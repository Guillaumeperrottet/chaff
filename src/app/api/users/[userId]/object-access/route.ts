// src/app/api/users/[userId]/route.ts
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/notification-serice";

// Typage mis à jour : params est une Promise qui résout { userId: string }
type RouteParams = {
  params: Promise<{ userId: string }>;
};

// GET - Récupérer tous les accès d'un utilisateur
export async function GET(req: Request, { params }: RouteParams) {
  // Récupération de l'userId depuis la promesse
  const { userId } = await params;
  const currentUser = await getUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est administrateur ou qu'il demande ses propres accès
  if (userId !== currentUser.id) {
    const userOrg = await prisma.organizationUser.findFirst({
      where: { userId: currentUser.id, role: "admin" },
    });

    if (!userOrg) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que l'utilisateur cible appartient à la même organisation
    const targetUserOrg = await prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId: userOrg.organizationId,
      },
    });

    if (!targetUserOrg) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette organisation" },
        { status: 404 }
      );
    }
  }

  try {
    // Récupérer les accès de l'utilisateur
    const access = await prisma.objectAccess.findMany({
      where: { userId },
      select: {
        objectId: true,
        accessLevel: true,
      },
    });

    return NextResponse.json({ access });
  } catch (error) {
    console.error("Erreur lors de la récupération des accès :", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des accès" },
      { status: 500 }
    );
  }
}

// POST - Mettre à jour les accès d'un utilisateur
export async function POST(req: Request, { params }: RouteParams) {
  // Récupération de l'userId depuis la promesse
  const { userId } = await params;
  const currentUser = await getUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est administrateur
  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId: currentUser.id, role: "admin" },
  });

  if (!userOrg) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Récupérer les données
  const { organizationId, access } = await req.json();

  // Vérifier que l'organisation correspond
  if (organizationId !== userOrg.organizationId) {
    return NextResponse.json(
      { error: "Organisation non autorisée" },
      { status: 403 }
    );
  }

  try {
    // Vérifier que l'utilisateur cible appartient à la même organisation
    const targetUserOrg = await prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!targetUserOrg) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette organisation" },
        { status: 404 }
      );
    }

    // Pour chaque accès, créer, mettre à jour ou supprimer
    for (const item of access) {
      const currentAccess = await prisma.objectAccess.findUnique({
        where: {
          userId_objectId: {
            userId,
            objectId: item.objectId,
          },
        },
      });

      if (item.accessLevel === "none") {
        // Suppression d'accès
        await prisma.objectAccess.deleteMany({
          where: {
            userId,
            objectId: item.objectId,
          },
        });
      } else {
        const isNewAccess =
          !currentAccess || currentAccess.accessLevel === "none";

        await prisma.objectAccess.upsert({
          where: {
            userId_objectId: {
              userId,
              objectId: item.objectId,
            },
          },
          update: {
            accessLevel: item.accessLevel,
          },
          create: {
            userId,
            objectId: item.objectId,
            accessLevel: item.accessLevel,
          },
        });

        // 🆕 NOTIFICATION POUR NOUVEL ACCÈS
        if (isNewAccess) {
          await NotificationService.notifyUserAddedToObject(
            userId,
            item.objectId,
            item.accessLevel,
            currentUser.name || "Administrateur"
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des accès :", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des accès" },
      { status: 500 }
    );
  }
}
