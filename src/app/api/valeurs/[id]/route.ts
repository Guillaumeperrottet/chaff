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

    // 🔧 NOUVEAU: Transaction pour mettre à jour la valeur ET lastEntry
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour la valeur journalière
      const updatedValue = await tx.dayValue.update({
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

      // Mettre à jour lastEntry du mandat concerné
      await tx.mandate.update({
        where: { id: updatedValue.mandateId },
        data: {
          lastEntry: new Date(), // 🔧 Date de modification = maintenant
        },
      });

      // Si le mandat a changé, mettre à jour aussi l'ancien mandat
      if (
        validatedData.mandateId &&
        validatedData.mandateId !== existingValue.mandateId
      ) {
        // Recalculer les stats de l'ancien mandat
        const oldMandateLastEntry = await tx.dayValue.findFirst({
          where: { mandateId: existingValue.mandateId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });

        await tx.mandate.update({
          where: { id: existingValue.mandateId },
          data: {
            lastEntry: oldMandateLastEntry?.createdAt || null,
          },
        });
      }

      return updatedValue;
    });

    // Recalculer les stats complètes (totalRevenue)
    await updateMandateStats(result.mandateId);

    // Si le mandat a changé, recalculer aussi l'ancien mandat
    if (
      validatedData.mandateId &&
      validatedData.mandateId !== existingValue.mandateId
    ) {
      await updateMandateStats(existingValue.mandateId);
    }

    return NextResponse.json(result);
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

    // 🔧 NOUVEAU: Transaction pour supprimer ET recalculer lastEntry
    await prisma.$transaction(async (tx) => {
      // Supprimer la valeur journalière
      await tx.dayValue.delete({
        where: { id },
      });

      // Recalculer lastEntry (dernière saisie restante)
      const lastRemainingEntry = await tx.dayValue.findFirst({
        where: { mandateId: existingValue.mandateId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      // Mettre à jour le mandat
      await tx.mandate.update({
        where: { id: existingValue.mandateId },
        data: {
          lastEntry: lastRemainingEntry?.createdAt || null, // null si plus de valeurs
        },
      });
    });

    // Recalculer les statistiques complètes du mandat
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
async function updateMandateStats(mandateId: string) {
  try {
    // Calculer le total des revenus pour ce mandat
    const totalRevenue = await prisma.dayValue.aggregate({
      where: { mandateId },
      _sum: { value: true },
    });

    // Mettre à jour les statistiques du mandat
    await prisma.mandate.update({
      where: { id: mandateId },
      data: {
        totalRevenue: totalRevenue._sum.value || 0,
      },
    });
  } catch (error) {
    console.error(
      `Erreur lors de la mise à jour des stats du mandat ${mandateId}:`,
      error
    );
    // Ne pas propager l'erreur pour éviter d'interrompre l'opération principale
  }
}
