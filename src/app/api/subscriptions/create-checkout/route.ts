import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe-server"; // Import serveur pour Stripe
import { PLAN_DETAILS } from "@/lib/stripe"; // Import partagé pour les configs

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { planType } = await req.json();

    if (!planType || !Object.keys(PLAN_DETAILS).includes(planType)) {
      return NextResponse.json({ error: "Plan non valide" }, { status: 400 });
    }

    if (planType === "ENTERPRISE") {
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/contact?plan=enterprise`,
      });
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

    const existingSubscription = await prisma.subscription.findUnique({
      where: { organizationId: userWithOrg.Organization.id },
      include: { plan: true },
    });

    // Pour le plan FREE, pas besoin de Stripe
    if (planType === "FREE") {
      const freePlan = await prisma.plan.findUnique({
        where: { name: "FREE" },
      });

      if (!freePlan) {
        return NextResponse.json(
          { error: "Plan gratuit non trouvé" },
          { status: 404 }
        );
      }

      if (existingSubscription) {
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: freePlan.id,
            status: "ACTIVE",
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            cancelAtPeriodEnd: false,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            organizationId: userWithOrg.Organization.id,
            planId: freePlan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return NextResponse.json({
        success: true,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=activated`,
      });
    }

    // Pour les plans payants, vérifier que Stripe est disponible
    if (!stripe) {
      return NextResponse.json(
        { error: "Service de paiement temporairement indisponible" },
        { status: 503 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { name: planType },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }

    let customerId = existingSubscription?.stripeCustomerId || null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: userWithOrg.Organization.name,
        metadata: {
          organizationId: userWithOrg.Organization.id,
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId!,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=canceled`,
      metadata: {
        organizationId: userWithOrg.Organization.id,
        planType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur lors de la création de la session Stripe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
