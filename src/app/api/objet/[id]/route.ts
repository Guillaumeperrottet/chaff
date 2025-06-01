// src/app/api/objet/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkObjectAccess } from "@/lib/auth-session";
import { CloudinaryService } from "@/lib/cloudinary";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { id: objectId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que l'objet existe
  const object = await prisma.objet.findUnique({
    where: { id: objectId },
  });

  if (!object) {
    return NextResponse.json({ error: "Objet non trouvé" }, { status: 404 });
  }

  // Vérifier que l'utilisateur a un accès en lecture à cet objet
  const hasReadAccess = await checkObjectAccess(user.id, objectId, "read");
  if (!hasReadAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour accéder à cet objet" },
      { status: 403 }
    );
  }

  // Récupérer toutes les tâches liées à cet objet, SAUF celles archivées
  const tasks = await prisma.task.findMany({
    where: {
      article: {
        sector: {
          objectId,
        },
      },
      archived: false, // Ajouter cette condition pour exclure les tâches archivées
    },
    include: {
      article: {
        select: {
          id: true,
          title: true,
          sector: {
            select: {
              id: true,
              name: true,
              object: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ realizationDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id: objetId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Récupérer l'objet avec toutes ses relations
    const objet = await prisma.objet.findUnique({
      where: { id: objetId },
      include: {
        sectors: {
          include: {
            articles: {
              include: {
                tasks: {
                  include: {
                    documents: true,
                    comments: true,
                  },
                },
              },
            },
          },
        },
        organization: true,
        objectAccess: true,
      },
    });

    if (!objet) {
      return NextResponse.json({ error: "Objet non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur appartient à la même organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== objet.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour supprimer cet objet" },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const isAdmin = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        organizationId: objet.organizationId,
        role: "admin",
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer des objets" },
        { status: 403 }
      );
    }

    // Collecter tous les fichiers à supprimer de Cloudinary
    const filesToDelete: Array<{
      publicId: string;
      resourceType: "image" | "raw";
    }> = [];

    // Images des secteurs
    for (const sector of objet.sectors) {
      if (sector.image) {
        const publicId = CloudinaryService.extractPublicIdFromUrl(sector.image);
        if (publicId) {
          filesToDelete.push({ publicId, resourceType: "image" });
        }
      }

      // Documents des tâches
      for (const article of sector.articles) {
        for (const task of article.tasks) {
          for (const document of task.documents) {
            const publicId = CloudinaryService.extractPublicIdFromUrl(
              document.filePath
            );
            if (publicId) {
              const resourceType = document.fileType.startsWith("image/")
                ? "image"
                : "raw";
              filesToDelete.push({ publicId, resourceType });
            }
          }
        }
      }
    }

    // Supprimer en cascade dans une transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer tous les documents liés aux tâches
      for (const sector of objet.sectors) {
        for (const article of sector.articles) {
          for (const task of article.tasks) {
            if (task.documents.length > 0) {
              await tx.document.deleteMany({
                where: { taskId: task.id },
              });
            }

            // Supprimer les commentaires
            if (task.comments.length > 0) {
              await tx.comment.deleteMany({
                where: { taskId: task.id },
              });
            }
          }

          // Supprimer les tâches de l'article
          await tx.task.deleteMany({
            where: { articleId: article.id },
          });
        }

        // Supprimer les articles du secteur
        await tx.article.deleteMany({
          where: { sectorId: sector.id },
        });
      }

      // Supprimer les secteurs
      await tx.sector.deleteMany({
        where: { objectId: objetId },
      });

      // Supprimer les accès à l'objet
      await tx.objectAccess.deleteMany({
        where: { objectId: objetId },
      });

      // Supprimer les notifications liées à cet objet
      await tx.notification.deleteMany({
        where: {
          data: {
            path: ["objectId"],
            equals: objetId,
          },
        },
      });

      // Finalement, supprimer l'objet
      await tx.objet.delete({
        where: { id: objetId },
      });
    });

    // Supprimer les fichiers de Cloudinary en parallèle (après la transaction DB)
    const deletePromises = filesToDelete.map(
      async ({ publicId, resourceType }) => {
        try {
          await CloudinaryService.deleteFile(publicId, resourceType);
          console.log(`✅ Fichier Cloudinary supprimé: ${publicId}`);
        } catch (error) {
          console.warn(`⚠️ Erreur suppression Cloudinary ${publicId}:`, error);
          // On continue même si la suppression Cloudinary échoue
        }
      }
    );

    // Attendre toutes les suppressions Cloudinary (avec timeout)
    await Promise.allSettled(deletePromises);

    console.log(`✅ Objet ${objet.nom} supprimé avec succès`);

    return NextResponse.json({
      success: true,
      message: "Objet supprimé avec succès",
      deletedFiles: filesToDelete.length,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'objet:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de l'objet",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
