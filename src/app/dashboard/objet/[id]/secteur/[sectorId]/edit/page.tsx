// src/app/dashboard/objet/[id]/secteur/[sectorId]/edit/page.tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import ArticleEditor from "./article-editor";

export default async function EditSectorPage({
  params,
}: {
  // Typage mis à jour : params est une Promise qui résout { id: string; sectorId: string }
  params: Promise<{ id: string; sectorId: string }>;
}) {
  const session = await getUser();
  if (!session) {
    redirect("/signin");
  }

  // Récupération des IDs depuis la promesse
  const { id: objetId, sectorId } = await params;

  // Récupérer le secteur
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    include: {
      object: true,
      articles: true,
    },
  });

  if (!sector) {
    redirect(`/dashboard/objet/${objetId}/edit`);
  }

  // Vérifier l'appartenance organisationnelle
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });
  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== sector.object.organizationId
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        <ArticleEditor
          sectorId={sectorId}
          initialArticles={sector.articles}
          imageWidth={sector.imageWidth}
          imageHeight={sector.imageHeight}
          imageSrc={sector.image || "/placeholder-image.jpg"}
          imageAlt={sector.name}
        />
      </div>
    </div>
  );
}
