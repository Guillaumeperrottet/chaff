import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UsersTable } from "@/app/profile/edit/users-table";
import { Button } from "@/app/components/ui/button";
import { BackButton } from "@/app/components/ui/BackButton";
import { PlusCircle, Users, UserCheck, Building2, Crown } from "lucide-react";

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

  // Calculer les statistiques
  const totalMembers = orgUsers.length;
  const adminCount = orgUsers.filter((ou) => ou.role === "admin").length;
  const memberCount = orgUsers.filter((ou) => ou.role === "member").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header avec design financier */}
      <div className="relative overflow-hidden">
        {/* Arrière-plan avec motif subtil */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-indigo-600/5 to-slate-600/3"></div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='6' cy='6' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        <div className="relative border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-6">
              <BackButton
                href="/profile"
                label="Retour au profil"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Icône principale avec gradient */}
                <div className="relative">
                  <div className="relative p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Gestion des Utilisateurs
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-slate-600 font-medium">
                        {organization?.name || "Organisation"}
                      </span>
                    </div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                    <span className="text-slate-500">
                      {totalMembers} membre{totalMembers > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton d'action principal */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  className="bg-blue-500 text-white shadow-lg transition-all duration-300"
                >
                  <Link href="/profile/invitations">
                    <PlusCircle size={16} className="mr-2" />
                    Inviter des membres
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Total des membres */}
          <div className="relative">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total des membres
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {totalMembers}
                  </p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Administrateurs */}
          <div className="relative">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Administrateurs
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {adminCount}
                  </p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Membres standards */}
          <div className="relative">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Membres</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {memberCount}
                  </p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte principale avec la liste des utilisateurs */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
            {/* En-tête de la carte */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    Liste des membres
                  </h2>
                  <p className="text-sm text-slate-600">
                    Gérez les accès et rôles de votre équipe
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu de la carte */}
            <div className="p-6">
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
      </div>
    </div>
  );
}
