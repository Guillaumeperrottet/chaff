import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface DashboardStats {
  totalMandates: number;
  activeMandates: number;
  totalDayValues: number;
  totalRevenue: number;
  averageDailyRevenue: number;
  recentValues: number;
  topPerformingMandate: {
    name: string;
    totalRevenue: number;
  } | null;
  mandatesByGroup: Record<string, number>; // ✅ Support types personnalisés
  revenueByGroup: Record<string, number>; // ✅ Support types personnalisés
  last7Days: {
    date: string;
    totalRevenue: number;
    valueCount: number;
  }[];
  monthlyTrend: {
    month: string;
    totalRevenue: number;
    valueCount: number;
  }[];
}

// GET /api/dashboard/stats - Récupérer les statistiques du dashboard
export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Dates de référence
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Statistiques des mandats
    const totalMandates = await prisma.mandate.count();
    const activeMandates = await prisma.mandate.count({
      where: { active: true },
    });

    // 2. Statistiques des valeurs journalières
    const totalDayValues = await prisma.dayValue.count();

    const recentValues = await prisma.dayValue.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // 3. Statistiques de revenus
    const revenueStats = await prisma.dayValue.aggregate({
      _sum: { value: true },
      _avg: { value: true },
    });

    const totalRevenue = revenueStats._sum.value || 0;
    const averageDailyRevenue = revenueStats._avg.value || 0;

    // 4. Mandat le plus performant
    const topMandate = await prisma.mandate.findFirst({
      orderBy: { totalRevenue: "desc" },
      select: {
        name: true,
        totalRevenue: true,
      },
    });

    // 5. Répartition par groupe (support types personnalisés)
    const mandatesByGroup = await prisma.mandate.groupBy({
      by: ["group"],
      _count: { _all: true },
    });

    // ✅ Utiliser Record<string, number> pour supporter les types personnalisés
    const mandatesGroupCount: Record<string, number> = {};

    // Initialiser avec les types par défaut
    mandatesGroupCount["HEBERGEMENT"] = 0;
    mandatesGroupCount["RESTAURATION"] = 0;

    mandatesByGroup.forEach((group) => {
      mandatesGroupCount[group.group] = group._count._all;
    });

    // 6. Revenus par groupe (support types personnalisés)
    const mandatesWithRevenue = await prisma.mandate.findMany({
      select: {
        group: true,
        totalRevenue: true,
      },
    });

    // ✅ Utiliser Record<string, number> pour supporter les types personnalisés
    const revenueGroupTotals: Record<string, number> = {};

    // Initialiser avec les types par défaut
    revenueGroupTotals["HEBERGEMENT"] = 0;
    revenueGroupTotals["RESTAURATION"] = 0;

    mandatesWithRevenue.forEach((mandate) => {
      if (!revenueGroupTotals[mandate.group]) {
        revenueGroupTotals[mandate.group] = 0;
      }
      revenueGroupTotals[mandate.group] += mandate.totalRevenue;
    });

    // 7. Données des 7 derniers jours
    const last7DaysData = await prisma.dayValue.groupBy({
      by: ["date"],
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
      _sum: { value: true },
      _count: { _all: true },
      orderBy: { date: "asc" },
    });

    const last7Days = last7DaysData.map((day) => ({
      date: day.date.toISOString().split("T")[0],
      totalRevenue: day._sum.value || 0,
      valueCount: day._count._all,
    }));

    // 8. Tendance mensuelle (derniers 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await prisma.dayValue.findMany({
      where: {
        date: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        date: true,
        value: true,
      },
      orderBy: { date: "asc" },
    });

    // Grouper par mois
    const monthlyMap = new Map<string, { revenue: number; count: number }>();

    monthlyData.forEach((item) => {
      const monthKey = `${item.date.getFullYear()}-${(item.date.getMonth() + 1).toString().padStart(2, "0")}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { revenue: 0, count: 0 });
      }

      const existing = monthlyMap.get(monthKey)!;
      existing.revenue += item.value;
      existing.count += 1;
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        totalRevenue: data.revenue,
        valueCount: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Construire la réponse
    const stats: DashboardStats = {
      totalMandates,
      activeMandates,
      totalDayValues,
      totalRevenue,
      averageDailyRevenue,
      recentValues,
      topPerformingMandate: topMandate
        ? {
            name: topMandate.name,
            totalRevenue: topMandate.totalRevenue,
          }
        : null,
      mandatesByGroup: mandatesGroupCount,
      revenueByGroup: revenueGroupTotals,
      last7Days,
      monthlyTrend,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
