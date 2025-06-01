// src/app/api/subscriptions/details/route.ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Obtenez l'organisation de l'utilisateur
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

    // Récupérez l'abonnement avec les détails du plan
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: userWithOrg.Organization.id },
      include: { plan: true },
    });

    // Si aucun abonnement n'existe, on considère que c'est un abonnement gratuit
    if (!subscription) {
      const freePlan = await prisma.plan.findUnique({
        where: { name: "FREE" },
      });

      return NextResponse.json({
        subscription: null,
        plan: freePlan,
        onFreePlan: true,
      });
    }

    return NextResponse.json({
      subscription,
      plan: subscription.plan,
      onFreePlan: subscription.plan.name === "FREE",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des détails de l'abonnement:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des détails de l'abonnement" },
      { status: 500 }
    );
  }
}
