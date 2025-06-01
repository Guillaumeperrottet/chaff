// src/app/api/webhooks/stripe/route.ts - Version corrigée
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server"; // Import serveur pour Stripe
import { prisma } from "@/lib/prisma";
import { PlanType, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { EmailService } from "@/lib/email";

// Types pour les objets Stripe
interface StripeCheckoutSession extends Stripe.Checkout.Session {
  metadata: {
    organizationId?: string;
    planType?: string;
    initiatedBy?: string;
    initiatedByUserId?: string;
  };
  customer: string;
  subscription: string;
  current_period_start: number;
  current_period_end: number;
}

interface StripeInvoice extends Stripe.Invoice {
  subscription: string;
  period_start: number;
  period_end: number;
}

interface StripeSubscription extends Stripe.Subscription {
  id: string;
  cancel_at_period_end: boolean;
  current_period_start: number;
  current_period_end: number;
}

export async function POST(req: NextRequest) {
  console.log("Webhook Stripe reçu - Début du traitement");
  console.log("URL de la requête webhook:", req.url);

  // Vérification critique : Stripe doit être disponible pour traiter les webhooks
  if (!stripe) {
    console.error("🚨 ERREUR CRITIQUE: Stripe non initialisé pour le webhook");
    console.error(
      "📝 Vérifiez que STRIPE_SECRET_KEY est définie dans les variables d'environnement"
    );

    // En webhook, on doit retourner 200 même en cas d'erreur pour éviter les retry infinis
    return NextResponse.json(
      {
        error: "Stripe non configuré",
        received: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  // Log détaillé des en-têtes pour déboguer
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });
  console.log("Headers de la requête webhook:", headers);

  try {
    const body = await req.text();
    console.log(
      "Corps de la requête (tronqué):",
      body.substring(0, 200) + "..."
    );

    // Récupérer l'en-tête de signature Stripe
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Signature Stripe manquante");
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 400 }
      );
    }

    // Vérifier la signature avec le corps brut
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    ) as Stripe.Event;

    console.log(`Événement Stripe reçu : ${event.type}, ID: ${event.id}`);

    // Traiter les différents types d'événements
    switch (event.type) {
      // Checkout
      case "checkout.session.completed": {
        const session = event.data.object as StripeCheckoutSession;
        const { organizationId, planType } = session.metadata || {};

        if (!organizationId || !planType) {
          console.error("Métadonnées manquantes dans la session de paiement");
          break;
        }

        // Récupérer le plan correspondant - Convertir en majuscules pour s'assurer de la compatibilité
        const normalizedPlanType = planType.toUpperCase();
        console.log(
          `Plan type reçu: ${planType}, normalisé: ${normalizedPlanType}`
        );

        const plan = await prisma.plan.findUnique({
          where: { name: normalizedPlanType as PlanType },
        });

        if (!plan) {
          console.error(
            `Plan non trouvé: ${planType} (normalisé: ${normalizedPlanType})`
          );
          break;
        }

        // Utiliser des dates simples connues pour être valides
        const currentPeriodStart = new Date(); // Maintenant
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // +1 mois

        console.log("Utilisation de dates valides:", {
          start: currentPeriodStart,
          end: currentPeriodEnd,
        });

        // Mise à jour ou création de l'abonnement
        await prisma.subscription.upsert({
          where: { organizationId },
          update: {
            planId: plan.id,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            status: "ACTIVE",
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
          },
          create: {
            organizationId,
            planId: plan.id,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            status: "ACTIVE",
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
          },
        });

        console.log(
          `Abonnement créé/mis à jour pour l'organisation: ${organizationId}, plan: ${plan.name}`
        );

        try {
          // Récupérer l'organisation et le plan
          const subscription = await prisma.subscription.findUnique({
            where: { organizationId },
            include: {
              organization: true,
              plan: true,
            },
          });

          if (subscription) {
            // Trouver l'admin de l'organisation
            const admin = await prisma.organizationUser.findFirst({
              where: {
                organizationId,
                role: "admin",
              },
              include: { user: true },
            });

            if (admin?.user) {
              await EmailService.sendSubscriptionConfirmationEmail(
                admin.user,
                subscription.organization,
                subscription.plan,
                subscription.currentPeriodEnd
              );
              console.log(`Email d'abonnement envoyé à ${admin.user.email}`);
            }
          }
        } catch (emailError) {
          console.error(
            "Erreur lors de l'envoi de l'email d'abonnement:",
            emailError
          );
        }

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as StripeCheckoutSession;
        const { organizationId, planType, initiatedBy, initiatedByUserId } =
          session.metadata || {};

        if (!organizationId || !planType) {
          console.error("Métadonnées manquantes dans la session de paiement");
          break;
        }

        // Récupérer le plan correspondant
        const normalizedPlanType = planType.toUpperCase();
        console.log(
          `Plan type reçu: ${planType}, normalisé: ${normalizedPlanType}`
        );

        const plan = await prisma.plan.findUnique({
          where: { name: normalizedPlanType as PlanType },
        });

        if (!plan) {
          console.error(
            `Plan non trouvé: ${planType} (normalisé: ${normalizedPlanType})`
          );
          break;
        }

        // Dates de période
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

        // Mise à jour ou création de l'abonnement
        await prisma.subscription.upsert({
          where: { organizationId },
          update: {
            planId: plan.id,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            status: "ACTIVE",
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
          },
          create: {
            organizationId,
            planId: plan.id,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            status: "ACTIVE",
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
          },
        });

        // Si c'est un changement initié par un admin
        if (initiatedBy === "admin" && initiatedByUserId) {
          // Mettre à jour l'audit
          await prisma.planChangeAudit.updateMany({
            where: {
              organizationId,
              stripeSessionId: session.id,
              status: "pending",
            },
            data: {
              status: "completed",
              completedAt: new Date(),
              notes: "Paiement confirmé via Stripe",
            },
          });

          // Notifier les admins de l'organisation
          const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
              users: true,
              subscription: { include: { plan: true } },
            },
          });

          if (organization) {
            const admins = await prisma.organizationUser.findMany({
              where: { organizationId, role: "admin" },
              include: { user: true },
            });

            for (const admin of admins) {
              if (
                admin.user &&
                admin.user.email !== session.customer_details?.email
              ) {
                await EmailService.sendSubscriptionConfirmationEmail(
                  admin.user,
                  organization,
                  plan,
                  currentPeriodEnd
                );
              }
            }
          }

          console.log(
            `Changement de plan admin complété pour l'organisation: ${organizationId}`
          );
        } else {
          // Changement normal (non-admin)
          try {
            const subscription = await prisma.subscription.findUnique({
              where: { organizationId },
              include: {
                organization: true,
                plan: true,
              },
            });

            if (subscription) {
              const admin = await prisma.organizationUser.findFirst({
                where: {
                  organizationId,
                  role: "admin",
                },
                include: { user: true },
              });

              if (admin?.user) {
                await EmailService.sendSubscriptionConfirmationEmail(
                  admin.user,
                  subscription.organization,
                  subscription.plan,
                  subscription.currentPeriodEnd
                );
                console.log(`Email d'abonnement envoyé à ${admin.user.email}`);
              }
            }
          } catch (emailError) {
            console.error(
              "Erreur lors de l'envoi de l'email d'abonnement:",
              emailError
            );
          }
        }

        console.log(
          `Abonnement créé/mis à jour pour l'organisation: ${organizationId}, plan: ${plan.name}`
        );
        break;
      }

      // Charges
      case "charge.refunded": {
        console.log(`Remboursement traité: ${event.data.object.id}`);
        break;
      }

      case "charge.dispute.created": {
        console.log(`Litige créé: ${event.data.object.id}`);
        break;
      }

      // Customer
      case "customer.created": {
        console.log(`Client créé: ${event.data.object.id}`);
        break;
      }

      case "customer.deleted": {
        console.log(`Client supprimé: ${event.data.object.id}`);
        break;
      }

      case "customer.updated": {
        console.log(`Client mis à jour: ${event.data.object.id}`);
        break;
      }

      case "customer.subscription.created": {
        const stripeSubscription = event.data.object as StripeSubscription;
        const customer = stripeSubscription.customer as string;

        // Récupérer l'abonnement dans votre base de données via le customerId
        const existingSubscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customer },
        });

        if (existingSubscription) {
          // Conversion correcte des timestamps
          const currentPeriodStart = new Date(
            stripeSubscription.current_period_start * 1000
          );
          const currentPeriodEnd = new Date(
            stripeSubscription.current_period_end * 1000
          );

          // Mettre à jour l'abonnement avec le nouvel ID d'abonnement Stripe
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              stripeSubscriptionId: stripeSubscription.id,
              status:
                stripeSubscription.status.toUpperCase() as SubscriptionStatus,
              currentPeriodStart,
              currentPeriodEnd,
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            },
          });
          console.log(`Abonnement créé pour: ${customer}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as StripeSubscription;

        // Récupérer l'abonnement dans votre base de données
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubscription.id },
        });

        if (subscription) {
          // Trouvez le plan gratuit
          const freePlan = await prisma.plan.findUnique({
            where: { name: "FREE" },
          });

          if (freePlan) {
            // Revenez au plan gratuit
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                planId: freePlan.id,
                status: "CANCELED",
                cancelAtPeriodEnd: false,
              },
            });
            console.log(
              `Abonnement annulé et retour au plan gratuit pour: ${subscription.id}`
            );
          }
        } else {
          console.warn(`Abonnement non trouvé pour: ${stripeSubscription.id}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as StripeSubscription;

        // Récupérer l'abonnement dans votre base de données
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubscription.id },
          include: { organization: true, plan: true },
        });

        if (subscription) {
          // Conversion correcte des timestamps
          const currentPeriodStart = new Date(
            stripeSubscription.current_period_start * 1000
          );
          const currentPeriodEnd = new Date(
            stripeSubscription.current_period_end * 1000
          );

          // Si le statut a changé, envoyez un email de notification
          const newStatus =
            stripeSubscription.status.toUpperCase() as SubscriptionStatus;
          const oldStatus = subscription.status;

          // Mettre à jour l'abonnement
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: newStatus,
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
              currentPeriodStart,
              currentPeriodEnd,
            },
          });

          console.log(`État d'abonnement mis à jour pour: ${subscription.id}`);

          // Si le statut change de façon significative, envoyez un email
          if (
            newStatus !== oldStatus ||
            subscription.cancelAtPeriodEnd !==
              stripeSubscription.cancel_at_period_end
          ) {
            // Trouver l'admin de l'organisation
            const admin = await prisma.organizationUser.findFirst({
              where: {
                organizationId: subscription.organizationId,
                role: "admin",
              },
              include: { user: true },
            });

            if (admin?.user) {
              try {
                // Choisir le template selon le changement de statut
                if (
                  stripeSubscription.cancel_at_period_end &&
                  !subscription.cancelAtPeriodEnd
                ) {
                  // Email de confirmation d'annulation programmée
                  // Vous devriez créer un template spécifique pour ce cas
                } else if (
                  newStatus === "PAST_DUE" &&
                  oldStatus !== "PAST_DUE"
                ) {
                  // Email d'alerte pour problème de paiement
                  // Vous devriez créer un template spécifique pour ce cas
                } else {
                  // Email de mise à jour générique d'abonnement
                  await EmailService.sendSubscriptionConfirmationEmail(
                    admin.user,
                    subscription.organization,
                    subscription.plan,
                    currentPeriodEnd
                  );
                }
              } catch (emailError) {
                console.error("Erreur lors de l'envoi de l'email:", emailError);
              }
            }
          }
        } else {
          console.warn(`Abonnement non trouvé pour: ${stripeSubscription.id}`);
        }
        break;
      }

      // Invoice
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as StripeInvoice;
        console.log(
          `Traitement de la facture payée: ${invoice.id}, abonnement: ${invoice.subscription}`
        );

        if (invoice.subscription) {
          try {
            // 1. Récupérer l'abonnement Stripe pour obtenir le client
            const stripeSubscription = await stripe.subscriptions.retrieve(
              invoice.subscription
            );
            const customerId = stripeSubscription.customer as string;

            console.log(`Abonnement Stripe trouvé - Client: ${customerId}`);

            // 2. Vérifier si un abonnement existe déjà avec cet ID Stripe
            let subscription = await prisma.subscription.findFirst({
              where: { stripeSubscriptionId: invoice.subscription },
            });

            // 3. Si non, chercher par customerId
            if (!subscription) {
              console.log(
                `Abonnement non trouvé par stripeSubscriptionId, recherche par customerId: ${customerId}`
              );
              subscription = await prisma.subscription.findFirst({
                where: { stripeCustomerId: customerId },
              });
            }

            // 4. Si toujours pas trouvé, chercher l'organisation par les métadonnées
            if (!subscription) {
              console.log("Abonnement non trouvé, recherche par métadonnées");

              // Extraire l'organizationId des métadonnées
              let organizationId: string | undefined;

              if (invoice.metadata && invoice.metadata.organizationId) {
                organizationId = invoice.metadata.organizationId;
              } else if (
                stripeSubscription.metadata &&
                stripeSubscription.metadata.organizationId
              ) {
                organizationId = stripeSubscription.metadata.organizationId;
              }

              if (organizationId) {
                console.log(
                  `OrganizationId trouvé dans les métadonnées: ${organizationId}`
                );

                // Trouver l'abonnement par organizationId
                subscription = await prisma.subscription.findFirst({
                  where: { organizationId },
                });
              } else {
                // Chercher l'organisation par le client Stripe
                const customerResponse =
                  await stripe.customers.retrieve(customerId);
                const customerData = customerResponse as Stripe.Customer;

                if (
                  "metadata" in customerData &&
                  customerData.metadata &&
                  customerData.metadata.organizationId
                ) {
                  organizationId = customerData.metadata.organizationId;
                  console.log(
                    `OrganizationId trouvé dans les métadonnées du client: ${organizationId}`
                  );

                  subscription = await prisma.subscription.findFirst({
                    where: { organizationId },
                  });
                }
              }
            }

            // 5. Si l'abonnement est trouvé, le mettre à jour
            if (subscription) {
              console.log(`Abonnement trouvé, mise à jour: ${subscription.id}`);

              // Conversion correcte des timestamps
              const currentPeriodStart = new Date(invoice.period_start * 1000);
              const currentPeriodEnd = new Date(invoice.period_end * 1000);

              // Récupérer les détails du plan depuis Stripe
              const stripePrice = await stripe.prices.retrieve(
                stripeSubscription.items.data[0].price.id
              );

              let planId = subscription.planId; // Par défaut, garder le même plan

              // Si un produit existe, trouver le plan correspondant
              if (stripePrice.product) {
                const productId =
                  typeof stripePrice.product === "string"
                    ? stripePrice.product
                    : stripePrice.product.id;

                const plan = await prisma.plan.findFirst({
                  where: { stripeProductId: productId },
                });

                if (plan) {
                  console.log(`Plan correspondant trouvé: ${plan.name}`);
                  planId = plan.id;
                }
              }

              // Mettre à jour l'abonnement
              await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                  planId,
                  currentPeriodStart,
                  currentPeriodEnd,
                  status: "ACTIVE",
                  stripeSubscriptionId: invoice.subscription, // S'assurer que l'ID d'abonnement est mis à jour
                  stripeCustomerId: customerId, // S'assurer que l'ID client est mis à jour
                },
              });

              console.log(`Abonnement mis à jour avec succès`);
            } else {
              console.log(
                `Aucun abonnement trouvé pour cet ID d'abonnement ou client`
              );
            }
          } catch (error) {
            console.error(
              `Erreur lors de la mise à jour de l'abonnement: ${error}`
            );
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeInvoice;

        if (invoice.subscription) {
          // Récupérer l'abonnement
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription },
            include: { organization: true },
          });

          if (subscription) {
            // Mettre à jour le statut en "PAST_DUE"
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: "PAST_DUE" },
            });

            console.log(
              `Échec de paiement pour l'abonnement: ${subscription.id}`
            );
          }
        }
        break;
      }

      case "invoice.upcoming": {
        console.log(`Facture à venir: ${event.data.object.id}`);
        break;
      }

      // Payment Method
      case "payment_method.updated": {
        console.log(`Méthode de paiement mise à jour: ${event.data.object.id}`);
        break;
      }

      default:
        console.log(`Événement Stripe non géré: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur du webhook Stripe:", error);
    // Important: retourner 200 même en cas d'erreur pour éviter que Stripe réessaie continuellement
    return NextResponse.json(
      {
        error: `Erreur de webhook: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        received: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
