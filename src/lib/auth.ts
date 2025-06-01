// src/lib/auth.ts - Version optimisée avec Better Auth
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
    autoSignIn: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log("📧 Envoi email de vérification:", user.email);
      const name = user.name || user.email.split("@")[0];
      const subject = "Finalisez votre inscription à PlanniKeeper";
      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset=\"utf-8\">
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
          <div class=\"container\">
            <div class=\"header\">
              <h1>🏠 PlanniKeeper</h1>
              <h2>Finaliser votre inscription</h2>
            </div>
            <div class=\"content\">
              <p>Bonjour ${name},</p>
              <p>Merci de votre intérêt pour PlanniKeeper ! Pour finaliser votre inscription et activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
              <div style=\"text-align: center; margin: 30px 0;\">
                <a href=\"${url}\" class=\"button\">
                  Activer mon compte
                </a>
              </div>
              <p><strong>Important :</strong> Ce lien expire dans 24 heures.</p>
            </div>
            <div class=\"footer\">
              <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
      `;
      await EmailService.sendEmail({ to: user.email, subject, html });
      console.log("✅ Email de vérification envoyé avec succès à:", user.email);
    },
  },

  // Hooks simplifiés pour inscriptions normales uniquement
  hooks: {
    after: async (inputContext) => {
      const path =
        ((inputContext as Record<string, unknown>)["path"] as string) ||
        ((
          (inputContext as Record<string, unknown>)["req"] as Record<
            string,
            unknown
          >
        )?.["path"] as string) ||
        ((
          (inputContext as Record<string, unknown>)["req"] as Record<
            string,
            unknown
          >
        )?.["url"] as string) ||
        "";
      const returned = (inputContext as Record<string, unknown>)["returned"] as
        | Record<string, unknown>
        | undefined;

      console.log("🔄 Hook after déclenché pour path:", path);

      // ✅ GARDER SEULEMENT LES INSCRIPTIONS NORMALES (sans invitation)
      if (path.includes("sign-up") && !path.includes("invitation")) {
        try {
          if (returned && typeof returned === "object" && "user" in returned) {
            const user = returned["user"] as {
              id: string;
              email: string;
              name?: string;
            };
            console.log("📝 Inscription normale pour:", user.email);
            await handleRegularSignup(user);
          }
        } catch (error) {
          console.error("❌ Erreur dans hook inscription normale:", error);
        }
      }

      // ✅ GARDER LA VÉRIFICATION EMAIL SEULEMENT POUR LES INSCRIPTIONS NORMALES
      else if (path.includes("verify-email")) {
        try {
          if (returned && typeof returned === "object" && "user" in returned) {
            const user = returned["user"] as {
              id: string;
              email: string;
              name?: string;
            };

            // Vérifier si c'est une invitation (auquel cas ne rien faire)
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { metadata: true },
            });

            const metadata = dbUser?.metadata as Record<string, unknown> | null;
            if (metadata && typeof metadata["inviteCode"] === "string") {
              console.log(
                "ℹ️ Invitation détectée, pas de traitement supplémentaire"
              );
              return {};
            }

            // Traitement normal pour les inscriptions classiques
            await handleEmailVerificationForRegularUser(user);
          }
        } catch (error) {
          console.error("❌ Erreur dans hook vérification email:", error);
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
// FONCTIONS SIMPLIFIÉES POUR INSCRIPTIONS NORMALES UNIQUEMENT
// ============================================================================

// Gérer inscription normale (nouveau propriétaire)
async function handleRegularSignup(user: {
  id: string;
  email: string;
  name?: string;
}) {
  console.log("🆕 Nouveau propriétaire, création organisation:", user.email);

  // Enregistrer les métadonnées basiques
  await prisma.user.update({
    where: { id: user.id },
    data: {
      metadata: {
        planType: "FREE",
        signupTimestamp: new Date().toISOString(),
      },
    },
  });

  // Pas de création d'organisation ici, on attend la vérification email
  console.log("✅ Métadonnées sauvegardées, attente vérification email");
}

// Fonction pour gérer la vérification email des utilisateurs normaux
async function handleEmailVerificationForRegularUser(user: {
  id: string;
  email: string;
  name?: string;
}) {
  console.log("✅ Email vérifié pour inscription normale:", user.email);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      Organization: true,
      OrganizationUser: true,
    },
  });

  if (!dbUser) {
    console.error("❌ Utilisateur introuvable après vérification email");
    return;
  }

  // Si l'utilisateur n'a pas encore d'organisation, en créer une
  if (!dbUser.Organization) {
    await createDefaultOrganization(user);
  } else {
    // Finaliser la configuration si l'organisation existe déjà
    const metadata = extractUserMetadata(dbUser.metadata);
    await finalizeRegularUserSetup(user, dbUser.Organization.id, metadata);
  }

  // Email de bienvenue
  await sendWelcomeEmail(user);
}

// ============================================================================
// FONCTIONS UTILITAIRES SIMPLIFIÉES
// ============================================================================

// Extraire métadonnées depuis l'utilisateur DB (simplifié)
function extractUserMetadata(metadata: unknown) {
  const meta =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : {};

  return {
    planType: typeof meta["planType"] === "string" ? meta["planType"] : "FREE",
  };
}

// ============================================================================
// FONCTIONS DE FINALISATION (APRÈS VÉRIFICATION EMAIL)
// ============================================================================

// Finaliser configuration utilisateur normal
async function finalizeRegularUserSetup(
  user: { id: string; email: string; name?: string },
  organizationId: string,
  metadata: { planType?: string }
) {
  // S'assurer que l'association OrganizationUser existe
  const existingOrgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id, organizationId },
  });

  if (!existingOrgUser) {
    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId,
        role: "admin",
      },
    });
    console.log("✅ Association OrganizationUser créée (admin)");
  }

  // Créer abonnement si nécessaire
  await createSubscriptionIfNeeded(organizationId, metadata.planType || "FREE");
}

// ============================================================================
// FONCTIONS UTILITAIRES COMMUNES
// ============================================================================

// Créer organisation par défaut
async function createDefaultOrganization(user: {
  id: string;
  email: string;
  name?: string;
}) {
  console.log("🏢 Création organisation par défaut pour:", user.email);

  const organization = await prisma.organization.create({
    data: {
      name: `${user.name || user.email.split("@")[0]}'s Organization`,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId: organization.id },
  });

  await prisma.organizationUser.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: "admin",
    },
  });

  await createSubscriptionIfNeeded(organization.id, "FREE");

  console.log("✅ Organisation par défaut créée:", organization.id);
  return organization;
}

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

// Envoyer email de bienvenue
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
      console.log("✅ Email de bienvenue envoyé à:", user.email);
    }
  } catch (error) {
    console.error("❌ Erreur envoi email de bienvenue:", error);
  }
}
