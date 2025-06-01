import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe-server"; // Import serveur pour Stripe

export async function POST(req: NextRequest) {
  try {
    // Vérifier que Stripe est disponible
    if (!stripe) {
      return NextResponse.json(
        { error: "Service de paiement temporairement indisponible" },
        { status: 503 }
      );
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

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

    const isAdmin = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        organizationId: userWithOrg.Organization.id,
        role: "admin",
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent annuler l'abonnement" },
        { status: 403 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: userWithOrg.Organization.id },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Aucun abonnement actif trouvé" },
        { status: 404 }
      );
    }

    const { cancelImmediately } = await req.json();

    if (cancelImmediately) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } else {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: cancelImmediately ? false : true,
        status: cancelImmediately ? "CANCELED" : subscription.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: cancelImmediately
        ? "Abonnement annulé immédiatement"
        : "Abonnement programmé pour être annulé à la fin de la période en cours",
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de l'abonnement" },
      { status: 500 }
    );
  }
}
