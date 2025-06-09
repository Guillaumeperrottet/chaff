// src/lib/auth.ts - Version corrigée avec création d'organisation
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { EmailService } from "./email";
import { PlanType } from "@prisma/client";

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

// Fonction utilitaire pour valider et normaliser le type de plan
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
  trustedOrigins: isDev
    ? ["http://localhost:3000", "localhost:3000", "127.0.0.1:3000"]
    : [
        "https://plannikeeper-next.vercel.app",
        "*",
        "https://www.plannikeeper.ch",
      ],

  // Configuration des champs supplémentaires avec Better Auth
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
    autoSignIn: false, // 🔧 IMPORTANT: Désactiver pour forcer la vérification email
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true, // Se connecter après vérification
    sendVerificationEmail: async ({ user, url }) => {
      console.log("📧 Envoi email de vérification:", user.email);
      const name = user.name || user.email.split("@")[0];
      const subject = "Finalisez votre inscription à Chaff.ch";
      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Finalisez votre inscription</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: #d9840d; color: white; padding: 24px; text-align: center; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; background-color: #d9840d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Chaff.ch</h1>
              <h2>Finaliser votre inscription</h2>
            </div>
            <div class="content">
              <p>Bonjour ${name},</p>
              <p>Merci de votre intérêt pour Chaff.ch ! Pour finaliser votre inscription et activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" class="button">
                  Activer mon compte
                </a>
              </div>
              <p><strong>Important :</strong> Ce lien expire dans 24 heures.</p>
            </div>
            <div class="footer">
              <p>© 2025 Chaff.ch. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
      `;
      await EmailService.sendEmail({ to: user.email, subject, html });
      console.log("✅ Email de vérification envoyé avec succès à:", user.email);
    },
  },

  // 🔧 CORRECTION: Utiliser databaseHooks au lieu de hooks
  databaseHooks: {
    user: {
      create: {
        // Hook AVANT création utilisateur
        before: async (user) => {
          console.log("🆕 Création utilisateur:", user.email);
          return { data: user };
        },
        // Hook APRÈS création utilisateur
        after: async (user) => {
          console.log("📝 Utilisateur créé, sauvegarde métadonnées:", user.id);

          // Sauvegarder les métadonnées basiques pour traitement ultérieur
          await prisma.user.update({
            where: { id: user.id },
            data: {
              metadata: {
                planType: "FREE",
                signupTimestamp: new Date().toISOString(),
                needsOrganization: true, // Flag pour indiquer qu'il faut créer l'organisation
              },
            },
          });
        },
      },
    },
  },

  // 🔧 NOUVEAU: Hooks pour les événements d'authentification
  hooks: {
    after: async (context) => {
      const path = context.request?.url || "";

      // 🔧 Hook spécifique pour la vérification email
      if (path.includes("verify-email")) {
        try {
          // Access user data from the response body instead
          const response = context.body as unknown as {
            user?: { id: string; email: string; name?: string };
          };
          if (response?.user) {
            console.log("✅ Email vérifié pour:", response.user.email);
            await handleEmailVerificationComplete(response.user);
          }
        } catch (error) {
          console.error("❌ Erreur dans hook verify-email:", error);
        }
      }

      return {};
    },
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: isDev ? "lax" : "none",
      secure: !isDev,
      domain: isDev ? "localhost" : undefined,
      maxAge: 60 * 60 * 4,
      httpOnly: true,
      path: "/",
    },
  },
});

// ============================================================================
// FONCTION POUR GÉRER LA FINALISATION APRÈS VÉRIFICATION EMAIL
// ============================================================================
async function handleEmailVerificationComplete(user: {
  id: string;
  email: string;
  name?: string;
}) {
  console.log("🔄 Finalisation de l'inscription pour:", user.email);

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        Organization: true,
        OrganizationUser: true,
      },
    });

    if (!dbUser) {
      console.error("❌ Utilisateur introuvable dans la DB");
      return;
    }

    // Vérifier si l'organisation existe déjà
    if (dbUser.Organization) {
      console.log("✅ Organisation existe déjà:", dbUser.Organization.id);
      return;
    }

    // Créer l'organisation et tout configurer
    console.log("🏢 Création organisation pour utilisateur normal");

    const organization = await prisma.organization.create({
      data: {
        name: `${user.name || user.email.split("@")[0]}'s Organization`,
      },
    });

    // Lier l'utilisateur à l'organisation
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });

    // Créer la relation OrganizationUser
    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "admin",
      },
    });

    // Créer l'abonnement FREE
    await createSubscriptionIfNeeded(organization.id, "FREE");

    // Créer le stockage
    await prisma.storageUsage.create({
      data: {
        organizationId: organization.id,
        totalUsedBytes: 0,
      },
    });

    console.log("✅ Organisation créée avec succès:", organization.id);

    // Envoyer email de bienvenue
    try {
      await EmailService.sendWelcomeEmail(dbUser, organization.name);
      console.log("📧 Email de bienvenue envoyé");
    } catch (emailError) {
      console.error("❌ Erreur envoi email bienvenue:", emailError);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la finalisation:", error);
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

// Créer abonnement si nécessaire
async function createSubscriptionIfNeeded(
  organizationId: string,
  planType: string
) {
  const existingSubscription = await prisma.subscription.findFirst({
    where: { organizationId },
  });

  if (existingSubscription) return;

  const validatedPlanType = validatePlanType(planType);
  let plan = await prisma.plan.findFirst({
    where: { name: validatedPlanType },
  });

  if (!plan) {
    plan = await prisma.plan.findFirst({ where: { name: "FREE" } });
  }

  if (plan) {
    await prisma.subscription.create({
      data: {
        organizationId,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    console.log("💰 Abonnement créé avec plan:", plan.name);
  }
}
