// src/app/api/admin/subscription-limits/route.ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

export async function GET() {
  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer toutes les organisations avec leurs abonnements et statistiques d'usage
    const organizations = await prisma.organization.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        users: {
          select: { id: true },
        },
        // Récupérer le créateur de l'organisation (premier admin ou plus ancien utilisateur)
        OrganizationUser: {
          orderBy: [
            { role: "asc" }, // Les admin d'abord
            { createdAt: "asc" }, // Puis les plus anciens
          ],
          take: 1,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        Objet: {
          select: {
            id: true,
            sectors: {
              select: {
                id: true,
                articles: {
                  select: {
                    id: true,
                    tasks: {
                      where: { archived: false },
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculer les statistiques pour chaque organisation
    const organizationsWithLimits = await Promise.all(
      organizations.map(async (org) => {
        // Calculer l'usage du stockage (approximatif)
        const documentsSize = await prisma.document.aggregate({
          where: {
            task: {
              article: {
                sector: {
                  object: {
                    organizationId: org.id,
                  },
                },
              },
            },
          },
          _sum: {
            fileSize: true,
          },
        });

        // Calculer la taille des images de secteurs (si applicable)
        const sectorsWithImages = await prisma.sector.findMany({
          where: {
            object: {
              organizationId: org.id,
            },
            image: {
              not: null,
            },
          },
          select: {
            image: true,
          },
        });

        // Estimation approximative des images (vous pourriez vouloir stocker la taille réelle)
        const estimatedImageSize = sectorsWithImages.length * 2 * 1024 * 1024; // 2MB par image

        // Calculer la taille des avatars utilisateurs (si stockés localement)
        const usersWithImages = await prisma.user.findMany({
          where: {
            organizationId: org.id,
            image: {
              not: null,
            },
          },
          select: {
            image: true,
          },
        });

        const estimatedAvatarSize = usersWithImages.length * 0.5 * 1024 * 1024; // 0.5MB par avatar

        const totalBytes =
          (documentsSize._sum.fileSize || 0) +
          estimatedImageSize +
          estimatedAvatarSize;

        const plan = org.subscription?.plan;
        const status = org.subscription?.status || "FREE";

        // Déterminer le créateur de l'organisation
        let createdBy = "N/A";
        if (org.OrganizationUser && org.OrganizationUser.length > 0) {
          const creator = org.OrganizationUser[0].user;
          createdBy = creator.name || creator.email || "N/A";
        }

        return {
          id: org.id,
          name: org.name,
          planName: plan?.name || "FREE",
          status,
          users: {
            current: org.users.length,
            limit: plan?.maxUsers,
            unlimited: plan?.maxUsers === null,
          },
          objects: {
            current: org.Objet.length,
            limit: plan?.maxObjects,
            unlimited: plan?.maxObjects === null,
          },
          sectors: {
            current: sectorCount(org),
            limit: plan?.maxSectors,
            unlimited: plan?.maxSectors === null,
          },
          articles: {
            current: articleCount(org),
            limit: plan?.maxArticles,
            unlimited: plan?.maxArticles === null,
          },
          tasks: {
            current: taskCount(org),
            limit: plan?.maxTasks,
            unlimited: plan?.maxTasks === null,
          },
          storage: {
            current: totalBytes / (1024 * 1024), // Convertir en MB
            limit: plan?.maxStorage || (plan?.name === "FREE" ? 500 : 2048), // MB
            unlimited: plan?.maxStorage === null,
          },
          subscriptionId: org.subscription?.id,
          createdAt: org.createdAt,
          createdBy, // Ajout du nom du créateur
        };
      })
    );

    return NextResponse.json({ organizations: organizationsWithLimits });
  } catch (error) {
    console.error("Erreur lors de la récupération des limites:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Types pour l'organisation et ses sous-éléments
interface Task {
  id: string;
}

interface Article {
  id: string;
  tasks: Task[];
}

interface Sector {
  id: string;
  articles: Article[];
}

interface Objet {
  id: string;
  sectors: Sector[];
}

interface OrganizationForCount {
  Objet: Objet[];
}

// Fonctions utilitaires pour calculer les comptages
function sectorCount(org: OrganizationForCount): number {
  return org.Objet.reduce(
    (total: number, obj: Objet) => total + obj.sectors.length,
    0
  );
}

function articleCount(org: OrganizationForCount): number {
  return org.Objet.reduce(
    (total: number, obj: Objet) =>
      total +
      obj.sectors.reduce(
        (subTotal: number, sector: Sector) => subTotal + sector.articles.length,
        0
      ),
    0
  );
}

function taskCount(org: OrganizationForCount): number {
  return org.Objet.reduce(
    (total: number, obj: Objet) =>
      total +
      obj.sectors.reduce(
        (subTotal: number, sector: Sector) =>
          subTotal +
          sector.articles.reduce(
            (taskTotal: number, article: Article) =>
              taskTotal + article.tasks.length,
            0
          ),
        0
      ),
    0
  );
}
