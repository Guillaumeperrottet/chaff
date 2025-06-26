import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface BestDayGlobalResponse {
  bestDay: {
    date: string;
    formattedDate: string;
    totalValue: number;
    formattedValue: string;
  } | null;
  meta: {
    totalDaysAnalyzed: number;
    dateRange: {
      start: string;
      end: string;
    };
    generatedAt: string;
  };
}

export async function GET() {
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

    // Récupérer tous les mandats actifs de l'organisation
    const mandates = await prisma.mandate.findMany({
      where: {
        organizationId: userWithOrg.Organization.id,
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (mandates.length === 0) {
      return NextResponse.json({
        bestDay: null,
        meta: {
          totalDaysAnalyzed: 0,
          dateRange: {
            start: "N/A",
            end: "N/A",
          },
          generatedAt: new Date().toISOString(),
        },
      });
    }

    const mandateIds = mandates.map((m) => m.id);

    // Récupérer TOUTES les données CA historiques pour ces mandats
    const allDayValues = await prisma.dayValue.findMany({
      where: {
        mandateId: {
          in: mandateIds,
        },
      },
      select: {
        date: true,
        value: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    if (allDayValues.length === 0) {
      return NextResponse.json({
        bestDay: null,
        meta: {
          totalDaysAnalyzed: 0,
          dateRange: {
            start: "N/A",
            end: "N/A",
          },
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Grouper par date et calculer la somme globale pour chaque jour
    const dailyTotals = new Map<string, number>();

    allDayValues.forEach((dayValue) => {
      const dateKey = dayValue.date.toISOString().split("T")[0];
      const currentTotal = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, currentTotal + dayValue.value);
    });

    // Trouver le jour avec le total le plus élevé
    let bestDay: { date: string; totalValue: number } | null = null;

    for (const [dateKey, totalValue] of dailyTotals.entries()) {
      if (!bestDay || totalValue > bestDay.totalValue) {
        bestDay = {
          date: dateKey,
          totalValue: totalValue,
        };
      }
    }

    // Formater la réponse
    const response: BestDayGlobalResponse = {
      bestDay: bestDay
        ? {
            date: bestDay.date,
            formattedDate: formatDate(bestDay.date),
            totalValue: bestDay.totalValue,
            formattedValue: formatCurrency(bestDay.totalValue),
          }
        : null,
      meta: {
        totalDaysAnalyzed: dailyTotals.size,
        dateRange: {
          start: allDayValues[0]?.date.toISOString().split("T")[0] || "N/A",
          end:
            allDayValues[allDayValues.length - 1]?.date
              .toISOString()
              .split("T")[0] || "N/A",
        },
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du meilleur jour global:",
      error
    );
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour formater la date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Fonction utilitaire pour formater la devise
function formatCurrency(value: number): string {
  try {
    // Formatage manuel avec apostrophe suisse
    if (value >= 1000) {
      const parts = value.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
      return `CHF ${integerPart}.${parts[1]}`;
    } else {
      return `CHF ${value.toFixed(2)}`;
    }
  } catch {
    // Fallback manuel
    const parts = value.toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `CHF ${integerPart}.${parts[1]}`;
  }
}
