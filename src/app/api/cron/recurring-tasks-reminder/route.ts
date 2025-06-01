// src/app/api/cron/recurring-tasks-reminder/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email";

export async function GET() {
  console.log("Starting recurring tasks reminder job");
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Trouver toutes les tâches récurrentes dont la date de rappel est aujourd'hui
    const tasksToRemind = await prisma.task.findMany({
      where: {
        recurring: true,
        recurrenceReminderDate: {
          gte: today,
          lt: tomorrow,
        },
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

    console.log(`Found ${tasksToRemind.length} tasks to remind`);

    // Regrouper les tâches par utilisateur pour envoyer un email par utilisateur
    // Replace 'any[]' with the actual type of your task objects, e.g., 'Task[]'
    // If you don't have a Task type, you can use 'typeof tasksToRemind[number][]'
    const tasksByUser: Record<string, (typeof tasksToRemind)[number][]> = {};

    for (const task of tasksToRemind) {
      if (task.assignedTo) {
        const userId = task.assignedTo.id;

        if (!tasksByUser[userId]) {
          tasksByUser[userId] = [];
        }

        tasksByUser[userId].push(task);
      }
    }

    // Envoyer les emails et stocker les résultats
    const emailResults = [];

    for (const userId in tasksByUser) {
      const tasks = tasksByUser[userId];
      const user = tasks[0].assignedTo; // Récupérer les infos utilisateur depuis la première tâche

      if (user && user.email && user.emailNotificationsEnabled) {
        try {
          await EmailService.sendReminderEmail(
            user.email,
            user.name || "Utilisateur",
            tasks,
            10 // nombre de jours avant échéance
          );

          emailResults.push({
            userId,
            email: user.email,
            success: true,
            taskCount: tasks.length,
          });

          console.log(
            `Reminder email sent to ${user.email} for ${tasks.length} tasks`
          );
        } catch (error) {
          console.error(
            `Failed to send reminder email to ${user.email}:`,
            error
          );

          emailResults.push({
            userId,
            email: user.email,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      tasksReminded: tasksToRemind.length,
      emailsSent: emailResults.length,
      details: emailResults,
    });
  } catch (error) {
    console.error("Error in recurring tasks reminder job:", error);
    return NextResponse.json(
      {
        error: "Error in recurring tasks reminder job",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
