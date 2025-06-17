import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// Types pour les données CA par types
interface TypeBreakdown {
  id: string;
  name: string;
  label: string;
  totalRevenue: number;
  totalPayroll: number;
  contribution: number;
  mandatesCount: number;
}

interface DayCAData {
  date: string;
  value: number;
  formattedDate: string;
}

interface PayrollData {
  year: number;
  month: number;
  grossAmount: number;
  socialCharges: number;
  totalCost: number;
  employeeCount?: number;
}

interface PeriodData {
  year: number;
  month: number;
  label: string;
  totalValue: number;
  dailyValues: DayCAData[];
  previousYearDailyValues: DayCAData[];
  averageDaily: number;
  daysWithData: number;
  cumulativeTotal?: number;
  cumulativePayroll?: number;
  cumulativePreviousYearRevenue?: number;
  cumulativePreviousYearPayroll?: number;
  cumulativeRevenueGrowth?: number | null;
  cumulativePayrollGrowth?: number | null;
  payrollData?: PayrollData;
  payrollToRevenueRatio?: number;
  yearOverYear: {
    previousYearRevenue: number;
    previousYearPayroll?: number;
    revenueGrowth: number | null;
    payrollGrowth: number | null;
  };
}

interface TypesCAResponse {
  organization: {
    name: string;
    totalTypes: number;
  };
  periods: PeriodData[];
  summary: {
    totalPeriods: number;
    grandTotal: number;
    averagePerPeriod: number;
    bestPeriod: PeriodData;
    worstPeriod: PeriodData;
    totalPayrollCost: number;
    globalPayrollRatio: number | null;
    yearOverYearGrowth: {
      revenue: number | null;
      payroll: number | null;
    };
    typesBreakdown: TypeBreakdown[];
  };
  meta: {
    year: number;
    startMonth: number;
    period: string;
    generatedAt: string;
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

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const startMonth = parseInt(searchParams.get("startMonth") || "1");
    const endMonth = parseInt(searchParams.get("endMonth") || "12");
    const period = searchParams.get("period") || "6months";
    const selectedType = searchParams.get("type"); // Nouveau paramètre pour le type sélectionné

    console.log("🔍 CA Types - Paramètres reçus:", {
      year,
      startMonth,
      endMonth,
      period,
      selectedType,
    });

    // Récupérer tous les mandats actifs (filtrer par type si spécifié)
    const mandateFilter: {
      organizationId: string;
      active: boolean;
      group?: string;
    } = {
      organizationId: userWithOrg.Organization.id,
      active: true,
    };

    // Si un type spécifique est demandé, filtrer sur ce type
    if (selectedType) {
      mandateFilter.group = selectedType;
    }

    const mandates = await prisma.mandate.findMany({
      where: mandateFilter,
      select: {
        id: true,
        name: true,
        group: true,
      },
    });

    // Si on filtre par type spécifique, utiliser seulement ce type
    const typeGroups = selectedType
      ? { [selectedType]: mandates }
      : mandates.reduce(
          (groups, mandate) => {
            if (!groups[mandate.group]) {
              groups[mandate.group] = [];
            }
            groups[mandate.group].push(mandate);
            return groups;
          },
          {} as Record<string, typeof mandates>
        );

    console.log("📊 Types traités:", Object.keys(typeGroups));
    console.log("📊 Nombre de mandats:", mandates.length);

    // Créer des données de test simples
    const testData: PeriodData[] = [];

    for (let month = startMonth; month <= endMonth; month++) {
      const monthLabel = new Date(year, month - 1).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });

      // Données de test
      const totalValue = Math.random() * 100000 + 50000;
      const previousYearValue = Math.random() * 80000 + 40000;

      testData.push({
        year,
        month,
        label: monthLabel,
        totalValue,
        dailyValues: [],
        previousYearDailyValues: [],
        averageDaily: totalValue / 30,
        daysWithData: 30,
        yearOverYear: {
          previousYearRevenue: previousYearValue,
          revenueGrowth:
            ((totalValue - previousYearValue) / previousYearValue) * 100,
          payrollGrowth: null,
        },
      });
    }

    // Calculer les breakdown par types
    const typesBreakdown: TypeBreakdown[] = Object.entries(typeGroups).map(
      ([typeId, mandates]) => {
        const typeTotalRevenue = Math.random() * 200000 + 100000;

        return {
          id: typeId,
          name: typeId,
          label: typeId,
          totalRevenue: typeTotalRevenue,
          totalPayroll: typeTotalRevenue * 0.3,
          contribution: Math.random() * 50 + 25,
          mandatesCount: mandates.length,
        };
      }
    );

    const grandTotal = testData.reduce(
      (sum, period) => sum + period.totalValue,
      0
    );
    const totalPayrollCost = typesBreakdown.reduce(
      (sum, type) => sum + type.totalPayroll,
      0
    );

    const response: TypesCAResponse = {
      organization: {
        name: userWithOrg.Organization.name,
        totalTypes: Object.keys(typeGroups).length,
      },
      periods: testData,
      summary: {
        totalPeriods: testData.length,
        grandTotal,
        averagePerPeriod: grandTotal / testData.length,
        bestPeriod: testData.reduce((best, current) =>
          current.totalValue > best.totalValue ? current : best
        ),
        worstPeriod: testData.reduce((worst, current) =>
          current.totalValue < worst.totalValue ? current : worst
        ),
        totalPayrollCost,
        globalPayrollRatio:
          grandTotal > 0 ? (totalPayrollCost / grandTotal) * 100 : null,
        yearOverYearGrowth: {
          revenue: Math.random() * 20 - 10, // Entre -10% et +10%
          payroll: Math.random() * 15 - 5, // Entre -5% et +10%
        },
        typesBreakdown,
      },
      meta: {
        year,
        startMonth,
        period,
        generatedAt: new Date().toISOString(),
      },
    };

    console.log("✅ CA Types - Réponse générée avec succès");
    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données CA par types:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
