// prisma/seed.ts
import { PrismaClient, PlanType } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPlans() {
  console.log("🌱 Début du seeding des plans...");

  // Supprimer les plans existants (optionnel, pour éviter les doublons)
  await prisma.plan.deleteMany();
  console.log("🗑️ Plans existants supprimés");

  // Plans de base avec toutes les propriétés requises
  const plans = [
    {
      name: PlanType.FREE,
      stripeProductId: null, // Pas de Stripe pour le gratuit
      stripePriceId: null,
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxUsers: 1,
      hasCustomPricing: false,
      trialDays: 0,
      features: [
        "1 utilisateur maximum",
        "1 mandat maximum",
        "100MB de stockage",
        "Dashboard de base uniquement",
        "Support communauté",
        "❌ Pas d'accès masse salariale",
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      maxStorage: 100, // 100MB
      description: "Plan gratuit avec fonctionnalités limitées",
      hasAdvancedReports: false,
      hasApiAccess: false,
      hasCustomBranding: false,
      isActive: true,
      maxApiCalls: 100,
      sortOrder: 1,
      supportLevel: "community",
    },
    {
      name: PlanType.PREMIUM,
      stripeProductId: "prod_SSzanXH0ailEMP",
      stripePriceId: "price_1RY3b1GuCDQP9LdIXFEMIlkM",
      price: 29,
      monthlyPrice: 29,
      yearlyPrice: 290, // 10 mois payés
      maxUsers: 5,
      hasCustomPricing: false,
      trialDays: 14,
      features: [
        "5 utilisateurs",
        "Objets illimités",
        "10GB de stockage",
        "Support prioritaire",
        "Gestion d'équipe",
        "Rapports avancés",
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      maxStorage: 10240, // 10GB
      description: "Pour une utilisation professionnelle",
      hasAdvancedReports: true,
      hasApiAccess: true,
      hasCustomBranding: true,
      isActive: true,
      maxApiCalls: 10000,
      sortOrder: 3,
      supportLevel: "priority",
    },
    {
      name: PlanType.SUPER_ADMIN,
      stripeProductId: null,
      stripePriceId: null,
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxUsers: null,
      hasCustomPricing: false,
      trialDays: 0,
      features: ["Accès administrateur complet"],
      createdAt: new Date(),
      updatedAt: new Date(),
      maxStorage: null, // Illimité
      description: "Accès complet au système",
      hasAdvancedReports: true,
      hasApiAccess: true,
      hasCustomBranding: true,
      isActive: true,
      maxApiCalls: null,
      sortOrder: 0,
      supportLevel: "admin",
    },
  ];

  // Créer chaque plan
  for (const planData of plans) {
    const plan = await prisma.plan.create({
      data: planData,
    });
    console.log(`✅ Plan créé: ${plan.name} (ID: ${plan.id})`);
  }

  console.log("🎉 Seeding des plans terminé avec succès!");
}

async function main() {
  try {
    await seedPlans();
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
