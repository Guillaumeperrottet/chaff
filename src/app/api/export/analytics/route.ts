// src/app/api/export/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface DayValueWithMandate {
  id: string;
  date: Date;
  value: number;
  mandateId: string;
  createdAt: Date;
  mandate: {
    id: string;
    name: string;
    group: string;
  };
}

interface MandateWithStats {
  id: string;
  name: string;
  group: string;
  dayValues: {
    id: string;
    date: Date;
    value: number;
    mandateId: string;
    createdAt: Date;
  }[];
  _count: {
    dayValues: number;
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
    const period = searchParams.get("period") || "30";
    const format = searchParams.get("format") || "csv";

    // Calculer les dates
    const now = new Date();
    const daysAgo = parseInt(period);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Récupérer les données complètes
    const dayValues = await prisma.dayValue.findMany({
      where: {
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        mandate: {
          select: {
            id: true,
            name: true,
            group: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { mandate: { name: "asc" } }],
    });

    const mandateStats = await prisma.mandate.findMany({
      include: {
        dayValues: {
          where: {
            date: {
              gte: startDate,
              lte: now,
            },
          },
        },
        _count: {
          select: { dayValues: true },
        },
      },
    });

    if (format === "csv") {
      return generateCSVReport(dayValues, mandateStats, startDate, now);
    } else {
      return generateJSONReport(dayValues, mandateStats, startDate, now);
    }
  } catch (error) {
    console.error("Erreur lors de l'export analytics:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}

function generateCSVReport(
  dayValues: DayValueWithMandate[],
  mandateStats: MandateWithStats[],
  startDate: Date,
  endDate: Date
) {
  const lines: string[] = [];

  lines.push(`# Période: ${formatDate(startDate)} - ${formatDate(endDate)}`);
  lines.push(`# Généré le: ${formatDateTime(new Date())}`);
  lines.push("");

  // Résumé exécutif
  const totalRevenue = dayValues.reduce((sum, dv) => sum + dv.value, 0);
  const uniqueMandates = new Set(dayValues.map((dv) => dv.mandateId)).size;

  lines.push("## RÉSUMÉ EXÉCUTIF");
  lines.push("Métrique,Valeur");
  lines.push(`Revenue Total,${formatCurrency(totalRevenue)}`);
  lines.push(`Nombre de Saisies,${dayValues.length}`);
  lines.push(`Mandats Actifs,${uniqueMandates}`);
  lines.push(
    `Moyenne par Saisie,${formatCurrency(dayValues.length > 0 ? totalRevenue / dayValues.length : 0)}`
  );
  lines.push("");

  // Performance par mandat
  lines.push("## PERFORMANCE PAR MANDAT");
  lines.push(
    "Mandat,Groupe,Revenue Total,Nb Saisies,Moyenne par Saisie,Dernière Saisie"
  );

  mandateStats.forEach((mandate) => {
    const mandateRevenue = mandate.dayValues.reduce(
      (
        sum: number,
        dv: {
          id: string;
          date: Date;
          value: number;
          mandateId: string;
          createdAt: Date;
        }
      ) => sum + dv.value,
      0
    );
    const mandateValueCount = mandate.dayValues.length;
    const averagePerValue =
      mandateValueCount > 0 ? mandateRevenue / mandateValueCount : 0;
    const lastEntry =
      mandate.dayValues.length > 0
        ? mandate.dayValues.reduce(
            (
              latest: {
                id: string;
                date: Date;
                value: number;
                mandateId: string;
                createdAt: Date;
              },
              dv: {
                id: string;
                date: Date;
                value: number;
                mandateId: string;
                createdAt: Date;
              }
            ) => (dv.date > latest.date ? dv : latest)
          ).date
        : null;

    lines.push(
      [
        `"${mandate.name}"`,
        mandate.group === "HEBERGEMENT" ? "Hébergement" : "Restauration",
        formatCurrency(mandateRevenue),
        mandateValueCount,
        formatCurrency(averagePerValue),
        lastEntry ? formatDate(lastEntry) : "Jamais",
      ].join(",")
    );
  });

  lines.push("");

  // Détail des saisies
  lines.push("## DÉTAIL DES SAISIES");
  lines.push("Date,Mandat,Groupe,Montant,Date de Saisie");

  dayValues.forEach((dv) => {
    lines.push(
      [
        formatDate(dv.date),
        `"${dv.mandate.name}"`,
        dv.mandate.group === "HEBERGEMENT" ? "Hébergement" : "Restauration",
        formatCurrency(dv.value),
        formatDateTime(dv.createdAt),
      ].join(",")
    );
  });

  lines.push("");

  // Analyse par groupe
  const hebergementValues = dayValues.filter(
    (dv) => dv.mandate.group === "HEBERGEMENT"
  );
  const restaurationValues = dayValues.filter(
    (dv) => dv.mandate.group === "RESTAURATION"
  );

  lines.push("## ANALYSE PAR GROUPE");
  lines.push("Groupe,Revenue,Nb Saisies,Moyenne");
  lines.push(
    [
      "Hébergement",
      formatCurrency(hebergementValues.reduce((sum, dv) => sum + dv.value, 0)),
      hebergementValues.length,
      formatCurrency(
        hebergementValues.length > 0
          ? hebergementValues.reduce((sum, dv) => sum + dv.value, 0) /
              hebergementValues.length
          : 0
      ),
    ].join(",")
  );
  lines.push(
    [
      "Restauration",
      formatCurrency(restaurationValues.reduce((sum, dv) => sum + dv.value, 0)),
      restaurationValues.length,
      formatCurrency(
        restaurationValues.length > 0
          ? restaurationValues.reduce((sum, dv) => sum + dv.value, 0) /
              restaurationValues.length
          : 0
      ),
    ].join(",")
  );

  // Créer le contenu CSV
  const csvContent = lines.join("\n");

  // Ajouter BOM UTF-8 pour Excel
  const bom = "\uFEFF";
  const finalContent = bom + csvContent;

  // Nom du fichier
  const filename = `analytics_chaff_${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}.csv`;

  return new NextResponse(finalContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function generateJSONReport(
  dayValues: DayValueWithMandate[],
  mandateStats: MandateWithStats[],
  startDate: Date,
  endDate: Date
) {
  const totalRevenue = dayValues.reduce((sum, dv) => sum + dv.value, 0);
  const uniqueMandates = new Set(dayValues.map((dv) => dv.mandateId)).size;

  const report = {
    metadata: {
      end: endDate.toISOString(),
      metadata: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
        ),
        format: "json",
      },
      totalValues: dayValues.length,
      uniqueMandates,
      averagePerValue:
        dayValues.length > 0 ? totalRevenue / dayValues.length : 0,
    },
    mandatePerformance: mandateStats.map((mandate) => {
      const mandateRevenue = mandate.dayValues.reduce(
        (
          sum: number,
          dv: {
            id: string;
            date: Date;
            value: number;
            mandateId: string;
            createdAt: Date;
          }
        ) => sum + dv.value,
        0
      );
      const mandateValueCount = mandate.dayValues.length;

      return {
        id: mandate.id,
        name: mandate.name,
        group: mandate.group,
        revenue: mandateRevenue,
        valueCount: mandateValueCount,
        averagePerValue:
          mandateValueCount > 0 ? mandateRevenue / mandateValueCount : 0,
        lastEntry:
          mandate.dayValues.length > 0
            ? mandate.dayValues.reduce((latest, dv) =>
                dv.date > latest.date ? dv : latest
              ).date
            : null,
      };
    }),
    groupAnalysis: {
      hebergement: {
        values: dayValues.filter((dv) => dv.mandate.group === "HEBERGEMENT"),
        totalRevenue: dayValues
          .filter((dv) => dv.mandate.group === "HEBERGEMENT")
          .reduce((sum, dv) => sum + dv.value, 0),
      },
      restauration: {
        values: dayValues.filter((dv) => dv.mandate.group === "RESTAURATION"),
        totalRevenue: dayValues
          .filter((dv) => dv.mandate.group === "RESTAURATION")
          .reduce((sum, dv) => sum + dv.value, 0),
      },
    },
    detailedValues: dayValues.map((dv) => ({
      id: dv.id,
      date: dv.date,
      value: dv.value,
      mandate: {
        id: dv.mandate.id,
        name: dv.mandate.name,
        group: dv.mandate.group,
      },
      createdAt: dv.createdAt,
    })),
  };

  const filename = `analytics_chaff_${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}.json`;

  return new NextResponse(JSON.stringify(report, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
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
    year: "numeric",
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
