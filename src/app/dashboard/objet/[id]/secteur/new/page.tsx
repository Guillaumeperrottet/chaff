// src/app/dashboard/objet/[id]/secteur/new/page.tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewSectorForm from "@/app/dashboard/objet/[id]/secteur/new/new-sector-form";

export default async function NewSectorPage({
  params,
}: {
  // Typage mis à jour : params est une Promise qui résout { id: string }
  params: Promise<{ id: string }>;
}) {
  const session = await getUser();
  if (!session) {
    redirect("/signin");
  }

  // Récupération de l'ID depuis la promesse
  const { id: objetId } = await params;

  // Récupérer l'objet
  const objet = await prisma.objet.findUnique({
    where: { id: objetId },
  });
  if (!objet) {
    redirect("/dashboard");
  }

  // Vérifier l'appartenance organisationnelle
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });
  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== objet.organizationId
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/objet/${objetId}/edit`}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">
            Ajouter un secteur à {objet.nom}
          </h1>
        </div>
      </div>

      <NewSectorForm objetId={objetId} />
    </div>
  );
}
