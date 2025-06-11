// prisma/seed.ts
import { PrismaClient, PlanType } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPlans() {
  console.log("🌱 Début du seeding des plans...");

  // Ne pas supprimer les plans existants à cause des contraintes de clés étrangères
  // await prisma.plan.deleteMany();
  console.log("📋 Création/mise à jour des plans...");

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
      maxMandates: 1, // ✨ Limite de 1 mandat
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
      maxMandates: null, // ✨ Illimité pour Premium
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
      maxMandates: null,
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
    {
      name: PlanType.ILLIMITE,
      stripeProductId: null,
      stripePriceId: null,
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxUsers: null,
      maxMandates: null,
      maxStorage: null, // Illimité
      description: "Plan illimité réservé aux utilisateurs spéciaux",
      hasAdvancedReports: true,
      hasApiAccess: true,
      hasCustomBranding: true,
      isActive: true,
      maxApiCalls: null,
      sortOrder: 999,
      supportLevel: "premium",
    },
    {
      name: PlanType.CUSTOM,
      stripeProductId: null,
      stripePriceId: null,
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxUsers: null,
      maxMandates: null,
      maxStorage: null,
      description: "Plan avec limites personnalisées",
      hasAdvancedReports: true,
      hasApiAccess: true,
      hasCustomBranding: true,
      isActive: true,
      maxApiCalls: null,
      sortOrder: 998,
      supportLevel: "custom",
    },
  ];

  // Créer chaque plan avec upsert pour éviter les doublons
  for (const planData of plans) {
    const plan = await prisma.plan.upsert({
      where: { name: planData.name },
      update: planData,
      create: planData,
    });
    console.log(`✅ Plan créé/mis à jour: ${plan.name} (ID: ${plan.id})`);
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
