// src/lib/auth-session.ts - Version template nettoyée

import { auth } from "./auth";
import { headers } from "next/headers";
import { prisma } from "./prisma";

// Types pour les niveaux d'accès de base
export type AccessLevel = "none" | "read" | "write" | "admin";

// Type étendu pour l'utilisateur avec informations d'organisation
export interface EnrichedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  planType?: string | null;
  // Propriétés enrichies
  organizationId?: string | null;
  Organization?: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  OrganizationUser?: {
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    organization?: {
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
    };
  } | null;
  hasOrganization: boolean;
  isAdmin: boolean;
  organizationRole?: string;
}

/**
 * Récupère l'utilisateur connecté avec informations d'organisation
 */
export const getUser = async (): Promise<EnrichedUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  // Récupérer les informations complètes de l'utilisateur depuis la DB
  const userWithOrganization = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      Organization: true,
      OrganizationUser: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!userWithOrganization) {
    console.warn(
      "⚠️ Utilisateur trouvé dans la session mais pas en DB:",
      session.user.id
    );
    // Retourner l'utilisateur de base avec les propriétés enrichies par défaut
    return {
      ...session.user,
      hasOrganization: false,
      isAdmin: false,
      organizationId: null,
      Organization: null,
      OrganizationUser: null,
      organizationRole: undefined,
    } as EnrichedUser;
  }

  // Enrichir les données de session avec les infos d'organisation
  return {
    ...session.user,
    organizationId: userWithOrganization.organizationId,
    Organization: userWithOrganization.Organization,
    OrganizationUser: userWithOrganization.OrganizationUser,
    // Ajouter des informations d'appartenance
    hasOrganization: !!userWithOrganization.organizationId,
    isAdmin: userWithOrganization.OrganizationUser?.role === "admin",
    organizationRole: userWithOrganization.OrganizationUser?.role,
  } as EnrichedUser;
};

/**
 * Récupère l'utilisateur connecté ou lève une erreur
 */
export const getRequiredUser = async (): Promise<EnrichedUser> => {
  const user = await getUser();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Vérifie si l'utilisateur appartient à une organisation
 */
export async function checkOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<boolean> {
  console.log("🔍 Vérification appartenance organisation:", {
    userId,
    organizationId,
  });

  const userWithOrg = await prisma.user.findUnique({
    where: { id: userId },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    console.log("❌ Utilisateur sans organisation:", userId);
    return false;
  }

  const isMember = userWithOrg.Organization.id === organizationId;
  console.log("✅ Appartenance vérifiée:", {
    userOrgId: userWithOrg.Organization.id,
    targetOrgId: organizationId,
    isMember,
  });

  return isMember;
}

/**
 * Vérifie si l'utilisateur est administrateur de l'organisation
 */
export async function isOrganizationAdmin(userId: string): Promise<boolean> {
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId, role: "admin" },
  });

  const isAdmin = !!orgUser;
  console.log("🔧 Vérification admin:", { userId, isAdmin });
  return isAdmin;
}

/**
 * Récupère les informations de l'organisation d'un utilisateur
 */
export async function getUserOrganization(userId: string) {
  const userWithOrg = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Organization: true,
      OrganizationUser: true,
    },
  });

  return userWithOrg;
}

/**
 * Vérifie si l'utilisateur peut gérer l'organisation (admin)
 */
export async function canManageOrganization(
  userId: string,
  organizationId?: string
): Promise<boolean> {
  const userWithOrg = await getUserOrganization(userId);

  if (!userWithOrg?.OrganizationUser) {
    return false;
  }

  // Si organizationId est spécifié, vérifier qu'il correspond
  if (organizationId && userWithOrg.organizationId !== organizationId) {
    return false;
  }

  return userWithOrg.OrganizationUser.role === "admin";
}

/**
 * Récupère les utilisateurs d'une organisation
 */
export async function getOrganizationUsers(organizationId: string) {
  return prisma.organizationUser.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

/**
 * Vérifie si l'utilisateur peut inviter d'autres utilisateurs
 */
export async function canInviteUsers(userId: string): Promise<boolean> {
  return isOrganizationAdmin(userId);
}
