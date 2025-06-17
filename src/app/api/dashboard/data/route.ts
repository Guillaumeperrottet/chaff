import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface DashboardData {
  id: string;
  name: string;
  lastEntry: string | null;
  daysSinceLastEntry: number | null;
  performance: string;
  values: Record<string, string>;
  category: string;
  status: string;
  totalRevenue: number;
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

    // ✅ NOUVEAU: Récupérer l'utilisateur avec son organizationId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // ✅ NOUVEAU: Récupérer les types d'établissement
    const establishmentTypes = await prisma.establishmentType.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        label: true,
      },
    });

    // Créer un map pour les types
    const typeMap = new Map<string, string>();
    establishmentTypes.forEach((type) => {
      typeMap.set(type.id, type.label);
    });

    const mandates = await prisma.mandate.findMany({
      where: {
        organizationId: user.organizationId,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        _count: {
          select: { dayValues: true },
        },
        establishmentType: {
          select: {
            id: true,
            label: true,
          },
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
        // Récupérer la dernière valeur saisie (par date de création, pas par date CA)
        const lastDayValue = await prisma.dayValue.findFirst({
          where: { mandateId: mandate.id },
          orderBy: { createdAt: "desc" }, // Trier par date de création
          select: {
            date: true,
            value: true,
            createdAt: true,
          },
        });

        // Récupérer les valeurs pour les colonnes (période affichée)
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

        // SOLUTION: Stocker les valeurs avec un formatage simple sans apostrophes
        const values: Record<string, string> = {};
        dateColumns.forEach((dateKey) => {
          const value = valuesByDate.get(dateKey);
          if (value && value > 0) {
            // Format simple avec virgule décimale seulement (pas d'apostrophes pour les milliers)
            values[dateKey] = value.toFixed(2).replace(".", ",");
          } else {
            values[dateKey] = "0,00";
          }
        });

        // Utiliser createdAt pour la dernière saisie (date réelle de création)
        const lastEntryFormatted = lastDayValue
          ? formatDateSimple(lastDayValue.createdAt)
          : null;

        // Calculer les jours depuis la dernière saisie
        let daysSinceLastEntry = null;
        if (lastDayValue) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const lastSaisieDate = new Date(lastDayValue.createdAt);
          lastSaisieDate.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - lastSaisieDate.getTime();
          daysSinceLastEntry = Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
            ? `${formatCurrencyForDisplay(maxValue)} / ${formatDateSimple(maxValueDate || new Date())}`
            : "Aucune donnée";

        // Statut: Basé sur l'existence d'une dernière saisie
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
          daysSinceLastEntry,
          performance,
          values,
          category: (() => {
            // ✅ NOUVEAU: Utiliser le type d'établissement si disponible
            if (mandate.establishmentType) {
              return mandate.establishmentType.id;
            }
            // Fallback vers l'ancien système group
            if (mandate.group === "HEBERGEMENT") return "Hébergement";
            if (mandate.group === "RESTAURATION") return "Restauration";
            return mandate.group || "Autre";
          })(),
          status,
          totalRevenue: mandate.totalRevenue,
        };
      })
    );

    // Trier par dernière saisie (plus récente en premier)
    dashboardData.sort((a, b) => {
      if (!a.lastEntry && !b.lastEntry) return 0;
      if (!a.lastEntry) return 1;
      if (!b.lastEntry) return -1;

      try {
        const dateA = parseSimpleDate(a.lastEntry);
        const dateB = parseSimpleDate(b.lastEntry);
        return dateB.getTime() - dateA.getTime();
      } catch {
        console.error("Erreur parsing dates pour tri:", {
          a: a.lastEntry,
          b: b.lastEntry,
        });
        return 0;
      }
    });

    // ✅ MODIFIÉ: Calculer les totaux côté serveur avec support des nouveaux types
    const totals = {
      totalRevenue: dashboardData.reduce(
        (sum, item) => sum + item.totalRevenue,
        0
      ),
      totalMandates: dashboardData.length,
      activeMandates: dashboardData.filter((item) => item.status === "active")
        .length,
      dailyTotals: {} as Record<string, number>,
      subtotalsByCategory: {} as Record<string, Record<string, number>>, // ✅ Structure dynamique
    };

    // ✅ NOUVEAU: Identifier tous les types utilisés dans les données
    const usedCategories = new Set<string>();
    dashboardData.forEach((item) => {
      usedCategories.add(item.category);
    });

    // Initialiser les sous-totaux pour chaque catégorie trouvée
    usedCategories.forEach((category) => {
      totals.subtotalsByCategory[category] = {};
    });

    // ✅ MODIFIÉ: Calculer les totaux à partir des données brutes de la base
    dateColumns.forEach((dateKey) => {
      let dailyTotal = 0;
      const categoryTotals: Record<string, number> = {};

      // Initialiser les totaux pour chaque catégorie
      usedCategories.forEach((category) => {
        categoryTotals[category] = 0;
      });

      dashboardData.forEach((item) => {
        // Reconvertir la valeur formatée en nombre
        const valueStr = item.values[dateKey] || "0,00";
        const numValue = parseFloat(valueStr.replace(",", "."));

        if (!isNaN(numValue) && numValue > 0) {
          dailyTotal += numValue;
          categoryTotals[item.category] += numValue;
        }
      });

      totals.dailyTotals[dateKey] = dailyTotal;

      // Enregistrer les totaux par catégorie
      usedCategories.forEach((category) => {
        totals.subtotalsByCategory[category][dateKey] =
          categoryTotals[category];
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

// Fonctions de formatage
function formatDateSimple(date: Date): string {
  return date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function parseSimpleDate(dateStr: string): Date {
  try {
    if (dateStr.includes(".")) {
      const [day, month, year] = dateStr.split(".");
      let fullYear = parseInt(year);

      if (fullYear < 100) {
        fullYear += fullYear < 50 ? 2000 : 1900;
      }

      return new Date(Date.UTC(fullYear, parseInt(month) - 1, parseInt(day)));
    }

    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      let fullYear = parseInt(year);

      if (fullYear < 100) {
        fullYear += fullYear < 50 ? 2000 : 1900;
      }

      return new Date(Date.UTC(fullYear, parseInt(month) - 1, parseInt(day)));
    }

    return new Date(dateStr);
  } catch (error) {
    console.error("Erreur parsing date:", dateStr, error);
    return new Date(0);
  }
}

// Format pour affichage (avec apostrophes pour les milliers)
function formatCurrencyForDisplay(amount: number): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
  }).format(amount);
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

interface ColumnLabel {
  key: string;
  label: string;
}
