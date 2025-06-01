// src/app/api/tasks/[id]/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { CloudinaryService } from "@/lib/cloudinary";
import { StorageService } from "@/lib/storage-service";
import { NotificationService } from "@/lib/notification-serice";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { id: taskId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Vérifier que la tâche existe et que l'utilisateur a accès
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        article: {
          include: {
            sector: {
              include: { object: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    // Vérifier organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== task.article.sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cette tâche" },
        { status: 403 }
      );
    }

    // Récupérer tous les documents de la tâche
    const documents = await prisma.document.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Erreur lors de la récupération des documents :", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { id: taskId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Vérifier que la tâche existe et que l'utilisateur a accès
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        article: {
          include: {
            sector: {
              include: { object: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    // Vérifier organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== task.article.sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cette tâche" },
        { status: 403 }
      );
    }

    // Traitement du formulaire
    const formData = await req.formData();
    const file = formData.get("file") as File;

    // Ajout de logs pour debug
    console.log("file:", file);
    if (file) {
      console.log("file.name:", file.name);
      console.log("file.type:", file.type);
      console.log("file.size:", file.size);
    }

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    //  Limites de stockage
    const organizationId = task.article.sector.object.organizationId;
    const storageCheck = await StorageService.canUploadFile(
      organizationId,
      file.size
    );

    if (!storageCheck.allowed) {
      const currentUsage = StorageService.formatSize(
        storageCheck.currentUsageBytes
      );
      const limit = storageCheck.limitBytes
        ? StorageService.formatSize(storageCheck.limitBytes)
        : "Illimité";

      return NextResponse.json(
        {
          error: `Limite de stockage dépassée. Usage actuel: ${currentUsage}/${limit}. Veuillez passer à un forfait supérieur ou libérer de l'espace.`,
          storageInfo: {
            current: currentUsage,
            limit: limit,
            unlimited: storageCheck.unlimited,
          },
        },
        { status: 413 } // Payload Too Large
      );
    }

    // Vérification du nom de fichier
    if (
      !file.name ||
      typeof file.name !== "string" ||
      file.name.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Nom de fichier invalide ou manquant" },
        { status: 400 }
      );
    }

    // Vérifier le type et la taille du fichier
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (
      !file.type ||
      typeof file.type !== "string" ||
      !allowedTypes.includes(file.type)
    ) {
      return NextResponse.json(
        {
          error:
            "Type de fichier non pris en charge ou manquant. Veuillez télécharger un PDF ou une image (jpeg, png, gif, webp).",
        },
        { status: 400 }
      );
    }
    const maxSize = 20 * 1024 * 1024; // max 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 20MB)" },
        { status: 400 }
      );
    }

    // Lire le fichier
    const buffer = Buffer.from(await file.arrayBuffer());

    // Déterminer le type de ressource pour Cloudinary
    const resourceType = CloudinaryService.getResourceTypeFromMime(file.type);

    // Upload du fichier vers Cloudinary
    const uploadResult = await CloudinaryService.uploadFile(buffer, file.name, {
      folder: `plannikeeper/tasks/${taskId}/documents`,
      resourceType,
      tags: ["document", `task_${taskId}`],
    });

    // Enregistrer en base de données
    const document = await prisma.document.create({
      data: {
        name: file.name,
        filePath: uploadResult.secureUrl,
        fileSize: uploadResult.bytes,
        fileType: file.type,
        taskId,
      },
    });

    // 🆕 NOTIFICATION POUR LE DOCUMENT
    await NotificationService.notifyDocumentUploaded(
      taskId,
      user.id,
      user.name || "Utilisateur",
      file.name
    );

    // APRÈS UN UPLOAD RÉUSSI : Mettre à jour l'usage du stockage
    await StorageService.updateStorageUsage(organizationId);

    return NextResponse.json(document);
  } catch (error) {
    console.error("Erreur lors du téléchargement du document :", error);
    return NextResponse.json(
      { error: "Erreur lors du téléchargement du document" },
      { status: 500 }
    );
  }
}
