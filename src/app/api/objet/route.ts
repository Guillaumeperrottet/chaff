// src/app/api/objet/route.ts - Version corrigée avec types
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUser,
  getAccessibleObjects,
  type EnrichedUser,
} from "@/lib/auth-session";

export async function GET() {
  console.log("🏠 API /api/objet appelée");

  const user: EnrichedUser | null = await getUser();
  if (!user) {
    console.log("❌ Utilisateur non authentifié");
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  console.log("👤 Utilisateur authentifié:", {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId, // ✅ Maintenant TypeScript reconnaît cette propriété
    hasOrganization: user.hasOrganization,
    isAdmin: user.isAdmin,
  });

  // Utiliser les informations enrichies de la session
  const organizationId = user.organizationId;

  if (!organizationId) {
    console.log("❌ Utilisateur sans organisation");

    // Vérifier si l'utilisateur a une organisation en DB mais pas dans la session
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        Organization: true,
        OrganizationUser: true,
      },
    });

    console.log("🔍 Vérification DB:", {
      userOrgId: userWithOrg?.organizationId,
      hasOrganization: !!userWithOrg?.Organization,
      hasOrgUser: !!userWithOrg?.OrganizationUser,
    });

    if (userWithOrg?.Organization) {
      console.log("⚠️ Discordance: organisation en DB mais pas dans session");
      // Utiliser l'organisation de la DB
      return getObjectsForOrganization(user.id, userWithOrg.Organization.id);
    }

    return NextResponse.json(
      { error: "Aucune organisation trouvée" },
      { status: 404 }
    );
  }

  // Utiliser la nouvelle fonction getAccessibleObjects
  return getObjectsForOrganization(user.id, organizationId);
}

async function getObjectsForOrganization(
  userId: string,
  organizationId: string
) {
  console.log("🏠 Récupération objets pour organisation:", organizationId);

  try {
    // Utiliser la fonction getAccessibleObjects qui gère la logique admin/member
    const objects = await getAccessibleObjects(userId, organizationId);

    console.log("✅ Objets récupérés:", objects.length);
    objects.forEach((obj) => console.log(`  - ${obj.nom} (${obj.id})`));

    // Formatter les données pour la réponse
    const formattedObjects = objects.map((obj) => ({
      id: obj.id,
      nom: obj.nom,
      adresse: obj.adresse,
      secteur: obj.secteur,
    }));

    return NextResponse.json(formattedObjects);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des objets:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des objets" },
      { status: 500 }
    );
  }
}
