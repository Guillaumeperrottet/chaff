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

    // Support pour endMonth (pour les semestres)
    const currentMonth = new Date().getMonth() + 1;
    const startMonth = parseInt(
      searchParams.get("startMonth") || currentMonth.toString()
    );
    const endMonth = searchParams.get("endMonth")
      ? parseInt(searchParams.get("endMonth")!)
      : null;
    const period = searchParams.get("period") || "12months";

    // Calculer les périodes à récupérer
    let periods;
    if (endMonth) {
      // Mode semestre avec startMonth et endMonth
      periods = generatePeriodsRange(year, startMonth, endMonth);
    } else {
      // Mode classique avec period
      periods = generatePeriods(year, startMonth, period);
    }

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

    // Récupérer les données pour chaque période (année courante + année précédente)
    const caData = await Promise.all(
      periods.map(async (periodInfo) => {
        const startDate = new Date(periodInfo.year, periodInfo.month - 1, 1);
        const endDate = new Date(periodInfo.year, periodInfo.month, 0);

        // Données CA année courante
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

        // Données CA année précédente (même période)
        const previousYearStart = new Date(
          periodInfo.year - 1,
          periodInfo.month - 1,
          1
        );
        const previousYearEnd = new Date(
          periodInfo.year - 1,
          periodInfo.month,
          0
        );

        const previousYearValues = await prisma.dayValue.findMany({
          where: {
            mandateId: id,
            date: {
              gte: previousYearStart,
              lte: previousYearEnd,
            },
          },
        });

        // Données masse salariale année courante
        const payrollEntry = await prisma.manualPayrollEntry.findUnique({
          where: {
            mandateId_year_month: {
              mandateId: id,
              year: periodInfo.year,
              month: periodInfo.month,
            },
          },
        });

        // Données masse salariale année précédente
        const previousYearPayroll = await prisma.manualPayrollEntry.findUnique({
          where: {
            mandateId_year_month: {
              mandateId: id,
              year: periodInfo.year - 1,
              month: periodInfo.month,
            },
          },
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

        // Traiter les données par jour pour l'année précédente
        const previousYearDailyValues: DayCAData[] = [];
        const previousYearDaysInMonth = previousYearEnd.getDate();

        for (let day = 1; day <= previousYearDaysInMonth; day++) {
          const dayDate = new Date(
            periodInfo.year - 1,
            periodInfo.month - 1,
            day
          );
          const dayValue = previousYearValues.find(
            (v) => v.date.toDateString() === dayDate.toDateString()
          );

          previousYearDailyValues.push({
            date: dayDate.toISOString().split("T")[0],
            value: dayValue?.value || 0,
            formattedDate: formatDate(dayDate),
          });
        }

        const totalValue = dayValues.reduce((sum, v) => sum + v.value, 0);
        const daysWithData = dayValues.length;
        const previousYearRevenue = previousYearValues.reduce(
          (sum, v) => sum + v.value,
          0
        );

        // Calculs ratio et croissance
        const payrollToRevenueRatio =
          totalValue > 0 && payrollEntry
            ? (payrollEntry.totalCost / totalValue) * 100
            : undefined;

        const revenueGrowth =
          previousYearRevenue > 0
            ? ((totalValue - previousYearRevenue) / previousYearRevenue) * 100
            : null;

        const payrollGrowth =
          previousYearPayroll && payrollEntry
            ? ((payrollEntry.totalCost - previousYearPayroll.totalCost) /
                previousYearPayroll.totalCost) *
              100
            : null;

        return {
          year: periodInfo.year,
          month: periodInfo.month,
          label: periodInfo.label,
          totalValue,
          dailyValues,
          previousYearDailyValues, // Nouvelles données journalières année précédente
          averageDaily: daysWithData > 0 ? totalValue / daysWithData : 0,
          daysWithData,

          // Nouvelles données masse salariale
          payrollData: payrollEntry
            ? {
                year: payrollEntry.year,
                month: payrollEntry.month,
                grossAmount: payrollEntry.grossAmount,
                socialCharges: payrollEntry.socialCharges,
                totalCost: payrollEntry.totalCost,
                employeeCount: payrollEntry.employeeCount || undefined,
              }
            : undefined,
          payrollToRevenueRatio,

          // Données comparaison année précédente
          yearOverYear: {
            previousYearRevenue,
            previousYearPayroll: previousYearPayroll?.totalCost,
            revenueGrowth,
            payrollGrowth,
          },
        };
      })
    );

    // Calculer les comparaisons mois précédent
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
        yearOverYear: current.yearOverYear,
      };
    });

    // Calculer les totaux cumulés (année courante et année précédente)
    let cumulativeTotal = 0;
    let cumulativePayroll = 0;
    let cumulativePreviousYearRevenue = 0;
    let cumulativePreviousYearPayroll = 0;

    const cumulativeData = caData.map((period) => {
      cumulativeTotal += period.totalValue;
      cumulativePreviousYearRevenue += period.yearOverYear.previousYearRevenue;

      if (period.payrollData) {
        cumulativePayroll += period.payrollData.totalCost;
      }

      if (period.yearOverYear.previousYearPayroll) {
        cumulativePreviousYearPayroll +=
          period.yearOverYear.previousYearPayroll;
      }

      // Calculer l'évolution des cumuls
      const cumulativeRevenueGrowth =
        cumulativePreviousYearRevenue > 0
          ? ((cumulativeTotal - cumulativePreviousYearRevenue) /
              cumulativePreviousYearRevenue) *
            100
          : null;

      const cumulativePayrollGrowth =
        cumulativePreviousYearPayroll > 0 && cumulativePayroll > 0
          ? ((cumulativePayroll - cumulativePreviousYearPayroll) /
              cumulativePreviousYearPayroll) *
            100
          : null;

      return {
        ...period,
        cumulativeTotal,
        cumulativePayroll,
        cumulativePreviousYearRevenue,
        cumulativePreviousYearPayroll,
        cumulativeRevenueGrowth,
        cumulativePayrollGrowth,
      };
    });

    // Calculs pour le résumé
    const totalPayrollCost = caData.reduce(
      (sum, p) => sum + (p.payrollData?.totalCost || 0),
      0
    );
    const totalPreviousYearRevenue = caData.reduce(
      (sum, p) => sum + p.yearOverYear.previousYearRevenue,
      0
    );
    const totalPreviousYearPayroll = caData.reduce(
      (sum, p) => sum + (p.yearOverYear.previousYearPayroll || 0),
      0
    );

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

        // Nouveaux indicateurs
        totalPayrollCost,
        globalPayrollRatio:
          cumulativeTotal > 0 && totalPayrollCost > 0
            ? (totalPayrollCost / cumulativeTotal) * 100
            : null,

        // Comparaisons annuelles
        yearOverYearGrowth: {
          revenue:
            totalPreviousYearRevenue > 0
              ? ((cumulativeTotal - totalPreviousYearRevenue) /
                  totalPreviousYearRevenue) *
                100
              : null,
          payroll:
            totalPreviousYearPayroll > 0 && totalPayrollCost > 0
              ? ((totalPayrollCost - totalPreviousYearPayroll) /
                  totalPreviousYearPayroll) *
                100
              : null,
        },
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
    let periodYear = year;
    let periodMonth = startMonth + i;

    // Gestion du passage à l'année suivante
    if (periodMonth > 12) {
      periodYear += Math.floor((periodMonth - 1) / 12);
      periodMonth = ((periodMonth - 1) % 12) + 1;
    }

    periods.push({
      year: periodYear,
      month: periodMonth,
      label: `${getMonthName(periodMonth)} ${periodYear}`,
    });
  }

  return periods;
}

// Nouvelle fonction pour générer une plage de mois (semestres)
function generatePeriodsRange(
  year: number,
  startMonth: number,
  endMonth: number
) {
  const periods = [];

  for (let month = startMonth; month <= endMonth; month++) {
    periods.push({
      year: year,
      month: month,
      label: `${getMonthName(month)} ${year}`,
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
