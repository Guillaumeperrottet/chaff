import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface DashboardData {
  id: string;
  name: string;
  lastEntry: string | null;
  lastEntryDate: Date | null;
  performance: string;
  values: Record<string, string>;
  category: string;
  status: string;
  totalRevenue: number;
}

interface ColumnLabel {
  key: string;
  label: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const days = parseInt(searchParams.get("days") || "7");

    const mandates = await prisma.mandate.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        _count: {
          select: { dayValues: true },
        },
      },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    });

    // Générer les colonnes de dates
    const dateColumns: string[] = [];
    const columnLabels: ColumnLabel[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      dateColumns.push(dateKey);

      const dayNames = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
      const dayName = dayNames[date.getDay()];
      const formattedDate = formatDateShort(date);

      columnLabels.push({
        key: dateKey,
        label: `${dayName} ${formattedDate}`,
      });
    }

    const dashboardData: DashboardData[] = await Promise.all(
      mandates.map(async (mandate) => {
        // Récupérer la dernière saisie par DATE (pas createdAt)
        const lastDayValue = await prisma.dayValue.findFirst({
          where: { mandateId: mandate.id },
          orderBy: { date: "desc" },
        });

        // Récupérer les valeurs pour les colonnes
        const recentValues = await prisma.dayValue.findMany({
          where: {
            mandateId: mandate.id,
            date: {
              gte: new Date(dateColumns[0]),
              lte: new Date(dateColumns[dateColumns.length - 1]),
            },
          },
          orderBy: { date: "asc" },
        });

        const valuesByDate = new Map<string, number>();
        recentValues.forEach((value) => {
          const dateKey = value.date.toISOString().split("T")[0];
          valuesByDate.set(dateKey, value.value);
        });

        const values: Record<string, string> = {};
        dateColumns.forEach((dateKey) => {
          const value = valuesByDate.get(dateKey);
          values[dateKey] = value ? formatCurrency(value) : "0.00";
        });

        // Juste la date, sans calcul des jours
        let lastEntryFormatted: string | null = null;
        let lastEntryDate: Date | null = null;

        if (lastDayValue) {
          lastEntryDate = lastDayValue.date;
          lastEntryFormatted = formatDateSimple(lastDayValue.date);
        }

        // Calculer la performance (record)
        const allTimeValues = await prisma.dayValue.findMany({
          where: { mandateId: mandate.id },
          orderBy: { value: "desc" },
          take: 1,
        });

        const maxValue = allTimeValues.length > 0 ? allTimeValues[0].value : 0;
        const maxValueDate =
          allTimeValues.length > 0 ? allTimeValues[0].date : null;

        const performance =
          maxValue > 0
            ? `${formatCurrency(maxValue)} / ${formatDate(maxValueDate || new Date())}`
            : "Aucune donnée";

        // 🔧 SIMPLIFIÉ: Statut basé uniquement sur l'existence de valeurs
        let status = "active";
        if (!mandate.active) {
          status = "inactive";
        } else if (!lastDayValue) {
          status = "new";
        }

        return {
          id: mandate.id,
          name: mandate.name,
          lastEntry: lastEntryFormatted,
          lastEntryDate: lastEntryDate,
          performance,
          values,
          category:
            mandate.group === "HEBERGEMENT" ? "Hébergement" : "Restauration",
          status,
          totalRevenue: mandate.totalRevenue,
        };
      })
    );

    // Trier par dernière saisie (plus récente en premier)
    dashboardData.sort((a, b) => {
      if (!a.lastEntryDate && !b.lastEntryDate) return 0;
      if (!a.lastEntryDate) return 1;
      if (!b.lastEntryDate) return -1;
      return b.lastEntryDate.getTime() - a.lastEntryDate.getTime();
    });

    // Calculer les totaux (code existant...)
    const totals = {
      totalRevenue: dashboardData.reduce(
        (sum, item) => sum + item.totalRevenue,
        0
      ),
      totalMandates: dashboardData.length,
      activeMandates: dashboardData.filter((item) => item.status === "active")
        .length,
      dailyTotals: {} as Record<string, number>,
      subtotalsByCategory: {
        hebergement: {} as Record<string, number>,
        restauration: {} as Record<string, number>,
      },
    };

    // Calculer les totaux par jour
    dateColumns.forEach((dateKey) => {
      totals.dailyTotals[dateKey] = 0;
      totals.subtotalsByCategory.hebergement[dateKey] = 0;
      totals.subtotalsByCategory.restauration[dateKey] = 0;

      dashboardData.forEach((item) => {
        const value = item.values[dateKey];
        const numValue = value ? parseFloat(value.replace(/[^\d.-]/g, "")) : 0;

        totals.dailyTotals[dateKey] += numValue;

        if (item.category === "Hébergement") {
          totals.subtotalsByCategory.hebergement[dateKey] += numValue;
        } else if (item.category === "Restauration") {
          totals.subtotalsByCategory.restauration[dateKey] += numValue;
        }
      });
    });

    return NextResponse.json({
      data: dashboardData,
      totals,
      columnLabels,
      meta: {
        dateRange: {
          start: dateColumns[0],
          end: dateColumns[dateColumns.length - 1],
          days: days,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données du dashboard:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

//Formatage simple de la date
function formatDateSimple(date: Date): string {
  return date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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
    year: "2-digit",
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}
