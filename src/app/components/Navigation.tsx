"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, Plus, Home, LogOut, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/hooks/useSession";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/auth/sign-in";
        },
      },
    });
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const linkClasses = (path: string) =>
    `flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? "bg-blue-100 text-blue-700"
        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
    }`;

  // Ne pas afficher la navigation si pas connecté ou en cours de chargement
  if (isPending) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Campus</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!session) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Campus</span>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/auth/sign-in" className="btn-primary">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Campus</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/" className={linkClasses("/")}>
              <Home className="h-4 w-4" />
              <span>Tableau de bord</span>
            </Link>

            <Link href="/valeurs" className={linkClasses("/valeurs")}>
              <BarChart3 className="h-4 w-4" />
              <span>Valeurs journalières</span>
            </Link>

            <Link href="/mandats" className={linkClasses("/mandats")}>
              <Building2 className="h-4 w-4" />
              <span>Mandats</span>
            </Link>

            <Link
              href="/valeurs/nouvelle"
              className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle valeur</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User className="h-4 w-4" />
              <span>Bonjour {session.user.name || session.user.email}!</span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
