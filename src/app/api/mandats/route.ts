// src/app/api/mandats/route.ts - Version modifiée avec stats payroll
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { canCreateMandate } from "@/lib/subscription-limits";

// ✅ SCHÉMA DE VALIDATION AMÉLIORÉ
const CreateMandateSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(100),
  group: z.string().min(1, "Le type est obligatoire"), // ✅ Accepter string au lieu d'enum
  active: z.boolean().default(true),
});

// ✅ FONCTION POUR VALIDER LE TYPE
async function validateEstablishmentType(
  typeId: string,
  organizationId: string
) {
  // Types par défaut acceptés
  const defaultTypes = ["HEBERGEMENT", "RESTAURATION"];

  if (defaultTypes.includes(typeId)) {
    return { isValid: true, isDefault: true };
  }

  // Vérifier si c'est un type personnalisé de l'organisation
  const customType = await prisma.establishmentType.findFirst({
    where: {
      id: typeId,
      organizationId: organizationId,
      isActive: true,
    },
  });

  if (customType) {
    return { isValid: true, isDefault: false, customType };
  }

  return { isValid: false };
}

// GET /api/mandats - Récupérer tous les mandats (+ stats payroll si demandé)
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
    const includeInactive = searchParams.get("includeInactive") === "true";
    const includePayrollStats =
      searchParams.get("includePayrollStats") === "true";

    // Base query - filtrer par organisation
    const mandates = await prisma.mandate.findMany({
      where: {
        organizationId: userWithOrg.Organization.id, // ✨ Filtrer par organisation
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        _count: {
          select: { dayValues: true },
        },
      },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    });

    // Si les stats payroll ne sont pas demandées, retourner les mandats normalement
    if (!includePayrollStats) {
      return NextResponse.json(mandates);
    }

    // ===== LOGIQUE STATS MASSE SALARIALE =====

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Enrichir chaque mandat avec des stats de masse salariale
    const mandatesWithPayrollStats = await Promise.all(
      mandates.map(async (mandate) => {
        // 1. Vérifier si il y a des données de masse salariale
        const payrollEntries = await prisma.manualPayrollEntry.findMany({
          where: { mandateId: mandate.id },
          select: {
            year: true,
            month: true,
            totalCost: true,
            employeeCount: true,
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 3, // Derniers 3 mois
        });

        const hasPayrollData = payrollEntries.length > 0;
        const lastPayrollEntry = payrollEntries[0] || null;

        // 2. Calculer le ratio du mois courant
        let currentMonthRatio: number | null = null;

        if (
          lastPayrollEntry &&
          lastPayrollEntry.year === currentYear &&
          lastPayrollEntry.month === currentMonth
        ) {
          // Récupérer le CA du mois courant
          const monthStart = new Date(currentYear, currentMonth - 1, 1);
          const monthEnd = new Date(currentYear, currentMonth, 0);

          const monthlyRevenue = await prisma.dayValue.aggregate({
            where: {
              mandateId: mandate.id,
              date: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            _sum: { value: true },
          });

          const totalRevenue = monthlyRevenue._sum.value || 0;
          if (totalRevenue > 0) {
            currentMonthRatio =
              (lastPayrollEntry.totalCost / totalRevenue) * 100;
          }
        }

        // 3. Compter les employés (approximatif basé sur les données payroll)
        const employeeCount = lastPayrollEntry?.employeeCount || null;

        // 4. Date de la dernière saisie masse salariale
        const lastPayrollEntryDate = lastPayrollEntry
          ? new Date(lastPayrollEntry.year, lastPayrollEntry.month - 1, 1)
          : null;

        return {
          ...mandate,
          // Nouvelles propriétés pour la masse salariale
          hasPayrollData,
          lastPayrollEntry: lastPayrollEntryDate,
          currentMonthRatio,
          employeeCount,
        };
      })
    );

    // ===== CALCULER LE SUMMARY GLOBAL =====

    const totalMandates = mandatesWithPayrollStats.length;
    const mandatesWithData = mandatesWithPayrollStats.filter(
      (m) => m.hasPayrollData
    ).length;

    // Calculer le total d'employés (approximatif)
    const totalEmployees = mandatesWithPayrollStats.reduce(
      (sum, m) => sum + (m.employeeCount || 0),
      0
    );

    // Calculer les ratios pour le summary
    const validRatios = mandatesWithPayrollStats
      .map((m) => m.currentMonthRatio)
      .filter((ratio): ratio is number => ratio !== null);

    const averageRatio =
      validRatios.length > 0
        ? validRatios.reduce((sum, ratio) => sum + ratio, 0) /
          validRatios.length
        : null;

    // Calcul global du ratio (tous mandats confondus)
    let globalRatio: number | null = null;

    if (mandatesWithData > 0) {
      // Sommer tous les CA et toutes les masses salariales du mois courant
      const globalStats = await Promise.all(
        mandatesWithPayrollStats
          .filter((m) => m.hasPayrollData)
          .map(async (mandate) => {
            // CA du mois courant
            const monthStart = new Date(currentYear, currentMonth - 1, 1);
            const monthEnd = new Date(currentYear, currentMonth, 0);

            const [monthlyRevenue, payrollEntry] = await Promise.all([
              prisma.dayValue.aggregate({
                where: {
                  mandateId: mandate.id,
                  date: { gte: monthStart, lte: monthEnd },
                },
                _sum: { value: true },
              }),
              prisma.manualPayrollEntry.findUnique({
                where: {
                  mandateId_year_month: {
                    mandateId: mandate.id,
                    year: currentYear,
                    month: currentMonth,
                  },
                },
              }),
            ]);

            return {
              revenue: monthlyRevenue._sum.value || 0,
              payroll: payrollEntry?.totalCost || 0,
            };
          })
      );

      const totalRevenue = globalStats.reduce((sum, s) => sum + s.revenue, 0);
      const totalPayroll = globalStats.reduce((sum, s) => sum + s.payroll, 0);

      if (totalRevenue > 0 && totalPayroll > 0) {
        globalRatio = (totalPayroll / totalRevenue) * 100;
      }
    }

    const summary = {
      totalMandates,
      mandatesWithData,
      totalEmployees,
      globalRatio,
      averageRatio,
    };

    // ===== RÉPONSE FINALE =====
    return NextResponse.json({
      mandates: mandatesWithPayrollStats,
      summary,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des mandats:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/mandats - Créer un nouveau mandat avec validation des types
export async function POST(request: NextRequest) {
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

    const organizationId = userWithOrg.Organization.id;

    // Vérifier les limites de mandats
    const limitCheck = await canCreateMandate(organizationId);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          limits: {
            current: limitCheck.current,
            limit: limitCheck.limit,
            type: "mandates",
          },
          upgradeRequired: true,
          upgradeMessage:
            "Passez au plan Premium pour créer plus d'entreprises/mandats",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    console.log("📝 Données reçues pour création de mandat:", body);

    // Valider les données
    const validatedData = CreateMandateSchema.parse(body);

    console.log("✅ Données validées:", validatedData);

    // ✅ VALIDER LE TYPE D'ÉTABLISSEMENT
    const typeValidation = await validateEstablishmentType(
      validatedData.group,
      organizationId
    );

    if (!typeValidation.isValid) {
      console.log("❌ Type d'établissement invalide:", validatedData.group);
      return NextResponse.json(
        {
          error: "Type d'établissement invalide",
          providedType: validatedData.group,
          hint: "Utilisez 'HEBERGEMENT', 'RESTAURATION' ou un type personnalisé valide",
        },
        { status: 400 }
      );
    }

    console.log("✅ Type d'établissement validé:", {
      typeId: validatedData.group,
      isDefault: typeValidation.isDefault,
      customType: typeValidation.customType?.label,
    });

    // ✅ VÉRIFIER L'UNICITÉ DU NOM DANS L'ORGANISATION
    const existingMandate = await prisma.mandate.findFirst({
      where: {
        name: validatedData.name,
        organizationId: organizationId,
      },
    });

    if (existingMandate) {
      console.log(
        "❌ Mandat avec ce nom existe déjà dans l'organisation:",
        validatedData.name
      );
      return NextResponse.json(
        {
          error: "Un mandat avec ce nom existe déjà dans votre organisation",
          existingMandate: existingMandate.name,
        },
        { status: 409 }
      );
    }

    // Créer le mandat avec l'organisation
    const mandate = await prisma.mandate.create({
      data: {
        name: validatedData.name,
        group: validatedData.group, // ✅ Peut être HEBERGEMENT/RESTAURATION ou un ID de type personnalisé
        active: validatedData.active,
        organizationId: organizationId,
      },
    });

    console.log("✅ Mandat créé avec succès:", {
      id: mandate.id,
      name: mandate.name,
      group: mandate.group,
      current: limitCheck.current + 1,
      limit: limitCheck.limit || "∞",
    });

    return NextResponse.json(mandate, { status: 201 });
  } catch (error) {
    console.error("❌ Erreur lors de la création du mandat:", error);

    if (error instanceof z.ZodError) {
      console.log("❌ Erreur de validation Zod:", error.errors);
      return NextResponse.json(
        {
          error: "Données invalides",
          details: error.errors,
          receivedData: request.body,
        },
        { status: 400 }
      );
    }

    // ✅ GESTION SPÉCIFIQUE DES ERREURS PRISMA
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: "Un mandat avec ces caractéristiques existe déjà",
            code: "DUPLICATE_MANDATE",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
