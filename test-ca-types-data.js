// Test script pour créer des données de test pour CA Types
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function createTestData() {
  try {
    console.log("🚀 Création de données de test pour CA Types...");

    // Vérifier s'il y a déjà une organisation
    const existingOrg = await prisma.organization.findFirst();
    if (!existingOrg) {
      console.log(
        "❌ Aucune organisation trouvée. Veuillez d'abord créer une organisation."
      );
      return;
    }

    console.log(`✅ Organisation trouvée: ${existingOrg.name}`);

    // Créer quelques mandats de test pour différents types
    const mandatesData = [
      {
        name: "Hôtel Bellevue",
        group: "HEBERGEMENT",
        organizationId: existingOrg.id,
      },
      {
        name: "Camping les Pins",
        group: "HEBERGEMENT",
        organizationId: existingOrg.id,
      },
      {
        name: "Restaurant La Fontaine",
        group: "RESTAURATION",
        organizationId: existingOrg.id,
      },
      {
        name: "Brasserie du Centre",
        group: "RESTAURATION",
        organizationId: existingOrg.id,
      },
    ];

    for (const mandateData of mandatesData) {
      // Vérifier si le mandat existe déjà
      const existingMandate = await prisma.mandate.findFirst({
        where: { name: mandateData.name, organizationId: existingOrg.id },
      });

      if (!existingMandate) {
        const mandate = await prisma.mandate.create({
          data: mandateData,
        });
        console.log(`✅ Mandat créé: ${mandate.name} (${mandate.group})`);

        // Créer des valeurs de CA pour les 6 derniers mois
        const currentDate = new Date();
        const months = [];

        for (let i = 5; i >= 0; i--) {
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
          );
          months.push(date);
        }

        for (const monthDate of months) {
          const daysInMonth = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth() + 1,
            0
          ).getDate();

          for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(
              monthDate.getFullYear(),
              monthDate.getMonth(),
              day
            );

            // Générer une valeur réaliste selon le type
            let baseValue;
            if (mandateData.group === "HEBERGEMENT") {
              baseValue = Math.random() * 3000 + 1000; // 1000-4000 CHF
            } else {
              baseValue = Math.random() * 2000 + 500; // 500-2500 CHF
            }

            const value = Math.round(baseValue);

            await prisma.dayValue.create({
              data: {
                mandateId: mandate.id,
                date: dayDate,
                value: value,
              },
            });
          }
        }

        console.log(`📊 Valeurs CA créées pour ${mandate.name}`);

        // Créer quelques données de masse salariale
        for (let i = 2; i >= 0; i--) {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth() + 1 - i;

          if (month > 0) {
            const grossAmount = Math.round(Math.random() * 15000 + 10000); // 10-25k CHF
            const socialCharges = Math.round(grossAmount * 0.25); // 25% charges sociales

            await prisma.manualPayrollEntry.create({
              data: {
                mandateId: mandate.id,
                year: year,
                month: month,
                grossAmount: grossAmount,
                socialCharges: socialCharges,
                totalCost: grossAmount + socialCharges,
                employeeCount: Math.round(Math.random() * 8 + 3), // 3-11 employés
                notes: `Saisie test - charges sociales: 25%`,
                createdBy: "test-script",
              },
            });
          }
        }

        console.log(`💰 Données masse salariale créées pour ${mandate.name}`);
      } else {
        console.log(`⚠️  Mandat existe déjà: ${mandateData.name}`);
      }
    }

    console.log("🎉 Données de test créées avec succès!");
    console.log("💡 Vous pouvez maintenant tester votre page CA Types sur:");
    console.log("   - http://localhost:3000/dashboard/ca-types");
  } catch (error) {
    console.error("❌ Erreur lors de la création des données de test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
