import { prisma } from "./prisma";

/**
 * Met à jour les statistiques d'un mandat (totalRevenue et lastEntry)
 * À appeler après chaque ajout/modification/suppression de valeur
 */
export async function updateMandateStats(mandateId: string) {
  try {
    // Récupérer les stats agrégées
    const stats = await prisma.dayValue.aggregate({
      where: { mandateId },
      _sum: { value: true },
      _max: { date: true }, // 🔧 IMPORTANT: Prendre la date MAX, pas createdAt
    });

    // Mettre à jour le mandat
    await prisma.mandate.update({
      where: { id: mandateId },
      data: {
        totalRevenue: stats._sum.value || 0,
        lastEntry: stats._max.date, // Date de la dernière valeur (date CA, pas date de saisie)
      },
    });

    console.log(`✅ Stats mises à jour pour mandat ${mandateId}:`, {
      totalRevenue: stats._sum.value || 0,
      lastEntry: stats._max.date?.toISOString().split("T")[0] || "Aucune",
    });
  } catch (error) {
    console.error(`❌ Erreur mise à jour stats mandat ${mandateId}:`, error);
    throw error;
  }
}

/**
 * Met à jour les stats de tous les mandats
 * Utile après un import massif ou pour corriger les incohérences
 */
export async function updateAllMandateStats() {
  try {
    console.log("🔄 Mise à jour de tous les mandats...");

    const mandates = await prisma.mandate.findMany({
      select: { id: true, name: true },
    });

    let updated = 0;
    let errors = 0;

    for (const mandate of mandates) {
      try {
        await updateMandateStats(mandate.id);
        updated++;
      } catch (error) {
        console.error(`Erreur mandat ${mandate.name}:`, error);
        errors++;
      }
    }

    console.log(
      `✅ Mise à jour terminée: ${updated} succès, ${errors} erreurs`
    );
    return { updated, errors, total: mandates.length };
  } catch (error) {
    console.error("❌ Erreur mise à jour globale:", error);
    throw error;
  }
}

/**
 * Vérifie et corrige les incohérences dans les stats des mandats
 */
export async function verifyMandateStats() {
  try {
    console.log("🔍 Vérification des incohérences...");

    const mandatesWithIssues = (await prisma.$queryRaw`
      SELECT 
        m.id,
        m.name,
        m."totalRevenue" as stored_total,
        m."lastEntry" as stored_last_entry,
        COALESCE(SUM(dv.value), 0) as calculated_total,
        MAX(dv.date) as calculated_last_entry
      FROM mandates m
      LEFT JOIN day_values dv ON m.id = dv."mandateId"
      GROUP BY m.id, m.name, m."totalRevenue", m."lastEntry"
      HAVING 
        ABS(m."totalRevenue" - COALESCE(SUM(dv.value), 0)) > 0.01
        OR m."lastEntry" != MAX(dv.date)
        OR (m."lastEntry" IS NULL AND MAX(dv.date) IS NOT NULL)
        OR (m."lastEntry" IS NOT NULL AND MAX(dv.date) IS NULL)
    `) as Array<{
      id: string;
      name: string;
      stored_total: number;
      stored_last_entry: Date | null;
      calculated_total: number;
      calculated_last_entry: Date | null;
    }>;

    console.log(`🔍 ${mandatesWithIssues.length} incohérence(s) détectée(s)`);

    // Corriger les incohérences
    for (const mandate of mandatesWithIssues) {
      console.log(`🔧 Correction mandat ${mandate.name}:`, {
        totalRevenue: `${mandate.stored_total} → ${mandate.calculated_total}`,
        lastEntry: `${mandate.stored_last_entry?.toISOString().split("T")[0]} → ${mandate.calculated_last_entry?.toISOString().split("T")[0]}`,
      });

      await updateMandateStats(mandate.id);
    }

    return mandatesWithIssues.length;
  } catch (error) {
    console.error("❌ Erreur vérification:", error);
    throw error;
  }
}
