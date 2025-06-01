import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import TaskDetailPage from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/task/[taskId]/task-detail-page";

export default async function TaskPage({
  params,
}: {
  params: Promise<{
    id: string;
    sectorId: string;
    articleId: string;
    taskId: string;
  }>;
}) {
  const session = await getUser();
  if (!session) {
    redirect("/signin");
  }

  const { id: objetId, sectorId, articleId, taskId } = await params;

  // Récupérer la tâche avec tous les détails nécessaires
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

  if (!task) {
    redirect(
      `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}`
    );
  }

  // Vérifier que l'utilisateur appartient à la même organisatio
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== task.article.sector.object.organizationId
  ) {
    redirect("/dashboard");
  }

  // Récupérer les utilisateurs de l'organisation pour l'attribution
  const orgUsers = await prisma.organizationUser.findMany({
    where: { organizationId: task.article.sector.object.organizationId },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const users = orgUsers.map((ou) => ({
    id: ou.user.id,
    name: ou.user.name ?? "",
    email: ou.user.email ?? "",
  }));

  return (
    <TaskDetailPage
      task={task}
      users={users}
      objetId={objetId}
      sectorId={sectorId}
      articleId={articleId}
    />
  );
}
