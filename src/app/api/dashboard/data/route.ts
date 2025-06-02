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
  daysSinceLastEntry: number | null;
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
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Récupérer tous les mandats avec leurs valeurs récentes
    const mandates = await prisma.mandate.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        dayValues: {
          orderBy: { date: "desc" },
          take: 1, // Seulement la plus récente pour lastEntry
        },
        _count: {
          select: { dayValues: true },
        },
      },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    });

    // Générer les colonnes de dates (derniers 7 jours)
    const dateColumns: string[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dateColumns.push(date.toISOString().split("T")[0]);
    }

    // Transformer les données pour le frontend
    const dashboardData: DashboardData[] = await Promise.all(
      mandates.map(async (mandate) => {
        // 🔧 CORRECTION: Récupérer la VRAIE dernière saisie
        const lastDayValue = await prisma.dayValue.findFirst({
          where: { mandateId: mandate.id },
          orderBy: { date: "desc" }, // Trier par DATE de la valeur, pas par date de création
        });

        // Récupérer les valeurs pour les 7 derniers jours pour l'affichage
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

        // Créer un map des valeurs par date
        const valuesByDate = new Map<string, number>();
        recentValues.forEach((value) => {
          const dateKey = value.date.toISOString().split("T")[0];
          valuesByDate.set(dateKey, value.value);
        });

        // Construire l'objet values pour les colonnes
        const values: Record<string, string> = {};
        dateColumns.forEach((dateKey) => {
          const value = valuesByDate.get(dateKey);
          values[dateKey] = value ? formatCurrency(value) : "0.00";
        });

        // 🔧 CORRECTION: Calculer les jours depuis la dernière saisie
        let daysSinceLastEntry: number | null = null;
        let lastEntryFormatted: string | null = null;
        let lastEntryDate: Date | null = null;

        if (lastDayValue) {
          lastEntryDate = lastDayValue.date;
          lastEntryFormatted = formatDateWithDetails(lastDayValue.date);

          // Calculer les jours écoulés
          const timeDiff = today.getTime() - lastDayValue.date.getTime();
          daysSinceLastEntry = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
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
            ? `${formatCurrency(maxValue)} (${formatDate(maxValueDate || new Date())})`
            : "Aucune donnée";

        // 🔧 CORRECTION: Déterminer le statut basé sur la vraie dernière saisie
        let status = "active";
        if (!mandate.active) {
          status = "inactive";
        } else if (!lastDayValue) {
          status = "new";
        } else if (daysSinceLastEntry !== null) {
          if (daysSinceLastEntry > 30) {
            status = "critical"; // Plus de 30 jours
          } else if (daysSinceLastEntry > 7) {
            status = "warning"; // Plus de 7 jours
          }
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
          daysSinceLastEntry,
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

    // Calculer les totaux pour le footer
    const totals = {
      totalRevenue: dashboardData.reduce(
        (sum, item) => sum + item.totalRevenue,
        0
      ),
      totalMandates: dashboardData.length,
      activeMandates: dashboardData.filter((item) => item.status === "active")
        .length,
      outdatedMandates: dashboardData.filter(
        (item) =>
          item.daysSinceLastEntry !== null && item.daysSinceLastEntry > 7
      ).length,
      dailyTotals: {} as Record<string, number>,
    };

    // Calculer les totaux par jour
    dateColumns.forEach((dateKey) => {
      totals.dailyTotals[dateKey] = dashboardData.reduce((sum, item) => {
        const value = item.values[dateKey];
        return sum + (value ? parseFloat(value.replace(/[^\d.-]/g, "")) : 0);
      }, 0);
    });

    // Générer les labels des colonnes avec jour de la semaine
    const columnLabels = dateColumns.map((dateKey) => {
      const date = new Date(dateKey);
      const dayNames = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
      const dayName = dayNames[date.getDay()];
      const formattedDate = formatDateShort(date);
      return {
        key: dateKey,
        label: `${dayName} ${formattedDate}`,
      };
    });

    return NextResponse.json({
      data: dashboardData,
      totals,
      columnLabels,
      meta: {
        dateRange: {
          start: dateColumns[0],
          end: dateColumns[dateColumns.length - 1],
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

// 🔧 NOUVELLES FONCTIONS: Formatage amélioré des dates
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

// 🔧 NOUVELLE FONCTION: Formatage détaillé de la dernière saisie
function formatDateWithDetails(date: Date): string {
  const now = new Date();
  const timeDiff = now.getTime() - date.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  const formattedDate = date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (daysDiff === 0) {
    return `Aujourd'hui (${formattedDate})`;
  } else if (daysDiff === 1) {
    return `Hier (${formattedDate})`;
  } else if (daysDiff <= 7) {
    return `Il y a ${daysDiff} jours (${formattedDate})`;
  } else if (daysDiff <= 30) {
    return `Il y a ${daysDiff} jours (${formattedDate})`;
  } else {
    const weeksDiff = Math.floor(daysDiff / 7);
    const monthsDiff = Math.floor(daysDiff / 30);

    if (monthsDiff >= 1) {
      return `Il y a ${monthsDiff} mois (${formattedDate})`;
    } else {
      return `Il y a ${weeksDiff} semaines (${formattedDate})`;
    }
  }
}
