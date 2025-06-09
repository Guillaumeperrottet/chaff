// src/lib/auth.ts - Version corrigée
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { EmailService } from "./email";
import { createAuthMiddleware } from "better-auth/api";

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
              <h1>🏠 PlanniKeeper</h1>
              <h2>Finaliser votre inscription</h2>
            </div>
            <div class="content">
              <p>Bonjour ${name},</p>
              <p>Merci de votre intérêt pour PlanniKeeper ! Pour finaliser votre inscription et activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" class="button">
                  Activer mon compte
                </a>
              </div>
              <p><strong>Important :</strong> Ce lien expire dans 24 heures.</p>
            </div>
            <div class="footer">
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

  // 🔧 HOOKS CORRIGÉS - Configuration simplifiée et robuste
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      console.log("🔄 Hook after déclenché:", {
        path: ctx.path,
        hasUser: !!ctx.context.newSession?.user,
      });

      try {
        // ✅ INSCRIPTION NORMALE (sans invitation)
        if (ctx.path === "/sign-up/email" && ctx.context.newSession?.user) {
          const user = ctx.context.newSession.user;
          console.log("📝 Inscription normale détectée pour:", user.email);

          // Marquer comme utilisateur normal (pas d'invitation)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              metadata: {
                signupType: "normal",
                signupTimestamp: new Date().toISOString(),
                needsOrganization: true,
              },
            },
          });
        }

        // ✅ VÉRIFICATION EMAIL - Création d'organisation pour inscription normale
        if (ctx.path === "/verify-email" && ctx.context.newSession?.user) {
          const user = ctx.context.newSession.user;
          console.log("✅ Email vérifié pour:", user.email);

          // Récupérer les métadonnées pour savoir le type d'inscription
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              Organization: true,
              OrganizationUser: true,
            },
          });

          if (!dbUser) {
            console.error("❌ Utilisateur introuvable après vérification");
            return {};
          }

          const metadata = dbUser.metadata as Record<string, unknown> | null;
          const isInvitation =
            metadata && typeof metadata["inviteCode"] === "string";

          // Si c'est une inscription normale ET pas d'organisation
          if (!isInvitation && !dbUser.Organization) {
            console.log("🏢 Création d'organisation pour inscription normale");
            await createOrganizationForUser(user);
          }

          // Email de bienvenue (seulement pour les inscriptions normales)
          if (!isInvitation) {
            try {
              const finalUser = await prisma.user.findUnique({
                where: { id: user.id },
                include: { Organization: true },
              });

              if (finalUser?.Organization) {
                await EmailService.sendWelcomeEmail(
                  finalUser,
                  finalUser.Organization.name
                );
                console.log("📧 Email de bienvenue envoyé");
              }
            } catch (emailError) {
              console.error("❌ Erreur envoi email bienvenue:", emailError);
            }
          }
        }
      } catch (error) {
        console.error("❌ Erreur dans hook after:", error);
      }

      return {};
    }),
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
// FONCTIONS UTILITAIRES POUR LA CRÉATION D'ORGANISATION
// ============================================================================

async function createOrganizationForUser(user: {
  id: string;
  email: string;
  name?: string;
}) {
  console.log("🏢 Création organisation pour utilisateur normal:", user.email);

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

      // 3. Créer la relation OrganizationUser avec rôle admin
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "admin",
        },
      });

      // 4. Créer l'abonnement FREE
      let freePlan = await tx.plan.findFirst({
        where: { name: "FREE" },
      });

      if (!freePlan) {
        freePlan = await tx.plan.create({
          data: {
            name: "FREE",
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
        });
      }

      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      // 5. Initialiser le stockage
      try {
        await tx.storageUsage.create({
          data: {
            organizationId: organization.id,
            totalUsedBytes: 0,
          },
        });
      } catch {
        console.log("ℹ️ StorageUsage déjà existant ou table non disponible");
      }

      console.log("✅ Organisation complète créée:", {
        organizationId: organization.id,
        organizationName: organization.name,
        userId: user.id,
      });
    });
  } catch (error) {
    console.error("❌ Erreur création organisation:", error);
    throw error;
  }
}
