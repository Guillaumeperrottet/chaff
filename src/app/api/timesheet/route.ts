import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schéma de validation pour créer une entrée de temps
const CreateTimeEntrySchema = z.object({
  employeeId: z.string().cuid(),
  mandateId: z.string().cuid(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Date invalide",
  }),
  clockIn: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Heure d'arrivée invalide",
  }),
  clockOut: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Heure de départ invalide",
  }),
  breakMinutes: z.number().min(0).max(480).default(0),
  workedHours: z.number().min(0),
  hourlyRate: z.number().min(0).optional(),
  entryType: z
    .enum(["REGULAR", "OVERTIME", "HOLIDAY", "SICK", "VACATION"])
    .default("REGULAR"),
  importSource: z.string().default("manual"),
  notes: z.string().optional(),
});

// GET /api/timesheet - Récupérer les entrées de temps
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
    const employeeId = searchParams.get("employeeId");
    const mandateId = searchParams.get("mandateId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construire les filtres
    const where: {
      employeeId?: string;
      mandateId?: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (mandateId) {
      where.mandateId = mandateId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            hourlyRate: true,
          },
        },
        mandate: {
          select: {
            id: true,
            name: true,
            group: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    });

    // Compter le total pour la pagination
    const total = await prisma.timeEntry.count({ where });

    return NextResponse.json({
      data: timeEntries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des entrées de temps:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/timesheet - Créer une nouvelle entrée de temps
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateTimeEntrySchema.parse(body);

    // Vérifier que l'employé existe
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId },
      include: { mandate: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id: validatedData.mandateId },
    });

    if (!mandate) {
      return NextResponse.json(
        { error: "Établissement non trouvé" },
        { status: 404 }
      );
    }

    // Convertir les dates
    const workDate = new Date(validatedData.date);
    const clockInTime = new Date(validatedData.clockIn);
    const clockOutTime = new Date(validatedData.clockOut);

    // Validations business
    if (clockOutTime <= clockInTime) {
      return NextResponse.json(
        { error: "L'heure de départ doit être après l'heure d'arrivée" },
        { status: 400 }
      );
    }

    // Vérifier qu'il n'y a pas déjà une entrée pour cette date/employé/mandat
    const existingEntry = await prisma.timeEntry.findUnique({
      where: {
        employeeId_date_mandateId: {
          employeeId: validatedData.employeeId,
          date: workDate,
          mandateId: validatedData.mandateId,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Une saisie existe déjà pour cet employé à cette date" },
        { status: 400 }
      );
    }

    // Calculer les heures supplémentaires (au-delà de 8h/jour)
    const totalHours = validatedData.workedHours;
    let overtimeHours = 0;

    if (totalHours > 8) {
      overtimeHours = totalHours - 8;
    }

    // Déterminer le taux horaire à utiliser
    const hourlyRate = validatedData.hourlyRate || employee.hourlyRate || 25; // Taux par défaut

    // Créer l'entrée de temps dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'entrée de temps
      const timeEntry = await tx.timeEntry.create({
        data: {
          employeeId: validatedData.employeeId,
          mandateId: validatedData.mandateId,
          date: workDate,
          clockIn: clockInTime,
          clockOut: clockOutTime,
          breakMinutes: validatedData.breakMinutes,
          workedHours: validatedData.workedHours,
          overtime: overtimeHours,
          hourlyRate,
          entryType: validatedData.entryType,
          importSource: validatedData.importSource,
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
            },
          },
          mandate: {
            select: {
              id: true,
              name: true,
              group: true,
            },
          },
        },
      });

      // Mettre à jour la dernière entrée de l'employé
      await tx.employee.update({
        where: { id: validatedData.employeeId },
        data: {
          updatedAt: new Date(),
        },
      });

      return timeEntry;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de l'entrée de temps:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/timesheet - Supprimer des entrées de temps
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "Aucun ID fourni" }, { status: 400 });
    }

    // Récupérer les entrées à supprimer pour les statistiques
    const entriesToDelete = await prisma.timeEntry.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        employeeId: true,
        mandateId: true,
        workedHours: true,
        hourlyRate: true,
      },
    });

    if (entriesToDelete.length === 0) {
      return NextResponse.json(
        { error: "Aucune entrée trouvée" },
        { status: 404 }
      );
    }

    // Supprimer les entrées
    const deleteResult = await prisma.timeEntry.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      message: `${deleteResult.count} entrée(s) supprimée(s)`,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des entrées:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
