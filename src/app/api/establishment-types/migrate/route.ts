// src/app/api/establishment-types/migrate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EstablishmentIcon } from "@prisma/client";

// POST - Migrer les données localStorage vers la base de données
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { customTypes } = body;

    if (!customTypes || !Array.isArray(customTypes)) {
      return NextResponse.json(
        { error: "Données de types personnalisés invalides" },
        { status: 400 }
      );
    }

    // Récupérer l'organisation de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Utilisateur non associé à une organisation" },
        { status: 400 }
      );
    }

    const migratedTypes = [];

    for (const type of customTypes) {
      try {
        // Vérifier si le type existe déjà
        const existingType = await prisma.establishmentType.findFirst({
          where: {
            label: type.label,
            organizationId: user.organizationId,
          },
        });

        if (!existingType) {
          // Créer le nouveau type en base de données
          const newType = await prisma.establishmentType.create({
            data: {
              label: type.label,
              description:
                type.description || `Type personnalisé: ${type.label}`,
              icon: (type.icon as EstablishmentIcon) || "BUILDING2",
              iconColor: type.iconColor || "text-purple-600",
              bgColor: type.bgColor || "bg-purple-100",
              isCustom: true,
              organizationId: user.organizationId,
              createdBy: session.user.id,
            },
          });

          migratedTypes.push(newType);
        }
      } catch (error) {
        console.error(
          `Erreur lors de la migration du type ${type.label}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      migratedCount: migratedTypes.length,
      migratedTypes: migratedTypes,
      message: `${migratedTypes.length} type(s) migré(s) avec succès`,
    });
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    return NextResponse.json(
      { error: "Erreur lors de la migration" },
      { status: 500 }
    );
  }
}
