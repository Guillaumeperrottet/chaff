const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugAlphaHotel() {
  try {
    console.log("🔍 Debug spécifique Hôtel Alpha...\n");

    // 1. Trouver l'hôtel Alpha
    const alphaHotel = await prisma.mandate.findFirst({
      where: {
        name: {
          contains: "Alpha",
          mode: "insensitive",
        },
      },
    });

    if (!alphaHotel) {
      console.log("❌ Hôtel Alpha non trouvé");

      // Lister tous les mandats pour debug
      const allMandates = await prisma.mandate.findMany({
        select: { id: true, name: true, group: true, active: true },
      });
      console.log("\n📋 Tous les mandats:");
      allMandates.forEach((m) => console.log(`  - ${m.name} (${m.group})`));
      return;
    }

    console.log(
      `🏨 Hôtel Alpha trouvé: ${alphaHotel.name} (ID: ${alphaHotel.id})`
    );

    // 2. Employés actifs
    const employees = await prisma.employee.findMany({
      where: {
        mandateId: alphaHotel.id,
        isActive: true,
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        hourlyRate: true,
        position: true,
      },
    });

    console.log(`\n👥 Employés actifs pour Alpha: ${employees.length}`);
    employees.forEach((emp) => {
      console.log(
        `  - ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - ${emp.hourlyRate}CHF/h - ${emp.position || "N/A"}`
      );
    });

    // 3. Saisies manuelles de masse salariale
    const manualEntries = await prisma.manualPayrollEntry.findMany({
      where: { mandateId: alphaHotel.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 5,
    });

    console.log(`\n📝 Saisies manuelles (${manualEntries.length}):`);
    manualEntries.forEach((entry) => {
      console.log(
        `  - ${entry.year}/${String(entry.month).padStart(2, "0")}: ${entry.totalCost} CHF, ${entry.employeeCount || "N/A"} employés`
      );
    });

    // 4. Imports Gastrotime
    const gastrotimeImports = await prisma.payrollImportHistory.findMany({
      where: { mandateId: alphaHotel.id },
      orderBy: { importDate: "desc" },
      take: 5,
    });

    console.log(`\n📥 Imports Gastrotime (${gastrotimeImports.length}):`);
    gastrotimeImports.forEach((imp) => {
      console.log(
        `  - ${imp.period}: ${imp.totalEmployees} employés, ${imp.totalCost} CHF (${imp.filename})`
      );
    });

    // 5. Test API actuelle
    console.log("\n🔄 Test de la logique API...");

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    console.log(
      `Mois courant: ${currentYear}-${String(currentMonth).padStart(2, "0")}`
    );

    // Simulation de la logique API
    const hasManualData = manualEntries.length > 0;
    const hasGastrotimeData = gastrotimeImports.length > 0;
    const hasPayrollData = hasManualData || hasGastrotimeData;

    console.log(`hasManualData: ${hasManualData}`);
    console.log(`hasGastrotimeData: ${hasGastrotimeData}`);
    console.log(`hasPayrollData: ${hasPayrollData}`);

    // Déterminer employeeCount selon la logique
    let employeeCount = null;
    const lastPayrollEntry = manualEntries[0] || null;
    const lastGastrotimeImport = gastrotimeImports[0] || null;

    if (lastPayrollEntry && lastGastrotimeImport) {
      const manualDate = new Date(
        lastPayrollEntry.year,
        lastPayrollEntry.month - 1,
        1
      );
      const gastrotimeDate = new Date(lastGastrotimeImport.importDate);

      if (gastrotimeDate > manualDate) {
        employeeCount = lastGastrotimeImport.totalEmployees;
        console.log(`Prend les employés du Gastrotime: ${employeeCount}`);
      } else {
        employeeCount = lastPayrollEntry.employeeCount;
        console.log(
          `Prend les employés de la saisie manuelle: ${employeeCount}`
        );
      }
    } else if (lastPayrollEntry) {
      employeeCount = lastPayrollEntry.employeeCount;
      console.log(`Seulement saisie manuelle: ${employeeCount}`);
    } else if (lastGastrotimeImport) {
      employeeCount = lastGastrotimeImport.totalEmployees;
      console.log(`Seulement Gastrotime: ${employeeCount}`);
    }

    console.log(`\n✅ Résultat final employeeCount: ${employeeCount}`);
    console.log(`✅ Nombre d'employés réels dans la base: ${employees.length}`);

    // 6. Vérifier si problème avec la date/période
    if (employeeCount !== employees.length) {
      console.log(
        `\n⚠️  PROBLÈME: employeeCount (${employeeCount}) ≠ employés réels (${employees.length})`
      );

      // Chercher le problème
      if (lastGastrotimeImport && !lastPayrollEntry) {
        console.log(
          `Dernière période Gastrotime: ${lastGastrotimeImport.period}`
        );
        console.log(
          `Employés dans cet import: ${lastGastrotimeImport.totalEmployees}`
        );
      }

      if (lastPayrollEntry && !lastGastrotimeImport) {
        console.log(
          `Dernière saisie manuelle: ${lastPayrollEntry.year}/${lastPayrollEntry.month}`
        );
        console.log(
          `Employés dans cette saisie: ${lastPayrollEntry.employeeCount}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAlphaHotel();
