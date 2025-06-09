import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasFeatureAccess } from "@/lib/access-control";

// Schéma de validation pour la saisie manuelle
const ManualPayrollSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12),
  grossAmount: z.number().min(0),
  socialCharges: z.number().min(0).optional(),
  employeeCount: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/mandats/[id]/payroll - Récupérer les données de masse salariale
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

    const hasPayrollAccess = await hasFeatureAccess(session.user.id, "payroll");
    if (!hasPayrollAccess) {
      return NextResponse.json(
        {
          error: "Accès refusé",
          message: "L'accès à la masse salariale nécessite un plan Premium",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const startMonth = parseInt(searchParams.get("startMonth") || "1");
    const endMonth = parseInt(searchParams.get("endMonth") || "12");

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id },
      select: { id: true, name: true, group: true },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Récupérer les saisies manuelles pour la période
    const manualEntries = await prisma.manualPayrollEntry.findMany({
      where: {
        mandateId: id,
        year,
        month: {
          gte: startMonth,
          lte: endMonth,
        },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    // Récupérer les données CA correspondantes pour calculer les ratios
    const revenueData = await Promise.all(
      Array.from({ length: endMonth - startMonth + 1 }, (_, i) => {
        const month = startMonth + i;
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);

        return prisma.dayValue
          .aggregate({
            where: {
              mandateId: id,
              date: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            _sum: { value: true },
            _count: { _all: true },
          })
          .then((result) => ({
            month,
            totalRevenue: result._sum.value || 0,
            entryCount: result._count._all,
          }));
      })
    );

    // Construire la réponse avec ratios
    const payrollSummary = Array.from(
      { length: endMonth - startMonth + 1 },
      (_, i) => {
        const month = startMonth + i;
        const manualEntry = manualEntries.find((e) => e.month === month);
        const revenue = revenueData[i];

        const payrollCost = manualEntry?.totalCost || 0;
        const ratio =
          revenue.totalRevenue > 0
            ? (payrollCost / revenue.totalRevenue) * 100
            : null;

        return {
          year,
          month,
          monthName: new Date(year, month - 1, 1).toLocaleDateString("fr-CH", {
            month: "long",
          }),
          manualEntry,
          revenue: revenue.totalRevenue,
          revenueEntries: revenue.entryCount,
          payrollToRevenueRatio: ratio,
          hasData: !!manualEntry || revenue.totalRevenue > 0,
        };
      }
    );

    return NextResponse.json({
      mandate,
      year,
      period: { startMonth, endMonth },
      summary: payrollSummary,
      totals: {
        totalPayrollCost: manualEntries.reduce(
          (sum, e) => sum + e.totalCost,
          0
        ),
        totalRevenue: revenueData.reduce((sum, r) => sum + r.totalRevenue, 0),
        averageRatio: payrollSummary
          .filter((s) => s.payrollToRevenueRatio !== null)
          .reduce(
            (sum, s, _, arr) => sum + s.payrollToRevenueRatio! / arr.length,
            0
          ),
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

// POST /api/mandats/[id]/payroll - Créer/mettre à jour une saisie manuelle
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const hasPayrollAccess = await hasFeatureAccess(session.user.id, "payroll");
    if (!hasPayrollAccess) {
      return NextResponse.json(
        {
          error: "Accès refusé",
          message: "L'accès à la masse salariale nécessite un plan Premium",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = ManualPayrollSchema.parse(body);

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Calculer le coût total si les charges sociales ne sont pas fournies
    const socialCharges =
      validatedData.socialCharges ?? validatedData.grossAmount * 0.22; // 22% par défaut
    const totalCost = validatedData.grossAmount + socialCharges;

    // Créer ou mettre à jour l'entrée
    const payrollEntry = await prisma.manualPayrollEntry.upsert({
      where: {
        mandateId_year_month: {
          mandateId: id,
          year: validatedData.year,
          month: validatedData.month,
        },
      },
      update: {
        grossAmount: validatedData.grossAmount,
        socialCharges,
        totalCost,
        employeeCount: validatedData.employeeCount,
        notes: validatedData.notes,
        updatedAt: new Date(),
      },
      create: {
        mandateId: id,
        year: validatedData.year,
        month: validatedData.month,
        grossAmount: validatedData.grossAmount,
        socialCharges,
        totalCost,
        employeeCount: validatedData.employeeCount,
        notes: validatedData.notes,
        createdBy: session.user.id,
      },
      include: {
        mandate: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(payrollEntry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/mandats/[id]/payroll/[year]/[month] - Supprimer une saisie
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "0");
    const month = parseInt(searchParams.get("month") || "0");

    if (!year || !month) {
      return NextResponse.json(
        { error: "Année et mois requis" },
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

    const hasPayrollAccess = await hasFeatureAccess(session.user.id, "payroll");
    if (!hasPayrollAccess) {
      return NextResponse.json(
        {
          error: "Accès refusé",
          message: "L'accès à la masse salariale nécessite un plan Premium",
        },
        { status: 403 }
      );
    }

    // Supprimer l'entrée
    await prisma.manualPayrollEntry.deleteMany({
      where: {
        mandateId: id,
        year,
        month,
      },
    });

    return NextResponse.json({ message: "Saisie supprimée avec succès" });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
