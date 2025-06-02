// src/app/api/admin/organizations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

export async function GET() {
  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer toutes les organisations avec des informations supplémentaires
    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          select: { id: true },
        },
        subscription: {
          include: {
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatter les résultats
    const formattedOrganizations = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      userCount: org.users.length,
      subscription: org.subscription
        ? {
            id: org.subscription.id,
            planName: org.subscription.plan.name,
            status: org.subscription.status,
          }
        : null,
    }));

    return NextResponse.json({ organizations: formattedOrganizations });
  } catch (error) {
    console.error("Erreur lors de la récupération des organisations:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer les données de la nouvelle organisation
    const orgData = await request.json();

    // Vérifier les données requises
    if (!orgData.name) {
      return NextResponse.json(
        { error: "Le nom de l'organisation est requis" },
        { status: 400 }
      );
    }

    // Créer l'organisation
    const newOrg = await prisma.organization.create({
      data: {
        name: orgData.name,
      },
    });

    // Si un plan est spécifié, créer un abonnement
    if (orgData.planName) {
      // Récupérer le plan
      const plan = await prisma.plan.findUnique({
        where: { name: orgData.planName },
      });

      if (plan) {
        // Créer l'abonnement
        await prisma.subscription.create({
          data: {
            organizationId: newOrg.id,
            planId: plan.id,
            status: orgData.status || "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            cancelAtPeriodEnd: false,
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Organisation créée avec succès",
        organization: newOrg,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de l'organisation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
