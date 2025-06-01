import { PrismaClient, PlanType } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting to seed plans...");

  // Supprimer les plans existants (si nécessaire)
  await prisma.plan.deleteMany({});

  // Créer le plan FREE
  await prisma.plan.create({
    data: {
      name: PlanType.FREE,
      stripeProductId: null, // Pas de produit Stripe pour le plan gratuit
      stripePriceId: null,
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: null,
      maxUsers: 1,
      maxObjects: 1,
      hasCustomPricing: false,
      trialDays: 0,
      features: ["1 utilisateur", "1 objet", "Fonctionnalités basiques"],
    },
  });

  // Créer le plan PERSONAL
  await prisma.plan.create({
    data: {
      name: PlanType.PERSONAL,
      stripeProductId: "prod_SGIEtVCmOll3el", // Remplacer par votre ID de produit Stripe
      stripePriceId: "price_1RLldxBQLEouvGCfL3be36t8", // Remplacer par votre ID de prix Stripe
      price: 9.99,
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      maxUsers: 1,
      maxObjects: 5,
      hasCustomPricing: false,
      trialDays: 14,
      features: ["1 utilisateur", "5 objets", "Toutes les fonctionnalités"],
    },
  });

  // Créer le plan PROFESSIONAL
  await prisma.plan.create({
    data: {
      name: PlanType.PROFESSIONAL,
      stripeProductId: "prod_SGIGQkZN7Seepi", // Remplacer par votre ID de produit Stripe
      stripePriceId: "price_1RLlfZBQLEouvGCfM7mFl469", // Remplacer par votre ID de prix Stripe
      price: 29.99,
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      maxUsers: 5,
      maxObjects: 20,
      hasCustomPricing: false,
      trialDays: 14,
      features: [
        "Jusqu'à 5 utilisateurs",
        "20 objets",
        "Toutes les fonctionnalités",
        "Support email",
      ],
    },
  });

  // Créer le plan ENTERPRISE
  await prisma.plan.create({
    data: {
      name: PlanType.ENTERPRISE,
      stripeProductId: null,
      stripePriceId: null,
      price: 99.99,
      monthlyPrice: 99.99,
      yearlyPrice: null,
      maxUsers: null, // Illimité
      maxObjects: null, // Illimité
      hasCustomPricing: true,
      trialDays: 14,
      features: [
        "Utilisateurs illimités",
        "Objets illimités",
        "Toutes les fonctionnalités",
        "Support dédié",
      ],
    },
  });

  await prisma.plan.create({
    data: {
      name: PlanType.SUPER_ADMIN,
      stripeProductId: null,
      stripePriceId: null,
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: null,
      maxUsers: null, // Illimité
      maxObjects: null, // Illimité
      hasCustomPricing: false,
      trialDays: 0,
      features: [
        "Accès super administrateur",
        "Utilisateurs illimités",
        "Objets illimités",
        "Toutes les fonctionnalités",
      ],
    },
  });

  // Créer le plan ILLIMITE
  await prisma.plan.create({
    data: {
      name: PlanType.ILLIMITE,
      stripeProductId: null,
      stripePriceId: null,
      price: 0,
      monthlyPrice: 0,
      yearlyPrice: null,
      maxUsers: null, // Illimité
      maxObjects: null, // Illimité
      hasCustomPricing: false,
      trialDays: 0,
      features: [
        "Accès privilégié",
        "Utilisateurs illimités",
        "Objets illimités",
        "Toutes les fonctionnalités",
      ],
    },
  });

  console.log("Plans seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
