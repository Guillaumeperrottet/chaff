// src/app/dashboard/objet/[id]/view/page.tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SectorViewer from "@/app/dashboard/objet/[id]/view/sector-viewer";

export default async function ObjetViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getUser();
  if (!session) {
    redirect("/signin");
  }

  // Récupération de l'ID depuis la promesse
  const { id: objetId } = await params;

  // Récupérer l'objet avec ses secteurs
  const objet = await prisma.objet.findUnique({
    where: { id: objetId },
    include: {
      sectors: {
        orderBy: { name: "asc" },
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

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      {/* Header - vous pourriez ajouter un en-tête mobile ici si nécessaire */}

      {/* Content */}
      {objet.sectors.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-background px-4 sm:px-6">
          <div className="text-center p-4 sm:p-6 max-w-md mx-auto">
            <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">
              Aucun secteur trouvé
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Ajoutez des secteurs à cet objet pour les visualiser ici.
            </p>
            <Link
              href={`/dashboard/objet/${objetId}/secteur/new`}
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-primary text-primary-foreground rounded-md hover:bg-primary/90 w-full sm:w-auto justify-center"
            >
              Ajouter un secteur
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full">
          <SectorViewer
            sectors={objet.sectors.map((sector) => ({
              ...sector,
              image: sector.image || "", // Convert null to empty string
            }))}
            objetId={objetId}
          />
        </div>
      )}

      {/* On pourrait ajouter un footer adaptatif ici si nécessaire */}
    </div>
  );
}
