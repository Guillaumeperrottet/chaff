import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface DayCAData {
  date: string;
  value: number;
  formattedDate: string;
}

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
    const startMonth = parseInt(searchParams.get("startMonth") || "7"); // Juillet par défaut
    const period = searchParams.get("period") || "6months"; // 6 mois par défaut

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        group: true,
        active: true,
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Calculer les périodes à récupérer
    const periods = generatePeriods(year, startMonth, period);

    // Récupérer les données pour chaque période
    const caData = await Promise.all(
      periods.map(async (periodInfo) => {
        const startDate = new Date(periodInfo.year, periodInfo.month - 1, 1);
        const endDate = new Date(periodInfo.year, periodInfo.month, 0); // Dernier jour du mois

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

        // Traiter les données par jour
        const dailyValues: DayCAData[] = [];
        const daysInMonth = endDate.getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const dayDate = new Date(periodInfo.year, periodInfo.month - 1, day);
          const dayValue = dayValues.find(
            (v) => v.date.toDateString() === dayDate.toDateString()
          );

          dailyValues.push({
            date: dayDate.toISOString().split("T")[0],
            value: dayValue?.value || 0,
            formattedDate: formatDate(dayDate),
          });
        }

        const totalValue = dayValues.reduce((sum, v) => sum + v.value, 0);
        const daysWithData = dayValues.length;

        return {
          year: periodInfo.year,
          month: periodInfo.month,
          label: periodInfo.label,
          totalValue,
          dailyValues,
          averageDaily: daysWithData > 0 ? totalValue / daysWithData : 0,
          daysWithData,
        };
      })
    );

    // Calculer les comparaisons
    const comparisons = caData.map((current, index) => {
      const previous = index > 0 ? caData[index - 1] : null;
      let comparisonPercentage = null;

      if (previous && previous.totalValue > 0) {
        comparisonPercentage =
          ((current.totalValue - previous.totalValue) / previous.totalValue) *
          100;
      }

      return {
        period: current,
        comparison: {
          previous: previous?.totalValue || 0,
          percentage: comparisonPercentage,
        },
      };
    });

    // Calculer les totaux cumulés
    let cumulativeTotal = 0;
    const cumulativeData = caData.map((period) => {
      cumulativeTotal += period.totalValue;
      return {
        ...period,
        cumulativeTotal,
      };
    });

    return NextResponse.json({
      mandate: {
        id: mandate.id,
        name: mandate.name,
        group: mandate.group,
      },
      periods: cumulativeData,
      comparisons,
      summary: {
        totalPeriods: caData.length,
        grandTotal: cumulativeTotal,
        averagePerPeriod: cumulativeTotal / caData.length,
        bestPeriod: caData.reduce((best, current) =>
          current.totalValue > best.totalValue ? current : best
        ),
        worstPeriod: caData.reduce((worst, current) =>
          current.totalValue < worst.totalValue ? current : worst
        ),
      },
      meta: {
        year,
        startMonth,
        period,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données CA:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonction pour générer les périodes à analyser
function generatePeriods(year: number, startMonth: number, period: string) {
  const periods = [];
  const periodsCount = period === "6months" ? 6 : 12;

  for (let i = 0; i < periodsCount; i++) {
    const monthOffset = startMonth - 1 + i;
    const periodYear = year + Math.floor(monthOffset / 12);
    const periodMonth = (monthOffset % 12) + 1;

    periods.push({
      year: periodYear,
      month: periodMonth,
      label: `${getMonthName(periodMonth)} ${periodYear}`,
    });
  }

  return periods;
}

// Fonction pour formater les dates
function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
  });
}

// Fonction pour obtenir le nom du mois
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
