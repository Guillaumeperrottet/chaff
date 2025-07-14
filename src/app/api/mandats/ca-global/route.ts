import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface DayCAData {
  date: string;
  value: number;
  formattedDate: string;
}

interface PayrollData {
  year: number;
  month: number;
  grossAmount: number;
  socialCharges: number;
  totalCost: number;
  employeeCount?: number;
}

interface PeriodData {
  year: number;
  month: number;
  label: string;
  totalValue: number;
  dailyValues: DayCAData[];
  previousYearDailyValues: DayCAData[];
  averageDaily: number;
  daysWithData: number;
  cumulativeTotal?: number;
  cumulativePayroll?: number;
  cumulativePreviousYearRevenue?: number;
  cumulativePreviousYearPayroll?: number;
  cumulativeRevenueGrowth?: number | null;
  cumulativePayrollGrowth?: number | null;
  payrollData?: PayrollData;
  payrollToRevenueRatio?: number;
  yearOverYear: {
    previousYearRevenue: number;
    previousYearPayroll?: number;
    revenueGrowth: number | null;
    payrollGrowth: number | null;
  };
  mandateDetails: Array<{
    id: string;
    name: string;
    group: string;
    totalValue: number;
    payrollCost?: number;
  }>;
}

interface GlobalCAResponse {
  organization: {
    name: string;
    totalMandates: number;
  };
  periods: PeriodData[];
  summary: {
    totalPeriods: number;
    grandTotal: number;
    grandTotalExcludingCurrentMonth: number; // Nouveau champ
    averagePerPeriod: number;
    bestPeriod: PeriodData;
    worstPeriod: PeriodData;
    totalPayrollCost: number;
    globalPayrollRatio: number | null;
    yearOverYearGrowth: {
      revenue: number | null;
      revenueExcludingCurrentMonth: number | null;
      payroll: number | null;
    };
    mandatesBreakdown: Array<{
      id: string;
      name: string;
      group: string;
      totalRevenue: number;
      totalPayroll: number;
      contribution: number; // Pourcentage du total
    }>;
  };
  meta: {
    year: number;
    startMonth: number;
    period: string;
    generatedAt: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
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

    // Support pour endMonth (pour les semestres)
    const currentMonth = new Date().getMonth() + 1;
    const startMonth = parseInt(
      searchParams.get("startMonth") || currentMonth.toString()
    );
    const endMonth = searchParams.get("endMonth")
      ? parseInt(searchParams.get("endMonth")!)
      : null;
    const period = searchParams.get("period") || "12months";

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
      return NextResponse.json({
        organization: {
          name: userWithOrg.Organization.name,
          totalMandates: 0,
        },
        periods: [],
        summary: {
          totalPeriods: 0,
          grandTotal: 0,
          averagePerPeriod: 0,
          bestPeriod: null,
          worstPeriod: null,
          totalPayrollCost: 0,
          globalPayrollRatio: null,
          yearOverYearGrowth: { revenue: null, payroll: null },
          mandatesBreakdown: [],
        },
        meta: {
          year,
          startMonth,
          period,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Calculer les périodes à récupérer
    let periods;
    if (endMonth) {
      // Mode semestre avec startMonth et endMonth
      periods = generatePeriodsRange(year, startMonth, endMonth);
    } else {
      // Mode classique avec period
      periods = generatePeriods(year, startMonth, period);
    }

    // Récupérer et consolider les données pour chaque période
    const consolidatedData = await Promise.all(
      periods.map(async (periodInfo) => {
        const startDate = new Date(periodInfo.year, periodInfo.month - 1, 1);
        const endDate = new Date(periodInfo.year, periodInfo.month, 0);

        // Données année précédente
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

        // Récupérer toutes les données CA pour tous les mandats
        const [currentYearValues, previousYearValues] = await Promise.all([
          prisma.dayValue.findMany({
            where: {
              mandateId: { in: mandates.map((m) => m.id) },
              date: { gte: startDate, lte: endDate },
            },
            include: {
              mandate: {
                select: { id: true, name: true, group: true },
              },
            },
            orderBy: { date: "asc" },
          }),
          prisma.dayValue.findMany({
            where: {
              mandateId: { in: mandates.map((m) => m.id) },
              date: { gte: previousYearStart, lte: previousYearEnd },
            },
            include: {
              mandate: {
                select: { id: true, name: true, group: true },
              },
            },
            orderBy: { date: "asc" },
          }),
        ]);

        // Récupérer les données de masse salariale pour tous les mandats
        const [payrollEntries, previousYearPayrollEntries] = await Promise.all([
          prisma.manualPayrollEntry.findMany({
            where: {
              mandateId: { in: mandates.map((m) => m.id) },
              year: periodInfo.year,
              month: periodInfo.month,
            },
            include: {
              mandate: {
                select: { id: true, name: true, group: true },
              },
            },
          }),
          prisma.manualPayrollEntry.findMany({
            where: {
              mandateId: { in: mandates.map((m) => m.id) },
              year: periodInfo.year - 1,
              month: periodInfo.month,
            },
            include: {
              mandate: {
                select: { id: true, name: true, group: true },
              },
            },
          }),
        ]);

        // Consolider les données par jour
        const daysInMonth = endDate.getDate();
        const dailyValues: DayCAData[] = [];
        const previousYearDailyValues: DayCAData[] = [];

        // Calculer le nombre de jours dans le mois de l'année précédente
        const previousYearEndDate = new Date(
          periodInfo.year - 1,
          periodInfo.month,
          0
        );
        const daysInPreviousYearMonth = previousYearEndDate.getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const dayDate = new Date(periodInfo.year, periodInfo.month - 1, day);

          // Somme de tous les mandats pour ce jour (année courante)
          const dayTotal = currentYearValues
            .filter((v) => v.date.toDateString() === dayDate.toDateString())
            .reduce((sum, v) => sum + v.value, 0);

          dailyValues.push({
            date: dayDate.toISOString().split("T")[0],
            value: dayTotal,
            formattedDate: formatDate(dayDate),
          });

          // Année précédente - Vérifier que le jour existe dans l'année précédente
          if (day <= daysInPreviousYearMonth) {
            const previousYearDayDate = new Date(
              periodInfo.year - 1,
              periodInfo.month - 1,
              day
            );

            const previousDayTotal = previousYearValues
              .filter(
                (v) =>
                  v.date.toDateString() === previousYearDayDate.toDateString()
              )
              .reduce((sum, v) => sum + v.value, 0);

            previousYearDailyValues.push({
              date: previousYearDayDate.toISOString().split("T")[0],
              value: previousDayTotal,
              formattedDate: formatDate(previousYearDayDate),
            });
          }
        }

        // Pour l'année précédente, ajouter tous les jours qui existent dans cette année
        // mais pas dans l'année courante (cas du 29 février en année bissextile)
        for (let day = daysInMonth + 1; day <= daysInPreviousYearMonth; day++) {
          const previousYearDayDate = new Date(
            periodInfo.year - 1,
            periodInfo.month - 1,
            day
          );

          const previousDayTotal = previousYearValues
            .filter(
              (v) =>
                v.date.toDateString() === previousYearDayDate.toDateString()
            )
            .reduce((sum, v) => sum + v.value, 0);

          previousYearDailyValues.push({
            date: previousYearDayDate.toISOString().split("T")[0],
            value: previousDayTotal,
            formattedDate: formatDate(previousYearDayDate),
          });
        }

        // Calculer les totaux
        const totalValue = dailyValues.reduce((sum, dv) => sum + dv.value, 0);
        const previousYearRevenue = previousYearDailyValues.reduce(
          (sum, dv) => sum + dv.value,
          0
        );

        // Calculer les totaux de masse salariale
        const totalPayrollCost = payrollEntries.reduce(
          (sum, entry) => sum + entry.totalCost,
          0
        );
        const previousYearPayrollCost = previousYearPayrollEntries.reduce(
          (sum, entry) => sum + entry.totalCost,
          0
        );

        // Calculer les croissances
        const revenueGrowth =
          previousYearRevenue > 0
            ? ((totalValue - previousYearRevenue) / previousYearRevenue) * 100
            : null;

        const payrollGrowth =
          previousYearPayrollCost > 0
            ? ((totalPayrollCost - previousYearPayrollCost) /
                previousYearPayrollCost) *
              100
            : null;

        // Détails par mandat pour cette période
        const mandateDetails = mandates.map((mandate) => {
          const mandateRevenue = currentYearValues
            .filter((v) => v.mandate.id === mandate.id)
            .reduce((sum, v) => sum + v.value, 0);

          const mandatePayroll = payrollEntries
            .filter((entry) => entry.mandate.id === mandate.id)
            .reduce((sum, entry) => sum + entry.totalCost, 0);

          return {
            id: mandate.id,
            name: mandate.name,
            group: mandate.group,
            totalValue: mandateRevenue,
            payrollCost: mandatePayroll || undefined,
          };
        });

        // Calculer la moyenne journalière
        const daysWithData = dailyValues.filter((dv) => dv.value > 0).length;
        const averageDaily = daysWithData > 0 ? totalValue / daysWithData : 0;

        return {
          year: periodInfo.year,
          month: periodInfo.month,
          label: periodInfo.label,
          totalValue,
          dailyValues,
          previousYearDailyValues,
          averageDaily,
          daysWithData,
          payrollData:
            totalPayrollCost > 0
              ? {
                  year: periodInfo.year,
                  month: periodInfo.month,
                  grossAmount: payrollEntries.reduce(
                    (sum, entry) => sum + entry.grossAmount,
                    0
                  ),
                  socialCharges: payrollEntries.reduce(
                    (sum, entry) => sum + entry.socialCharges,
                    0
                  ),
                  totalCost: totalPayrollCost,
                  employeeCount: payrollEntries.reduce(
                    (sum, entry) => sum + (entry.employeeCount || 0),
                    0
                  ),
                }
              : undefined,
          payrollToRevenueRatio:
            totalValue > 0 && totalPayrollCost > 0
              ? (totalPayrollCost / totalValue) * 100
              : undefined,
          yearOverYear: {
            previousYearRevenue,
            previousYearPayroll: previousYearPayrollCost || undefined,
            revenueGrowth,
            payrollGrowth,
          },
          mandateDetails,
        };
      })
    );

    // Calculer les données cumulatives ANNUELLES (depuis le début de l'année)
    const cumulativeData = await Promise.all(
      consolidatedData.map(async (period) => {
        // Récupérer toutes les données depuis le début de l'année jusqu'à ce mois
        const yearStartDate = new Date(period.year, 0, 1);
        const periodEndDate = new Date(period.year, period.month, 0);

        // Données CA cumulées depuis le début de l'année courante
        const yearToDateValues = await prisma.dayValue.findMany({
          where: {
            mandateId: { in: mandates.map((m) => m.id) },
            date: { gte: yearStartDate, lte: periodEndDate },
          },
        });

        // Données CA cumulées depuis le début de l'année précédente (même période)
        const previousYearStartDate = new Date(period.year - 1, 0, 1);
        const previousYearEndDate = new Date(period.year - 1, period.month, 0);

        const previousYearToDateValues = await prisma.dayValue.findMany({
          where: {
            mandateId: { in: mandates.map((m) => m.id) },
            date: { gte: previousYearStartDate, lte: previousYearEndDate },
          },
        });

        // Données masse salariale cumulées depuis le début de l'année courante
        const yearToDatePayroll = await prisma.manualPayrollEntry.findMany({
          where: {
            mandateId: { in: mandates.map((m) => m.id) },
            year: period.year,
            month: { gte: 1, lte: period.month },
          },
        });

        // Données masse salariale cumulées depuis le début de l'année précédente
        const previousYearToDatePayroll =
          await prisma.manualPayrollEntry.findMany({
            where: {
              mandateId: { in: mandates.map((m) => m.id) },
              year: period.year - 1,
              month: { gte: 1, lte: period.month },
            },
          });

        // Calculer les cumuls
        const cumulativeTotal = yearToDateValues.reduce(
          (sum, v) => sum + v.value,
          0
        );
        const cumulativePreviousYearRevenue = previousYearToDateValues.reduce(
          (sum, v) => sum + v.value,
          0
        );
        const cumulativePayroll = yearToDatePayroll.reduce(
          (sum, p) => sum + p.totalCost,
          0
        );
        const cumulativePreviousYearPayroll = previousYearToDatePayroll.reduce(
          (sum, p) => sum + p.totalCost,
          0
        );

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
      })
    );

    // Calculer le summary global
    const totalPreviousYearRevenue = cumulativeData.reduce(
      (sum, p) => sum + p.yearOverYear.previousYearRevenue,
      0
    );
    const totalPreviousYearPayroll = cumulativeData.reduce(
      (sum, p) => sum + (p.yearOverYear.previousYearPayroll || 0),
      0
    );

    // Calculer la répartition par mandat (utiliser les données cumulatives)
    const lastPeriodData = cumulativeData[cumulativeData.length - 1];
    const grandTotal = lastPeriodData?.cumulativeTotal || 0;

    const mandatesBreakdown = mandates.map((mandate) => {
      const mandateTotalRevenue = cumulativeData.reduce((sum, period) => {
        const mandateDetail = period.mandateDetails.find(
          (d) => d.id === mandate.id
        );
        return sum + (mandateDetail?.totalValue || 0);
      }, 0);

      const mandateTotalPayroll = cumulativeData.reduce((sum, period) => {
        const mandateDetail = period.mandateDetails.find(
          (d) => d.id === mandate.id
        );
        return sum + (mandateDetail?.payrollCost || 0);
      }, 0);

      return {
        id: mandate.id,
        name: mandate.name,
        group: mandate.group,
        totalRevenue: mandateTotalRevenue,
        totalPayroll: mandateTotalPayroll,
        contribution:
          grandTotal > 0 ? (mandateTotalRevenue / grandTotal) * 100 : 0,
      };
    });

    // Filtrer les données pour exclure le mois en cours des statistiques
    const currentDate = new Date();
    const currentYearForStats = currentDate.getFullYear();
    const currentMonthForStats = currentDate.getMonth() + 1;

    // NOUVEAU : Récupérer les données de l'année complète pour les stats best/worst
    const fullYearPeriods = generatePeriodsRange(year, 1, 12);
    const fullYearData = await Promise.all(
      fullYearPeriods.map(async (periodInfo) => {
        const startDate = new Date(periodInfo.year, periodInfo.month - 1, 1);
        const endDate = new Date(periodInfo.year, periodInfo.month, 0);

        // Récupérer toutes les données CA pour tous les mandats pour ce mois
        const currentYearValues = await prisma.dayValue.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
            mandate: {
              organizationId: userWithOrg.Organization?.id,
            },
          },
          include: {
            mandate: true,
          },
        });

        const totalValue = currentYearValues.reduce(
          (sum, value) => sum + value.value,
          0
        );

        return {
          year: periodInfo.year,
          month: periodInfo.month,
          label: periodInfo.label,
          totalValue,
          // Pas besoin des autres champs pour les stats
        };
      })
    );

    // Filtrer les données de l'année complète pour exclure le mois en cours
    const fullYearStatsData = fullYearData.filter((period) => {
      if (
        period.year === currentYearForStats &&
        period.month === currentMonthForStats
      ) {
        return false;
      }
      return period.totalValue > 0; // Exclure aussi les mois sans données
    });

    const statsData = cumulativeData.filter((period) => {
      // Exclure le mois en cours si c'est la même année
      if (
        period.year === currentYearForStats &&
        period.month === currentMonthForStats
      ) {
        return false;
      }
      return true;
    });

    // Utiliser statsData pour les calculs de best/worst period et masse salariale
    const statsTotalPayrollCost = statsData.reduce(
      (sum, p) => sum + (p.payrollData?.totalCost || 0),
      0
    );

    // Calculer le CA total excluant le mois en cours pour les statistiques
    const grandTotalExcludingCurrentMonth = statsData.reduce(
      (sum, p) => sum + p.totalValue,
      0
    );

    // Calculs pour les statistiques excluant le mois en cours
    const totalPreviousYearRevenueExcludingCurrent = statsData.reduce(
      (sum, p) => sum + p.yearOverYear.previousYearRevenue,
      0
    );

    const response: GlobalCAResponse = {
      organization: {
        name: userWithOrg.Organization.name,
        totalMandates: mandates.length,
      },
      periods: cumulativeData,
      summary: {
        totalPeriods: cumulativeData.length,
        grandTotal,
        grandTotalExcludingCurrentMonth, // Nouveau champ pour les statistiques
        averagePerPeriod: grandTotal / cumulativeData.length,
        bestPeriod:
          fullYearStatsData.length > 0
            ? (() => {
                const best = fullYearStatsData.reduce((best, current) =>
                  current.totalValue > best.totalValue ? current : best
                );
                return {
                  year: best.year,
                  month: best.month,
                  label: best.label,
                  totalValue: best.totalValue,
                  dailyValues: [],
                  previousYearDailyValues: [],
                  averageDaily: 0,
                  daysWithData: 0,
                  yearOverYear: {
                    previousYearRevenue: 0,
                    revenueGrowth: null,
                    payrollGrowth: null,
                  },
                  mandateDetails: [],
                } as PeriodData;
              })()
            : statsData.length > 0
              ? statsData.reduce((best, current) =>
                  current.totalValue > best.totalValue ? current : best
                )
              : cumulativeData.reduce((best, current) =>
                  current.totalValue > best.totalValue ? current : best
                ),
        worstPeriod:
          fullYearStatsData.length > 0
            ? (() => {
                const worst = fullYearStatsData.reduce((worst, current) =>
                  current.totalValue < worst.totalValue ? current : worst
                );
                return {
                  year: worst.year,
                  month: worst.month,
                  label: worst.label,
                  totalValue: worst.totalValue,
                  dailyValues: [],
                  previousYearDailyValues: [],
                  averageDaily: 0,
                  daysWithData: 0,
                  yearOverYear: {
                    previousYearRevenue: 0,
                    revenueGrowth: null,
                    payrollGrowth: null,
                  },
                  mandateDetails: [],
                } as PeriodData;
              })()
            : statsData.length > 0
              ? statsData.reduce((worst, current) =>
                  current.totalValue < worst.totalValue ? current : worst
                )
              : cumulativeData.reduce((worst, current) =>
                  current.totalValue < worst.totalValue ? current : worst
                ),
        totalPayrollCost: statsTotalPayrollCost,
        globalPayrollRatio:
          grandTotal > 0 && statsTotalPayrollCost > 0
            ? (statsTotalPayrollCost / grandTotal) * 100
            : null,
        yearOverYearGrowth: {
          revenue:
            totalPreviousYearRevenue > 0
              ? ((grandTotal - totalPreviousYearRevenue) /
                  totalPreviousYearRevenue) *
                100
              : null,
          // Nouvelle croissance basée sur les données excluant le mois en cours
          revenueExcludingCurrentMonth:
            totalPreviousYearRevenueExcludingCurrent > 0
              ? ((grandTotalExcludingCurrentMonth -
                  totalPreviousYearRevenueExcludingCurrent) /
                  totalPreviousYearRevenueExcludingCurrent) *
                100
              : null,
          payroll:
            totalPreviousYearPayroll > 0 && statsTotalPayrollCost > 0
              ? ((statsTotalPayrollCost - totalPreviousYearPayroll) /
                  totalPreviousYearPayroll) *
                100
              : null,
        },
        mandatesBreakdown,
      },
      meta: {
        year,
        startMonth,
        period,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données CA globales:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonction pour générer les périodes à analyser
function generatePeriods(year: number, startMonth: number, period: string) {
  const periods = [];
  let monthsToGenerate = 12;

  if (period === "6months") {
    monthsToGenerate = 6;
  } else if (period === "3months") {
    monthsToGenerate = 3;
  }

  for (let i = 0; i < monthsToGenerate; i++) {
    const month = ((startMonth - 1 + i) % 12) + 1;
    const periodYear = year + Math.floor((startMonth - 1 + i) / 12);

    periods.push({
      year: periodYear,
      month,
      label: `${getMonthName(month)} ${periodYear}`,
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
      year,
      month,
      label: `${getMonthName(month)} ${year}`,
    });
  }

  return periods;
}

// Fonction pour formater les dates
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-CH", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
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
