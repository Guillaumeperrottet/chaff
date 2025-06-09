import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasFeatureAccess } from "@/lib/access-control";

// Schéma de validation pour créer un employé
const CreateEmployeeSchema = z.object({
  employeeId: z.string().min(1, "L'ID employé est obligatoire"),
  firstName: z.string().min(1, "Le prénom est obligatoire"),
  lastName: z.string().min(1, "Le nom est obligatoire"),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  mandateId: z.string().cuid(),
  position: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  hiredAt: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
});

// GET /api/employees - Récupérer tous les employés
export async function GET(request: NextRequest) {
  try {
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
    const mandateId = searchParams.get("mandateId");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construire les filtres
    const where: {
      mandateId?: string;
      isActive?: boolean;
    } = {};
    if (mandateId) {
      where.mandateId = mandateId;
    }
    if (!includeInactive) {
      where.isActive = true;
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        mandate: {
          select: {
            id: true,
            name: true,
            group: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
            payrollData: true,
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: limit,
      skip: offset,
    });

    // Compter le total pour la pagination
    const total = await prisma.employee.count({ where });

    return NextResponse.json({
      data: employees,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des employés:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/employees - Créer un nouvel employé
export async function POST(request: NextRequest) {
  try {
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
    const validatedData = CreateEmployeeSchema.parse(body);

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id: validatedData.mandateId },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Vérifier l'unicité de l'employeeId
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId: validatedData.employeeId },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: "Un employé avec cet ID existe déjà" },
        { status: 400 }
      );
    }

    // Créer l'employé
    const employee = await prisma.employee.create({
      data: validatedData,
      include: {
        mandate: {
          select: {
            id: true,
            name: true,
            group: true,
          },
        },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de l'employé:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
