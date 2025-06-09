import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditName from "./edit-name";
import EditOrganizationName from "./edit-organization-name";
import ChangePasswordForm from "./change-password-form";
import UpdateProfileImage from "./UpdateProfileImage";
import {
  User,
  Building2,
  Shield,
  Bell,
  Users,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  Crown,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/signin");

  // Récupérer l'organisation de l'utilisateur avec son rôle
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  // Vérifier si l'utilisateur est admin
  const isAdmin = orgUser?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header avec glassmorphism et accent financier */}
      <div className="relative overflow-hidden">
        {/* Arrière-plan avec motif subtil */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-indigo-600/5 to-slate-600/3"></div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='6' cy='6' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Contenu du header */}
        <div className="relative border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="relative group">
                {/* Cercle de fond avec effet subtil */}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 shadow-lg">
                  <UpdateProfileImage
                    initialImage={user.image ?? null}
                    userName={user.name ?? ""}
                  />
                </div>
              </div>

              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {user.name || "Utilisateur"}
                  </h1>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold shadow-lg self-center sm:self-auto">
                      <Crown size={14} className="text-yellow-200" />
                      <span>Administrateur</span>
                    </div>
                  )}
                </div>
                <p className="text-slate-600 text-lg flex items-center gap-2 justify-center sm:justify-start">
                  <div className="p-1 rounded bg-blue-50">
                    <Mail size={16} className="text-blue-600" />
                  </div>
                  {user.email}
                </p>
                {orgUser?.organization && (
                  <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                    <div className="p-1 rounded bg-emerald-50">
                      <Building2 size={16} className="text-emerald-600" />
                    </div>
                    <span className="text-slate-600 font-medium">
                      {orgUser.organization.name}
                    </span>
                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                    <span className="text-slate-500 text-sm">
                      {isAdmin ? "Administrateur" : "Membre"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation cards avec couleurs financières */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/profile/edit"
            className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-blue-200/60"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
                <Users size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                  Utilisateurs
                </h3>
                <p className="text-sm text-slate-600">Gérer l&apos;équipe</p>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
              />
            </div>
          </Link>

          <Link
            href="/profile/notifications"
            className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-emerald-200/60"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 group-hover:from-emerald-100 group-hover:to-emerald-200 transition-all">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  Notifications
                </h3>
                <p className="text-sm text-slate-600">Préférences</p>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"
              />
            </div>
          </Link>

          <Link
            href="/profile/subscription"
            className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-amber-200/60"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 group-hover:from-amber-100 group-hover:to-amber-200 transition-all">
                <Sparkles size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
                  Abonnement
                </h3>
                <p className="text-sm text-slate-600">Plan actuel</p>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all"
              />
            </div>
          </Link>

          <Link
            href="/features"
            className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-200/60"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 group-hover:from-purple-100 group-hover:to-purple-200 transition-all">
                <TrendingUp size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 group-hover:text-purple-700 transition-colors">
                  Feedback
                </h3>
                <p className="text-sm text-slate-600">Améliorer l&apos;app</p>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all"
              />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Carte Informations personnelles avec design financier */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/30 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      Informations personnelles
                    </h2>
                    <p className="text-sm text-slate-600">
                      Gérez vos données de profil
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-5">
                  <div className="group/field">
                    <label className="font-medium mb-3 text-slate-700 flex items-center gap-2">
                      <div className="p-1 rounded bg-blue-50">
                        <User size={14} className="text-blue-600" />
                      </div>
                      Nom complet
                    </label>
                    <div className="transition-transform group-hover/field:scale-[1.01]">
                      <EditName initialName={user.name ?? ""} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      Cliquez pour modifier votre nom
                    </p>
                  </div>

                  <div className="group/field">
                    <label className="font-medium mb-3 text-slate-700 flex items-center gap-2">
                      <div className="p-1 rounded bg-emerald-50">
                        <Mail size={14} className="text-emerald-600" />
                      </div>
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={user.email ?? ""}
                      disabled
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 bg-slate-50/70 text-slate-600 text-sm backdrop-blur-sm"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      L&apos;email ne peut pas être modifié pour des raisons de
                      sécurité
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1 rounded bg-red-50">
                      <Lock size={14} className="text-red-600" />
                    </div>
                    <h3 className="font-medium text-slate-700">
                      Sécurité du compte
                    </h3>
                  </div>
                  <ChangePasswordForm />
                </div>
              </div>
            </div>
          </div>

          {/* Carte Organisation avec design financier */}
          {orgUser?.organization && (
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 via-transparent to-blue-50/30 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                        <Building2 size={20} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800">
                          Organisation
                        </h2>
                        <p className="text-sm text-slate-600">
                          Paramètres de l&apos;entreprise
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold shadow-lg">
                        <Shield size={12} />
                        <span>Admin</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="group/field">
                    <label className="font-medium mb-3 text-slate-700 flex items-center gap-2">
                      <div className="p-1 rounded bg-emerald-50">
                        <Building2 size={14} className="text-emerald-600" />
                      </div>
                      Nom de l&apos;organisation
                    </label>
                    <div className="transition-transform group-hover/field:scale-[1.01]">
                      <EditOrganizationName
                        initialName={orgUser.organization.name}
                        organizationId={orgUser.organization.id}
                        isAdmin={isAdmin}
                      />
                    </div>
                    {isAdmin && (
                      <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        En tant qu&apos;administrateur, vous pouvez modifier le
                        nom
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50/80 to-blue-50/40 border border-slate-150">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-br from-blue-50 to-blue-100">
                        {isAdmin ? (
                          <Shield size={16} className="text-blue-600" />
                        ) : (
                          <User size={16} className="text-slate-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Votre rôle</p>
                        <p className="text-sm text-slate-600 capitalize">
                          {isAdmin ? "Administrateur" : "Membre"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isAdmin
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isAdmin ? "Accès complet" : "Accès standard"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
