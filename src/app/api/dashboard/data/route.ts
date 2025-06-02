import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface DashboardData {
  id: string;
  name: string;
  lastEntry: string | null;
  performance: string;
  values: Record<string, string>;
  category: string;
  status: string;
  totalRevenue: number;
}

// GET /api/dashboard/data - Récupérer les données du tableau de bord principal
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
          take: 10, // Les 10 dernières valeurs pour calculer la performance
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
        // Récupérer les valeurs pour les 7 derniers jours
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

        // Calculer la performance (record)
        const maxValue =
          mandate.dayValues.length > 0
            ? Math.max(...mandate.dayValues.map((v) => v.value))
            : 0;

        const maxValueDate = mandate.dayValues.find(
          (v) => v.value === maxValue
        )?.date;
        const performance =
          maxValue > 0
            ? `${formatCurrency(maxValue)} / ${formatDate(maxValueDate || new Date())}`
            : "Aucune donnée";

        // Déterminer le statut
        let status = "active";
        if (!mandate.active) {
          status = "inactive";
        } else if (mandate.dayValues.length === 0) {
          status = "new";
        } else {
          // Vérifier si la dernière saisie date de plus de 7 jours
          const lastEntryDate = mandate.lastEntry
            ? new Date(mandate.lastEntry)
            : null;
          if (lastEntryDate) {
            const daysSinceLastEntry = Math.floor(
              (today.getTime() - lastEntryDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            if (daysSinceLastEntry > 7) {
              status = "warning";
            }
          }
        }

        return {
          id: mandate.id,
          name: mandate.name,
          lastEntry: mandate.lastEntry ? formatDate(mandate.lastEntry) : null,
          performance,
          values,
          category:
            mandate.group === "HEBERGEMENT" ? "Hébergement" : "Restauration",
          status,
          totalRevenue: mandate.totalRevenue,
        };
      })
    );

    // Calculer les totaux pour le footer
    const totals = {
      totalRevenue: dashboardData.reduce(
        (sum, item) => sum + item.totalRevenue,
        0
      ),
      totalMandates: dashboardData.length,
      activeMandates: dashboardData.filter((item) => item.status === "active")
        .length,
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
