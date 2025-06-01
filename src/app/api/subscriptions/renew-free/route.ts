// src/app/api/subscriptions/renew-free/route.ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (!userWithOrg?.Organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est admin de l'organisation
    const isAdmin = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        organizationId: userWithOrg.Organization.id,
        role: "admin",
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent renouveler un abonnement" },
        { status: 403 }
      );
    }

    // Récupérer l'abonnement actuel
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: userWithOrg.Organization.id },
      include: { plan: true },
    });

    // Vérifier si c'est un plan gratuit
    if (!subscription || subscription.plan.name !== "FREE") {
      return NextResponse.json(
        {
          error:
            "Seuls les plans gratuits peuvent être renouvelés via cette API",
        },
        { status: 400 }
      );
    }

    // Renouveler l'abonnement gratuit pour un an
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement gratuit renouvelé avec succès",
      newExpiryDate: updatedSubscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Erreur lors du renouvellement de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur lors du renouvellement de l'abonnement" },
      { status: 500 }
    );
  }
}
