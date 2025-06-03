// src/app/api/dashboard/data/route.ts - Version simplifiée
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface DashboardData {
  id: string;
  name: string;
  lastEntry: string | null; // Format simple: "01.06.25" ou null
  daysSinceLastEntry: number | null; // Nombre de jours depuis la dernière saisie
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
        const lastDayValue = await prisma.dayValue.findFirst({
          where: { mandateId: mandate.id },
          orderBy: { date: "desc" }, // Trier par date CA
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

        const values: Record<string, string> = {};
        dateColumns.forEach((dateKey) => {
          const value = valuesByDate.get(dateKey);
          values[dateKey] = value ? formatCurrency(value) : "0.00";
        });

        const lastEntryFormatted = lastDayValue
          ? formatDateSimple(lastDayValue.date) // Utiliser la date CA
          : null;

        // Calculer les jours depuis la dernière saisie (pas depuis la date CA)
        let daysSinceLastEntry = null;
        if (lastDayValue) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const lastSaisieDate = new Date(lastDayValue.createdAt);
          lastSaisieDate.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - lastSaisieDate.getTime();
          daysSinceLastEntry = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        // 🐛 DEBUG TEMPORAIRE - À retirer après vérification
        if (mandate.name === "Camping Lac") {
          console.log(`🔍 DEBUG ${mandate.name}:`);
          console.log(`  lastDayValue:`, lastDayValue);
          console.log(`  date brute:`, lastDayValue?.date);
          console.log(`  date formatée:`, lastEntryFormatted);
          console.log(`  vraies dates en DB pour ce mandat:`);

          // Voir les 3 dernières vraies dates
          const debugDates = await prisma.dayValue.findMany({
            where: { mandateId: mandate.id },
            orderBy: { date: "desc" },
            take: 3,
            select: { date: true, value: true },
          });
          debugDates.forEach((d, i) => {
            console.log(
              `    ${i + 1}. ${d.date.toISOString().split("T")[0]} (${d.value})`
            );
          });
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
            ? `${formatCurrency(maxValue)} / ${formatDateSimple(maxValueDate || new Date())}`
            : "Aucune donnée";

        // 🔥 STATUT: Basé sur l'existence d'une dernière saisie
        let status = "active";
        if (!mandate.active) {
          status = "inactive";
        } else if (!lastDayValue) {
          status = "new"; // Aucune saisie jamais
        }

        return {
          id: mandate.id,
          name: mandate.name,
          lastEntry: lastEntryFormatted,
          daysSinceLastEntry, // Ajouter cette ligne
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
      if (!a.lastEntry && !b.lastEntry) return 0;
      if (!a.lastEntry) return 1; // Les sans saisie à la fin
      if (!b.lastEntry) return -1;

      try {
        // Comparer les dates (format DD.MM.YY ou DD.MM.YYYY)
        const dateA = parseSimpleDate(a.lastEntry);
        const dateB = parseSimpleDate(b.lastEntry);
        return dateB.getTime() - dateA.getTime(); // Plus récent en premier
      } catch {
        console.error("Erreur parsing dates pour tri:", {
          a: a.lastEntry,
          b: b.lastEntry,
        });
        return 0; // En cas d'erreur, ne pas trier
      }
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

// 🔥 FONCTIONS DE FORMATAGE SIMPLIFIÉES
function formatDateSimple(date: Date): string {
  return date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit", // Format YY au lieu de YYYY
  });
}

function parseSimpleDate(dateStr: string): Date {
  try {
    // Format DD.MM.YY ou DD.MM.YYYY
    if (dateStr.includes(".")) {
      const [day, month, year] = dateStr.split(".");
      let fullYear = parseInt(year);

      // Si année sur 2 chiffres
      if (fullYear < 100) {
        fullYear += fullYear < 50 ? 2000 : 1900; // 22 = 2022, 25 = 2025, 50 = 1950
      }

      return new Date(Date.UTC(fullYear, parseInt(month) - 1, parseInt(day)));
    }

    // Format DD/MM/YY ou DD/MM/YYYY
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      let fullYear = parseInt(year);

      if (fullYear < 100) {
        fullYear += fullYear < 50 ? 2000 : 1900;
      }

      return new Date(Date.UTC(fullYear, parseInt(month) - 1, parseInt(day)));
    }

    // Fallback
    return new Date(dateStr);
  } catch (error) {
    console.error("Erreur parsing date:", dateStr, error);
    return new Date(0); // Date très ancienne en cas d'erreur
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
