import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const startMonth = parseInt(searchParams.get("startMonth") || "7");
    const period = searchParams.get("period") || "6months";

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        group: true,
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Calculer les périodes
    const periodsCount = period === "6months" ? 6 : 12;
    const periods = [];

    for (let i = 0; i < periodsCount; i++) {
      const monthOffset = startMonth - 1 + i;
      const periodYear = year + Math.floor(monthOffset / 12);
      const periodMonth = (monthOffset % 12) + 1;

      const startDate = new Date(periodYear, periodMonth - 1, 1);
      const endDate = new Date(periodYear, periodMonth, 0);

      const dayValues = await prisma.dayValue.findMany({
        where: {
          mandateId: id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      });

      periods.push({
        year: periodYear,
        month: periodMonth,
        monthName: getMonthName(periodMonth),
        dayValues,
      });
    }

    // Générer le CSV
    const csvLines = [];

    // En-tête
    csvLines.push("# Export CA - " + mandate.name);
    csvLines.push(
      "# Période: " + year + " - " + (startMonth === 1 ? "Janvier" : "Juillet")
    );
    csvLines.push("# Généré le: " + new Date().toLocaleString("fr-CH"));
    csvLines.push("");

    // Colonnes
    csvLines.push("Date,Mois,Année,Montant CHF,Cumul mensuel");

    let grandTotal = 0;

    // Données
    periods.forEach((period) => {
      let monthTotal = 0;

      if (period.dayValues.length > 0) {
        period.dayValues.forEach((dv) => {
          monthTotal += dv.value;
          csvLines.push(
            `${formatDate(dv.date)},${period.monthName},${period.year},${formatCurrency(dv.value)},${formatCurrency(monthTotal)}`
          );
        });
      }

      // Total du mois
      if (monthTotal > 0) {
        grandTotal += monthTotal;
        csvLines.push(
          `Total ${period.monthName},${period.monthName},${period.year},${formatCurrency(monthTotal)},${formatCurrency(grandTotal)}`
        );
        csvLines.push(""); // Ligne vide entre les mois
      }
    });

    // Total général
    csvLines.push("");
    csvLines.push(`TOTAL GÉNÉRAL,,,${formatCurrency(grandTotal)},`);

    // Statistiques
    csvLines.push("");
    csvLines.push("# Statistiques");
    csvLines.push(`Total périodes analysées,${periodsCount}`);
    csvLines.push(`Montant total,${formatCurrency(grandTotal)}`);
    csvLines.push(
      `Moyenne mensuelle,${formatCurrency(grandTotal / periodsCount)}`
    );

    const csvContent = csvLines.join("\n");
    const bom = "\uFEFF"; // BOM pour Excel
    const finalContent = bom + csvContent;

    const filename = `ca_${mandate.name.replace(/[^a-z0-9]/gi, "_")}_${year}.csv`;

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
    console.error("Erreur lors de l'export CA:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getMonthName(month: number): string {
  const months = [
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
  return months[month - 1];
}
