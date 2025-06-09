import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { EmailService } from "./email";
import { PlanType } from "@prisma/client";

const isDev = process.env.NODE_ENV === "development";

function validatePlanType(planType: string): PlanType {
  const validPlans: PlanType[] = [
    "FREE",
    "PERSONAL",
    "PROFESSIONAL",
    "ENTERPRISE",
    "SUPER_ADMIN",
    "ILLIMITE",
    "CUSTOM",
  ];
  return validPlans.includes(planType as PlanType)
    ? (planType as PlanType)
    : "FREE";
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: isDev
    ? "http://localhost:3000/api/auth"
    : `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`,

  user: {
    additionalFields: {
      planType: {
        type: "string",
        required: false,
        input: true,
        defaultValue: "FREE",
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log("📧 Envoi email de vérification:", user.email);
      await EmailService.sendEmail({
        to: user.email,
        subject: "Finalisez votre inscription à Chaff.ch",
        html: getVerificationEmailTemplate(user.name || user.email, url),
      });
    },
  },

  hooks: {
    after: async (context) => {
      const path = (context as { path?: string }).path || "";
      const returned = (
        context as {
          returned?: {
            user?: {
              id: string;
              email: string;
              name?: string;
              planType?: string;
            };
          };
        }
      ).returned;

      console.log("🔄 Hook after déclenché pour path:", path);

      // Inscription normale (pas d'invitation)
      if (path.includes("sign-up") && !path.includes("invitation")) {
        try {
          if (returned?.user) {
            const user = returned.user as {
              id: string;
              email: string;
              name?: string;
              planType?: string;
            };
            console.log(
              "📝 Inscription normale pour:",
              user.email,
              "Plan:",
              user.planType
            );
            await handleRegularSignup(user);
          }
        } catch (error) {
          console.error("❌ Erreur dans hook inscription:", error);
        }
      }

      // Vérification email
      else if (path.includes("verify-email")) {
        try {
          if (returned?.user) {
            const user = returned.user as {
              id: string;
              email: string;
              name?: string;
            };
            await handleEmailVerification(user);
          }
        } catch (error) {
          console.error("❌ Erreur dans hook vérification:", error);
        }
      }

      return {};
    },
  },
});

// Gérer inscription normale avec plan choisi
async function handleRegularSignup(user: {
  id: string;
  email: string;
  name?: string;
  planType?: string;
}) {
  console.log("🆕 Nouveau utilisateur avec plan:", user.planType || "FREE");

  const planType = validatePlanType(user.planType || "FREE");

  // Sauvegarder les métadonnées avec le plan choisi
  await prisma.user.update({
    where: { id: user.id },
    data: {
      planType,
      metadata: {
        planType,
        signupTimestamp: new Date().toISOString(),
        organizationCreated: false,
      },
    },
  });

  console.log("✅ Métadonnées sauvegardées avec plan:", planType);
}

// Gérer la vérification email et création organisation + abonnement
async function handleEmailVerification(user: {
  id: string;
  email: string;
  name?: string;
}) {
  console.log("✅ Email vérifié pour:", user.email);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true, OrganizationUser: true },
  });

  if (!dbUser) {
    console.error("❌ Utilisateur introuvable après vérification");
    return;
  }

  // Si pas d'organisation, en créer une avec le bon plan
  if (!dbUser.Organization) {
    const metadata = extractUserMetadata(dbUser.metadata);
    await createOrganizationWithPlan(user, metadata.planType || "FREE");
  }

  // Email de bienvenue
  await sendWelcomeEmail(user);
}

// Créer organisation avec le plan choisi
async function createOrganizationWithPlan(
  user: { id: string; email: string; name?: string },
  planType: string
) {
  console.log("🏢 Création organisation avec plan:", planType);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Créer l'organisation
      const organization = await tx.organization.create({
        data: {
          name: `${user.name || user.email.split("@")[0]}'s Organization`,
        },
      });

      // 2. Lier l'utilisateur à l'organisation
      await tx.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
      });

      // 3. Créer la relation OrganizationUser
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "admin",
        },
      });

      // 4. Créer l'abonnement avec le bon plan
      await createSubscriptionWithPlan(organization.id, planType);

      // 5. Initialiser le stockage
      try {
        await tx.storageUsage.create({
          data: {
            organizationId: organization.id,
            totalUsedBytes: 0,
          },
        });
      } catch {
        console.log("ℹ️ StorageUsage déjà existant");
      }

      console.log("✅ Organisation créée avec plan:", planType);
    });
  } catch (error) {
    console.error("❌ Erreur création organisation avec plan:", error);
    throw error;
  }
}

// Créer abonnement avec le plan spécifique
async function createSubscriptionWithPlan(
  organizationId: string,
  planType: string
) {
  console.log("💰 Création abonnement avec plan:", planType);

  // Récupérer le plan demandé
  let plan = await prisma.plan.findFirst({
    where: { name: validatePlanType(planType) },
  });

  // Si le plan n'existe pas, créer les plans par défaut
  if (!plan) {
    console.log("📋 Plans manquants, création des plans par défaut...");
    await createDefaultPlans();

    // Récupérer à nouveau le plan
    plan = await prisma.plan.findFirst({
      where: { name: validatePlanType(planType) },
    });
  }

  if (!plan) {
    console.error("❌ Impossible de trouver/créer le plan:", planType);
    return;
  }

  // Créer l'abonnement
  const subscription = await prisma.subscription.create({
    data: {
      organizationId,
      planId: plan.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("💰 Abonnement créé:", {
    planName: plan.name,
    organizationId,
    subscriptionId: subscription.id,
  });

  return subscription;
}

// Créer les plans par défaut s'ils n'existent pas
async function createDefaultPlans() {
  const plans = [
    {
      name: "FREE" as PlanType,
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxUsers: 1,
      maxStorage: 500,
      features: [
        "1 utilisateur",
        "1 objet immobilier",
        "500MB de stockage",
        "Support communauté",
      ],
      description: "Plan gratuit pour découvrir l'application",
      isActive: true,
    },
    {
      name: "PERSONAL" as PlanType,
      price: 9,
      monthlyPrice: 9,
      yearlyPrice: 86.4,
      maxUsers: 1,
      maxStorage: 2048,
      features: [
        "1 utilisateur",
        "3 objets immobiliers",
        "2GB de stockage",
        "Support email",
      ],
      description: "Pour une utilisation personnelle",
      isActive: true,
    },
    {
      name: "PROFESSIONAL" as PlanType,
      price: 29,
      monthlyPrice: 29,
      yearlyPrice: 278.4,
      maxUsers: 5,
      maxStorage: 10240,
      features: [
        "5 utilisateurs",
        "Objets illimités",
        "10GB de stockage",
        "Support prioritaire",
      ],
      description: "Pour une utilisation professionnelle",
      isActive: true,
    },
    {
      name: "ENTERPRISE" as PlanType,
      price: 99,
      monthlyPrice: 99,
      yearlyPrice: 950.4,
      maxUsers: null,
      maxStorage: 102400,
      features: [
        "Utilisateurs illimités",
        "Objets illimités",
        "100GB de stockage",
        "Support dédié",
      ],
      description: "Pour les grandes équipes",
      isActive: true,
    },
  ];

  for (const planData of plans) {
    try {
      await prisma.plan.upsert({
        where: { name: planData.name },
        update: {},
        create: planData,
      });
      console.log(`✅ Plan ${planData.name} créé/vérifié`);
    } catch (error) {
      console.error(`❌ Erreur création plan ${planData.name}:`, error);
    }
  }
}

// Utilitaires
function extractUserMetadata(metadata: unknown) {
  const meta =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : {};
  return {
    planType: typeof meta["planType"] === "string" ? meta["planType"] : "FREE",
  };
}

async function sendWelcomeEmail(user: {
  id: string;
  email: string;
  name?: string;
}) {
  try {
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (userWithOrg?.Organization) {
      await EmailService.sendWelcomeEmail(
        userWithOrg,
        userWithOrg.Organization.name
      );
      console.log("✅ Email de bienvenue envoyé");
    }
  } catch (error) {
    console.error("❌ Erreur envoi email bienvenue:", error);
  }
}

function getVerificationEmailTemplate(
  userName: string,
  verificationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Vérification email - Chaff.ch</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #d9840d; margin: 0;">Chaff.ch</h1>
          <h2 style="color: #333; margin: 16px 0;">Vérifiez votre adresse email</h2>
        </div>
        
        <p>Bonjour ${userName},</p>
        <p>Merci de vous être inscrit sur Chaff.ch ! Pour finaliser votre inscription, veuillez cliquer sur le bouton ci-dessous :</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" style="background-color: #d9840d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Vérifier mon email
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">Ce lien expire dans 24 heures.</p>
        <p style="color: #666; font-size: 14px;">© 2025 Chaff.ch. Tous droits réservés.</p>
      </div>
    </body>
    </html>
  `;
}
