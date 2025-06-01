import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: orgId } = await params;
    const { type, adjustment } = await request.json();

    // Vérifier que l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const updateData: { maxUsers?: number; maxObjects?: number } = {};

    // Préparer les données de mise à jour selon le type
    switch (type) {
      case "users":
        const currentUsersLimit = organization.subscription?.plan.maxUsers || 0;
        updateData.maxUsers = Math.max(0, currentUsersLimit + adjustment);
        break;
      case "objects":
        const currentObjectsLimit =
          organization.subscription?.plan.maxObjects || 0;
        updateData.maxObjects = Math.max(0, currentObjectsLimit + adjustment);
        break;
      case "storage":
        // Pour le stockage, vous devrez ajouter ce champ au modèle Plan
        // updateData.maxStorage = currentStorageLimit + adjustment;
        break;
      default:
        return NextResponse.json(
          { error: "Type d'ajustement non valide" },
          { status: 400 }
        );
    }

    // Mettre à jour le plan
    if (organization.subscription) {
      await prisma.plan.update({
        where: { id: organization.subscription.planId },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Limite ${type} ajustée de ${adjustment}`,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajustement rapide:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
