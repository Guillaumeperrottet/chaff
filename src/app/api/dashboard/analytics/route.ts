// src/app/api/dashboard/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalMandates: number;
    totalValues: number;
    averageDaily: number;
    growth: {
      revenue: number;
      mandates: number;
      values: number;
    };
  };
  timeSeriesData: Array<{
    date: string;
    totalRevenue: number;
    hebergementRevenue: number;
    restaurationRevenue: number;
    valueCount: number;
  }>;
  mandatePerformance: Array<{
    id: string;
    name: string;
    group: string;
    totalRevenue: number;
    valueCount: number;
    averageDaily: number;
    lastEntry: string | null;
    growthPercentage: number;
  }>;
  groupAnalysis: {
    hebergement: {
      totalRevenue: number;
      mandateCount: number;
      averagePerMandate: number;
      topMandate: { name: string; revenue: number } | null;
    };
    restauration: {
      totalRevenue: number;
      mandateCount: number;
      averagePerMandate: number;
      topMandate: { name: string; revenue: number } | null;
    };
  };
  periodicAnalysis: {
    daily: Array<{
      dayName: string;
      averageRevenue: number;
      totalValues: number;
    }>;
    monthly: Array<{
      month: string;
      totalRevenue: number;
      totalValues: number;
      averageDaily: number;
    }>;
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // 30 jours par défaut
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculer les dates de période
    const now = new Date();
    const daysAgo = parseInt(period);
    const periodStart = startDate
      ? new Date(startDate)
      : new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const periodEnd = endDate ? new Date(endDate) : now;

    // Période précédente pour les comparaisons
    const previousPeriodStart = new Date(
      periodStart.getTime() - (periodEnd.getTime() - periodStart.getTime())
    );

    // 1. Vue d'ensemble
    const [currentPeriodStats, previousPeriodStats] = await Promise.all([
      getPeriodStats(periodStart, periodEnd),
      getPeriodStats(previousPeriodStart, periodStart),
    ]);

    const overview = {
      totalRevenue: currentPeriodStats.totalRevenue,
      totalMandates: currentPeriodStats.uniqueMandates,
      totalValues: currentPeriodStats.totalValues,
      averageDaily:
        currentPeriodStats.totalValues > 0
          ? currentPeriodStats.totalRevenue / currentPeriodStats.totalValues
          : 0,
      growth: {
        revenue: calculateGrowthPercentage(
          currentPeriodStats.totalRevenue,
          previousPeriodStats.totalRevenue
        ),
        mandates: calculateGrowthPercentage(
          currentPeriodStats.uniqueMandates,
          previousPeriodStats.uniqueMandates
        ),
        values: calculateGrowthPercentage(
          currentPeriodStats.totalValues,
          previousPeriodStats.totalValues
        ),
      },
    };

    // 2. Données temporelles
    const timeSeriesData = await getTimeSeriesData(periodStart, periodEnd);

    // 3. Performance des mandats
    const mandatePerformance = await getMandatePerformance(
      periodStart,
      periodEnd
    );

    // 4. Analyse par groupe
    const groupAnalysis = await getGroupAnalysis(periodStart, periodEnd);

    // 5. Analyse périodique
    const periodicAnalysis = await getPeriodicAnalysis(periodStart, periodEnd);

    const analyticsData: AnalyticsData = {
      overview,
      timeSeriesData,
      mandatePerformance,
      groupAnalysis,
      periodicAnalysis,
    };

    return NextResponse.json({
      data: analyticsData,
      meta: {
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
          days: Math.ceil(
            (periodEnd.getTime() - periodStart.getTime()) /
              (24 * 60 * 60 * 1000)
          ),
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération des analytics:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires

async function getPeriodStats(startDate: Date, endDate: Date) {
  const stats = await prisma.dayValue.aggregate({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: { value: true },
    _count: { _all: true },
  });

  const uniqueMandates = await prisma.dayValue.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { mandateId: true },
    distinct: ["mandateId"],
  });

  return {
    totalRevenue: stats._sum.value || 0,
    totalValues: stats._count._all,
    uniqueMandates: uniqueMandates.length,
  };
}

async function getTimeSeriesData(startDate: Date, endDate: Date) {
  const dayValues = await prisma.dayValue.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      mandate: {
        select: { group: true },
      },
    },
    orderBy: { date: "asc" },
  });

  // Grouper par date
  const dateMap = new Map<
    string,
    {
      totalRevenue: number;
      hebergementRevenue: number;
      restaurationRevenue: number;
      valueCount: number;
    }
  >();

  dayValues.forEach((dv) => {
    const dateKey = dv.date.toISOString().split("T")[0];
    const existing = dateMap.get(dateKey) || {
      totalRevenue: 0,
      hebergementRevenue: 0,
      restaurationRevenue: 0,
      valueCount: 0,
    };

    existing.totalRevenue += dv.value;
    existing.valueCount += 1;

    if (dv.mandate.group === "HEBERGEMENT") {
      existing.hebergementRevenue += dv.value;
    } else {
      existing.restaurationRevenue += dv.value;
    }

    dateMap.set(dateKey, existing);
  });

  return Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));
}

async function getMandatePerformance(startDate: Date, endDate: Date) {
  const mandates = await prisma.mandate.findMany({
    include: {
      dayValues: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _count: {
        select: { dayValues: true },
      },
    },
  });

  // Calculer la période précédente pour la croissance
  const previousPeriodStart = new Date(
    startDate.getTime() - (endDate.getTime() - startDate.getTime())
  );

  return Promise.all(
    mandates.map(async (mandate) => {
      const currentRevenue = mandate.dayValues.reduce(
        (sum, dv) => sum + dv.value,
        0
      );
      const currentValueCount = mandate.dayValues.length;

      // Revenue de la période précédente
      const previousValues = await prisma.dayValue.findMany({
        where: {
          mandateId: mandate.id,
          date: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      });
      const previousRevenue = previousValues.reduce(
        (sum, dv) => sum + dv.value,
        0
      );

      return {
        id: mandate.id,
        name: mandate.name,
        group: mandate.group === "HEBERGEMENT" ? "Hébergement" : "Restauration",
        totalRevenue: currentRevenue,
        valueCount: currentValueCount,
        averageDaily:
          currentValueCount > 0 ? currentRevenue / currentValueCount : 0,
        lastEntry: mandate.lastEntry?.toISOString().split("T")[0] || null,
        growthPercentage: calculateGrowthPercentage(
          currentRevenue,
          previousRevenue
        ),
      };
    })
  );
}

async function getGroupAnalysis(startDate: Date, endDate: Date) {
  const mandates = await prisma.mandate.findMany({
    include: {
      dayValues: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });

  const hebergementMandates = mandates.filter((m) => m.group === "HEBERGEMENT");
  const restaurationMandates = mandates.filter(
    (m) => m.group === "RESTAURATION"
  );

  const analyzeGroup = (groupMandates: typeof mandates) => {
    const totalRevenue = groupMandates.reduce(
      (sum, m) => sum + m.dayValues.reduce((s, dv) => s + dv.value, 0),
      0
    );
    const mandateCount = groupMandates.length;
    const averagePerMandate =
      mandateCount > 0 ? totalRevenue / mandateCount : 0;

    const topMandate = groupMandates.reduce(
      (best, current) => {
        const currentRevenue = current.dayValues.reduce(
          (s, dv) => s + dv.value,
          0
        );
        const bestRevenue = best ? best.revenue : 0;
        return currentRevenue > bestRevenue
          ? { name: current.name, revenue: currentRevenue }
          : best;
      },
      null as { name: string; revenue: number } | null
    );

    return {
      totalRevenue,
      mandateCount,
      averagePerMandate,
      topMandate,
    };
  };

  return {
    hebergement: analyzeGroup(hebergementMandates),
    restauration: analyzeGroup(restaurationMandates),
  };
}

async function getPeriodicAnalysis(startDate: Date, endDate: Date) {
  const dayValues = await prisma.dayValue.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Analyse par jour de la semaine
  const dayNames = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const dailyStats = Array.from({ length: 7 }, (_, i) => ({
    dayName: dayNames[i],
    values: [] as number[],
    totalValues: 0,
  }));

  dayValues.forEach((dv) => {
    const dayOfWeek = dv.date.getDay();
    dailyStats[dayOfWeek].values.push(dv.value);
    dailyStats[dayOfWeek].totalValues += 1;
  });

  const daily = dailyStats.map((stat) => ({
    dayName: stat.dayName,
    averageRevenue:
      stat.values.length > 0
        ? stat.values.reduce((sum, v) => sum + v, 0) / stat.values.length
        : 0,
    totalValues: stat.totalValues,
  }));

  // Analyse par mois
  const monthlyMap = new Map<string, { revenue: number; count: number }>();
  dayValues.forEach((dv) => {
    const monthKey = `${dv.date.getFullYear()}-${(dv.date.getMonth() + 1).toString().padStart(2, "0")}`;
    const existing = monthlyMap.get(monthKey) || { revenue: 0, count: 0 };
    existing.revenue += dv.value;
    existing.count += 1;
    monthlyMap.set(monthKey, existing);
  });

  const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    totalRevenue: data.revenue,
    totalValues: data.count,
    averageDaily: data.count > 0 ? data.revenue / data.count : 0,
  }));

  return { daily, monthly };
}

function calculateGrowthPercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
