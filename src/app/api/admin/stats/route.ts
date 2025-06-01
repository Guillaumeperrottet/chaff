// src/app/api/admin/stats/route.ts
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

    // Récupérer les statistiques en parallèle pour optimiser les performances
    const [
      totalUsers,
      totalOrganizations,
      activeSubscriptions,
      totalObjects,
      totalTasks,
      recentUsers,
      systemHealth,
    ] = await Promise.all([
      // Nombre total d'utilisateurs
      prisma.user.count(),

      // Nombre total d'organisations
      prisma.organization.count(),

      // Nombre d'abonnements actifs (pas gratuits)
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
          plan: {
            name: {
              not: "FREE",
            },
          },
        },
      }),

      // Nombre total d'objets immobiliers
      prisma.objet.count(),

      // Nombre total de tâches non archivées
      prisma.task.count({
        where: {
          archived: false,
        },
      }),

      // Utilisateurs créés dans les 7 derniers jours
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Calcul de la santé du système (simplifié)
      calculateSystemHealth(),
    ]);

    // Calculer les statistiques dérivées
    const stats = {
      totalUsers,
      totalOrganizations,
      activeSubscriptions,
      totalObjects,
      totalTasks,
      recentUsers,
      systemHealth,
      // Ratios et métriques utiles
      avgUsersPerOrganization:
        totalOrganizations > 0
          ? Math.round((totalUsers / totalOrganizations) * 10) / 10
          : 0,
      avgObjectsPerOrganization:
        totalOrganizations > 0
          ? Math.round((totalObjects / totalOrganizations) * 10) / 10
          : 0,
      subscriptionRate:
        totalOrganizations > 0
          ? Math.round((activeSubscriptions / totalOrganizations) * 100)
          : 0,
      // Tendances (croissance sur 7 jours)
      growth: {
        users: recentUsers,
        usersPercentage:
          totalUsers > 0 ? Math.round((recentUsers / totalUsers) * 100) : 0,
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonction pour calculer la santé du système
async function calculateSystemHealth(): Promise<
  "good" | "warning" | "critical"
> {
  try {
    // Vérifier plusieurs indicateurs de santé
    const checks = await Promise.all([
      // Vérifier les erreurs récentes (simulation)
      checkRecentErrors(),

      // Vérifier la performance de la base de données
      checkDatabaseHealth(),

      // Vérifier les abonnements en problème
      checkSubscriptionIssues(),
    ]);

    const criticalIssues = checks.filter(
      (check) => check === "critical"
    ).length;
    const warningIssues = checks.filter((check) => check === "warning").length;

    if (criticalIssues > 0) {
      return "critical";
    } else if (warningIssues > 1) {
      return "warning";
    } else {
      return "good";
    }
  } catch (error) {
    console.error("Erreur lors du calcul de la santé du système:", error);
    return "warning";
  }
}

async function checkRecentErrors(): Promise<"good" | "warning" | "critical"> {
  // Dans un vrai système, vous pourriez vérifier les logs d'erreurs
  // Pour l'instant, on simule
  return "good";
}

async function checkDatabaseHealth(): Promise<"good" | "warning" | "critical"> {
  try {
    const start = Date.now();
    await prisma.user.findFirst();
    const duration = Date.now() - start;

    if (duration > 1000) {
      return "critical";
    } else if (duration > 500) {
      return "warning";
    } else {
      return "good";
    }
  } catch (error) {
    console.error("Database health check failed:", error);
    return "critical";
  }
}

async function checkSubscriptionIssues(): Promise<
  "good" | "warning" | "critical"
> {
  try {
    const problemSubscriptions = await prisma.subscription.count({
      where: {
        status: {
          in: ["PAST_DUE", "CANCELED", "UNPAID"],
        },
      },
    });

    const totalActiveSubscriptions = await prisma.subscription.count({
      where: {
        status: "ACTIVE",
      },
    });

    if (totalActiveSubscriptions === 0) {
      return "good"; // Pas de problème si pas d'abonnements
    }

    const problemRate = problemSubscriptions / totalActiveSubscriptions;

    if (problemRate > 0.1) {
      // Plus de 10% de problèmes
      return "critical";
    } else if (problemRate > 0.05) {
      // Plus de 5% de problèmes
      return "warning";
    } else {
      return "good";
    }
  } catch (error) {
    console.error("Error checking subscription issues:", error);
    return "warning";
  }
}
