// src/app/api/admin/organizations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

// Define the route parameters type
type RouteParams = {
  params: Promise<{ id: string }>;
};

// Récupérer une organisation spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: orgId } = await params;

  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer l'organisation avec des informations détaillées
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: {
          include: {
            OrganizationUser: {
              select: {
                role: true,
              },
            },
          },
        },
        Objet: true,
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'organisation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Mettre à jour une organisation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id: orgId } = await params;

  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const updateData = await request.json();

    // Vérifier que l'organisation existe
    const existingOrg = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour l'organisation
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: updateData.name,
      },
    });

    // Si un plan est spécifié, mettre à jour ou créer l'abonnement
    if (updateData.subscription) {
      const planName = updateData.subscription.planName;
      const status = updateData.subscription.status || "ACTIVE";

      // Récupérer le plan
      const plan = await prisma.plan.findUnique({
        where: { name: planName },
      });

      if (!plan) {
        return NextResponse.json(
          {
            error: "Plan non trouvé",
            organization: updatedOrg,
          },
          { status: 400 }
        );
      }

      // Vérifier si un abonnement existe déjà
      const existingSub = await prisma.subscription.findUnique({
        where: { organizationId: orgId },
      });

      if (existingSub) {
        // Mettre à jour l'abonnement
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            planId: plan.id,
            status: status,
            // Autres champs pertinents...
            cancelAtPeriodEnd:
              updateData.subscription.cancelAtPeriodEnd || false,
          },
        });
      } else {
        // Créer un nouvel abonnement
        await prisma.subscription.create({
          data: {
            organizationId: orgId,
            planId: plan.id,
            status: status,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            cancelAtPeriodEnd:
              updateData.subscription.cancelAtPeriodEnd || false,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Organisation mise à jour avec succès",
      organization: updatedOrg,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'organisation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Supprimer une organisation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: orgId } = await params;

  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que l'organisation existe
    const existingOrg = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // ⚠️ Suppression en cascade de tous les objets liés
    // ATTENTION: Cette opération est destructive et irréversible

    // Effectuer la suppression dans une transaction plus complète
    await prisma.$transaction(async (tx) => {
      // 1. Récupérer tous les objets liés à cette organisation
      const objets = await tx.objet.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      });

      const objetIds = objets.map((obj) => obj.id);

      // 2. Pour chaque objet, supprimer toutes les entités associées
      for (const objetId of objetIds) {
        // 2.1 Récupérer tous les secteurs de cet objet
        const sectors = await tx.sector.findMany({
          where: { objectId: objetId },
          select: { id: true },
        });

        const sectorIds = sectors.map((sector) => sector.id);

        // 2.2 Pour chaque secteur, supprimer tous les articles
        for (const sectorId of sectorIds) {
          // 2.2.1 Récupérer tous les articles de ce secteur
          const articles = await tx.article.findMany({
            where: { sectorId },
            select: { id: true },
          });

          const articleIds = articles.map((article) => article.id);

          // 2.2.2 Pour chaque article, supprimer toutes les tâches
          for (const articleId of articleIds) {
            // Récupérer toutes les tâches de cet article
            const tasks = await tx.task.findMany({
              where: { articleId },
              select: { id: true },
            });

            const taskIds = tasks.map((task) => task.id);

            // Supprimer tous les documents associés aux tâches
            if (taskIds.length > 0) {
              await tx.document.deleteMany({
                where: { taskId: { in: taskIds } },
              });
            }

            // Supprimer tous les commentaires associés aux tâches
            if (taskIds.length > 0) {
              await tx.comment.deleteMany({
                where: { taskId: { in: taskIds } },
              });
            }

            // Supprimer toutes les tâches
            await tx.task.deleteMany({
              where: { articleId },
            });
          }

          // Supprimer tous les articles
          await tx.article.deleteMany({
            where: { sectorId },
          });
        }

        // Supprimer tous les secteurs
        await tx.sector.deleteMany({
          where: { objectId: objetId },
        });
      }

      // 3. Supprimer tous les objets
      await tx.objet.deleteMany({
        where: { organizationId: orgId },
      });

      // 4. Supprimer les accès aux objets
      await tx.objectAccess.deleteMany({
        where: { objectId: { in: objetIds } },
      });

      // 5. Supprimer les notifications liées à l'organisation
      await tx.notification.deleteMany({
        where: {
          userId: {
            in: await tx.user
              .findMany({
                where: { organizationId: orgId },
                select: { id: true },
              })
              .then((users) => users.map((u) => u.id)),
          },
        },
      });

      // 6. Supprimer l'abonnement
      await tx.subscription.deleteMany({
        where: { organizationId: orgId },
      });

      // 7. Supprimer le stockage
      await tx.storageUsage.deleteMany({
        where: { organizationId: orgId },
      });

      // 8. Supprimer les associations utilisateur-organisation
      await tx.organizationUser.deleteMany({
        where: { organizationId: orgId },
      });

      // 9. Supprimer les invitations
      await tx.invitationCode.deleteMany({
        where: { organizationId: orgId },
      });

      // 10. Mettre à jour les utilisateurs pour supprimer la référence à l'organisation
      await tx.user.updateMany({
        where: { organizationId: orgId },
        data: { organizationId: null },
      });

      // 11. Finalement supprimer l'organisation elle-même
      await tx.organization.delete({
        where: { id: orgId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Organisation supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'organisation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
