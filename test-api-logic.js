const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testAPILogic() {
  try {
    console.log("🔍 Test de la nouvelle logique API...\n");

    // Trouver l'hôtel Alpha
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
      return;
    }

    console.log(`🏨 Hôtel Alpha: ${alphaHotel.name} (ID: ${alphaHotel.id})`);

    // Simulation exacte de la logique API corrigée
    const payrollEntries = await prisma.manualPayrollEntry.findMany({
      where: { mandateId: alphaHotel.id },
      select: {
        year: true,
        month: true,
        totalCost: true,
        employeeCount: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 3,
    });

    const gastrotimeImports = await prisma.payrollImportHistory.findMany({
      where: { mandateId: alphaHotel.id },
      select: {
        period: true,
        totalCost: true,
        totalEmployees: true,
        importDate: true,
      },
      orderBy: { importDate: "desc" },
      take: 3,
    });

    const hasManualData = payrollEntries.length > 0;
    const hasGastrotimeData = gastrotimeImports.length > 0;
    const hasPayrollData = hasManualData || hasGastrotimeData;

    const lastPayrollEntry = payrollEntries[0] || null;
    const lastGastrotimeImport = gastrotimeImports[0] || null;

    let lastPayrollEntryDate = null;
    let currentMonthRatio = null;
    let employeeCount = null;

    // Logique exacte de l'API
    if (lastPayrollEntry && lastGastrotimeImport) {
      const manualDate = new Date(
        lastPayrollEntry.year,
        lastPayrollEntry.month - 1,
        1
      );
      const gastrotimeDate = new Date(lastGastrotimeImport.importDate);

      if (gastrotimeDate > manualDate) {
        lastPayrollEntryDate = gastrotimeDate;
        employeeCount = lastGastrotimeImport.totalEmployees;
      } else {
        lastPayrollEntryDate = manualDate;
        employeeCount = lastPayrollEntry.employeeCount;
      }
    } else if (lastPayrollEntry) {
      lastPayrollEntryDate = new Date(
        lastPayrollEntry.year,
        lastPayrollEntry.month - 1,
        1
      );
      employeeCount = lastPayrollEntry.employeeCount;
    } else if (lastGastrotimeImport) {
      lastPayrollEntryDate = new Date(lastGastrotimeImport.importDate);
      employeeCount = lastGastrotimeImport.totalEmployees;
    }

    // 🆕 NOUVELLE LOGIQUE AJOUTÉE
    if (employeeCount === null) {
      const activeEmployeesCount = await prisma.employee.count({
        where: {
          mandateId: alphaHotel.id,
          isActive: true,
        },
      });
      if (activeEmployeesCount > 0) {
        employeeCount = activeEmployeesCount;
      }
    }

    console.log("📊 Résultats de la logique API:");
    console.log(`  - hasPayrollData: ${hasPayrollData}`);
    console.log(`  - lastPayrollEntry: ${lastPayrollEntry ? "Oui" : "Non"}`);
    console.log(
      `  - lastGastrotimeImport: ${lastGastrotimeImport ? "Oui" : "Non"}`
    );
    console.log(`  - employeeCount (final): ${employeeCount}`);

    console.log(
      `\n✅ Alpha devrait maintenant afficher: ${employeeCount} employés`
    );
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPILogic();
