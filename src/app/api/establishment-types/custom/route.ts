import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      // Si pas d'organisation, retourner seulement les types par défaut
      const defaultTypes = [
        { id: "HEBERGEMENT", name: "HEBERGEMENT", label: "Hébergement" },
        { id: "RESTAURATION", name: "RESTAURATION", label: "Restauration" },
      ];

      return NextResponse.json({
        types: defaultTypes,
        total: defaultTypes.length,
      });
    }

    // Récupérer tous les types d'établissements utilisés dans l'organisation
    const establishmentTypes = await prisma.establishmentType.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true, // Seulement les types actifs
      },
      select: {
        id: true,
        label: true,
        isCustom: true,
        _count: {
          select: {
            mandates: true,
          },
        },
      },
      orderBy: [
        { isCustom: "asc" }, // Types par défaut en premier
        { label: "asc" },
      ],
    });

    // Ajouter les types par défaut s'ils ne sont pas déjà présents
    const defaultTypes = [
      {
        id: "HEBERGEMENT",
        name: "HEBERGEMENT",
        label: "Hébergement",
        isCustom: false,
        mandatesCount: 0,
      },
      {
        id: "RESTAURATION",
        name: "RESTAURATION",
        label: "Restauration",
        isCustom: false,
        mandatesCount: 0,
      },
    ];

    // Formatter les données pour l'interface
    const customTypes = establishmentTypes.map((type) => ({
      id: type.label.toUpperCase().replace(/\s+/g, "_"), // Convertir le label en ID
      name: type.label.toUpperCase().replace(/\s+/g, "_"),
      label: type.label,
      isCustom: type.isCustom,
      mandatesCount: type._count.mandates,
    }));

    // Combiner les types par défaut et personnalisés
    const allTypes = [...defaultTypes, ...customTypes];

    return NextResponse.json({
      types: allTypes,
      total: allTypes.length,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des types personnalisés:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
