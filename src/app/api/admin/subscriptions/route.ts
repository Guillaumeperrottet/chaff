// src/app/api/admin/subscriptions/route.ts
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

    // Récupérer tous les abonnements avec des informations détaillées
    const subscriptions = await prisma.subscription.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatter les résultats
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      organization: {
        id: sub.organization.id,
        name: sub.organization.name,
      },
      plan: {
        id: sub.plan.id,
        name: sub.plan.name,
        monthlyPrice: sub.plan.monthlyPrice,
      },
      status: sub.status,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      createdAt: sub.createdAt,
    }));

    return NextResponse.json({ subscriptions: formattedSubscriptions });
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnements:", error);
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

    // Récupérer les données du nouvel abonnement
    const subData = await request.json();

    // Vérifier les données requises
    if (!subData.organizationId || !subData.planName) {
      return NextResponse.json(
        { error: "L'ID de l'organisation et le nom du plan sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: subData.organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le plan existe
    const plan = await prisma.plan.findUnique({
      where: { name: subData.planName },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }

    // Vérifier si l'organisation a déjà un abonnement
    const existingSub = await prisma.subscription.findUnique({
      where: { organizationId: subData.organizationId },
    });

    if (existingSub) {
      return NextResponse.json(
        { error: "Cette organisation a déjà un abonnement" },
        { status: 400 }
      );
    }

    // Créer l'abonnement
    const newSubscription = await prisma.subscription.create({
      data: {
        organizationId: subData.organizationId,
        planId: plan.id,
        status: subData.status || "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        cancelAtPeriodEnd: subData.cancelAtPeriodEnd || false,
        stripeSubscriptionId: subData.stripeSubscriptionId,
        stripeCustomerId: subData.stripeCustomerId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Abonnement créé avec succès",
        subscription: newSubscription,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
