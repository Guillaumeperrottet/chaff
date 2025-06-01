import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";
import { updateCustomLimits } from "@/lib/subscription-limits";
import { stripe } from "@/lib/stripe-server";
import { EmailService } from "@/lib/email";
import { SubscriptionStatus, PlanType } from "@prisma/client";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: orgId } = await params;
    const { customLimits, planChange } = await request.json();

    // Vérifier que l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          include: { plan: true },
        },
        users: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Si on change de plan
    if (planChange && planChange.newPlanName) {
      const oldPlan = organization.subscription?.plan;
      const newPlan = await prisma.plan.findUnique({
        where: { name: planChange.newPlanName },
      });

      if (!newPlan) {
        return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
      }

      // Créer un enregistrement d'audit
      await prisma.planChangeAudit.create({
        data: {
          organizationId: orgId,
          fromPlan: oldPlan?.name || "FREE",
          toPlan: newPlan.name,
          initiatedBy: user.id,
          status: "pending",
          notes: `Changement initié depuis le dashboard admin`,
        },
      });

      // Cas 1: Passage de FREE ou aucun abonnement à un plan payant
      if (
        (!oldPlan || oldPlan.name === "FREE") &&
        newPlan.price.toNumber() > 0
      ) {
        // Si Stripe n'est pas configuré, mise à jour locale uniquement
        if (!stripe) {
          await updateLocalSubscriptionOnly(orgId, newPlan.id, "ACTIVE");

          // Mettre à jour l'audit
          await prisma.planChangeAudit.updateMany({
            where: {
              organizationId: orgId,
              status: "pending",
            },
            data: {
              status: "completed",
              completedAt: new Date(),
              notes: "Stripe non configuré - mise à jour locale uniquement",
            },
          });

          return NextResponse.json({
            success: true,
            warning: "Stripe non configuré - mise à jour locale uniquement",
          });
        }

        // Créer une session de paiement Stripe
        try {
          const checkoutUrl = await createUpgradeCheckoutSession(
            organization,
            newPlan,
            user.id
          );

          return NextResponse.json({
            requiresPayment: true,
            checkoutUrl,
            message: "Redirection vers le paiement requise",
          });
        } catch (error) {
          console.error(
            "Erreur lors de la création de la session Stripe:",
            error
          );

          // Mettre à jour l'audit
          await prisma.planChangeAudit.updateMany({
            where: {
              organizationId: orgId,
              status: "pending",
            },
            data: {
              status: "failed",
              completedAt: new Date(),
              notes: `Erreur Stripe: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
            },
          });

          return NextResponse.json(
            { error: "Erreur lors de la création de la session de paiement" },
            { status: 500 }
          );
        }
      }

      // Cas 2: Passage entre plans payants
      if (
        oldPlan &&
        oldPlan.price.toNumber() > 0 &&
        newPlan.price.toNumber() > 0
      ) {
        if (organization.subscription?.stripeSubscriptionId && stripe) {
          try {
            // Récupérer l'abonnement Stripe actuel
            const stripeSubscription = await stripe.subscriptions.retrieve(
              organization.subscription.stripeSubscriptionId
            );

            // Mettre à jour l'abonnement avec le nouveau prix
            await stripe.subscriptions.update(
              organization.subscription.stripeSubscriptionId,
              {
                items: [
                  {
                    id: stripeSubscription.items.data[0].id,
                    price: newPlan.stripePriceId!,
                  },
                ],
                proration_behavior: "create_prorations",
              }
            );

            // Mettre à jour la base de données locale
            await updateLocalSubscription(orgId, newPlan.id, "ACTIVE");

            // Mettre à jour l'audit
            await prisma.planChangeAudit.updateMany({
              where: {
                organizationId: orgId,
                status: "pending",
              },
              data: {
                status: "completed",
                completedAt: new Date(),
              },
            });

            // Envoyer un email de notification
            await notifyPlanChange(organization, oldPlan.name, newPlan.name);

            return NextResponse.json({
              success: true,
              message: "Plan mis à jour avec succès",
            });
          } catch (error) {
            console.error("Erreur lors de la mise à jour Stripe:", error);

            await prisma.planChangeAudit.updateMany({
              where: {
                organizationId: orgId,
                status: "pending",
              },
              data: {
                status: "failed",
                completedAt: new Date(),
                notes: `Erreur Stripe: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
              },
            });

            return NextResponse.json(
              { error: "Erreur lors de la mise à jour de l'abonnement Stripe" },
              { status: 500 }
            );
          }
        } else {
          // Pas d'abonnement Stripe, mise à jour locale uniquement
          await updateLocalSubscription(orgId, newPlan.id, "ACTIVE");

          await prisma.planChangeAudit.updateMany({
            where: {
              organizationId: orgId,
              status: "pending",
            },
            data: {
              status: "completed",
              completedAt: new Date(),
            },
          });

          return NextResponse.json({
            success: true,
            message: "Plan mis à jour localement",
          });
        }
      }

      // Cas 3: Downgrade vers FREE
      if (oldPlan && oldPlan.price.toNumber() > 0 && newPlan.name === "FREE") {
        if (organization.subscription?.stripeSubscriptionId && stripe) {
          try {
            // Annuler l'abonnement Stripe
            await stripe.subscriptions.cancel(
              organization.subscription.stripeSubscriptionId
            );
          } catch (error) {
            console.error("Erreur lors de l'annulation Stripe:", error);
          }
        }

        // Mettre à jour la base de données locale
        await updateLocalSubscription(orgId, newPlan.id, "CANCELED");

        // Mettre à jour l'audit
        await prisma.planChangeAudit.updateMany({
          where: {
            organizationId: orgId,
            status: "pending",
          },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        });

        // Envoyer un email de notification
        await notifyPlanChange(
          organization,
          oldPlan?.name || "UNKNOWN",
          newPlan.name
        );

        return NextResponse.json({
          success: true,
          message: "Abonnement annulé et retour au plan gratuit",
        });
      }

      // Cas 4: Plans spéciaux (SUPER_ADMIN, ILLIMITE)
      if (["SUPER_ADMIN", "ILLIMITE"].includes(newPlan.name)) {
        await updateLocalSubscription(orgId, newPlan.id, "ACTIVE");

        await prisma.planChangeAudit.updateMany({
          where: {
            organizationId: orgId,
            status: "pending",
          },
          data: {
            status: "completed",
            completedAt: new Date(),
            notes: "Plan spécial - pas de facturation",
          },
        });

        await notifyPlanChange(
          organization,
          oldPlan?.name || "FREE",
          newPlan.name
        );

        return NextResponse.json({
          success: true,
          message: `Plan spécial ${newPlan.name} activé`,
        });
      }
    }

    // Si on modifie les limites personnalisées
    if (customLimits) {
      await updateCustomLimits(orgId, customLimits);

      return NextResponse.json({
        success: true,
        message: "Limites personnalisées mises à jour",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Mise à jour effectuée",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonction helper pour créer une session de paiement Stripe
type OrganizationWithSubscriptionAndUsers = {
  id: string;
  name: string;
  subscription?: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    plan?: {
      name: string;
      price: { toNumber: () => number };
      stripePriceId?: string | null;
      id: string;
    } | null;
  } | null;
  users: { email?: string | null }[];
};

async function createUpgradeCheckoutSession(
  organization: OrganizationWithSubscriptionAndUsers,
  plan: {
    stripePriceId?: string | null;
    name: string;
    id: string;
  },
  initiatedByUserId: string
): Promise<string> {
  if (!stripe) {
    throw new Error("Stripe non configuré");
  }

  // Créer ou récupérer le customer Stripe
  let customerId = organization.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: organization.name,
      email: organization.users[0]?.email || undefined,
      metadata: {
        organizationId: organization.id,
      },
    });
    customerId = customer.id;
  }

  // Créer la session checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: plan.stripePriceId!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?upgrade=success&org=${organization.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?upgrade=cancelled`,
    metadata: {
      organizationId: organization.id,
      planType: plan.name,
      initiatedBy: "admin",
      initiatedByUserId,
    },
  });

  // Stocker l'ID de session dans l'audit
  await prisma.planChangeAudit.updateMany({
    where: {
      organizationId: organization.id,
      status: "pending",
    },
    data: {
      stripeSessionId: session.id,
    },
  });

  return session.url!;
}

// Fonction pour mettre à jour uniquement la base de données locale
async function updateLocalSubscriptionOnly(
  organizationId: string,
  planId: string,
  status: string
): Promise<void> {
  const existingSubscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        planId,
        status: { set: status as SubscriptionStatus },
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        organizationId,
        planId,
        status: status as SubscriptionStatus,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
}

// Fonction pour mettre à jour l'abonnement local
async function updateLocalSubscription(
  organizationId: string,
  planId: string,
  status: string
): Promise<void> {
  await updateLocalSubscriptionOnly(organizationId, planId, status);
}

// Fonction pour notifier le changement de plan
async function notifyPlanChange(
  organization: OrganizationWithSubscriptionAndUsers,
  oldPlanName: string,
  newPlanName: string
): Promise<void> {
  try {
    // Récupérer les admins de l'organisation
    const admins = await prisma.organizationUser.findMany({
      where: {
        organizationId: organization.id,
        role: "admin",
      },
      include: { user: true },
    });

    // Récupérer les détails du nouveau plan
    const newPlan = await prisma.plan.findUnique({
      where: { name: newPlanName as PlanType },
    });

    if (!newPlan) return;

    // Envoyer un email à chaque admin
    for (const admin of admins) {
      if (admin.user.email) {
        await EmailService.sendPlanChangeEmail(
          admin.user,
          organization.name,
          oldPlanName,
          newPlanName,
          newPlan
        );
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi des notifications:", error);
  }
}
