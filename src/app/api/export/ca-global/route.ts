import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers as getHeaders } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const userWithOrg = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { Organization: true },
    });

    if (!userWithOrg?.Organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const startMonth = parseInt(searchParams.get("startMonth") || "1");
    const endMonth = parseInt(searchParams.get("endMonth") || "12");

    // Récupérer tous les mandats actifs de l'organisation
    const mandates = await prisma.mandate.findMany({
      where: {
        organizationId: userWithOrg.Organization.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        group: true,
      },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    });

    if (mandates.length === 0) {
      return NextResponse.json(
        { error: "Aucun mandat actif trouvé" },
        { status: 404 }
      );
    }

    // Générer les mois de la période
    const months = [];
    for (let month = startMonth; month <= endMonth; month++) {
      months.push({
        year,
        month,
        label: `${getMonthName(month)} ${year}`,
      });
    }

    // Récupérer les données pour tous les mois
    const monthlyData = await Promise.all(
      months.map(async (monthInfo) => {
        const startDate = new Date(monthInfo.year, monthInfo.month - 1, 1);
        const endDate = new Date(monthInfo.year, monthInfo.month, 0);

        // Données CA pour le mois
        const dayValues = await prisma.dayValue.findMany({
          where: {
            mandateId: { in: mandates.map((m) => m.id) },
            date: { gte: startDate, lte: endDate },
          },
          include: {
            mandate: {
              select: { name: true, group: true },
            },
          },
          orderBy: { date: "asc" },
        });

        // Données payroll pour le mois
        const payrollEntries = await prisma.manualPayrollEntry.findMany({
          where: {
            mandateId: { in: mandates.map((m) => m.id) },
            year: monthInfo.year,
            month: monthInfo.month,
          },
          include: {
            mandate: {
              select: { name: true, group: true },
            },
          },
        });

        // Calculer les totaux par mandat
        const mandateData = mandates.map((mandate) => {
          const mandateCA = dayValues
            .filter((dv) => dv.mandateId === mandate.id)
            .reduce((sum, dv) => sum + dv.value, 0);

          const mandatePayroll = payrollEntries
            .filter((pe) => pe.mandateId === mandate.id)
            .reduce((sum, pe) => sum + pe.totalCost, 0);

          return {
            mandateId: mandate.id,
            mandateName: mandate.name,
            mandateGroup: mandate.group,
            ca: mandateCA,
            payroll: mandatePayroll,
          };
        });

        return {
          month: monthInfo.label,
          mandateData,
          totalCA: mandateData.reduce((sum, m) => sum + m.ca, 0),
          totalPayroll: mandateData.reduce((sum, m) => sum + m.payroll, 0),
        };
      })
    );

    // Générer le CSV
    const csvLines = [];

    // En-tête du fichier
    csvLines.push(`Export CA Global - ${userWithOrg.Organization.name}`);
    csvLines.push(
      `Période: ${getMonthName(startMonth)} - ${getMonthName(endMonth)} ${year}`
    );
    csvLines.push(`Généré le: ${new Date().toLocaleString("fr-CH")}`);
    csvLines.push("");

    // En-tête du tableau
    const headers = [
      "Mois",
      "Mandat",
      "Groupe",
      "CA (CHF)",
      "Payroll (CHF)",
      "Ratio Payroll/CA (%)",
    ];
    csvLines.push(headers.join(","));

    // Données mensuelles
    monthlyData.forEach((monthData) => {
      monthData.mandateData.forEach((mandate) => {
        const ratio =
          mandate.ca > 0
            ? ((mandate.payroll / mandate.ca) * 100).toFixed(1)
            : "0.0";
        csvLines.push(
          [
            `"${monthData.month}"`,
            `"${mandate.mandateName}"`,
            `"${mandate.mandateGroup}"`,
            formatCurrency(mandate.ca),
            formatCurrency(mandate.payroll),
            ratio,
          ].join(",")
        );
      });

      // Ligne de total mensuel
      const monthlyRatio =
        monthData.totalCA > 0
          ? ((monthData.totalPayroll / monthData.totalCA) * 100).toFixed(1)
          : "0.0";
      csvLines.push(
        [
          `"${monthData.month}"`,
          `"TOTAL MENSUEL"`,
          `""`,
          formatCurrency(monthData.totalCA),
          formatCurrency(monthData.totalPayroll),
          monthlyRatio,
        ].join(",")
      );
      csvLines.push("");
    });

    // Totaux globaux
    const grandTotalCA = monthlyData.reduce((sum, m) => sum + m.totalCA, 0);
    const grandTotalPayroll = monthlyData.reduce(
      (sum, m) => sum + m.totalPayroll,
      0
    );
    const globalRatio =
      grandTotalCA > 0
        ? ((grandTotalPayroll / grandTotalCA) * 100).toFixed(1)
        : "0.0";

    csvLines.push("RÉCAPITULATIF GLOBAL");
    csvLines.push(`Total CA,${formatCurrency(grandTotalCA)}`);
    csvLines.push(`Total Payroll,${formatCurrency(grandTotalPayroll)}`);
    csvLines.push(`Ratio global Payroll/CA,${globalRatio}%`);
    csvLines.push(`Nombre de mandats,${mandates.length}`);

    // Détail par mandat (totaux)
    csvLines.push("");
    csvLines.push("DÉTAIL PAR MANDAT (TOTAUX)");
    csvLines.push(
      "Mandat,Groupe,CA Total (CHF),Payroll Total (CHF),Contribution CA (%),Ratio Payroll/CA (%)"
    );

    const mandateTotals = mandates.map((mandate) => {
      const totalCA = monthlyData.reduce((sum, month) => {
        const mandateData = month.mandateData.find(
          (m) => m.mandateId === mandate.id
        );
        return sum + (mandateData?.ca || 0);
      }, 0);

      const totalPayroll = monthlyData.reduce((sum, month) => {
        const mandateData = month.mandateData.find(
          (m) => m.mandateId === mandate.id
        );
        return sum + (mandateData?.payroll || 0);
      }, 0);

      const contribution =
        grandTotalCA > 0 ? ((totalCA / grandTotalCA) * 100).toFixed(1) : "0.0";
      const ratio =
        totalCA > 0 ? ((totalPayroll / totalCA) * 100).toFixed(1) : "0.0";

      return {
        name: mandate.name,
        group: mandate.group,
        totalCA,
        totalPayroll,
        contribution,
        ratio,
      };
    });

    // Trier par contribution décroissante
    mandateTotals.sort((a, b) => b.totalCA - a.totalCA);

    mandateTotals.forEach((mandate) => {
      csvLines.push(
        [
          `"${mandate.name}"`,
          `"${mandate.group}"`,
          formatCurrency(mandate.totalCA),
          formatCurrency(mandate.totalPayroll),
          mandate.contribution,
          mandate.ratio,
        ].join(",")
      );
    });

    const csvContent = csvLines.join("\n");
    const bom = "\uFEFF"; // BOM pour Excel
    const finalContent = bom + csvContent;

    const semesterName = startMonth === 1 ? "S1" : "S2";
    const filename = `ca_global_${userWithOrg.Organization.name.replace(/[^a-z0-9]/gi, "_")}_${year}_${semesterName}.csv`;

    return new NextResponse(finalContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'export CA global:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires
function formatCurrency(amount: number): string {
  try {
    const formatted = new Intl.NumberFormat("de-CH", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(amount);

    // Forcer l'apostrophe suisse si nécessaire
    if (amount >= 1000 && !formatted.includes("'")) {
      const parts = amount.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
      return `${integerPart}.${parts[1]}`;
    }

    return formatted;
  } catch {
    // Fallback manuel
    const parts = amount.toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `${integerPart}.${parts[1]}`;
  }
}

function getMonthName(month: number): string {
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return monthNames[month - 1] || "Inconnu";
}
