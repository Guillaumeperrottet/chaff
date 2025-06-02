import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schéma de validation pour la mise à jour d'une valeur journalière
const UpdateDayValueSchema = z.object({
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Date invalide",
    })
    .optional(),
  value: z.number().min(0, "La valeur doit être positive").optional(),
  mandateId: z.string().cuid().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/valeurs/[id] - Récupérer une valeur journalière spécifique
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

    const dayValue = await prisma.dayValue.findUnique({
      where: { id },
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

    if (!dayValue) {
      return NextResponse.json(
        { error: "Valeur journalière non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(dayValue);
  } catch (error) {
    console.error("Erreur lors de la récupération de la valeur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/valeurs/[id] - Mettre à jour une valeur journalière
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

    const body = await request.json();

    // Valider les données
    const validatedData = UpdateDayValueSchema.parse(body);

    // Vérifier que la valeur existe
    const existingValue = await prisma.dayValue.findUnique({
      where: { id },
    });

    if (!existingValue) {
      return NextResponse.json(
        { error: "Valeur journalière non trouvée" },
        { status: 404 }
      );
    }

    // Si le mandat est modifié, vérifier qu'il existe et est actif
    if (validatedData.mandateId) {
      const mandate = await prisma.mandate.findUnique({
        where: { id: validatedData.mandateId },
      });

      if (!mandate) {
        return NextResponse.json(
          { error: "Mandat non trouvé" },
          { status: 404 }
        );
      }

      if (!mandate.active) {
        return NextResponse.json(
          { error: "Impossible d'assigner à un mandat inactif" },
          { status: 400 }
        );
      }
    }

    // Si la date ou le mandat changent, vérifier l'unicité
    if (validatedData.date || validatedData.mandateId) {
      const newDate = validatedData.date
        ? new Date(validatedData.date)
        : existingValue.date;
      const newMandateId = validatedData.mandateId || existingValue.mandateId;

      const conflictingValue = await prisma.dayValue.findFirst({
        where: {
          date: newDate,
          mandateId: newMandateId,
          id: { not: id },
        },
      });

      if (conflictingValue) {
        return NextResponse.json(
          { error: "Une valeur existe déjà pour cette date et ce mandat" },
          { status: 400 }
        );
      }
    }

    // Préparer les données à mettre à jour
    const updateData: {
      date?: Date;
      value?: number;
      mandateId?: string;
    } = {};
    if (validatedData.date) updateData.date = new Date(validatedData.date);
    if (validatedData.value !== undefined)
      updateData.value = validatedData.value;
    if (validatedData.mandateId) updateData.mandateId = validatedData.mandateId;

    // Mettre à jour la valeur journalière
    const updatedValue = await prisma.dayValue.update({
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
      },
    });

    // Mettre à jour les statistiques du mandat concerné
    await updateMandateStats(updatedValue.mandateId);

    // Si le mandat a changé, mettre à jour aussi l'ancien mandat
    if (
      validatedData.mandateId &&
      validatedData.mandateId !== existingValue.mandateId
    ) {
      await updateMandateStats(existingValue.mandateId);
    }

    return NextResponse.json(updatedValue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour de la valeur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/valeurs/[id] - Supprimer une valeur journalière
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

    // Récupérer la valeur avant suppression pour mettre à jour les stats
    const existingValue = await prisma.dayValue.findUnique({
      where: { id },
    });

    if (!existingValue) {
      return NextResponse.json(
        { error: "Valeur journalière non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer la valeur journalière
    await prisma.dayValue.delete({
      where: { id },
    });

    // Mettre à jour les statistiques du mandat
    await updateMandateStats(existingValue.mandateId);

    return NextResponse.json({
      message: "Valeur journalière supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la valeur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour mettre à jour les statistiques d'un mandat
async function updateMandateStats(mandateId: string) {
  const stats = await prisma.dayValue.aggregate({
    where: { mandateId },
    _sum: { value: true },
    _max: { date: true },
  });

  await prisma.mandate.update({
    where: { id: mandateId },
    data: {
      totalRevenue: stats._sum.value || 0,
      lastEntry: stats._max.date,
    },
  });
}
