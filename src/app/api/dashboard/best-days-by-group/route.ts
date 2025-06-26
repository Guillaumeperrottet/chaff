import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface BestDayByGroup {
  date: string;
  formattedDate: string;
  totalValue: number;
  formattedValue: string;
}

interface BestDaysByGroupResponse {
  bestDaysByGroup: Record<string, BestDayByGroup | null>;
  meta: {
    totalGroupsAnalyzed: number;
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

    // Récupérer tous les mandats actifs de l'organisation avec leurs groupes/types
    const mandates = await prisma.mandate.findMany({
      where: {
        organizationId: userWithOrg.Organization.id,
        active: true,
      },
      select: {
        id: true,
        group: true,
        establishmentTypeId: true,
      },
    });

    if (mandates.length === 0) {
      return NextResponse.json({
        bestDaysByGroup: {},
        meta: {
          totalGroupsAnalyzed: 0,
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
        mandateId: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    if (allDayValues.length === 0) {
      return NextResponse.json({
        bestDaysByGroup: {},
        meta: {
          totalGroupsAnalyzed: 0,
          dateRange: {
            start: "N/A",
            end: "N/A",
          },
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Créer une map pour associer mandateId -> groupe
    const mandateToGroup = new Map<string, string>();
    mandates.forEach((mandate) => {
      // Déterminer le groupe/type de l'établissement
      let groupKey = "";
      if (mandate.establishmentTypeId) {
        // Nouveau système avec types personnalisés - utiliser directement l'ID du type
        groupKey = mandate.establishmentTypeId;
      } else {
        // Ancien système avec groupes par défaut - utiliser les mêmes clés que le frontend
        if (
          mandate.group === "HEBERGEMENT" ||
          mandate.group === "Hébergement"
        ) {
          groupKey = "hebergement";
        } else if (
          mandate.group === "RESTAURATION" ||
          mandate.group === "Restauration"
        ) {
          groupKey = "restauration";
        } else {
          groupKey = mandate.group || "autre";
        }
      }
      mandateToGroup.set(mandate.id, groupKey);
    });

    // Grouper les données par groupe et date
    const groupDailyTotals = new Map<string, Map<string, number>>();

    allDayValues.forEach((dayValue) => {
      const dateKey = dayValue.date.toISOString().split("T")[0];
      const groupKey = mandateToGroup.get(dayValue.mandateId) || "autre";

      if (!groupDailyTotals.has(groupKey)) {
        groupDailyTotals.set(groupKey, new Map());
      }

      const groupDaily = groupDailyTotals.get(groupKey)!;
      const currentTotal = groupDaily.get(dateKey) || 0;
      groupDaily.set(dateKey, currentTotal + dayValue.value);
    });

    // Trouver le meilleur jour pour chaque groupe
    const bestDaysByGroup: Record<string, BestDayByGroup | null> = {};

    for (const [groupKey, dailyTotals] of groupDailyTotals.entries()) {
      let bestDay: { date: string; totalValue: number } | null = null;

      for (const [dateKey, totalValue] of dailyTotals.entries()) {
        if (!bestDay || totalValue > bestDay.totalValue) {
          bestDay = {
            date: dateKey,
            totalValue: totalValue,
          };
        }
      }

      bestDaysByGroup[groupKey] = bestDay
        ? {
            date: bestDay.date,
            formattedDate: formatDate(bestDay.date),
            totalValue: bestDay.totalValue,
            formattedValue: formatCurrency(bestDay.totalValue),
          }
        : null;
    }

    // Formater la réponse
    const response: BestDaysByGroupResponse = {
      bestDaysByGroup,
      meta: {
        totalGroupsAnalyzed: groupDailyTotals.size,
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
      "Erreur lors de la récupération des meilleurs jours par groupe:",
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
