import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextOccurrence, calculateReminderDate } from "@/lib/utils";

export async function GET() {
  console.log("Starting recurring tasks renewal job");
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Trouver toutes les tâches récurrentes dont la date d'échéance est passée,
    // quel que soit leur statut
    const tasksToRenew = await prisma.task.findMany({
      where: {
        recurring: true,
        realizationDate: {
          lt: today,
        },
        OR: [
          { endDate: null }, // Sans date de fin (récurrence infinie)
          { endDate: { gte: today } }, // Date de fin non dépassée
        ],
        // On ne filtre plus sur le statut ici
      },
      include: {
        article: {
          include: {
            sector: {
              include: {
                object: true,
              },
            },
          },
        },
        assignedTo: true,
      },
    });

    console.log(`Found ${tasksToRenew.length} recurring tasks to renew`);

    const renewedTasks = [];

    for (const task of tasksToRenew) {
      try {
        // Calculer la prochaine date d'échéance
        const nextDate = calculateNextOccurrence(
          new Date(task.realizationDate!),
          task.period || "monthly" // Par défaut mensuel si non spécifié
        );

        // Calculer la date de rappel si nécessaire
        let reminderDate = null;
        if (
          (task.period === "quarterly" || task.period === "yearly") &&
          nextDate
        ) {
          reminderDate = calculateReminderDate(nextDate, task.period, 10);
        }

        // Créer une nouvelle tâche avec les mêmes caractéristiques
        // mais avec la nouvelle date d'échéance
        const newTask = await prisma.task.create({
          data: {
            name: task.name,
            description: task.description,
            status: "pending", // Nouvelle tâche, donc en attente
            taskType: task.taskType,
            color: task.color,
            realizationDate: nextDate,
            assignedToId: task.assignedToId,
            recurring: true,
            period: task.period,
            endDate: task.endDate,
            recurrenceReminderDate: reminderDate,
            articleId: task.articleId,
            executantComment: task.executantComment,
          },
        });

        // Mettre à jour la tâche originale en la marquant comme complétée ou archivée
        // selon vos préférences
        await prisma.task.update({
          where: { id: task.id },
          data: {
            archived: true, // Optionnel: archiver l'ancienne tâche
            archivedAt: new Date(),
          },
        });

        renewedTasks.push({
          original: {
            id: task.id,
            name: task.name,
            realizationDate: task.realizationDate,
            status: task.status,
          },
          new: {
            id: newTask.id,
            name: newTask.name,
            realizationDate: newTask.realizationDate,
          },
        });

        // Créer une notification pour l'utilisateur assigné
        if (task.assignedToId) {
          await prisma.notification.create({
            data: {
              userId: task.assignedToId,
              title: "Nouvelle tâche récurrente",
              message: `Une nouvelle instance récurrente de la tâche "${task.name}" a été créée`,
              category: "TASK_RECURRING",
              link: `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${newTask.id}`,
              data: {
                taskId: newTask.id,
                taskName: newTask.name,
                objectName: task.article.sector.object.nom,
                sectorName: task.article.sector.name,
                articleTitle: task.article.title,
                isRecurring: true,
                period: task.period,
                originalTaskId: task.id,
              },
            },
          });
        }
      } catch (error) {
        console.error(`Error renewing task ${task.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      tasksRenewed: renewedTasks.length,
      details: renewedTasks,
    });
  } catch (error) {
    console.error("Error in recurring tasks renewal job:", error);
    return NextResponse.json(
      { error: "Error in recurring tasks renewal job", details: String(error) },
      { status: 500 }
    );
  }
}
