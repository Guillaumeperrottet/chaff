// src/app/dashboard/objet/[id]/sector/[sectorId]/article/[articleId]/page.tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import TasksPage from "./tasks-page";

export default async function ArticleDetailPage({
  params,
}: {
  // params is now a Promise resolving the dynamic route params
  params: Promise<{ id: string; sectorId: string; articleId: string }>;
}) {
  const session = await getUser();
  if (!session) {
    redirect("/signin");
  }

  // await the params promise and destructure the values
  const { id: objetId, sectorId, articleId } = await params;

  // Récupérer l'article avec ses tâches et le secteur parent
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      tasks: {
        where: {
          archived: false, // Filtrer les tâches archivées ici
        },
        include: { assignedTo: true },
        orderBy: { createdAt: "desc" },
      },
      sector: { include: { object: true } },
    },
  });

  if (!article) {
    redirect(`/dashboard/objet/${objetId}/view`);
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });
  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== article.sector.object.organizationId
  ) {
    redirect("/dashboard");
  }

  // Récupérer tous les utilisateurs de l'organisation pour l'attribution des tâches
  const orgUsers = await prisma.organizationUser.findMany({
    where: { organizationId: article.sector.object.organizationId },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const users = orgUsers.map((ou) => ({
    id: ou.user.id,
    name: ou.user.name ?? "",
    email: ou.user.email ?? "",
  }));

  return (
    <TasksPage
      initialTasks={article.tasks}
      users={users}
      articleId={article.id}
      articleTitle={article.title}
      articleDescription={article.description}
      objetId={objetId}
      sectorId={sectorId}
    />
  );
}
