// src/app/api/admin/organizations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

// Define the route parameters type
type RouteParams = {
  params: Promise<{ id: string }>;
};

// Récupérer une organisation spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: orgId } = await params;

  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer l'organisation avec des informations détaillées
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: {
          include: {
            OrganizationUser: {
              select: {
                role: true,
              },
            },
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'organisation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Mettre à jour une organisation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id: orgId } = await params;

  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const updateData = await request.json();

    // Vérifier que l'organisation existe
    const existingOrg = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour l'organisation
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: updateData.name,
      },
    });

    // Si un plan est spécifié, mettre à jour ou créer l'abonnement
    if (updateData.subscription) {
      const planName = updateData.subscription.planName;
      const status = updateData.subscription.status || "ACTIVE";

      // Récupérer le plan
      const plan = await prisma.plan.findUnique({
        where: { name: planName },
      });

      if (!plan) {
        return NextResponse.json(
          {
            error: "Plan non trouvé",
            organization: updatedOrg,
          },
          { status: 400 }
        );
      }

      // Vérifier si un abonnement existe déjà
      const existingSub = await prisma.subscription.findUnique({
        where: { organizationId: orgId },
      });

      if (existingSub) {
        // Mettre à jour l'abonnement
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            planId: plan.id,
            status: status,
            // Autres champs pertinents...
            cancelAtPeriodEnd:
              updateData.subscription.cancelAtPeriodEnd || false,
          },
        });
      } else {
        // Créer un nouvel abonnement
        await prisma.subscription.create({
          data: {
            organizationId: orgId,
            planId: plan.id,
            status: status,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            cancelAtPeriodEnd:
              updateData.subscription.cancelAtPeriodEnd || false,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Organisation mise à jour avec succès",
      organization: updatedOrg,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'organisation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Supprimer une organisation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: orgId } = await params;

  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que l'organisation existe
    const existingOrg = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Organisation supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'organisation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
