// scripts/fix-mandate-stats.ts
// Script pour corriger les stats des mandats existants

import { prisma } from "../src/lib/prisma";

async function fixMandateStats() {
  console.log("🔧 Correction des statistiques des mandats...");

  try {
    // Récupérer tous les mandats
    const mandates = await prisma.mandate.findMany({
      select: { id: true, name: true, lastEntry: true, totalRevenue: true },
    });

    console.log(`📋 ${mandates.length} mandats à traiter`);

    let corrected = 0;
    let unchanged = 0;

    for (const mandate of mandates) {
      // Calculer les vraies statistiques
      const stats = await prisma.dayValue.aggregate({
        where: { mandateId: mandate.id },
        _sum: { value: true },
        _max: { date: true }, // ✅ DATE de la valeur (pas createdAt)
      });

      const correctTotalRevenue = stats._sum.value || 0;
      const correctLastEntry = stats._max.date;

      // Vérifier s'il y a des différences
      const needsUpdate =
        Math.abs(mandate.totalRevenue - correctTotalRevenue) > 0.01 ||
        mandate.lastEntry?.getTime() !== correctLastEntry?.getTime();

      if (needsUpdate) {
        console.log(`🔧 Correction ${mandate.name}:`, {
          totalRevenue: `${mandate.totalRevenue} → ${correctTotalRevenue}`,
          lastEntry: `${mandate.lastEntry?.toISOString().split("T")[0]} → ${correctLastEntry?.toISOString().split("T")[0]}`,
        });

        // Mettre à jour
        await prisma.mandate.update({
          where: { id: mandate.id },
          data: {
            totalRevenue: correctTotalRevenue,
            lastEntry: correctLastEntry,
          },
        });

        corrected++;
      } else {
        unchanged++;
      }
    }

    console.log(
      `✅ Terminé: ${corrected} corrigés, ${unchanged} déjà corrects`
    );
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  fixMandateStats();
}

export { fixMandateStats };
