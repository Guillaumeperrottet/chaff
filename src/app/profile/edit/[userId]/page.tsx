// src/app/profile/edit/[userId]/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteUserButton } from "../delete-user-button";
import { UserRoleSelector } from "../user-role-selector";
import { Button } from "@/app/components/ui/button";
import {
  ArrowLeft,
  Shield,
  User as UserIcon,
  Lock,
  Mail,
  Calendar,
  Crown,
  Building2,
} from "lucide-react";
import Image from "next/image";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const currentUser = await getUser();

  if (!currentUser) {
    redirect("/signin");
  }

  const currentUserOrg = await prisma.organizationUser.findFirst({
    where: { userId: currentUser.id },
    include: { organization: true },
  });

  if (!currentUserOrg || currentUserOrg.role !== "admin") {
    redirect("/profile");
  }

  const userToEdit = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userToEdit) {
    redirect("/profile/edit");
  }

  const userToEditOrg = await prisma.organizationUser.findFirst({
    where: {
      userId: userToEdit.id,
      organizationId: currentUserOrg.organizationId,
    },
  });

  if (!userToEditOrg) {
    redirect("/profile/edit");
  }

  const isCurrentUser = currentUser.id === userToEdit.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Header minimaliste */}
      <div className="border-b border-slate-200/50 bg-white/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Retour à la liste des utilisateurs</span>
            </Link>
          </div>

          {/* Profil utilisateur */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                {userToEdit.image ? (
                  <Image
                    src={userToEdit.image}
                    alt={userToEdit.name || ""}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-slate-600">
                    {userToEdit.name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              {userToEditOrg.role === "admin" && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Crown size={12} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-800">
                  {userToEdit.name || "Utilisateur sans nom"}
                </h1>
                {isCurrentUser && (
                  <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                    C&apos;est vous
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Mail size={14} />
                  <span className="truncate max-w-xs">{userToEdit.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 size={14} />
                  <span className="truncate">
                    {currentUserOrg.organization.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>
                    Membre depuis{" "}
                    {new Date(userToEditOrg.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gestion des rôles */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-lg shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Shield size={18} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">
                    Gestion des rôles
                  </h2>
                  <p className="text-sm text-slate-600">
                    Définir les permissions de l&apos;utilisateur
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Rôle dans l&apos;organisation
                  </label>
                  <UserRoleSelector
                    userId={userToEdit.id}
                    currentRole={userToEditOrg.role}
                    isCurrentUser={isCurrentUser}
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-800 mb-2">
                    Permissions
                  </h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    {userToEditOrg.role === "admin" ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Gérer les membres de l&apos;organisation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>
                            Modifier les paramètres de l&apos;organisation
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Inviter de nouveaux membres</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Accès complet aux données</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Accès aux données de l&apos;organisation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Modifier son profil personnel</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                          <span className="text-slate-500">
                            Gestion des membres (non autorisé)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                          <span className="text-slate-500">
                            Paramètres organisation (non autorisé)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations du compte */}
          <div className="space-y-6">
            {/* Détails du compte */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-lg shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <UserIcon size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800">
                      Informations du compte
                    </h2>
                    <p className="text-sm text-slate-600">
                      Détails de l&apos;utilisateur
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Nom complet</span>
                    <p className="font-medium text-slate-800">
                      {userToEdit.name || "Non défini"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email</span>
                    <p className="font-medium text-slate-800 truncate">
                      {userToEdit.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Rôle actuel</span>
                    <div className="mt-1">
                      {userToEditOrg.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                          <Crown size={10} />
                          Administrateur
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                          <UserIcon size={10} />
                          Membre
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Statut</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Actif
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="text-sm">
                    <span className="text-slate-500">Membre depuis</span>
                    <p className="font-medium text-slate-800">
                      {new Date(userToEditOrg.createdAt).toLocaleDateString(
                        "fr-FR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone de danger */}
            <div className="bg-white/80 backdrop-blur-sm border border-red-200/60 rounded-lg shadow-sm">
              <div className="p-6 border-b border-red-100 bg-red-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <Lock size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-red-800">
                      Zone de danger
                    </h2>
                    <p className="text-sm text-red-600">
                      Actions irréversibles
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-slate-800 mb-2">
                      {isCurrentUser
                        ? "Quitter l'organisation"
                        : "Supprimer l'utilisateur"}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      {isCurrentUser
                        ? "Vous êtes sur le point de vous retirer de l'organisation. Cette action est irréversible et vous perdrez tous vos accès."
                        : "En supprimant cet utilisateur, vous le retirez définitivement de l'organisation. Cette action est irréversible."}
                    </p>
                  </div>

                  <DeleteUserButton
                    userId={userToEdit.id}
                    userName={userToEdit.name || "cet utilisateur"}
                    isCurrentUser={isCurrentUser}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton de retour en bas */}
        <div className="mt-8 flex justify-center">
          <Button
            asChild
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50"
          >
            <Link href="/profile/edit">
              <ArrowLeft size={16} className="mr-2" />
              Retour à la liste des utilisateurs
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
