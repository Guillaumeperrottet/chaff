import { prisma } from "./prisma";

export enum NotificationType {
  TASK_ASSIGNED = "TASK_ASSIGNED",
  TASK_COMPLETED = "TASK_COMPLETED",
  TASK_OVERDUE = "TASK_OVERDUE",
  TASK_DUE_SOON = "TASK_DUE_SOON",
  COMMENT_ADDED = "COMMENT_ADDED",
  TASK_UPDATED = "TASK_UPDATED",
  TASK_DELETED = "TASK_DELETED",
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  USER_ADDED_TO_OBJECT = "USER_ADDED_TO_OBJECT",
  USER_REMOVED_FROM_OBJECT = "USER_REMOVED_FROM_OBJECT",
  RECURRING_TASK_REMINDER = "RECURRING_TASK_REMINDER",
  OBJECT_CREATED = "OBJECT_CREATED",
  SECTOR_CREATED = "SECTOR_CREATED",
  ARTICLE_CREATED = "ARTICLE_CREATED",
}

interface BaseNotificationData {
  objectName?: string;
  sectorName?: string;
  articleTitle?: string;
  taskName?: string;
  taskId?: string;
  authorName?: string;
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
   * Notification quand une tâche est terminée
   */
  static async notifyTaskCompleted(
    taskId: string,
    completedByUserId: string,
    completedByName: string
  ): Promise<void> {
    try {
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
          assignedTo: true,
        },
      });

      if (!task) return;

      // Récupérer tous les utilisateurs ayant accès à cet objet
      const objectAccess = await prisma.objectAccess.findMany({
        where: {
          objectId: task.article.sector.objectId,
          NOT: { accessLevel: "none" },
        },
        include: { user: true },
      });

      // Inclure aussi les admins de l'organisation
      const orgAdmins = await prisma.organizationUser.findMany({
        where: {
          organizationId: task.article.sector.object.organizationId,
          role: "admin",
        },
        include: { user: true },
      });

      const allUsers = [
        ...objectAccess.map((oa) => oa.user),
        ...orgAdmins.map((oa) => oa.user),
      ];
      const uniqueUsers = allUsers.filter(
        (user, index, self) =>
          index === self.findIndex((u) => u.id === user.id) &&
          user.id !== completedByUserId // Ne pas notifier celui qui a terminé la tâche
      );

      const link = `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}`;

      for (const user of uniqueUsers) {
        await this.createNotification({
          userId: user.id,
          type: NotificationType.TASK_COMPLETED,
          title: "Tâche terminée",
          message: `La tâche "${task.name}" a été marquée comme terminée`,
          link,
          data: {
            taskId: task.id,
            taskName: task.name,
            objectName: task.article.sector.object.nom,
            sectorName: task.article.sector.name,
            articleTitle: task.article.title,
            completedBy: completedByName,
          },
        });
      }
    } catch (error) {
      console.error("❌ Erreur notification tâche terminée:", error);
    }
  }

  /**
   * Notification quand un commentaire est ajouté
   */
  static async notifyCommentAdded(
    taskId: string,
    commentAuthorId: string,
    commentAuthorName: string,
    commentContent: string
  ): Promise<void> {
    try {
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
          assignedTo: true,
        },
      });

      if (!task) return;

      // Notifier la personne assignée (si différente de l'auteur du commentaire)
      if (task.assignedToId && task.assignedToId !== commentAuthorId) {
        const link = `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${task.id}`;

        await this.createNotification({
          userId: task.assignedToId,
          type: NotificationType.COMMENT_ADDED,
          title: "Nouveau commentaire",
          message: `${commentAuthorName} a ajouté un commentaire sur "${task.name}"`,
          link,
          data: {
            taskId: task.id,
            taskName: task.name,
            objectName: task.article.sector.object.nom,
            sectorName: task.article.sector.name,
            articleTitle: task.article.title,
            authorName: commentAuthorName,
            commentPreview: commentContent.substring(0, 100),
          },
        });
      }
    } catch (error) {
      console.error("❌ Erreur notification commentaire:", error);
    }
  }

  /**
   * Notification quand une tâche est mise à jour
   */
  static async notifyTaskUpdated(
    taskId: string,
    updatedByUserId: string,
    updatedByName: string,
    changes: string[]
  ): Promise<void> {
    try {
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
          assignedTo: true,
        },
      });

      if (!task) return;

      // Notifier la personne assignée (si différente de celle qui modifie)
      if (task.assignedToId && task.assignedToId !== updatedByUserId) {
        const link = `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${task.id}`;

        await this.createNotification({
          userId: task.assignedToId,
          type: NotificationType.TASK_UPDATED,
          title: "Tâche modifiée",
          message: `${updatedByName} a modifié la tâche "${task.name}"`,
          link,
          data: {
            taskId: task.id,
            taskName: task.name,
            objectName: task.article.sector.object.nom,
            sectorName: task.article.sector.name,
            articleTitle: task.article.title,
            authorName: updatedByName,
            changes: changes,
          },
        });
      }
    } catch (error) {
      console.error("❌ Erreur notification tâche mise à jour:", error);
    }
  }

  /**
   * Notification pour les tâches en retard
   */
  static async notifyOverdueTasks(): Promise<void> {
    try {
      const now = new Date();

      // Récupérer toutes les tâches en retard
      const overdueTasks = await prisma.task.findMany({
        where: {
          realizationDate: {
            lt: now,
          },
          done: false,
          archived: false,
          assignedToId: { not: null },
        },
        include: {
          article: {
            include: {
              sector: {
                include: { object: true },
              },
            },
          },
          assignedTo: true,
        },
      });

      for (const task of overdueTasks) {
        if (!task.assignedTo) continue;

        const link = `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${task.id}`;

        // Vérifier si une notification de retard n'a pas déjà été envoyée dans les 24h
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: task.assignedToId!,
            category: NotificationType.TASK_OVERDUE,
            data: {
              path: ["taskId"],
              equals: task.id,
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h
            },
          },
        });

        if (!existingNotification) {
          await this.createNotification({
            userId: task.assignedToId!,
            type: NotificationType.TASK_OVERDUE,
            title: "Tâche en retard",
            message: `La tâche "${task.name}" est en retard`,
            link,
            data: {
              taskId: task.id,
              taskName: task.name,
              objectName: task.article.sector.object.nom,
              sectorName: task.article.sector.name,
              articleTitle: task.article.title,
              dueDate: task.realizationDate?.toISOString(),
            },
          });
        }
      }
    } catch (error) {
      console.error("❌ Erreur notification tâches en retard:", error);
    }
  }

  /**
   * Notification pour les tâches dues bientôt (dans 2 jours)
   */
  static async notifyTasksDueSoon(): Promise<void> {
    try {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      twoDaysFromNow.setHours(23, 59, 59, 999);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tasksDueSoon = await prisma.task.findMany({
        where: {
          realizationDate: {
            gte: tomorrow,
            lte: twoDaysFromNow,
          },
          done: false,
          archived: false,
          assignedToId: { not: null },
        },
        include: {
          article: {
            include: {
              sector: {
                include: { object: true },
              },
            },
          },
          assignedTo: true,
        },
      });

      for (const task of tasksDueSoon) {
        if (!task.assignedTo) continue;

        const link = `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${task.id}`;

        // Vérifier si une notification n'a pas déjà été envoyée aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: task.assignedToId!,
            category: NotificationType.TASK_DUE_SOON,
            data: {
              path: ["taskId"],
              equals: task.id,
            },
            createdAt: {
              gte: today,
            },
          },
        });

        if (!existingNotification) {
          await this.createNotification({
            userId: task.assignedToId!,
            type: NotificationType.TASK_DUE_SOON,
            title: "Tâche à échéance proche",
            message: `La tâche "${task.name}" est due dans 2 jours`,
            link,
            data: {
              taskId: task.id,
              taskName: task.name,
              objectName: task.article.sector.object.nom,
              sectorName: task.article.sector.name,
              articleTitle: task.article.title,
              dueDate: task.realizationDate?.toISOString(),
            },
          });
        }
      }
    } catch (error) {
      console.error("❌ Erreur notification tâches dues bientôt:", error);
    }
  }

  /**
   * Notification quand un document est ajouté à une tâche
   */
  static async notifyDocumentUploaded(
    taskId: string,
    uploadedByUserId: string,
    uploadedByName: string,
    documentName: string
  ): Promise<void> {
    try {
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
          assignedTo: true,
        },
      });

      if (!task) return;

      // Notifier la personne assignée (si différente de celle qui upload)
      if (task.assignedToId && task.assignedToId !== uploadedByUserId) {
        const link = `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${task.id}`;

        await this.createNotification({
          userId: task.assignedToId,
          type: NotificationType.DOCUMENT_UPLOADED,
          title: "Nouveau document",
          message: `${uploadedByName} a ajouté le document "${documentName}" à la tâche "${task.name}"`,
          link,
          data: {
            taskId: task.id,
            taskName: task.name,
            objectName: task.article.sector.object.nom,
            sectorName: task.article.sector.name,
            articleTitle: task.article.title,
            authorName: uploadedByName,
            documentName: documentName,
          },
        });
      }
    } catch (error) {
      console.error("❌ Erreur notification document:", error);
    }
  }

  /**
   * Notification quand un utilisateur obtient l'accès à un objet
   */
  static async notifyUserAddedToObject(
    userId: string,
    objectId: string,
    accessLevel: string,
    grantedByName: string
  ): Promise<void> {
    try {
      const object = await prisma.objet.findUnique({
        where: { id: objectId },
      });

      if (!object) return;

      const link = `/dashboard/objet/${objectId}/view`;

      await this.createNotification({
        userId,
        type: NotificationType.USER_ADDED_TO_OBJECT,
        title: "Nouvel accès objet",
        message: `Vous avez obtenu l'accès "${accessLevel}" à l'objet "${object.nom}"`,
        link,
        data: {
          objectId: object.id,
          objectName: object.nom,
          accessLevel: accessLevel,
          grantedBy: grantedByName,
        },
      });
    } catch (error) {
      console.error("❌ Erreur notification accès objet:", error);
    }
  }
}
