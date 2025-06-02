import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schéma de validation pour créer un mandat
const CreateMandateSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(100),
  group: z.enum(["HEBERGEMENT", "RESTAURATION"]),
  active: z.boolean().default(true),
});

// GET /api/mandats - Récupérer tous les mandats
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
    const includeInactive = searchParams.get("includeInactive") === "true";

    const mandates = await prisma.mandate.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        _count: {
          select: { dayValues: true },
        },
      },
      orderBy: [{ group: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(mandates);
  } catch (error) {
    console.error("Erreur lors de la récupération des mandats:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/mandats - Créer un nouveau mandat
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
    const validatedData = CreateMandateSchema.parse(body);

    // Vérifier que le nom n'existe pas déjà
    const existingMandate = await prisma.mandate.findUnique({
      where: { name: validatedData.name },
    });

    if (existingMandate) {
      return NextResponse.json(
        { error: "Un mandat avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Créer le mandat
    const mandate = await prisma.mandate.create({
      data: validatedData,
    });

    return NextResponse.json(mandate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création du mandat:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
