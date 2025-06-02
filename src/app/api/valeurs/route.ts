import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schéma de validation pour créer une valeur journalière
const CreateDayValueSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Date invalide",
  }),
  value: z.number().min(0, "La valeur doit être positive"),
  mandateId: z.string().cuid(),
});

// GET /api/valeurs - Récupérer toutes les valeurs journalières
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
    const mandateId = searchParams.get("mandateId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construire les filtres
    const where: {
      mandateId?: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

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

    const dayValues = await prisma.dayValue.findMany({
      where,
      include: {
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
    const total = await prisma.dayValue.count({ where });

    return NextResponse.json({
      data: dayValues,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des valeurs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/valeurs - Créer une nouvelle valeur journalière
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

    // Valider les données
    const validatedData = CreateDayValueSchema.parse(body);

    // Vérifier que le mandat existe et est actif
    const mandate = await prisma.mandate.findUnique({
      where: { id: validatedData.mandateId },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    if (!mandate.active) {
      return NextResponse.json(
        { error: "Impossible d'ajouter une valeur à un mandat inactif" },
        { status: 400 }
      );
    }

    const date = new Date(validatedData.date);

    // Vérifier qu'il n'y a pas déjà une valeur pour cette date et ce mandat
    const existingValue = await prisma.dayValue.findUnique({
      where: {
        date_mandateId: {
          date: date,
          mandateId: validatedData.mandateId,
        },
      },
    });

    if (existingValue) {
      return NextResponse.json(
        { error: "Une valeur existe déjà pour cette date et ce mandat" },
        { status: 400 }
      );
    }

    // Créer la valeur journalière
    const dayValue = await prisma.dayValue.create({
      data: {
        date: date,
        value: validatedData.value,
        mandateId: validatedData.mandateId,
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
    });

    // Mettre à jour les statistiques du mandat
    const stats = await prisma.dayValue.aggregate({
      where: { mandateId: validatedData.mandateId },
      _sum: { value: true },
      _max: { date: true },
    });

    await prisma.mandate.update({
      where: { id: validatedData.mandateId },
      data: {
        totalRevenue: stats._sum.value || 0,
        lastEntry: stats._max.date,
      },
    });

    return NextResponse.json(dayValue, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de la valeur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/valeurs - Supprimer des valeurs journalières
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

    // Récupérer les valeurs à supprimer pour mettre à jour les mandats
    const valuesToDelete = await prisma.dayValue.findMany({
      where: { id: { in: ids } },
      select: { mandateId: true },
    });

    const affectedMandateIds = [
      ...new Set(valuesToDelete.map((v) => v.mandateId)),
    ];

    // Supprimer les valeurs
    const deleteResult = await prisma.dayValue.deleteMany({
      where: { id: { in: ids } },
    });

    // Mettre à jour les statistiques des mandats affectés
    for (const mandateId of affectedMandateIds) {
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

    return NextResponse.json({
      message: `${deleteResult.count} valeur(s) supprimée(s)`,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des valeurs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
