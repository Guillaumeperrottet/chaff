import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// Types pour les données CA par types
interface TypeBreakdown {
  id: string;
  name: string;
  label: string;
  totalRevenue: number;
  totalPayroll: number;
  contribution: number;
  mandatesCount: number;
}

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
}

interface TypesCAResponse {
  organization: {
    name: string;
    totalTypes: number;
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
    typesBreakdown: TypeBreakdown[];
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
    const startMonth = parseInt(searchParams.get("startMonth") || "1");
    const endMonth = parseInt(searchParams.get("endMonth") || "12");
    const period = searchParams.get("period") || "6months";
    const selectedType = searchParams.get("type"); // Nouveau paramètre pour le type sélectionné

    console.log("🔍 CA Types - Paramètres reçus:", {
      year,
      startMonth,
      endMonth,
      period,
      selectedType,
      isFullYear: startMonth === 1 && endMonth === 12,
    });

    // Récupérer tous les mandats actifs (filtrer par type si spécifié)
    const mandateFilter: {
      organizationId: string;
      active: boolean;
      group?: string;
    } = {
      organizationId: userWithOrg.Organization.id,
      active: true,
    };

    // Si un type spécifique est demandé, filtrer sur ce type
    if (selectedType) {
      mandateFilter.group = selectedType;
    }

    const mandates = await prisma.mandate.findMany({
      where: mandateFilter,
      select: {
        id: true,
        name: true,
        group: true,
      },
    });

    // Si on filtre par type spécifique, utiliser seulement ce type
    const typeGroups = selectedType
      ? { [selectedType]: mandates }
      : mandates.reduce(
          (groups, mandate) => {
            if (!groups[mandate.group]) {
              groups[mandate.group] = [];
            }
            groups[mandate.group].push(mandate);
            return groups;
          },
          {} as Record<string, typeof mandates>
        );

    console.log("📊 Types traités:", Object.keys(typeGroups));
    console.log("📊 Nombre de mandats:", mandates.length);

    // Récupérer les vraies données CA depuis la base de données
    const periods = [];
    for (let month = startMonth; month <= endMonth; month++) {
      periods.push({
        year,
        month,
        label: getMonthName(month) + " " + year,
      });
    }

    // Récupérer les données réelles pour tous les mandats du type sélectionné
    const periodData = await Promise.all(
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

        // Récupérer toutes les valeurs CA pour les mandats du type
        const [currentYearValues, previousYearValues] = await Promise.all([
          prisma.dayValue.findMany({
            where: {
              mandateId: { in: mandates.map((m) => m.id) },
              date: { gte: startDate, lte: endDate },
            },
            orderBy: { date: "asc" },
          }),
          prisma.dayValue.findMany({
            where: {
              mandateId: { in: mandates.map((m) => m.id) },
              date: { gte: previousYearStart, lte: previousYearEnd },
            },
            orderBy: { date: "asc" },
          }),
        ]);

        // Récupérer les données de masse salariale
        const [payrollEntries, previousYearPayrollEntries] = await Promise.all([
          prisma.manualPayrollEntry.findMany({
            where: {
              mandateId: { in: mandates.map((m) => m.id) },
              year: periodInfo.year,
              month: periodInfo.month,
            },
          }),
          prisma.manualPayrollEntry.findMany({
            where: {
              mandateId: { in: mandates.map((m) => m.id) },
              year: periodInfo.year - 1,
              month: periodInfo.month,
            },
          }),
        ]);

        // Consolider par jour
        const daysInMonth = endDate.getDate();
        const dailyValues: DayCAData[] = [];
        const previousYearDailyValues: DayCAData[] = [];

        let monthlyTotal = 0;
        let previousYearMonthlyTotal = 0;

        for (let day = 1; day <= daysInMonth; day++) {
          const dayDate = new Date(periodInfo.year, periodInfo.month - 1, day);

          // Somme pour ce jour (tous les mandats du type)
          const dayTotal = currentYearValues
            .filter((v) => v.date.toDateString() === dayDate.toDateString())
            .reduce((sum, v) => sum + v.value, 0);

          monthlyTotal += dayTotal;

          dailyValues.push({
            date: dayDate.toISOString().split("T")[0],
            value: dayTotal,
            formattedDate: dayDate.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
            }),
          });
        }

        // Année précédente
        const previousYearDaysInMonth = new Date(
          periodInfo.year - 1,
          periodInfo.month,
          0
        ).getDate();
        for (let day = 1; day <= previousYearDaysInMonth; day++) {
          const dayDate = new Date(
            periodInfo.year - 1,
            periodInfo.month - 1,
            day
          );

          const dayTotal = previousYearValues
            .filter((v) => v.date.toDateString() === dayDate.toDateString())
            .reduce((sum, v) => sum + v.value, 0);

          previousYearMonthlyTotal += dayTotal;

          previousYearDailyValues.push({
            date: dayDate.toISOString().split("T")[0],
            value: dayTotal,
            formattedDate: dayDate.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
            }),
          });
        }

        // Calculer masse salariale
        const totalPayrollCost = payrollEntries.reduce(
          (sum, entry) => sum + entry.totalCost,
          0
        );
        const previousYearPayrollCost = previousYearPayrollEntries.reduce(
          (sum, entry) => sum + entry.totalCost,
          0
        );

        const daysWithData = dailyValues.filter((dv) => dv.value > 0).length;
        const averageDaily = daysWithData > 0 ? monthlyTotal / daysWithData : 0;

        const revenueGrowth =
          previousYearMonthlyTotal > 0
            ? ((monthlyTotal - previousYearMonthlyTotal) /
                previousYearMonthlyTotal) *
              100
            : null;

        const payrollGrowth =
          previousYearPayrollCost > 0
            ? ((totalPayrollCost - previousYearPayrollCost) /
                previousYearPayrollCost) *
              100
            : null;

        return {
          year: periodInfo.year,
          month: periodInfo.month,
          label: periodInfo.label,
          totalValue: monthlyTotal,
          dailyValues,
          previousYearDailyValues,
          averageDaily,
          daysWithData,
          cumulativeTotal: 0, // Sera calculé après
          cumulativePreviousYearRevenue: 0, // Sera calculé après
          cumulativeRevenueGrowth: null, // Sera calculé après
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
                  employeeCount:
                    Math.max(
                      ...payrollEntries.map((e) => e.employeeCount || 0),
                      0
                    ) || undefined,
                }
              : undefined,
          payrollToRevenueRatio:
            monthlyTotal > 0 && totalPayrollCost > 0
              ? (totalPayrollCost / monthlyTotal) * 100
              : undefined,
          yearOverYear: {
            previousYearRevenue: previousYearMonthlyTotal,
            previousYearPayroll:
              previousYearPayrollCost > 0 ? previousYearPayrollCost : undefined,
            revenueGrowth,
            payrollGrowth,
          },
        };
      })
    );

    // Calculer les cumuls ANNUELS après avoir créé toutes les périodes
    // Pour chaque période, calculer le cumul depuis le début de l'année jusqu'à cette période
    const periodsWithCumuls = await Promise.all(
      periodData.map(async (period) => {
        // Récupérer toutes les données depuis le début de l'année jusqu'à ce mois pour les cumuls
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

        // Calculer les cumuls annuels
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

    // Calculer les breakdown par types (utiliser les données cumulatives)
    const lastPeriodData = periodsWithCumuls[periodsWithCumuls.length - 1];
    const totalCumulativeRevenue = lastPeriodData?.cumulativeTotal || 0;

    const typesBreakdown: TypeBreakdown[] = Object.entries(typeGroups).map(
      ([typeId, mandatesInType]) => {
        // Calculer le total réel pour ce type (utiliser les données mensuelles)
        const typeTotalRevenue = periodsWithCumuls.reduce(
          (sum, period) => sum + period.totalValue,
          0
        );
        const typeTotalPayroll = periodsWithCumuls.reduce(
          (sum, period) => sum + (period.payrollData?.totalCost || 0),
          0
        );

        return {
          id: typeId,
          name: typeId,
          label: getTypeLabel(typeId),
          totalRevenue: typeTotalRevenue,
          totalPayroll: typeTotalPayroll,
          contribution:
            totalCumulativeRevenue > 0
              ? (typeTotalRevenue / totalCumulativeRevenue) * 100
              : 0,
          mandatesCount: mandatesInType.length,
        };
      }
    );

    // Exclure le mois courant des statistiques pour éviter les données incomplètes
    const currentDate = new Date();
    const currentYearForStats = currentDate.getFullYear();
    const currentMonthForStats = currentDate.getMonth() + 1; // getMonth() retourne 0-11

    // Filtrer les données pour les statistiques (exclure le mois courant de l'année courante)
    const statsData = periodsWithCumuls.filter(
      (period) =>
        !(
          period.year === currentYearForStats &&
          period.month === currentMonthForStats
        )
    );

    // Utiliser les données cumulatives pour les totaux
    const grandTotal = totalCumulativeRevenue;

    // Calculer les totaux pour les statistiques (sans le mois courant)
    const statsTotalPayrollCost = statsData.reduce(
      (sum, period) => sum + (period.payrollData?.totalCost || 0),
      0
    );
    const statsGrandTotal = statsData.reduce(
      (sum, period) => sum + period.totalValue,
      0
    );

    // Croissances basées sur les données filtrées pour les statistiques
    const statsTotalPreviousYearRevenue = statsData.reduce(
      (sum, period) => sum + period.yearOverYear.previousYearRevenue,
      0
    );
    const statsTotalPreviousYearPayroll = statsData.reduce(
      (sum, period) => sum + (period.yearOverYear.previousYearPayroll || 0),
      0
    );

    const yearOverYearRevenueGrowth =
      statsTotalPreviousYearRevenue > 0
        ? ((statsGrandTotal - statsTotalPreviousYearRevenue) /
            statsTotalPreviousYearRevenue) *
          100
        : null;

    const yearOverYearPayrollGrowth =
      statsTotalPreviousYearPayroll > 0
        ? ((statsTotalPayrollCost - statsTotalPreviousYearPayroll) /
            statsTotalPreviousYearPayroll) *
          100
        : null;

    const response: TypesCAResponse = {
      organization: {
        name: userWithOrg.Organization.name,
        totalTypes: Object.keys(typeGroups).length,
      },
      periods: periodsWithCumuls,
      summary: {
        totalPeriods: periodsWithCumuls.length,
        grandTotal,
        grandTotalExcludingCurrentMonth: statsGrandTotal, // Nouveau champ pour les statistiques
        averagePerPeriod: grandTotal / periodsWithCumuls.length,
        bestPeriod:
          statsData.length > 0
            ? statsData.reduce((best, current) =>
                current.totalValue > best.totalValue ? current : best
              )
            : periodsWithCumuls.reduce((best, current) =>
                current.totalValue > best.totalValue ? current : best
              ),
        worstPeriod:
          statsData.length > 0
            ? statsData.reduce((worst, current) =>
                current.totalValue < worst.totalValue ? current : worst
              )
            : periodsWithCumuls.reduce((worst, current) =>
                current.totalValue < worst.totalValue ? current : worst
              ),
        totalPayrollCost: statsTotalPayrollCost,
        globalPayrollRatio:
          statsGrandTotal > 0
            ? (statsTotalPayrollCost / statsGrandTotal) * 100
            : null,
        yearOverYearGrowth: {
          revenue: yearOverYearRevenueGrowth,
          revenueExcludingCurrentMonth: yearOverYearRevenueGrowth, // Utilise déjà les données filtrées
          payroll: yearOverYearPayrollGrowth,
        },
        typesBreakdown,
      },
      meta: {
        year,
        startMonth,
        period,
        generatedAt: new Date().toISOString(),
      },
    };

    console.log("✅ CA Types - Réponse générée avec succès");
    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données CA par types:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
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

// Fonction pour obtenir le label d'un type
function getTypeLabel(typeId: string): string {
  if (typeId === "HEBERGEMENT") return "Hébergement";
  if (typeId === "RESTAURATION") return "Restauration";
  return typeId; // Pour les types personnalisés
}
