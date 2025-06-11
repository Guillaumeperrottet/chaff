import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { EmailService } from "./email";

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: isDev
    ? "http://localhost:3000/api/auth"
    : `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`,
  trustedOrigins: isDev
    ? ["http://localhost:3000", "localhost:3000", "127.0.0.1:3000"]
    : ["https://chaff-next.vercel.app", "*", "https://www.chaff.ch"],

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
    autoSignIn: false,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
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
            .header { background-color: #3b82f6; color: white; padding: 24px; text-align: center; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Chaff.ch</h1>
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

  // 🔥 HOOKS CORRIGÉS
  hooks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    after: async (inputContext: any) => {
      const path =
        inputContext?.path ||
        inputContext?.req?.path ||
        inputContext?.req?.url ||
        "";
      const returned = inputContext?.returned;

      console.log("🔄 Hook after déclenché pour path:", path);

      // ✅ INSCRIPTION NORMALE - Sauvegarder les métadonnées seulement
      if (path.includes("sign-up") && !path.includes("invitation")) {
        try {
          if (returned?.user) {
            const user = returned.user;
            console.log("📝 Inscription normale pour:", user.email);

            // Sauvegarder les métadonnées d'inscription
            await prisma.user.update({
              where: { id: user.id },
              data: {
                metadata: {
                  planType: "FREE",
                  signupTimestamp: new Date().toISOString(),
                  signupSource: "normal",
                },
              },
            });
            console.log("✅ Métadonnées d'inscription sauvegardées");
          }
        } catch (error) {
          console.error("❌ Erreur dans hook inscription normale:", error);
        }
      }

      // ✅ VÉRIFICATION EMAIL - Créer l'organisation ICI
      // 🔧 CORRECTION MAJEURE: Déclencher sur verify-email ET auto sign-in
      else if (
        path.includes("verify-email") ||
        path === "/verify-email" ||
        (path.includes("sign-in") && returned?.user?.emailVerified)
      ) {
        try {
          if (returned?.user) {
            const user = returned.user;
            console.log("📧 Traitement post-vérification pour:", user.email);

            // 🔧 VÉRIFICATION AMÉLIORÉE: Vérifier si l'utilisateur a déjà une organisation
            const existingUser = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                Organization: true,
                OrganizationUser: true,
              },
            });

            if (!existingUser) {
              console.log("❌ Utilisateur non trouvé en base:", user.id);
              return {};
            }

            // Si l'utilisateur a déjà une organisation, ne rien faire
            if (existingUser.organizationId && existingUser.Organization) {
              console.log(
                "ℹ️ Utilisateur a déjà une organisation:",
                existingUser.Organization.name
              );
              return {};
            }

            // Vérifier si c'est une invitation via metadata
            const metadata = existingUser.metadata as Record<
              string,
              unknown
            > | null;
            const isInvitation =
              metadata && typeof metadata["inviteCode"] === "string";

            if (isInvitation) {
              console.log(
                "ℹ️ Invitation détectée, pas de création d'organisation"
              );
              return {};
            }

            // ✅ CRÉER L'ORGANISATION POUR LES INSCRIPTIONS NORMALES
            console.log("🏢 Création d'organisation pour inscription normale");
            await createDefaultOrganizationForUser(user);
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
// FONCTION POUR CRÉER L'ORGANISATION AVEC PLAN FREE - VERSION AMÉLIORÉE
// ============================================================================

async function createDefaultOrganizationForUser(user: {
  id: string;
  email: string;
  name?: string;
}) {
  console.log("🆕 Création d'organisation par défaut pour:", user.email);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. 🔧 CRÉER OU RÉCUPÉRER LE PLAN FREE D'ABORD
      let freePlan = await tx.plan.findFirst({
        where: { name: "FREE" },
      });

      if (!freePlan) {
        console.log("🔧 Plan FREE inexistant, création...");
        freePlan = await tx.plan.create({
          data: {
            name: "FREE",
            price: 0,
            monthlyPrice: 0,
            yearlyPrice: 0,
            maxUsers: 1,
            maxMandates: 1,
            maxStorage: 100,
            description: "Plan gratuit pour découvrir l'application",
            isActive: true,
            hasAdvancedReports: false,
            hasApiAccess: false,
            hasCustomBranding: false,
            maxApiCalls: 100,
            sortOrder: 1,
            supportLevel: "community",
          },
        });
        console.log("✅ Plan FREE créé:", freePlan.id);
      } else {
        console.log("✅ Plan FREE trouvé:", freePlan.id);
      }

      // 2. Créer l'organisation
      const organization = await tx.organization.create({
        data: {
          name: `${user.name || user.email.split("@")[0]}'s Organization`,
        },
      });
      console.log("✅ Organisation créée:", organization.id);

      // 3. Lier l'utilisateur à l'organisation
      await tx.user.update({
        where: { id: user.id },
        data: {
          organizationId: organization.id,
          planType: "FREE", // Marquer explicitement comme FREE
        },
      });
      console.log("✅ Utilisateur lié à l'organisation");

      // 4. Créer l'association OrganizationUser
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "admin",
        },
      });
      console.log("✅ Association OrganizationUser créée (admin)");

      // 5. Créer l'abonnement FREE
      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      console.log("✅ Abonnement FREE créé");

      // 6. Initialiser le stockage
      await tx.storageUsage.create({
        data: {
          organizationId: organization.id,
          totalUsedBytes: 0,
        },
      });
      console.log("✅ Stockage initialisé");

      // 7. Envoyer l'email de bienvenue
      try {
        const fullUser = await tx.user.findUnique({
          where: { id: user.id },
        });

        if (fullUser) {
          console.log("🚀 Tentative d'envoi email de bienvenue...");
          const emailResult = await EmailService.sendWelcomeEmail(
            fullUser,
            organization.name
          );

          if (emailResult.success) {
            console.log("✅ Email de bienvenue envoyé avec succès");
          } else {
            const error = emailResult.error as { isTestDomain?: boolean };
            if (error?.isTestDomain) {
              console.log(
                "⚠️ Email non envoyé : domaine de test bloqué par Resend"
              );
            } else {
              console.log("❌ Échec envoi email bienvenue:", emailResult.error);
            }
          }
        }
      } catch (emailError) {
        console.error("❌ Exception lors envoi email bienvenue:", emailError);
        // Ne pas faire échouer la transaction pour autant
      }

      console.log(
        "🎉 Configuration complète de l'utilisateur terminée avec plan FREE"
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'organisation:", error);
    throw error;
  }
}
