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
      organizationId: {
        type: "string",
        required: false,
        input: false,
      },
      inviteCode: {
        type: "string",
        required: false,
        input: true,
      },
      tempOrganizationId: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false, // ⚠️ Désactivé pour gérer manuellement
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false, // ⚠️ Contrôle manuel
    sendVerificationEmail: async ({ user, url }) => {
      console.log("📧 Envoi email de vérification:", user.email);

      // Ajouter les paramètres nécessaires à l'URL
      const enrichedUrl = await enrichVerificationUrl(url, user);

      await EmailService.sendEmail({
        to: user.email,
        subject: "Finalisez votre inscription à Chaff.ch",
        html: getVerificationEmailTemplate(
          user.name || user.email,
          enrichedUrl
        ),
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
              inviteCode?: string;
              tempOrganizationId?: string;
              emailVerified?: boolean;
              organizationId?: string;
            };
          };
        }
      ).returned;

      console.log("🔄 Hook after déclenché:", {
        path,
        hasUser: !!returned?.user,
      });

      try {
        // 1. INSCRIPTION (sign-up)
        if (path.includes("sign-up") && returned?.user) {
          const user = returned.user;
          console.log("📝 Traitement inscription:", {
            userId: user.id,
            email: user.email,
            planType: user.planType,
            inviteCode: user.inviteCode,
            tempOrgId: user.tempOrganizationId,
          });

          await handleUserSignup(user);
        }

        // 2. VERIFICATION EMAIL
        else if (path.includes("verify-email") && returned?.user) {
          const user = returned.user;
          console.log("✅ Traitement vérification email:", user.id);

          await handleEmailVerification(user);
        }

        // 3. CONNEXION
        else if (path.includes("sign-in") && returned?.user) {
          const user = returned.user;
          console.log("🔐 Traitement connexion:", user.id);

          await handleUserSignIn(user);
        }
      } catch (error) {
        console.error("❌ Erreur dans hook after:", error);
        // Ne pas faire échouer l'authentification pour autant
      }

      return {};
    },
  },
});

// =======================================
// FONCTIONS DE TRAITEMENT
// =======================================

async function handleUserSignup(user: User) {
  console.log("🆕 Traitement inscription pour:", user.email);

  const planType = validatePlanType(user.planType || "FREE");
  const isInvitation = !!user.inviteCode;

  // Sauvegarder les métadonnées d'inscription
  await prisma.user.update({
    where: { id: user.id },
    data: {
      planType,
      inviteCode: user.inviteCode || null,
      tempOrganizationId: user.tempOrganizationId || null,
      metadata: {
        planType,
        inviteCode: user.inviteCode || null,
        tempOrganizationId: user.tempOrganizationId || null,
        signupTimestamp: new Date().toISOString(),
        isInvitation,
        organizationCreated: false,
      },
    },
  });

  console.log("✅ Métadonnées d'inscription sauvegardées:", {
    planType,
    isInvitation,
  });
}

async function handleEmailVerification(user: User) {
  console.log("✅ Email vérifié, configuration utilisateur:", user.id);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      Organization: true,
      OrganizationUser: true,
    },
  });

  if (!dbUser) {
    console.error("❌ Utilisateur introuvable après vérification");
    return;
  }

  const metadata = extractUserMetadata(dbUser.metadata);

  // Déterminer le type de configuration nécessaire
  if (metadata.inviteCode) {
    // CASE 1: Invitation - traiter l'invitation
    await handleInvitationAcceptance(dbUser, metadata);
  } else if (!dbUser.Organization) {
    // CASE 2: Inscription normale - créer organisation
    await createOrganizationForUser(dbUser, metadata);
  }

  // Marquer l'email comme vérifié
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  // Email de bienvenue
  await sendWelcomeEmail(dbUser);
}

async function handleUserSignIn(user: User) {
  // Vérifier l'état de l'utilisateur à la connexion
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true, OrganizationUser: true },
  });

  if (!dbUser?.Organization && dbUser?.emailVerified) {
    console.log("🔧 Utilisateur sans organisation détecté, création...");
    const metadata = extractUserMetadata(dbUser.metadata);
    await createOrganizationForUser(dbUser, metadata);
  }
}

// =======================================
// TRAITEMENT DES INVITATIONS
// =======================================

async function handleInvitationAcceptance(user: User, metadata: UserMetadata) {
  console.log("🎯 Traitement acceptation invitation:", {
    userId: user.id,
    inviteCode: metadata.inviteCode,
  });

  // Trouver l'invitation
  const invitation = await prisma.invitationCode.findFirst({
    where: {
      code: metadata.inviteCode || undefined,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    include: { organization: true },
  });

  if (!invitation) {
    console.error("❌ Invitation invalide ou expirée:", metadata.inviteCode);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Lier l'utilisateur à l'organisation
    await tx.user.update({
      where: { id: user.id },
      data: { organizationId: invitation.organizationId },
    });

    // 2. Créer la relation OrganizationUser
    await tx.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    // 3. Marquer l'invitation comme utilisée
    await tx.invitationCode.update({
      where: { id: invitation.id },
      data: { isUsed: true },
    });

    // 4. Mettre à jour les métadonnées
    await tx.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...metadata,
          organizationCreated: true,
          invitationProcessed: true,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      },
    });
  });

  console.log("✅ Invitation acceptée:", {
    organizationId: invitation.organizationId,
    role: invitation.role,
  });
}

// =======================================
// CREATION D'ORGANISATION
// =======================================

async function createOrganizationForUser(user: User, metadata: UserMetadata) {
  console.log("🏢 Création organisation pour:", user.email);

  const planType = metadata.planType || "FREE";

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

      // 4. Créer l'abonnement avec le bon plan
      await createSubscriptionWithPlan(tx, organization.id, planType);

      // 5. Initialiser le stockage
      await tx.storageUsage.create({
        data: {
          organizationId: organization.id,
          totalUsedBytes: 0,
        },
      });

      // 6. Mettre à jour les métadonnées utilisateur
      await tx.user.update({
        where: { id: user.id },
        data: {
          metadata: {
            ...metadata,
            organizationCreated: true,
            organizationId: organization.id,
          },
        },
      });

      console.log("✅ Organisation créée:", {
        organizationId: organization.id,
        planType,
      });
    });
  } catch (error) {
    console.error("❌ Erreur création organisation:", error);
    throw error;
  }
}

// =======================================
// GESTION DES PLANS ET ABONNEMENTS
// =======================================

async function createSubscriptionWithPlan(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  organizationId: string,
  planType: string
) {
  console.log("💰 Création abonnement:", { organizationId, planType });

  // S'assurer que les plans par défaut existent
  await ensureDefaultPlansExist(tx);

  // Récupérer le plan
  const plan = await tx.plan.findFirst({
    where: { name: validatePlanType(planType) },
  });

  if (!plan) {
    console.error("❌ Plan introuvable:", planType);
    throw new Error(`Plan ${planType} introuvable`);
  }

  // Créer l'abonnement
  const subscription = await tx.subscription.create({
    data: {
      organizationId,
      planId: plan.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
    },
  });

  console.log("💰 Abonnement créé:", subscription.id);
  return subscription;
}

async function ensureDefaultPlansExist(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
) {
  const plansToCreate = [
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

  for (const planData of plansToCreate) {
    await tx.plan.upsert({
      where: { name: planData.name },
      update: {}, // Ne pas écraser les plans existants
      create: planData,
    });
  }
}

// =======================================
// UTILITAIRES
// =======================================

function extractUserMetadata(metadata: unknown) {
  const meta =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : {};

  return {
    planType: typeof meta["planType"] === "string" ? meta["planType"] : "FREE",
    inviteCode:
      typeof meta["inviteCode"] === "string" ? meta["inviteCode"] : null,
    tempOrganizationId:
      typeof meta["tempOrganizationId"] === "string"
        ? meta["tempOrganizationId"]
        : null,
    organizationCreated:
      typeof meta["organizationCreated"] === "boolean"
        ? meta["organizationCreated"]
        : false,
  };
}

async function enrichVerificationUrl(
  originalUrl: string,
  user: User
): Promise<string> {
  try {
    const url = new URL(originalUrl);

    // Ajouter les paramètres utilisateur
    if (user.planType) url.searchParams.set("plan", user.planType);
    if (user.inviteCode) url.searchParams.set("code", user.inviteCode);
    if (user.id) url.searchParams.set("userId", user.id);

    return url.toString();
  } catch (error) {
    console.error("Erreur enrichissement URL:", error);
    return originalUrl;
  }
}

interface User {
  id: string;
  email: string;
  name?: string | null;
  planType?: string | null;
  inviteCode?: string | null;
  tempOrganizationId?: string | null;
  emailVerified?: boolean;
  organizationId?: string | null;
}

interface UserMetadata {
  planType: string;
  inviteCode: string | null;
  tempOrganizationId: string | null;
  organizationCreated: boolean;
  signupTimestamp?: string;
  isInvitation?: boolean;
  invitationProcessed?: boolean;
  organizationId?: string;
  role?: string;
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
