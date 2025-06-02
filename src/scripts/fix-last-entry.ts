// src/scripts/fix-last-entry.ts - Version corrigée avec les bons noms de colonnes

import { prisma } from "@/lib/prisma";

async function fixLastEntryDates() {
  console.log("🔧 Correction des dates lastEntry pour tous les mandats...");

  try {
    const mandates = await prisma.mandate.findMany({
      select: { id: true, name: true, lastEntry: true },
    });

    console.log(`📊 ${mandates.length} mandats à traiter`);

    let corrected = 0;
    let alreadyCorrect = 0;
    let errors = 0;

    for (const mandate of mandates) {
      try {
        // Trouver la dernière saisie (createdAt le plus récent)
        const lastDayValue = await prisma.dayValue.findFirst({
          where: { mandateId: mandate.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, date: true },
        });

        const newLastEntry = lastDayValue?.createdAt || null;

        // Vérifier si une correction est nécessaire
        const currentLastEntry = mandate.lastEntry;
        const needsUpdate =
          (newLastEntry === null && currentLastEntry !== null) ||
          (newLastEntry !== null && currentLastEntry === null) ||
          (newLastEntry !== null &&
            currentLastEntry !== null &&
            Math.abs(newLastEntry.getTime() - currentLastEntry.getTime()) >
              1000); // Différence > 1 seconde

        if (needsUpdate) {
          // Mettre à jour lastEntry
          await prisma.mandate.update({
            where: { id: mandate.id },
            data: { lastEntry: newLastEntry },
          });

          console.log(`✅ ${mandate.name}:`);
          console.log(`   Avant: ${currentLastEntry?.toISOString() || "null"}`);
          console.log(`   Après: ${newLastEntry?.toISOString() || "null"}`);
          if (lastDayValue) {
            console.log(
              `   Dernière date CA: ${lastDayValue.date.toISOString().split("T")[0]}`
            );
          }

          corrected++;
        } else {
          alreadyCorrect++;
          console.log(`⚪ ${mandate.name}: déjà correct`);
        }
      } catch (error) {
        console.error(`❌ Erreur ${mandate.name}:`, error);
        errors++;
      }
    }

    console.log("\n🎉 Correction terminée!");
    console.log(`✅ Corrigés: ${corrected}`);
    console.log(`⚪ Déjà corrects: ${alreadyCorrect}`);
    console.log(`❌ Erreurs: ${errors}`);
    console.log(`📊 Total traité: ${mandates.length}`);
  } catch (error) {
    console.error("❌ Erreur générale:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Version simplifiée sans requête SQL brute (plus sûre)
async function checkCurrentStateSimple() {
  console.log("🔍 Vérification de l'état actuel (version simple)...");

  const mandates = await prisma.mandate.findMany({
    select: {
      id: true,
      name: true,
      lastEntry: true,
    },
  });

  let issuesCount = 0;

  for (const mandate of mandates.slice(0, 10)) {
    // Vérifier les 10 premiers seulement
    const lastDayValue = await prisma.dayValue.findFirst({
      where: { mandateId: mandate.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, date: true },
    });

    const actualLastEntry = lastDayValue?.createdAt || null;
    const storedLastEntry = mandate.lastEntry;

    const hasIssue =
      (actualLastEntry === null && storedLastEntry !== null) ||
      (actualLastEntry !== null && storedLastEntry === null) ||
      (actualLastEntry !== null &&
        storedLastEntry !== null &&
        Math.abs(actualLastEntry.getTime() - storedLastEntry.getTime()) > 1000);

    if (hasIssue) {
      issuesCount++;
      console.log(`❌ ${mandate.name}:`);
      console.log(
        `   DB lastEntry: ${storedLastEntry?.toISOString() || "null"}`
      );
      console.log(
        `   Vraie dernière saisie: ${actualLastEntry?.toISOString() || "null"}`
      );
      if (lastDayValue) {
        console.log(
          `   Dernière date CA: ${lastDayValue.date.toISOString().split("T")[0]}`
        );
      }
    }
  }

  if (issuesCount === 0) {
    console.log("✅ Les 10 premiers mandats semblent corrects");
  }

  return issuesCount;
}

// Exécution
async function main() {
  console.log("🚀 Démarrage du script de correction lastEntry");

  try {
    // Étape 1: Vérifier l'état actuel (version simple pour éviter les erreurs SQL)
    const issuesCount = await checkCurrentStateSimple();

    // Étape 2: Demander confirmation
    console.log(
      `\n📊 Analyse rapide terminée. ${issuesCount} problèmes détectés.`
    );
    console.log("Lancement de la correction complète...\n");

    // Étape 3: Corriger
    await fixLastEntryDates();
  } catch (error) {
    console.error("❌ Erreur dans main():", error);

    // Fallback : exécuter seulement la correction
    console.log("🔄 Tentative de correction directe...");
    await fixLastEntryDates();
  }
}

// Exécuter le script
main().catch(console.error);
