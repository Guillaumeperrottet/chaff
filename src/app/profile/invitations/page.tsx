import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GenerateInviteForm from "./generate-invite-form";
import InvitationsList from "./invitations-list";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Shield,
  Link as LinkIcon,
  Calendar,
  Building2,
} from "lucide-react";

export default async function InvitationsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/signin");
  }

  // Vérifiez si l'utilisateur est admin
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  if (!orgUser || orgUser.role !== "admin") {
    redirect("/profile");
  }

  // Récupérez les codes d'invitation actifs
  const invitationCodes = await prisma.invitationCode.findMany({
    where: {
      organizationId: orgUser.organizationId,
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: "desc" },
  });

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
            {/* Bouton retour */}
            <div className="mb-6">
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft
                  size={16}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span>Retour aux utilisateurs</span>
              </Link>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Icône principale avec gradient */}
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur-md"></div>
                  <div className="relative p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Gestion des Invitations
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-slate-600 font-medium">
                        {orgUser.organization.name}
                      </span>
                    </div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                    <span className="text-slate-500">
                      Invitez de nouveaux membres
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations utilisateur admin */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200/50">
                <div className="p-1.5 rounded bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Administrateur
                  </p>
                  <p className="text-xs text-slate-600">{user.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Carte Générer une invitation */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 via-transparent to-blue-50/30 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                    <UserPlus size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      Inviter de nouveaux membres
                    </h2>
                    <p className="text-sm text-slate-600">
                      Générez un code d&apos;invitation sécurisé
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <GenerateInviteForm
                  organizationId={orgUser.organizationId}
                  userId={user.id}
                />
              </div>
            </div>
          </div>

          {/* Carte Codes d'invitation actifs */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/30 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <LinkIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      Codes d&apos;invitation actifs
                    </h2>
                    <p className="text-sm text-slate-600">
                      Gérez vos invitations en cours
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <InvitationsList
                  invitationCodes={invitationCodes}
                  organizationName={orgUser.organization.name}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section d'aide et conseils */}
        <div className="mt-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50/50 via-transparent to-pink-50/30 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Comment ça fonctionne
                    </h3>
                    <p className="text-sm text-slate-600">
                      Guide d&apos;utilisation des invitations
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 flex-shrink-0">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        1
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 mb-1">
                        Générez un code
                      </h4>
                      <p className="text-sm text-slate-600">
                        Choisissez le rôle et générez un code d&apos;invitation
                        sécurisé
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        2
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 mb-1">
                        Partagez le lien
                      </h4>
                      <p className="text-sm text-slate-600">
                        Envoyez le lien d&apos;invitation à vos futurs
                        collaborateurs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 flex-shrink-0">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        3
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 mb-1">
                        Ils rejoignent
                      </h4>
                      <p className="text-sm text-slate-600">
                        Les invités créent leur compte et rejoignent votre
                        organisation
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/30">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Conseil de sécurité
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Les codes d&apos;invitation expirent automatiquement
                        pour garantir la sécurité de votre organisation.
                        Partagez-les uniquement avec des personnes de confiance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
