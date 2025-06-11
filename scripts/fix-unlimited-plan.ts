// Script pour corriger le plan ILLIMITE avec des valeurs null au lieu de grandes valeurs numériques
// Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/fix-unlimited-plan.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUnlimitedPlan() {
  try {
    console.log("🔧 Correction du plan ILLIMITE...");

    // Trouver le plan ILLIMITE
    const illimitePlan = await prisma.plan.findFirst({
      where: { name: "ILLIMITE" },
    });

    if (!illimitePlan) {
      console.log("❌ Plan ILLIMITE non trouvé");
      return;
    }

    console.log("📋 Plan ILLIMITE actuel:");
    console.log(`   - ID: ${illimitePlan.id}`);
    console.log(`   - maxUsers: ${illimitePlan.maxUsers}`);
    console.log(`   - maxMandates: ${illimitePlan.maxMandates}`);
    console.log(`   - maxStorage: ${illimitePlan.maxStorage}`);

    // Mettre à jour le plan avec des valeurs null pour indiquer l'illimité
    const updatedPlan = await prisma.plan.update({
      where: { id: illimitePlan.id },
      data: {
        maxUsers: null,
        maxMandates: null,
        maxStorage: null,
        maxApiCalls: null,
      },
    });

    console.log("✅ Plan ILLIMITE mis à jour avec succès!");
    console.log("📋 Nouvelles valeurs:");
    console.log(`   - maxUsers: ${updatedPlan.maxUsers} (null = illimité)`);
    console.log(
      `   - maxMandates: ${updatedPlan.maxMandates} (null = illimité)`
    );
    console.log(`   - maxStorage: ${updatedPlan.maxStorage} (null = illimité)`);
    console.log(
      `   - maxApiCalls: ${updatedPlan.maxApiCalls} (null = illimité)`
    );

    return updatedPlan;
  } catch (error) {
    console.error("❌ Erreur lors de la correction du plan ILLIMITE:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  fixUnlimitedPlan()
    .then(() => {
      console.log("🎉 Correction terminée avec succès!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur fatale:", error);
      process.exit(1);
    });
}

export { fixUnlimitedPlan };
