// src/app/api/auth/temp-image-upload/route.ts - Version optimisée
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Readable } from "stream";

// Utilisez la version importée correctement de cloudinary
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// Configuration de Cloudinary avec vérification
if (
  !cloudinary.config().cloud_name ||
  !cloudinary.config().api_key ||
  !cloudinary.config().api_secret
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    // Recevoir le fichier depuis le formData
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Valider le type de fichier - utiliser une seule condition
    const isValidType = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ].includes(file.type);
    if (!isValidType) {
      return NextResponse.json(
        {
          error:
            "Type de fichier non pris en charge. Seuls les formats JPG, PNG et WebP sont acceptés.",
        },
        { status: 400 }
      );
    }

    // Valider la taille du fichier
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 5MB)" },
        { status: 400 }
      );
    }

    // Lire le fichier
    const buffer = Buffer.from(await file.arrayBuffer());

    // Générer un ID temporaire moins coûteux
    const tempUserId = crypto.randomBytes(8).toString("hex");

    // Préparation de l'upload de manière optimisée
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `plannikeeper/temp_signup/${tempUserId}`,
          resource_type: "image",
          tags: ["profile", "temp_signup"],
          transformation: {
            width: 400,
            height: 400,
            crop: "fill",
            gravity: "face",
            quality: "auto",
            format: "webp", // Forcer le format webp pour une meilleure performance
          },
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      const bufferStream = Readable.from(buffer);
      bufferStream.pipe(uploadStream);
      bufferStream.pipe(uploadStream);
    });

    // Typer correctement le résultat
    const result = uploadResult as UploadApiResponse;

    return NextResponse.json({
      success: true,
      imageUrl: result.secure_url,
      tempId: tempUserId,
    });
  } catch (error) {
    console.error("Erreur lors du traitement de l'image de profil:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 }
    );
  }
}
