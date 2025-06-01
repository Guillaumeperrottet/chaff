// src/app/api/objet/new-with-sectors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { CloudinaryService } from "@/lib/cloudinary";
import { checkOrganizationLimits } from "@/lib/subscription-limits";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const userDb = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (!userDb?.Organization) {
      return NextResponse.json(
        { error: "Aucune organisation trouvée" },
        { status: 400 }
      );
    }

    const userRole = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        organizationId: userDb.Organization.id,
      },
      select: { role: true },
    });

    if (!userRole || userRole.role !== "admin") {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits nécessaires pour créer un objet" },
        { status: 403 }
      );
    }

    // Vérifier les limites d'objets
    const limitsCheck = await checkOrganizationLimits(
      userDb.Organization.id,
      "objects"
    );

    if (!limitsCheck.allowed && !limitsCheck.unlimited) {
      return NextResponse.json(
        {
          error: `Limite d'objets atteinte (${limitsCheck.current}/${limitsCheck.limit}). Veuillez passer à un forfait supérieur pour créer plus d'objets.`,
          limits: limitsCheck,
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    // Extraire les données principales de l'objet
    const nom = formData.get("nom") as string;
    const adresse = formData.get("adresse") as string;
    const secteur = formData.get("secteur") as string;
    const sectorsCount = parseInt(formData.get("sectorsCount") as string, 10);

    // Validation des données principales
    if (!nom || !adresse || !secteur) {
      return NextResponse.json(
        { error: "Données incomplètes: nom, adresse et secteur sont requis" },
        { status: 400 }
      );
    }

    // Validation du nombre de secteurs
    if (!sectorsCount || sectorsCount <= 0) {
      return NextResponse.json(
        { error: "Au moins un secteur est requis pour créer un objet" },
        { status: 400 }
      );
    }

    // 1. Créer l'objet
    const objet = await prisma.objet.create({
      data: {
        nom,
        adresse,
        secteur,
        organizationId: userDb.Organization.id,
      },
    });

    // Après avoir créé l'objet, créer des entrées d'accès pour TOUS les membres
    const allUsers = await prisma.organizationUser.findMany({
      where: {
        organizationId: userDb.Organization.id,
      },
      select: { userId: true, role: true },
    });

    if (allUsers.length > 0) {
      const accessEntries = allUsers.map((ou) => ({
        userId: ou.userId,
        objectId: objet.id,
        accessLevel: ou.role === "admin" ? "admin" : "none", // Admin = accès admin, autres = none par défaut
      }));

      await prisma.objectAccess.createMany({
        data: accessEntries,
        skipDuplicates: true,
      });
    }

    // 2. Traiter les secteurs
    const sectorsData = [];
    let hasValidSector = false;

    for (let i = 0; i < sectorsCount; i++) {
      const sectorName = formData.get(`sector_${i}_name`) as string;
      const sectorImage = formData.get(`sector_${i}_image`) as File;

      // Vérifier que chaque secteur a un nom et une image
      if (!sectorName || !sectorImage) {
        continue; // Ignorer les secteurs incomplets
      }

      hasValidSector = true;

      // Lire l'image
      const buffer = Buffer.from(await sectorImage.arrayBuffer());

      // Upload vers Cloudinary
      const uploadResult = await CloudinaryService.uploadFile(
        buffer,
        sectorImage.name,
        {
          folder: `plannikeeper/objets/${objet.id}/secteurs`,
          resourceType: "image",
          tags: ["secteur", `objet_${objet.id}`],
        }
      );

      // Ajouter le secteur aux données à créer
      sectorsData.push({
        name: sectorName,
        image: uploadResult.secureUrl,
        imageWidth: uploadResult.width || 0,
        imageHeight: uploadResult.height || 0,
        objectId: objet.id,
      });
    }

    // Vérifier qu'au moins un secteur valide a été créé
    if (!hasValidSector || sectorsData.length === 0) {
      // Si aucun secteur valide, supprimer l'objet créé précédemment
      await prisma.objet.delete({
        where: { id: objet.id },
      });

      return NextResponse.json(
        { error: "Au moins un secteur avec nom et image est requis" },
        { status: 400 }
      );
    }

    // 3. Créer tous les secteurs
    await prisma.sector.createMany({
      data: sectorsData,
    });

    // 4. Récupérer l'objet complet avec ses secteurs
    const objetAvecSecteurs = await prisma.objet.findUnique({
      where: { id: objet.id },
      include: { sectors: true },
    });

    return NextResponse.json(objetAvecSecteurs);
  } catch (error) {
    console.error("Erreur lors de la création de l'objet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'objet" },
      { status: 500 }
    );
  }
}
