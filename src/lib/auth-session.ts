import { auth } from "./auth";
import { headers } from "next/headers";
import { prisma } from "./prisma";

// Types pour les niveaux d'accès
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

export const getUser = async (): Promise<EnrichedUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  // CORRECTIF: Récupérer les informations complètes de l'utilisateur depuis la DB
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

export const getRequiredUser = async (): Promise<EnrichedUser> => {
  const user = await getUser();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Vérifie si l'utilisateur appartient à la même organisation que l'objet
 */
export async function checkOrganizationMembership(
  userId: string,
  objectId: string
): Promise<boolean> {
  console.log("🔍 Vérification appartenance organisation:", {
    userId,
    objectId,
  });

  const userWithOrg = await prisma.user.findUnique({
    where: { id: userId },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    console.log("❌ Utilisateur sans organisation:", userId);
    return false;
  }

  const object = await prisma.objet.findUnique({
    where: { id: objectId },
    select: { organizationId: true },
  });

  if (!object) {
    console.log("❌ Objet introuvable:", objectId);
    return false;
  }

  const isMember = userWithOrg.Organization.id === object.organizationId;
  console.log("✅ Appartenance vérifiée:", {
    userOrgId: userWithOrg.Organization.id,
    objectOrgId: object.organizationId,
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
 * Vérifie si l'utilisateur a le niveau d'accès requis pour un objet
 */
export async function checkObjectAccess(
  userId: string,
  objectId: string,
  requiredLevel: AccessLevel
): Promise<boolean> {
  console.log("🔐 Vérification accès objet:", {
    userId,
    objectId,
    requiredLevel,
  });

  // Les administrateurs ont toujours accès à tout
  const isAdmin = await isOrganizationAdmin(userId);
  if (isAdmin) {
    console.log("✅ Accès admin accordé");
    return true;
  }

  // Si le niveau requis est "none", pas besoin de vérifier plus loin
  if (requiredLevel === "none") {
    return true;
  }

  // Vérifier d'abord l'appartenance à l'organisation
  const isMember = await checkOrganizationMembership(userId, objectId);
  if (!isMember) {
    console.log("❌ Utilisateur pas membre de l'organisation");
    return false;
  }

  // Récupérer le niveau d'accès de l'utilisateur pour cet objet
  const access = await prisma.objectAccess.findUnique({
    where: {
      userId_objectId: { userId, objectId },
    },
  });

  // Mapping des niveaux d'accès en valeurs numériques pour comparaison
  const accessLevels: Record<AccessLevel, number> = {
    none: 0,
    read: 1,
    write: 2,
    admin: 3,
  };

  // Par défaut, si aucun accès spécifique n'est défini, l'utilisateur a un accès "none"
  const userLevel = access
    ? accessLevels[access.accessLevel as AccessLevel]
    : 0;
  const requiredLevelValue = accessLevels[requiredLevel];

  const hasAccess = userLevel >= requiredLevelValue;
  console.log("🔐 Résultat vérification accès:", {
    userLevel,
    requiredLevel: requiredLevelValue,
    hasAccess,
  });

  return hasAccess;
}

/**
 * Vérifie si l'utilisateur a le niveau d'accès requis pour un secteur
 * (via l'objet parent)
 */
export async function checkSectorAccess(
  userId: string,
  sectorId: string,
  requiredLevel: AccessLevel
): Promise<boolean> {
  // Les administrateurs ont toujours accès à tout
  const isAdmin = await isOrganizationAdmin(userId);
  if (isAdmin) {
    return true;
  }

  // Récupérer le secteur avec son objet parent
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    include: { object: true },
  });

  if (!sector) {
    return false;
  }

  // Déléguer la vérification à la fonction checkObjectAccess
  return checkObjectAccess(userId, sector.objectId, requiredLevel);
}

/**
 * Vérifie si l'utilisateur a le niveau d'accès requis pour un article
 * (via le secteur et l'objet parent)
 */
export async function checkArticleAccess(
  userId: string,
  articleId: string,
  requiredLevel: AccessLevel
): Promise<boolean> {
  // Les administrateurs ont toujours accès à tout
  const isAdmin = await isOrganizationAdmin(userId);
  if (isAdmin) {
    return true;
  }

  // Récupérer l'article avec son secteur et l'objet parent
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      sector: {
        include: { object: true },
      },
    },
  });

  if (!article) {
    return false;
  }

  // Déléguer la vérification à la fonction checkObjectAccess
  return checkObjectAccess(userId, article.sector.objectId, requiredLevel);
}

/**
 * Vérifie si l'utilisateur a le niveau d'accès requis pour une tâche
 * (via l'article, le secteur et l'objet parent)
 */
export async function checkTaskAccess(
  userId: string,
  taskId: string,
  requiredLevel: AccessLevel
): Promise<boolean> {
  // Les administrateurs ont toujours accès à tout
  const isAdmin = await isOrganizationAdmin(userId);
  if (isAdmin) {
    return true;
  }

  // Récupérer la tâche avec son article, secteur et l'objet parent
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: {
            include: { object: true },
          },
        },
      },
    },
  });

  if (!task) {
    return false;
  }

  // Déléguer la vérification à la fonction checkObjectAccess
  return checkObjectAccess(userId, task.article.sector.objectId, requiredLevel);
}

/**
 * NOUVELLE FONCTION: Récupère les objets accessibles pour un utilisateur
 * Cette fonction remplace la logique dans /api/objet/route.ts
 */
export async function getAccessibleObjects(
  userId: string,
  organizationId?: string
) {
  console.log("🏠 Récupération objets accessibles:", {
    userId,
    organizationId,
  });

  // Récupérer l'utilisateur avec son organisation si pas fournie
  let userOrgId = organizationId;
  let userRole = null;

  if (!userOrgId) {
    const userWithOrg = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Organization: true,
        OrganizationUser: true,
      },
    });
    userOrgId = userWithOrg?.Organization?.id;
    userRole = userWithOrg?.OrganizationUser?.role;
  } else {
    // Récupérer le rôle si on a l'orgId
    const orgUser = await prisma.organizationUser.findFirst({
      where: { userId, organizationId: userOrgId },
    });
    userRole = orgUser?.role;
  }

  if (!userOrgId) {
    console.log("❌ Pas d'organisation trouvée pour l'utilisateur");
    return [];
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin = userRole === "admin";
  console.log("🔧 Utilisateur admin:", isAdmin, "- Rôle:", userRole);

  // Si l'utilisateur est admin, retourner tous les objets
  if (isAdmin) {
    console.log("✅ Admin: retour de tous les objets");
    return prisma.objet.findMany({
      where: { organizationId: userOrgId },
      orderBy: { nom: "asc" },
    });
  }

  // Pour les membres non-admin, récupérer les accès explicites
  const objectAccess = await prisma.objectAccess.findMany({
    where: {
      userId,
      NOT: { accessLevel: "none" },
    },
    select: { objectId: true, accessLevel: true },
  });

  console.log("🔐 Accès trouvés:", objectAccess.length);

  // CORRECTIF: Si aucun accès et que l'utilisateur est membre, créer les accès par défaut
  if (objectAccess.length === 0 && userRole) {
    console.log("⚠️ Membre sans accès détecté - Création des accès par défaut");

    await createDefaultObjectAccessForNewMember(userId, userOrgId, userRole);

    // Re-récupérer les accès après création
    const newObjectAccess = await prisma.objectAccess.findMany({
      where: {
        userId,
        NOT: { accessLevel: "none" },
      },
      select: { objectId: true },
    });

    if (newObjectAccess.length > 0) {
      const objectIds = newObjectAccess.map((access) => access.objectId);
      return prisma.objet.findMany({
        where: {
          id: { in: objectIds },
          organizationId: userOrgId,
        },
        orderBy: { nom: "asc" },
      });
    }
  }

  const objectIds = objectAccess.map((access) => access.objectId);
  console.log("🔐 IDs objets avec accès:", objectIds);

  return prisma.objet.findMany({
    where: {
      id: { in: objectIds },
      organizationId: userOrgId,
    },
    orderBy: { nom: "asc" },
  });
}
/**
 * Crée les accès par défaut aux objets pour un utilisateur lors de son ajout à une organisation.
 * - Les admins ont accès "admin" à tous les objets de l'organisation.
 * - Les membres ont accès "read" à tous les objets de l'organisation.
 */
async function createDefaultObjectAccessForNewMember(
  userId: string,
  userOrgId: string,
  role: string
) {
  // Déterminer le niveau d'accès par défaut selon le rôle
  const accessLevel = role === "admin" ? "admin" : "read";

  // Récupérer tous les objets de l'organisation
  const objects = await prisma.objet.findMany({
    where: { organizationId: userOrgId },
    select: { id: true },
  });

  if (objects.length === 0) return;

  // Préparer les accès à créer
  const data = objects.map((obj) => ({
    userId,
    objectId: obj.id,
    accessLevel,
  }));

  // Créer les accès en batch (ignorer les doublons)
  await prisma.objectAccess.createMany({
    data,
    skipDuplicates: true,
  });
}
