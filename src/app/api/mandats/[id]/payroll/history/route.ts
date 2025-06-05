import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/mandats/[id]/payroll/history - Récupérer l'historique des imports
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const year = searchParams.get("year");

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id },
      select: { id: true, name: true, group: true },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }
    // Construire les filtres
    const where: Prisma.PayrollImportHistoryWhereInput = { mandateId: id };
    if (year) {
      where.period = {
        startsWith: year,
      };
    }

    // Récupérer l'historique des imports
    const imports = await prisma.payrollImportHistory.findMany({
      where,
      include: {
        employeeEntries: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            totalHours: true,
            hourlyRate: true,
            grossAmount: true,
            rateSource: true,
            employeeFound: true,
          },
        },
        _count: {
          select: {
            employeeEntries: true,
          },
        },
      },
      orderBy: { importDate: "desc" },
      take: limit,
      skip: offset,
    });

    // Calculer les statistiques globales
    const totalImports = await prisma.payrollImportHistory.count({ where });

    const stats = await prisma.payrollImportHistory.aggregate({
      where,
      _sum: {
        totalEmployees: true,
        totalHours: true,
        totalGrossAmount: true,
        totalCost: true,
      },
      _avg: {
        totalHours: true,
        totalCost: true,
      },
    });

    // Récupérer les données par mois pour le graphique
    const monthlyData = await prisma.payrollImportHistory.groupBy({
      by: ["period"],
      where,
      _sum: {
        totalEmployees: true,
        totalHours: true,
        totalCost: true,
      },
      orderBy: {
        period: "asc",
      },
    });

    // Calculer l'évolution mois par mois
    const evolutionData = monthlyData.map((month, index) => {
      const previousMonth = index > 0 ? monthlyData[index - 1] : null;
      const costEvolution = previousMonth
        ? (((month._sum.totalCost || 0) - (previousMonth._sum.totalCost || 0)) /
            (previousMonth._sum.totalCost || 1)) *
          100
        : null;

      return {
        period: month.period,
        monthName: formatPeriodToMonth(month.period),
        totalEmployees: month._sum.totalEmployees || 0,
        totalHours: month._sum.totalHours || 0,
        totalCost: month._sum.totalCost || 0,
        costEvolution: costEvolution
          ? parseFloat(costEvolution.toFixed(1))
          : null,
      };
    });

    return NextResponse.json({
      mandate,
      imports: imports.map((imp) => ({
        ...imp,
        periodFormatted: formatPeriodToMonth(imp.period),
      })),
      pagination: {
        total: totalImports,
        limit,
        offset,
        hasMore: offset + limit < totalImports,
      },
      statistics: {
        totalImports,
        totalEmployees: stats._sum.totalEmployees || 0,
        totalHours: stats._sum.totalHours || 0,
        totalAmount: stats._sum.totalGrossAmount || 0,
        totalCost: stats._sum.totalCost || 0,
        averageHoursPerImport: stats._avg.totalHours || 0,
        averageCostPerImport: stats._avg.totalCost || 0,
      },
      evolutionData,
      meta: {
        year: year || "all",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/mandats/[id]/payroll/history/[importId] - Supprimer un import
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const importId = searchParams.get("importId");

    if (!importId) {
      return NextResponse.json(
        { error: "ID d'import requis" },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'import appartient au bon mandat
    const importHistory = await prisma.payrollImportHistory.findFirst({
      where: {
        id: importId,
        mandateId: id,
      },
    });

    if (!importHistory) {
      return NextResponse.json({ error: "Import non trouvé" }, { status: 404 });
    }

    // Supprimer l'import et ses données (cascade automatique)
    await prisma.payrollImportHistory.delete({
      where: { id: importId },
    });

    return NextResponse.json({
      message: "Import supprimé avec succès",
      deletedImport: {
        id: importId,
        period: importHistory.period,
        filename: importHistory.filename,
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour formater la période
function formatPeriodToMonth(period: string): string {
  try {
    const [year, month] = period.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("fr-CH", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return period;
  }
}
