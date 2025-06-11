// Script pour créer le plan ILLIMITE dans la base de données
// Usage: npx ts-node scripts/create-unlimited-plan.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createUnlimitedPlan() {
  try {
    console.log("🚀 Création du plan ILLIMITE...");

    // Vérifier si le plan existe déjà
    const existingPlan = await prisma.plan.findFirst({
      where: { name: "ILLIMITE" },
    });

    if (existingPlan) {
      console.log("ℹ️ Le plan ILLIMITE existe déjà:", existingPlan.id);
      return existingPlan;
    }

    // Créer le plan ILLIMITE avec des valeurs très élevées pour simuler l'illimité
    const unlimitedPlan = await prisma.plan.create({
      data: {
        name: "ILLIMITE",
        price: 0, // Gratuit (attribué manuellement)
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxUsers: 999999, // Pratiquement illimité
        maxMandates: 999999, // Pratiquement illimité
        maxStorage: 999999999, // 999 GB - pratiquement illimité
        description: "Plan illimité réservé aux utilisateurs spéciaux",
        isActive: true,
        hasAdvancedReports: true, // Toutes les fonctionnalités activées
        hasApiAccess: true,
        hasCustomBranding: true,
        maxApiCalls: 999999999, // Pratiquement illimité
        sortOrder: 999, // En dernier dans l'ordre d'affichage
        supportLevel: "premium", // Support premium
      },
    });

    console.log("✅ Plan ILLIMITE créé avec succès!");
    console.log("📋 Détails du plan:");
    console.log(`   - ID: ${unlimitedPlan.id}`);
    console.log(`   - Nom: ${unlimitedPlan.name}`);
    console.log(`   - Max Users: ${unlimitedPlan.maxUsers}`);
    console.log(`   - Max Mandates: ${unlimitedPlan.maxMandates}`);
    console.log(`   - Max Storage: ${unlimitedPlan.maxStorage} MB`);
    console.log(`   - API Calls: ${unlimitedPlan.maxApiCalls}`);

    return unlimitedPlan;
  } catch (error) {
    console.error("❌ Erreur lors de la création du plan ILLIMITE:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createUnlimitedPlan()
    .then(() => {
      console.log("🎉 Script terminé avec succès!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur fatale:", error);
      process.exit(1);
    });
}

export { createUnlimitedPlan };
