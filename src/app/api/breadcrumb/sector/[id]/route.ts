// src/app/api/breadcrumb/sector/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { id: sectorId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Récupérer le secteur avec l'objet associé
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
      include: { object: true },
    });

    if (!sector) {
      return NextResponse.json(
        { error: "Secteur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur appartient à la même organisation que l'objet
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à ce secteur" },
        { status: 403 }
      );
    }

    // Retourner les données du secteur nécessaires pour le breadcrumb
    return NextResponse.json({
      id: sector.id,
      name: sector.name,
      objectId: sector.objectId,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du secteur :", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du secteur" },
      { status: 500 }
    );
  }
}
