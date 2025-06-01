// src/app/pricing/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import PricingPlans from "@/app/pricing/pricing-plans";

export default async function PricingPage() {
  // Récupérer l'utilisateur (mais ne pas rediriger s'il n'est pas connecté)
  const user = await getUser();
  let currentPlan = null;
  let organizationId = null;
  let isAdmin = false;

  // Récupérer tous les plans disponibles MAIS filtrer ceux qui sont réservés aux admins
  const prismaPlans = await prisma.plan.findMany({
    where: {
      name: {
        notIn: ["SUPER_ADMIN", "ILLIMITE", "CUSTOM"], // Exclure ces plans
      },
    },
    orderBy: {
      price: "asc",
    },
  });

  // Convert Decimal to number for compatibility with the Plan interface
  const plans = prismaPlans.map((plan) => ({
    ...plan,
    price: typeof plan.price === "object" ? Number(plan.price) : plan.price,
    monthlyPrice:
      typeof plan.monthlyPrice === "object"
        ? Number(plan.monthlyPrice)
        : plan.monthlyPrice,
    yearlyPrice:
      typeof plan.yearlyPrice === "object"
        ? Number(plan.yearlyPrice)
        : plan.yearlyPrice,
  }));

  // Si l'utilisateur est connecté, récupérer son plan actuel et ses droits
  if (user) {
    // Récupérer l'organisation de l'utilisateur
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (userWithOrg?.Organization) {
      organizationId = userWithOrg.Organization.id;

      // Récupérer l'abonnement actuel
      const subscription = await prisma.subscription.findUnique({
        where: { organizationId },
        include: { plan: true },
      });

      // Convert subscription plan Decimal to number if it exists
      if (subscription?.plan) {
        currentPlan = {
          ...subscription.plan,
          price:
            typeof subscription.plan.price === "object"
              ? Number(subscription.plan.price)
              : subscription.plan.price,
          monthlyPrice:
            typeof subscription.plan.monthlyPrice === "object"
              ? Number(subscription.plan.monthlyPrice)
              : subscription.plan.monthlyPrice,
          yearlyPrice:
            typeof subscription.plan.yearlyPrice === "object"
              ? Number(subscription.plan.yearlyPrice)
              : subscription.plan.yearlyPrice,
        };
      }

      // Vérifier si l'utilisateur est admin
      isAdmin = !!(await prisma.organizationUser.findFirst({
        where: { userId: user.id, organizationId, role: "admin" },
      }));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        {/* Cercles décoratifs */}
        <div className="absolute -right-20 top-1/4 w-64 h-64 rounded-full bg-[#d9840d]/10 blur-2xl -z-10" />
        <div className="absolute left-1/4 -bottom-32 w-72 h-72 rounded-full bg-[#e8ebe0]/40 blur-xl -z-10" />

        <div className="text-center mb-14">
          <div className="inline-block bg-[#d9840d]/10 px-4 py-2 rounded-full mb-4">
            <span className="text-[#d9840d] font-medium">Plans et tarifs</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#141313]">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-[#62605d] max-w-3xl mx-auto">
            Sélectionnez l&apos;offre qui correspond le mieux à vos besoins et
            commencez à optimiser la gestion de vos projets immobiliers dès
            aujourd&apos;hui.
          </p>
        </div>

        <PricingPlans
          plans={plans}
          currentPlan={currentPlan}
          isAdmin={isAdmin}
          organizationId={organizationId || ""}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
