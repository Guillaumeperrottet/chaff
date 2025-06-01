import { prisma } from "./prisma";

export enum NotificationType {
  USER_INVITED = "USER_INVITED",
  USER_JOINED = "USER_JOINED",
  ORGANIZATION_UPDATED = "ORGANIZATION_UPDATED",
  SUBSCRIPTION_CHANGED = "SUBSCRIPTION_CHANGED",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
  SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION",
  WELCOME = "WELCOME",
}

interface BaseNotificationData {
  organizationName?: string;
  userName?: string;
  planName?: string;
  [key: string]: unknown;
}

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: BaseNotificationData;
}

export class NotificationService {
  /**
   * Créer une notification générique
   */
  static async createNotification({
    userId,
    type,
    title,
    message,
    link,
    data = {},
  }: NotificationPayload): Promise<void> {
    try {
      // Vérifier si l'utilisateur a activé les notifications
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationsEnabled: true },
      });

      if (!user?.notificationsEnabled) {
        console.log(
          `🔕 Notifications désactivées pour l'utilisateur ${userId}`
        );
        return;
      }

      await prisma.notification.create({
        data: {
          userId,
          category: type,
          title,
          message,
          link,
          data: JSON.parse(JSON.stringify(data)),
        },
      });

      console.log(`✅ Notification ${type} créée pour ${userId}`);
    } catch (error) {
      console.error("❌ Erreur création notification:", error);
    }
  }

  /**
   * Notification de bienvenue pour un nouvel utilisateur
   */
  static async notifyWelcome(
    userId: string,
    userName: string,
    organizationName: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.WELCOME,
      title: "Bienvenue !",
      message: `Bienvenue ${userName} dans ${organizationName} !`,
      link: "/dashboard",
      data: {
        userName,
        organizationName,
      },
    });
  }

  /**
   * Notification quand un utilisateur est invité
   */
  static async notifyUserInvited(
    adminUserId: string,
    invitedEmail: string,
    organizationName: string
  ): Promise<void> {
    await this.createNotification({
      userId: adminUserId,
      type: NotificationType.USER_INVITED,
      title: "Invitation envoyée",
      message: `Invitation envoyée à ${invitedEmail}`,
      link: "/profile/organization",
      data: {
        invitedEmail,
        organizationName,
      },
    });
  }

  /**
   * Notification quand un utilisateur rejoint l'organisation
   */
  static async notifyUserJoined(
    organizationId: string,
    newUserName: string,
    newUserEmail: string
  ): Promise<void> {
    try {
      // Notifier tous les admins de l'organisation
      const admins = await prisma.organizationUser.findMany({
        where: {
          organizationId,
          role: "admin",
        },
        include: { user: true, organization: true },
      });

      for (const admin of admins) {
        await this.createNotification({
          userId: admin.userId,
          type: NotificationType.USER_JOINED,
          title: "Nouveau membre",
          message: `${newUserName} (${newUserEmail}) a rejoint l'organisation`,
          link: "/profile/organization",
          data: {
            newUserName,
            newUserEmail,
            organizationName: admin.organization.name,
          },
        });
      }
    } catch (error) {
      console.error("❌ Erreur notification utilisateur rejoint:", error);
    }
  }

  /**
   * Notification de changement d'abonnement
   */
  static async notifySubscriptionChanged(
    organizationId: string,
    oldPlan: string,
    newPlan: string
  ): Promise<void> {
    try {
      // Notifier tous les utilisateurs de l'organisation
      const orgUsers = await prisma.organizationUser.findMany({
        where: { organizationId },
        include: { user: true, organization: true },
      });

      for (const orgUser of orgUsers) {
        await this.createNotification({
          userId: orgUser.userId,
          type: NotificationType.SUBSCRIPTION_CHANGED,
          title: "Plan mis à jour",
          message: `Le plan de l'organisation est passé de ${oldPlan} à ${newPlan}`,
          link: "/profile/subscription",
          data: {
            oldPlan,
            newPlan,
            organizationName: orgUser.organization.name,
          },
        });
      }
    } catch (error) {
      console.error("❌ Erreur notification changement plan:", error);
    }
  }

  /**
   * Notification d'expiration d'abonnement
   */
  static async notifySubscriptionExpired(
    organizationId: string
  ): Promise<void> {
    try {
      // Notifier tous les admins de l'organisation
      const admins = await prisma.organizationUser.findMany({
        where: {
          organizationId,
          role: "admin",
        },
        include: { user: true, organization: true },
      });

      for (const admin of admins) {
        await this.createNotification({
          userId: admin.userId,
          type: NotificationType.SUBSCRIPTION_EXPIRED,
          title: "Abonnement expiré",
          message:
            "Votre abonnement a expiré. Renouvelez-le pour continuer à utiliser toutes les fonctionnalités.",
          link: "/profile/subscription",
          data: {
            organizationName: admin.organization.name,
          },
        });
      }
    } catch (error) {
      console.error("❌ Erreur notification expiration abonnement:", error);
    }
  }

  /**
   * Notification système générique
   */
  static async notifySystem(
    userId: string,
    title: string,
    message: string,
    link?: string,
    data?: BaseNotificationData
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM_NOTIFICATION,
      title,
      message,
      link,
      data,
    });
  }

  /**
   * Notification pour tous les utilisateurs d'une organisation
   */
  static async notifyOrganization(
    organizationId: string,
    title: string,
    message: string,
    link?: string,
    data?: BaseNotificationData
  ): Promise<void> {
    try {
      const orgUsers = await prisma.organizationUser.findMany({
        where: { organizationId },
        select: { userId: true },
      });

      for (const orgUser of orgUsers) {
        await this.notifySystem(orgUser.userId, title, message, link, data);
      }
    } catch (error) {
      console.error("❌ Erreur notification organisation:", error);
    }
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
    } catch (error) {
      console.error("❌ Erreur marquer notifications comme lues:", error);
    }
  }

  /**
   * Supprimer les anciennes notifications (plus de 30 jours)
   */
  static async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          read: true,
        },
      });

      console.log("🧹 Anciennes notifications supprimées");
    } catch (error) {
      console.error("❌ Erreur nettoyage notifications:", error);
    }
  }
}
