import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schéma de validation pour la mise à jour d'un mandat
const UpdateMandateSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(100).optional(),
  group: z.enum(["HEBERGEMENT", "RESTAURATION"]).optional(),
  active: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/mandats/[id] - Récupérer un mandat spécifique
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

    const mandate = await prisma.mandate.findUnique({
      where: { id },
      include: {
        dayValues: {
          orderBy: { date: "desc" },
          take: 10, // Les 10 dernières valeurs
        },
        _count: {
          select: { dayValues: true },
        },
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    return NextResponse.json(mandate);
  } catch (error) {
    console.error("Erreur lors de la récupération du mandat:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/mandats/[id] - Mettre à jour un mandat
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
    const validatedData = UpdateMandateSchema.parse(body);

    // Vérifier que le mandat existe
    const existingMandate = await prisma.mandate.findUnique({
      where: { id },
    });

    if (!existingMandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Si le nom est modifié, vérifier l'unicité
    if (validatedData.name && validatedData.name !== existingMandate.name) {
      const nameExists = await prisma.mandate.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Un mandat avec ce nom existe déjà" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le mandat
    const updatedMandate = await prisma.mandate.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedMandate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour du mandat:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/mandats/[id] - Supprimer un mandat
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

    // Vérifier que le mandat existe
    const existingMandate = await prisma.mandate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dayValues: true },
        },
      },
    });

    if (!existingMandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Vérifier s'il y a des valeurs journalières associées
    if (existingMandate._count.dayValues > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer un mandat qui contient des valeurs journalières",
          count: existingMandate._count.dayValues,
        },
        { status: 400 }
      );
    }

    // Supprimer le mandat
    await prisma.mandate.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Mandat supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du mandat:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
