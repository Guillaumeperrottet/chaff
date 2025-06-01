import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe-server"; // Import serveur pour Stripe

export async function POST() {
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

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: userWithOrg.Organization.id },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur lors de la création du portail Stripe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du portail client" },
      { status: 500 }
    );
  }
}
