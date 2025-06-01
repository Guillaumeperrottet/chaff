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
  Settings,
  Bell,
  Users,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  Crown,
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
    <div className="min-h-screen bg-gradient-to-br from-[color:var(--background)] via-[color:var(--muted)]/20 to-[color:var(--background)]">
      {/* Header avec effet glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[color:var(--primary)]/10 via-[color:var(--primary)]/5 to-transparent border-b border-[color:var(--border)]/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--primary)]/5 to-transparent opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--primary)]/60 rounded-full blur opacity-20"></div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <UpdateProfileImage
                  initialImage={user.image ?? null}
                  userName={user.name ?? ""}
                />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--foreground)]">
                  {user.name || "Utilisateur"}
                </h1>
                {isAdmin && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-sm font-semibold shadow-lg self-center sm:self-auto">
                    <Crown size={14} />
                    Admin
                  </div>
                )}
              </div>
              <p className="text-[color:var(--muted-foreground)] text-lg flex items-center gap-2">
                <Mail size={16} />
                {user.email}
              </p>
              {orgUser?.organization && (
                <div className="flex items-center gap-2 mt-2">
                  <Building2
                    size={16}
                    className="text-[color:var(--primary)]"
                  />
                  <span className="text-[color:var(--muted-foreground)]">
                    {orgUser.organization.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/profile/edit"
            className="group relative overflow-hidden bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/80 border border-[color:var(--border)] rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-[color:var(--primary)]/30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[color:var(--primary)]/10 text-[color:var(--primary)] group-hover:bg-[color:var(--primary)]/20 transition-colors">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--primary)] transition-colors">
                  Utilisateurs
                </h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Gérer l&apos;équipe
                </p>
              </div>
              <ArrowRight
                size={16}
                className="ml-auto text-[color:var(--muted-foreground)] group-hover:text-[color:var(--primary)] group-hover:translate-x-1 transition-all"
              />
            </div>
          </Link>

          <Link
            href="/profile/notifications"
            className="group relative overflow-hidden bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/80 border border-[color:var(--border)] rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-[color:var(--primary)]/30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[color:var(--primary)]/10 text-[color:var(--primary)] group-hover:bg-[color:var(--primary)]/20 transition-colors">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--primary)] transition-colors">
                  Notifications
                </h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Préférences
                </p>
              </div>
              <ArrowRight
                size={16}
                className="ml-auto text-[color:var(--muted-foreground)] group-hover:text-[color:var(--primary)] group-hover:translate-x-1 transition-all"
              />
            </div>
          </Link>

          <Link
            href="/profile/subscription"
            className="group relative overflow-hidden bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/80 border border-[color:var(--border)] rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-[color:var(--primary)]/30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[color:var(--primary)]/10 text-[color:var(--primary)] group-hover:bg-[color:var(--primary)]/20 transition-colors">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--primary)] transition-colors">
                  Abonnement
                </h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Plan actuel
                </p>
              </div>
              <ArrowRight
                size={16}
                className="ml-auto text-[color:var(--muted-foreground)] group-hover:text-[color:var(--primary)] group-hover:translate-x-1 transition-all"
              />
            </div>
          </Link>

          <Link
            href="/features"
            className="group relative overflow-hidden bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/80 border border-[color:var(--border)] rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-[color:var(--primary)]/30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[color:var(--primary)]/10 text-[color:var(--primary)] group-hover:bg-[color:var(--primary)]/20 transition-colors">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--primary)] transition-colors">
                  Feedback
                </h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Améliorer l&apos;app
                </p>
              </div>
              <ArrowRight
                size={16}
                className="ml-auto text-[color:var(--muted-foreground)] group-hover:text-[color:var(--primary)] group-hover:translate-x-1 transition-all"
              />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Carte Informations personnelles */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[color:var(--primary)]/20 to-[color:var(--primary)]/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-xl shadow-sm backdrop-blur-sm">
              <div className="p-6 border-b border-[color:var(--border)]/50 bg-gradient-to-r from-[color:var(--muted)]/30 to-transparent rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[color:var(--primary)]/10">
                    <User size={20} className="text-[color:var(--primary)]" />
                  </div>
                  <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                    Informations personnelles
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="group/field">
                    <label className="font-medium mb-2 text-[color:var(--foreground)] flex items-center gap-2">
                      <User size={16} className="text-[color:var(--primary)]" />
                      Nom complet
                    </label>
                    <div className="transition-transform group-hover/field:scale-[1.02]">
                      <EditName initialName={user.name ?? ""} />
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--muted-foreground)] flex items-center gap-1">
                      <Settings size={12} />
                      Cliquez pour modifier votre nom
                    </p>
                  </div>

                  <div className="group/field">
                    <label className="font-medium mb-2 text-[color:var(--foreground)] flex items-center gap-2">
                      <Mail size={16} className="text-[color:var(--primary)]" />
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={user.email ?? ""}
                      disabled
                      className="w-full border border-[color:var(--border)] rounded-lg px-4 py-3 bg-[color:var(--muted)]/50 text-[color:var(--muted-foreground)] text-sm backdrop-blur-sm"
                    />
                    <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
                      L&apos;email ne peut pas être modifié
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-[color:var(--border)]/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock size={16} className="text-[color:var(--primary)]" />
                    <h3 className="font-medium text-[color:var(--foreground)]">
                      Sécurité du compte
                    </h3>
                  </div>
                  <ChangePasswordForm />
                </div>
              </div>
            </div>
          </div>

          {/* Carte Organisation */}
          {orgUser?.organization && (
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[color:var(--primary)]/20 to-[color:var(--primary)]/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-xl shadow-sm backdrop-blur-sm">
                <div className="p-6 border-b border-[color:var(--border)]/50 bg-gradient-to-r from-[color:var(--muted)]/30 to-transparent rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[color:var(--primary)]/10">
                        <Building2
                          size={20}
                          className="text-[color:var(--primary)]"
                        />
                      </div>
                      <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                        Organisation
                      </h2>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-xs font-semibold shadow-lg">
                        <Shield size={12} />
                        Administrateur
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="group/field">
                    <label className="font-medium mb-2 text-[color:var(--foreground)] flex items-center gap-2">
                      <Building2
                        size={16}
                        className="text-[color:var(--primary)]"
                      />
                      Nom de l&apos;organisation
                    </label>
                    <div className="transition-transform group-hover/field:scale-[1.02]">
                      <EditOrganizationName
                        initialName={orgUser.organization.name}
                        organizationId={orgUser.organization.id}
                        isAdmin={isAdmin}
                      />
                    </div>
                    {isAdmin && (
                      <p className="mt-2 text-xs text-[color:var(--muted-foreground)] flex items-center gap-1">
                        <Settings size={12} />
                        En tant qu&apos;administrateur, vous pouvez modifier le
                        nom
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[color:var(--muted)]/30 to-transparent border border-[color:var(--border)]/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-[color:var(--primary)]/10">
                        {isAdmin ? (
                          <Shield
                            size={16}
                            className="text-[color:var(--primary)]"
                          />
                        ) : (
                          <User
                            size={16}
                            className="text-[color:var(--muted-foreground)]"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[color:var(--foreground)]">
                          Votre rôle
                        </p>
                        <p className="text-sm text-[color:var(--muted-foreground)] capitalize">
                          {orgUser.role}
                        </p>
                      </div>
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
