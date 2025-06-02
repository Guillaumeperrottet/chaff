import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { UsersTable } from "@/app/profile/edit/users-table";
import { Users } from "lucide-react";

export default async function ProfileEditPage() {
  const user = await getUser();
  if (!user) {
    redirect("/profile");
  }

  // On récupère l'organisation courante de l'utilisateur connecté
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    select: { organizationId: true, role: true },
  });

  if (!orgUser || orgUser.role !== "admin") {
    redirect("/profile");
  }

  // On récupère tous les utilisateurs de cette organisation avec leur rôle
  const orgUsers = await prisma.organizationUser.findMany({
    where: { organizationId: orgUser.organizationId },
    include: { user: true },
    orderBy: { user: { email: "asc" } },
  });

  // Récupérer le nom de l'organisation
  const organization = await prisma.organization.findUnique({
    where: { id: orgUser.organizationId },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--foreground)]">
              Gestion des Utilisateurs
            </h1>
            <p className="text-[color:var(--muted-foreground)] mt-1">
              {organization?.name || "Organisation"} - {orgUsers.length} membre
              {orgUsers.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[color:var(--border)] bg-[color:var(--muted)]">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-[color:var(--primary)]" />
            <h2 className="text-lg font-medium text-[color:var(--foreground)]">
              Liste des membres
            </h2>
          </div>
        </div>

        <div className="p-1 sm:p-2">
          <UsersTable
            users={orgUsers.map((ou) => ({
              id: ou.user.id,
              email: ou.user.email || "",
              name: ou.user.name || "",
              role: ou.role,
              avatar: ou.user.image,
              isCurrentUser: ou.user.id === user.id,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
