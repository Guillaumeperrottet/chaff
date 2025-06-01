// scripts/add-daily-summary-field.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addDailySummaryField() {
  console.log("🚀 Début de la migration du champ dailySummaryEnabled...");

  try {
    // D'abord, vérifier si le champ existe déjà
    console.log("🔍 Vérification de l'existence du champ...");

    // Compter le nombre total d'utilisateurs
    const totalUsers = await prisma.user.count();
    console.log(`📊 Nombre total d'utilisateurs : ${totalUsers}`);

    if (totalUsers === 0) {
      console.log("✅ Aucun utilisateur trouvé, migration non nécessaire.");
      return;
    }

    // Mettre à jour tous les utilisateurs existants
    // Par défaut, on met à false pour respecter le principe opt-in
    console.log("🔄 Mise à jour de tous les utilisateurs...");

    const updateResult = await prisma.user.updateMany({
      data: {
        dailySummaryEnabled: false, // Par défaut désactivé
      },
    });

    console.log(
      `✅ ${updateResult.count} utilisateurs mis à jour avec dailySummaryEnabled = false`
    );

    // Optionnel : Activer pour les administrateurs ou utilisateurs spécifiques
    // Décommentez si vous voulez que les admins aient la fonctionnalité activée par défaut
    /*
    const adminUpdate = await prisma.user.updateMany({
      where: {
        OrganizationUser: {
          role: 'admin'
        }
      },
      data: {
        dailySummaryEnabled: true,
      },
    });
    
    console.log(`🔧 ${adminUpdate.count} administrateurs ont la fonctionnalité activée par défaut`);
    */

    // Statistiques finales
    const usersWithDailyEnabled = await prisma.user.count({
      where: { dailySummaryEnabled: true },
    });

    const usersWithDailyDisabled = await prisma.user.count({
      where: { dailySummaryEnabled: false },
    });

    console.log("\n📈 Statistiques finales :");
    console.log(
      `   - Utilisateurs avec récapitulatif activé : ${usersWithDailyEnabled}`
    );
    console.log(
      `   - Utilisateurs avec récapitulatif désactivé : ${usersWithDailyDisabled}`
    );
    console.log(
      `   - Total : ${usersWithDailyEnabled + usersWithDailyDisabled}`
    );

    console.log("\n✅ Migration terminée avec succès !");
    console.log(
      "💡 Les utilisateurs peuvent maintenant activer la fonctionnalité dans Profil > Notifications"
    );
  } catch (error) {
    console.error("❌ Erreur lors de la migration :", error);

    // Vérifier si l'erreur est due au fait que le champ n'existe pas encore
    if (error instanceof Error && error.message.includes("Unknown field")) {
      console.log(
        "\n⚠️  Le champ dailySummaryEnabled n'existe pas encore dans la base de données."
      );
      console.log("📝 Veuillez d'abord :\n");
      console.log("   1. Ajouter le champ dans schema.prisma :");
      console.log("      dailySummaryEnabled Boolean @default(false)");
      console.log("   2. Exécuter : npx prisma db push");
      console.log("   3. Puis relancer ce script\n");
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
addDailySummaryField().catch((error) => {
  console.error("💥 Échec de la migration :", error);
  process.exit(1);
});
