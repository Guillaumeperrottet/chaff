// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkTaskAccess } from "@/lib/auth-session";
import { calculateReminderDate } from "@/lib/utils";
import { NotificationService } from "@/lib/notification-serice";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/tasks/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: { include: { object: true } },
        },
      },
      assignedTo: true,
    },
  });
  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }
  const hasReadAccess = await checkTaskAccess(user.id, taskId, "read");
  if (!hasReadAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour accéder à cette tâche" },
      { status: 403 }
    );
  }

  return NextResponse.json(task);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const {
    name,
    description,
    status,
    taskType,
    color,
    realizationDate,
    assignedToId,
    recurring,
    period,
    endDate,
    executantComment,
    recurrenceReminderDate,
  } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Le nom de la tâche est requis" },
      { status: 400 }
    );
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: { include: { object: true } },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  const hasWriteAccess = await checkTaskAccess(user.id, taskId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cette tâche" },
      { status: 403 }
    );
  }

  // Avant la mise à jour, récupérer l'état actuel
  const currentTask = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      name: true,
      description: true,
      status: true,
      realizationDate: true,
      assignedToId: true,
      done: true,
    },
  });

  // Gérer la date de rappel pour les tâches récurrentes
  let reminderDate = recurrenceReminderDate;

  // Si la tâche devient récurrente ou change de période vers trimestrielle/annuelle
  if (
    realizationDate &&
    // La tâche devient récurrente
    ((recurring && !task.recurring) ||
      // Ou la période change vers un type qui nécessite un rappel
      (recurring &&
        task.recurring &&
        (period === "quarterly" || period === "yearly") &&
        task.period !== "quarterly" &&
        task.period !== "yearly"))
  ) {
    // Si aucune date de rappel n'est fournie explicitement
    if (recurrenceReminderDate === undefined) {
      // Calculer automatiquement si c'est une période qui nécessite un rappel
      if (period === "quarterly" || period === "yearly") {
        reminderDate = calculateReminderDate(
          new Date(realizationDate),
          period,
          10 // 10 jours avant l'échéance
        );
      } else {
        reminderDate = null;
      }
    }
  }
  // Si la tâche n'est plus récurrente ou change vers une période qui ne nécessite pas de rappel
  else if (
    !recurring ||
    (recurring && period !== "quarterly" && period !== "yearly")
  ) {
    reminderDate = null;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      name,
      description,
      status,
      taskType,
      color,
      realizationDate: realizationDate ? new Date(realizationDate) : null,
      assignedToId: assignedToId || null,
      recurring,
      period,
      endDate: endDate ? new Date(endDate) : null,
      executantComment,
      done: status === "completed",
      recurrenceReminderDate: reminderDate,
    },
  });

  // 🆕 NOTIFICATIONS POUR LES MISES À JOUR
  if (currentTask) {
    const changes: string[] = [];

    // Détecter les changements
    if (currentTask.name !== name) changes.push("nom");
    if (currentTask.description !== description) changes.push("description");
    if (currentTask.status !== status) changes.push("statut");
    if (
      currentTask.realizationDate?.getTime() !==
      new Date(realizationDate || "").getTime()
    ) {
      changes.push("date d'échéance");
    }

    // Si la tâche passe à "terminée"
    if (!currentTask.done && status === "completed") {
      await NotificationService.notifyTaskCompleted(
        taskId,
        user.id,
        user.name || "Utilisateur"
      );
    }
    // Sinon, si il y a d'autres changements
    else if (changes.length > 0) {
      await NotificationService.notifyTaskUpdated(
        taskId,
        user.id,
        user.name || "Utilisateur",
        changes
      );
    }
  }

  // Stocker l'ID de l'objet et du secteur pour les invalidations de cache
  const objectId = task.article.sector.object.id;
  const sectorId = task.article.sector.id;

  // Ajouter des headers spécifiques pour indiquer quels caches doivent être invalidés
  const response = NextResponse.json(updatedTask);
  response.headers.set("X-Invalidate-Cache", `tasks_${objectId}`);
  response.headers.set(
    "X-Invalidate-Cache-Keys",
    JSON.stringify([
      `tasks_${objectId}`,
      `article_tasks_${task.article.id}`,
      `sector_tasks_${sectorId}`,
    ])
  );

  return response;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const updateData = await req.json();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: { include: { object: true } },
        },
      },
    },
  });
  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  const hasWriteAccess = await checkTaskAccess(user.id, taskId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cette tâche" },
      { status: 403 }
    );
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  return NextResponse.json(updatedTask);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: { include: { object: true } },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  const hasWriteAccess = await checkTaskAccess(user.id, taskId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour supprimer cette tâche" },
      { status: 403 }
    );
  }

  // Stocker l'ID de l'objet pour les invalidations de cache
  const objectId = task.article.sector.object.id;

  await prisma.task.delete({ where: { id: taskId } });

  // Inclure des métadonnées sur les données à rafraichir
  // Ces informations seront utilisées côté client
  const responseData = {
    success: true,
    deletedTaskId: taskId,
    objectId: objectId,
    refreshKeys: [`tasks_${objectId}`, "agenda_tasks"],
  };

  return NextResponse.json(responseData, { status: 200 });
}
