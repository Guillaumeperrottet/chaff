import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import Image from "next/image";
import DeleteObjectButton from "@/app/dashboard/objet/[id]/edit/delete-object-button";
import EditableField from "@/app/components/ui/EditableField";

export default async function ObjetEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  const { id: objetId } = await params;

  // Récupérer l'objet avec ses secteurs
  const objet = await prisma.objet.findUnique({
    where: { id: objetId },
    include: {
      sectors: {
        orderBy: { createdAt: "asc" },
      },
      organization: true,
    },
  });

  if (!objet) {
    redirect("/dashboard");
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
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

  // Vérifier si l'utilisateur est admin
  const isAdmin = await prisma.organizationUser.findFirst({
    where: {
      userId: session.id,
      organizationId: objet.organizationId,
      role: "admin",
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-[color:var(--muted)] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
            Modifier : {objet.nom}
          </h1>
        </div>
      </div>

      <div className="bg-background rounded-lg border border-[color:var(--border)] p-6 mb-6 shadow-sm">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-[color:var(--foreground)]">
              Informations générales
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[color:var(--foreground)]">
                  Nom
                </label>
                <EditableField
                  initialValue={objet.nom}
                  fieldName="nom"
                  label="Nom"
                  objectId={objetId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[color:var(--foreground)]">
                  Adresse
                </label>
                <EditableField
                  initialValue={objet.adresse}
                  fieldName="adresse"
                  label="Adresse"
                  objectId={objetId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[color:var(--foreground)]">
                  Activité
                </label>
                <EditableField
                  initialValue={objet.secteur}
                  fieldName="secteur"
                  label="Activité"
                  objectId={objetId}
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4 text-[color:var(--foreground)]">
              Organisation
            </h2>
            <p className="font-medium text-[color:var(--foreground)]">
              {objet.organization.name}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="border-t border-[color:var(--border)] pt-4 mt-4">
            <DeleteObjectButton objetId={objetId} objetName={objet.nom} />
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
            Secteurs ({objet.sectors.length})
          </h2>
          <Link
            href={`/dashboard/objet/${objetId}/secteur/new`}
            className="flex items-center gap-2 text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 font-medium transition"
          >
            <Plus size={16} />
            <span>Ajouter un secteur</span>
          </Link>
        </div>

        {objet.sectors.length === 0 ? (
          <div className="text-center py-12 bg-[color:var(--muted)] rounded-lg border border-[color:var(--border)]">
            <p className="text-[color:var(--muted-foreground)] mb-4">
              Aucun secteur n&apos;a été créé pour cet objet.
            </p>
            <Link
              href={`/dashboard/objet/${objetId}/secteur/new`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90 transition"
            >
              <Plus size={16} />
              <span>Ajouter un secteur</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objet.sectors.map((sector) => (
              <Link
                key={sector.id}
                href={`/dashboard/objet/${objetId}/view`}
                className="block bg-background rounded-lg border border-[color:var(--border)] overflow-hidden hover:shadow-md transition"
              >
                <div className="relative w-full h-40">
                  <Image
                    src={sector.image || "/placeholder-image.jpg"}
                    alt={sector.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 text-[color:var(--foreground)]">
                    {sector.name}
                  </h3>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-[color:var(--muted-foreground)]">
                      {new Date(sector.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[color:var(--primary)] text-sm font-medium">
                      Voir détails
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
