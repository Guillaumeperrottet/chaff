// src/app/api/establishment-types/route.ts - VERSION CORRIGÉE
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EstablishmentIcon } from "@prisma/client";

// Interface pour les types d'établissement côté API
interface EstablishmentTypeResponse {
  id: string;
  label: string;
  description: string;
  icon: EstablishmentIcon;
  iconColor: string;
  bgColor: string;
  isCustom: boolean;
  createdBy?: string;
}

// Types par défaut (ces données seront retournées même s'ils ne sont pas en DB)
const DEFAULT_TYPES: EstablishmentTypeResponse[] = [
  {
    id: "HEBERGEMENT",
    label: "Hébergement",
    description: "Hôtels, auberges, gîtes • Suivi des nuitées et revenus",
    icon: "HOTEL" as EstablishmentIcon,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    isCustom: false,
  },
  {
    id: "RESTAURATION",
    label: "Restauration",
    description: "Restaurants, bars, cafés • Suivi des ventes et revenus",
    icon: "UTENSILS" as EstablishmentIcon,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-100",
    isCustom: false,
  },
];

// GET - Récupérer tous les types d'établissement
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
      return NextResponse.json({
        types: DEFAULT_TYPES,
        defaultTypes: DEFAULT_TYPES,
        customTypes: [],
      });
    }

    // Récupérer les types personnalisés de l'organisation
    const customTypes = await prisma.establishmentType.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Convertir les types DB en format API
    const customTypesFormatted: EstablishmentTypeResponse[] = customTypes.map(
      (type) => ({
        id: type.id,
        label: type.label,
        description: type.description,
        icon: type.icon,
        iconColor: type.iconColor,
        bgColor: type.bgColor,
        isCustom: type.isCustom,
        createdBy: type.createdBy,
      })
    );

    // Combiner types par défaut + types personnalisés
    const allTypes = [...DEFAULT_TYPES, ...customTypesFormatted];

    return NextResponse.json({
      types: allTypes,
      defaultTypes: DEFAULT_TYPES,
      customTypes: customTypesFormatted,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des types:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Ajouter un nouveau type personnalisé
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { label, description, icon, iconColor, bgColor } = body;

    console.log("📝 Données reçues pour création de type:", {
      label,
      description,
      icon,
      iconColor,
      bgColor,
    });

    // ✅ VALIDATION PLUS STRICTE
    if (!label || typeof label !== "string" || label.trim().length < 2) {
      console.log("❌ Validation échouée: label invalide", { label });
      return NextResponse.json(
        {
          error:
            "Le nom est obligatoire et doit contenir au moins 2 caractères",
        },
        { status: 400 }
      );
    }

    // Valider les champs optionnels
    const validatedData = {
      label: label.trim(),
      description: description?.trim() || `Type personnalisé: ${label.trim()}`,
      icon: (icon as EstablishmentIcon) || "BUILDING2",
      iconColor: iconColor || "text-purple-600",
      bgColor: bgColor || "bg-purple-100",
    };

    // Récupérer l'organisation de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    console.log("👤 Utilisateur trouvé:", {
      userId: session.user.id,
      organizationId: user?.organizationId,
    });

    if (!user?.organizationId) {
      console.log("❌ Utilisateur sans organisation");
      return NextResponse.json(
        { error: "Utilisateur non associé à une organisation" },
        { status: 400 }
      );
    }

    // ✅ VÉRIFIER L'UNICITÉ DU LABEL DANS L'ORGANISATION
    const existingType = await prisma.establishmentType.findFirst({
      where: {
        organizationId: user.organizationId,
        label: validatedData.label,
        isActive: true,
      },
    });

    if (existingType) {
      console.log("❌ Type avec ce nom existe déjà:", validatedData.label);
      return NextResponse.json(
        {
          error: "Un type avec ce nom existe déjà dans votre organisation",
          existingType: existingType.label,
        },
        { status: 409 }
      );
    }

    // ✅ VÉRIFIER AUSSI CONTRE LES TYPES PAR DÉFAUT
    const isDefaultType = DEFAULT_TYPES.some(
      (defaultType) =>
        defaultType.label.toLowerCase() === validatedData.label.toLowerCase()
    );

    if (isDefaultType) {
      console.log("❌ Conflit avec type par défaut:", validatedData.label);
      return NextResponse.json(
        {
          error: "Ce nom est réservé pour les types par défaut",
          suggestion: `Essayez "${validatedData.label} personnalisé" ou "${validatedData.label} custom"`,
        },
        { status: 409 }
      );
    }

    // Créer le nouveau type en base de données
    console.log("💾 Tentative de création en base avec les données:", {
      ...validatedData,
      organizationId: user.organizationId,
      createdBy: session.user.id,
    });

    const newType = await prisma.establishmentType.create({
      data: {
        ...validatedData,
        isCustom: true,
        isActive: true,
        organizationId: user.organizationId,
        createdBy: session.user.id,
      },
    });

    const responseType: EstablishmentTypeResponse = {
      id: newType.id,
      label: newType.label,
      description: newType.description,
      icon: newType.icon,
      iconColor: newType.iconColor,
      bgColor: newType.bgColor,
      isCustom: newType.isCustom,
      createdBy: newType.createdBy,
    };

    console.log("✅ Type créé avec succès:", responseType);

    return NextResponse.json({
      success: true,
      type: responseType,
      message: `Type "${validatedData.label}" créé avec succès`,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création du type:", error);

    // ✅ GESTION SPÉCIFIQUE DES ERREURS PRISMA
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        // Contrainte unique violée
        return NextResponse.json(
          {
            error: "Un type avec ces caractéristiques existe déjà",
            code: "DUPLICATE_TYPE",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la création du type",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
