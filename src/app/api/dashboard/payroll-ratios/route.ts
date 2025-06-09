// src/app/api/dashboard/payroll-ratios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasFeatureAccess } from "@/lib/access-control";

interface PayrollRatioData {
  mandateId: string;
  mandateName: string;
  mandateGroup: string;
  year: number;
  month: number;
  monthName: string;

  // Données CA
  totalRevenue: number;
  revenueEntries: number;
  averageDailyRevenue: number;

  // Données masse salariale
  payrollAmount: number | null;
  payrollSource: "manual" | "calculated" | null;
  employeeCount: number | null;

  // Ratios et indicateurs
  payrollToRevenueRatio: number | null;
  ratioStatus: "excellent" | "good" | "warning" | "critical" | "no-data";

  // Comparaisons
  previousMonthRatio: number | null;
  ratioTrend: "up" | "down" | "stable" | "no-data";
}

interface DashboardPayrollResponse {
  currentPeriod: {
    year: number;
    month: number;
    monthName: string;
  };
  mandatesData: PayrollRatioData[];
  summary: {
    totalMandates: number;
    mandatesWithData: number;
    totalRevenue: number;
    totalPayroll: number;
    globalRatio: number | null;
    averageRatio: number | null;
    ratioDistribution: {
      excellent: number;
      good: number;
      warning: number;
      critical: number;
      noData: number;
    };
  };
  trends: {
    revenueChange: number;
    payrollChange: number;
    ratioChange: number;
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

    const hasPayrollAccess = await hasFeatureAccess(session.user.id, "payroll");
    if (!hasPayrollAccess) {
      return NextResponse.json(
        {
          error: "Accès refusé",
          message: "L'accès à la masse salariale nécessite un plan Premium",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString()
    );

    // Récupérer tous les mandats actifs
    const mandates = await prisma.mandate.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        group: true,
      },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    });

    // Calculer les données pour chaque mandat
    const mandatesData: PayrollRatioData[] = await Promise.all(
      mandates.map(async (mandate) => {
        // 1. Récupérer les données CA du mois
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);

        const revenueData = await prisma.dayValue.aggregate({
          where: {
            mandateId: mandate.id,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: { value: true },
          _count: { _all: true },
        });

        const totalRevenue = revenueData._sum.value || 0;
        const revenueEntries = revenueData._count._all;
        const averageDailyRevenue =
          revenueEntries > 0 ? totalRevenue / revenueEntries : 0;

        // 2. Récupérer les données de masse salariale manuelle
        const manualPayrollEntry = await prisma.manualPayrollEntry.findUnique({
          where: {
            mandateId_year_month: {
              mandateId: mandate.id,
              year,
              month,
            },
          },
        });

        // 3. Calculer les données du mois précédent pour les tendances
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        const [prevRevenueData, prevPayrollEntry] = await Promise.all([
          prisma.dayValue.aggregate({
            where: {
              mandateId: mandate.id,
              date: {
                gte: new Date(prevYear, prevMonth - 1, 1),
                lte: new Date(prevYear, prevMonth, 0),
              },
            },
            _sum: { value: true },
          }),
          prisma.manualPayrollEntry.findUnique({
            where: {
              mandateId_year_month: {
                mandateId: mandate.id,
                year: prevYear,
                month: prevMonth,
              },
            },
          }),
        ]);

        const prevTotalRevenue = prevRevenueData._sum.value || 0;
        const prevPayrollAmount = prevPayrollEntry?.totalCost || 0;
        const previousMonthRatio =
          prevTotalRevenue > 0 && prevPayrollAmount > 0
            ? (prevPayrollAmount / prevTotalRevenue) * 100
            : null;

        // 4. Calculer le ratio et le statut
        const payrollAmount = manualPayrollEntry?.totalCost || null;
        const payrollToRevenueRatio =
          totalRevenue > 0 && payrollAmount
            ? (payrollAmount / totalRevenue) * 100
            : null;

        const ratioStatus = getRatioStatus(payrollToRevenueRatio);
        const ratioTrend = getRatioTrend(
          payrollToRevenueRatio,
          previousMonthRatio
        );

        return {
          mandateId: mandate.id,
          mandateName: mandate.name,
          mandateGroup: mandate.group,
          year,
          month,
          monthName: new Date(year, month - 1, 1).toLocaleDateString("fr-CH", {
            month: "long",
          }),

          totalRevenue,
          revenueEntries,
          averageDailyRevenue,

          payrollAmount,
          payrollSource: manualPayrollEntry ? ("manual" as const) : null,
          employeeCount: manualPayrollEntry?.employeeCount || null,

          payrollToRevenueRatio,
          ratioStatus,

          previousMonthRatio,
          ratioTrend,
        };
      })
    );

    // 5. Calculer les statistiques globales
    const mandatesWithData = mandatesData.filter(
      (m) => m.payrollAmount && m.totalRevenue > 0
    );
    const totalRevenue = mandatesData.reduce(
      (sum, m) => sum + m.totalRevenue,
      0
    );
    const totalPayroll = mandatesData.reduce(
      (sum, m) => sum + (m.payrollAmount || 0),
      0
    );

    const globalRatio =
      totalRevenue > 0 && totalPayroll > 0
        ? (totalPayroll / totalRevenue) * 100
        : null;

    const averageRatio =
      mandatesWithData.length > 0
        ? mandatesWithData.reduce(
            (sum, m) => sum + (m.payrollToRevenueRatio || 0),
            0
          ) / mandatesWithData.length
        : null;

    // Distribution des ratios
    const ratioDistribution = {
      excellent: mandatesData.filter((m) => m.ratioStatus === "excellent")
        .length,
      good: mandatesData.filter((m) => m.ratioStatus === "good").length,
      warning: mandatesData.filter((m) => m.ratioStatus === "warning").length,
      critical: mandatesData.filter((m) => m.ratioStatus === "critical").length,
      noData: mandatesData.filter((m) => m.ratioStatus === "no-data").length,
    };

    // 6. Calculer les tendances
    const prevMandatesWithData = mandatesData.filter(
      (m) => m.previousMonthRatio !== null && m.payrollToRevenueRatio !== null
    );

    const trends = {
      revenueChange: 0, // Simplifié pour cet exemple
      payrollChange: 0, // Simplifié pour cet exemple
      ratioChange:
        prevMandatesWithData.length > 0
          ? prevMandatesWithData.reduce(
              (sum, m) =>
                sum +
                (m.payrollToRevenueRatio! - m.previousMonthRatio!) /
                  prevMandatesWithData.length,
              0
            )
          : 0,
    };

    const response: DashboardPayrollResponse = {
      currentPeriod: {
        year,
        month,
        monthName: new Date(year, month - 1, 1).toLocaleDateString("fr-CH", {
          month: "long",
        }),
      },
      mandatesData,
      summary: {
        totalMandates: mandates.length,
        mandatesWithData: mandatesWithData.length,
        totalRevenue,
        totalPayroll,
        globalRatio,
        averageRatio,
        ratioDistribution,
      },
      trends,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la récupération des ratios payroll:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

function getRatioStatus(
  ratio: number | null
): "excellent" | "good" | "warning" | "critical" | "no-data" {
  if (ratio === null) return "no-data";
  if (ratio < 25) return "excellent";
  if (ratio < 35) return "good";
  if (ratio < 50) return "warning";
  return "critical";
}

function getRatioTrend(
  current: number | null,
  previous: number | null
): "up" | "down" | "stable" | "no-data" {
  if (current === null || previous === null) return "no-data";
  const diff = current - previous;
  if (Math.abs(diff) < 1) return "stable";
  return diff > 0 ? "up" : "down";
}
