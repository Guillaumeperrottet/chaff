import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { CloudinaryService } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        {
          error: "Vous devez être connecté pour modifier votre photo de profil",
        },
        { status: 401 }
      );
    }

    // Recevoir le fichier depuis le formData
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Valider le type de fichier
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Type de fichier non pris en charge. Seuls les formats JPG, PNG et WebP sont acceptés.",
        },
        { status: 400 }
      );
    }

    // Valider la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 5MB)" },
        { status: 400 }
      );
    }

    // Lire le fichier
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload vers Cloudinary
    const uploadResult = await CloudinaryService.uploadFile(buffer, file.name, {
      folder: `plannikeeper/users/${user.id}/profile`,
      resourceType: "image",
      tags: ["profile", `user_${user.id}`],
      // Ajouter des transformations pour optimiser l'image de profil
      transformation: {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        fetch_format: "auto",
      },
    });

    // Mettre à jour l'URL de l'image dans la base de données
    await prisma.user.update({
      where: { id: user.id },
      data: { image: uploadResult.secureUrl },
    });

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secureUrl,
      message: "Photo de profil mise à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du traitement de l'image de profil:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 }
    );
  }
}
