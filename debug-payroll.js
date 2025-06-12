const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugPayrollData() {
  try {
    console.log("🔍 Analyse des données de masse salariale...\n");

    // 1. Récupérer tous les mandats
    const mandates = await prisma.mandate.findMany({
      select: {
        id: true,
        name: true,
        group: true,
        active: true,
        totalRevenue: true,
      },
    });

    console.log(`📋 Mandats trouvés: ${mandates.length}`);
    mandates.forEach((m) => {
      console.log(
        `  - ${m.name} (${m.group}) - Active: ${m.active} - CA: ${m.totalRevenue}`
      );
    });

    // 2. Chercher spécifiquement l'hôtel Alpha
    const alphaHotel = mandates.find((m) =>
      m.name.toLowerCase().includes("alpha")
    );
    if (alphaHotel) {
      console.log(
        `\n🏨 Hôtel Alpha trouvé: ${alphaHotel.name} (ID: ${alphaHotel.id})`
      );

      // 3. Vérifier les saisies manuelles de masse salariale
      const manualEntries = await prisma.manualPayrollEntry.findMany({
        where: { mandateId: alphaHotel.id },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });

      console.log(`📝 Saisies manuelles pour Alpha: ${manualEntries.length}`);
      manualEntries.forEach((entry) => {
        console.log(
          `  - ${entry.year}/${entry.month}: ${entry.totalCost} CHF (${entry.employeeCount || "N/A"} employés)`
        );
      });

      // 4. Vérifier les imports Gastrotime
      const imports = await prisma.payrollImportHistory.findMany({
        where: { mandateId: alphaHotel.id },
        orderBy: { importDate: "desc" },
        take: 5,
      });

      console.log(`📥 Imports Gastrotime pour Alpha: ${imports.length}`);
      imports.forEach((imp) => {
        console.log(
          `  - ${imp.period}: ${imp.totalEmployees} employés, ${imp.totalCost} CHF`
        );
      });

      // 5. Vérifier les employés
      const employees = await prisma.employee.findMany({
        where: { mandateId: alphaHotel.id },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          isActive: true,
          hourlyRate: true,
        },
      });

      console.log(`👥 Employés pour Alpha: ${employees.length}`);
      employees.forEach((emp) => {
        console.log(
          `  - ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - Active: ${emp.isActive} - Taux: ${emp.hourlyRate}`
        );
      });
    } else {
      console.log("\n❌ Hôtel Alpha non trouvé");
      console.log("Mandats disponibles:");
      mandates.forEach((m) => console.log(`  - ${m.name}`));
    }

    // 6. Test de l'API de la page payroll
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    console.log(
      `\n🔄 Test logique API pour le mois courant: ${currentYear}/${currentMonth}`
    );

    for (const mandate of mandates.slice(0, 3)) {
      // Limiter à 3 mandats pour le debug
      const payrollEntries = await prisma.manualPayrollEntry.findMany({
        where: { mandateId: mandate.id },
        select: {
          year: true,
          month: true,
          totalCost: true,
          employeeCount: true,
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 3,
      });

      const hasPayrollData = payrollEntries.length > 0;
      const lastPayrollEntry = payrollEntries[0] || null;

      let currentMonthRatio = null;
      if (
        lastPayrollEntry &&
        lastPayrollEntry.year === currentYear &&
        lastPayrollEntry.month === currentMonth
      ) {
        const monthStart = new Date(currentYear, currentMonth - 1, 1);
        const monthEnd = new Date(currentYear, currentMonth, 0);

        const monthlyRevenue = await prisma.dayValue.aggregate({
          where: {
            mandateId: mandate.id,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: { value: true },
        });

        const totalRevenue = monthlyRevenue._sum.value || 0;
        if (totalRevenue > 0) {
          currentMonthRatio = (lastPayrollEntry.totalCost / totalRevenue) * 100;
        }
      }

      console.log(`\n${mandate.name}:`);
      console.log(`  - hasPayrollData: ${hasPayrollData}`);
      console.log(
        `  - employeeCount: ${lastPayrollEntry?.employeeCount || "null"}`
      );
      console.log(`  - currentMonthRatio: ${currentMonthRatio || "null"}`);
      console.log(
        `  - lastPayrollEntry: ${lastPayrollEntry ? `${lastPayrollEntry.year}/${lastPayrollEntry.month}` : "null"}`
      );
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPayrollData();
