// src/app/api/secteur/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { CloudinaryService } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const image = formData.get("image") as File;
    const objectId = formData.get("objectId") as string;

    if (!name || !image || !objectId) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Vérifier que l'objet existe et appartient à l'organisation de l'utilisateur
    const objet = await prisma.objet.findUnique({
      where: { id: objectId },
      include: { organization: true },
    });

    if (!objet) {
      return NextResponse.json({ error: "Objet non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur appartient à la même organisation que l'objet
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== objet.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour modifier cet objet" },
        { status: 403 }
      );
    }

    // Lire l'image
    const buffer = Buffer.from(await image.arrayBuffer());

    // Upload de l'image vers Cloudinary
    const uploadResult = await CloudinaryService.uploadFile(
      buffer,
      image.name,
      {
        folder: `plannikeeper/objets/${objectId}/secteurs`,
        resourceType: "image",
        tags: ["secteur", `objet_${objectId}`],
      }
    );

    // Créer le secteur avec les dimensions de l'image
    const sector = await prisma.sector.create({
      data: {
        name,
        image: uploadResult.secureUrl,
        imageWidth: uploadResult.width || 0,
        imageHeight: uploadResult.height || 0,
        objectId: objectId,
      },
    });

    return NextResponse.json(sector);
  } catch (error) {
    console.error("Erreur lors de la création du secteur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du secteur" },
      { status: 500 }
    );
  }
}
