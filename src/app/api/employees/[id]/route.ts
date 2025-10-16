import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schéma de validation pour mettre à jour un employé
const UpdateEmployeeSchema = z.object({
  employeeId: z.string().min(1, "L'ID employé est obligatoire").optional(),
  firstName: z.string().min(1, "Le prénom est obligatoire").optional(),
  lastName: z.string().min(1, "Le nom est obligatoire").optional(),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  mandateId: z.string().cuid().optional(),
  position: z.string().optional().or(z.literal("")),
  hourlyRate: z.number().min(0).optional(),
  hiredAt: z
    .string()
    .transform((str) => (str ? new Date(str) : undefined))
    .optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/employees/[id] - Récupérer un employé spécifique
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

    // Récupérer l'utilisateur avec son organizationId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Utilisateur sans organisation" },
        { status: 403 }
      );
    }

    // Récupérer l'employé SEULEMENT s'il appartient à l'organisation
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        mandate: { organizationId: user.organizationId },
      },
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
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'employé:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Mettre à jour un employé
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organizationId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Utilisateur sans organisation" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateEmployeeSchema.parse(body);

    // Vérifier que l'employé existe ET appartient à l'organisation
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        mandate: { organizationId: user.organizationId },
      },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Si l'employeeId change, vérifier l'unicité dans l'organisation
    if (
      validatedData.employeeId &&
      validatedData.employeeId !== existingEmployee.employeeId
    ) {
      const employeeWithSameId = await prisma.employee.findFirst({
        where: {
          employeeId: validatedData.employeeId,
          mandate: { organizationId: user.organizationId },
        },
      });

      if (employeeWithSameId) {
        return NextResponse.json(
          {
            error: "Un employé avec cet ID existe déjà dans votre organisation",
          },
          { status: 400 }
        );
      }
    }

    // Si le mandat change, vérifier qu'il existe ET appartient à l'organisation
    if (validatedData.mandateId) {
      const mandate = await prisma.mandate.findFirst({
        where: {
          id: validatedData.mandateId,
          organizationId: user.organizationId,
        },
      });

      if (!mandate) {
        return NextResponse.json(
          { error: "Mandat non trouvé ou non autorisé" },
          { status: 404 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: {
      employeeId?: string;
      firstName?: string;
      lastName?: string;
      email?: string | null;
      phoneNumber?: string | null;
      mandateId?: string;
      position?: string | null;
      hourlyRate?: number;
      hiredAt?: Date;
      isActive?: boolean;
    } = {};

    if (validatedData.employeeId !== undefined) {
      updateData.employeeId = validatedData.employeeId;
    }
    if (validatedData.firstName !== undefined) {
      updateData.firstName = validatedData.firstName;
    }
    if (validatedData.lastName !== undefined) {
      updateData.lastName = validatedData.lastName;
    }
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email || null;
    }
    if (validatedData.phoneNumber !== undefined) {
      updateData.phoneNumber = validatedData.phoneNumber || null;
    }
    if (validatedData.mandateId !== undefined) {
      updateData.mandateId = validatedData.mandateId;
    }
    if (validatedData.position !== undefined) {
      updateData.position = validatedData.position || null;
    }
    if (validatedData.hourlyRate !== undefined) {
      updateData.hourlyRate = validatedData.hourlyRate;
    }
    if (validatedData.hiredAt !== undefined) {
      updateData.hiredAt = validatedData.hiredAt;
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    // Mettre à jour l'employé
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour de l'employé:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Supprimer un employé
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organizationId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Utilisateur sans organisation" },
        { status: 403 }
      );
    }

    // Vérifier que l'employé existe ET appartient à l'organisation
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        mandate: { organizationId: user.organizationId },
      },
      include: {
        _count: {
          select: {
            timeEntries: true,
            payrollData: true,
          },
        },
      },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des données liées
    if (
      existingEmployee._count.timeEntries > 0 ||
      existingEmployee._count.payrollData > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer cet employé car il a des données de temps ou de paie associées. Vous pouvez le désactiver à la place.",
        },
        { status: 400 }
      );
    }

    // Supprimer l'employé
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'employé:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
