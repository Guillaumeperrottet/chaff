"use client";

import { VT323 } from "next/font/google";
import Switch from "@/app/components/ui/switchmode";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import UserMenu from "@/app/components/ui/UserMenu";
import NotificationIndicator from "./NotificationIndicator";
import { useRouter } from "@/lib/router-helper";
import { useCallback } from "react";

interface User {
  id: string;
  role?: string;
  isAdmin?: boolean;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

export default function Navbar({ user }: { user: User }) {
  const isAdmin = user?.role === "admin" || user?.isAdmin;
  const customRouter = useRouter();

  // Fonction optimisée pour la navigation vers le dashboard
  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // 1. Feedback visuel immédiat
      const element = e.currentTarget;
      element.classList.add("active-navigation");

      // 2. Feedback tactile si disponible
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }

      // 3. Navigation avec loader global - amélioration pour garantir qu'il reste visible
      // Nous allons augmenter légèrement le délai du loader pour qu'il reste visible plus longtemps
      customRouter.navigateWithLoading("/dashboard", {
        loadingMessage: "Chargement du dashboard...",
        instantLoader: true,
        // Augmenter le délai minimum à 850ms pour s'assurer que le loader reste visible
        // pendant toute la transition de page
        delay: 150, // Un petit délai avant de commencer la navigation
        onComplete: () => {
          // Nettoyer la classe active après un délai plus long
          setTimeout(() => {
            element.classList.remove("active-navigation");
          }, 200); // Délai légèrement augmenté
        },
      });
    },
    [customRouter]
  );

  return (
    <nav
      className="w-full border-b px-3 md:px-4 py-2 flex justify-between items-center relative z-50"
      style={{
        background: "var(--background)",
        borderColor: "var(--border)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Logo avec gestion optimisée du clic */}
      <a
        href="/dashboard"
        onClick={handleLogoClick}
        className={`text-2xl md:text-4xl font-bold text-[color:var(--foreground)] transition-transform active:scale-95 ${vt323.className}`}
        style={{
          transition: "color 0.3s, transform 0.1s",
        }}
      >
        PlanniKeeper
      </a>

      {/* Reste du code inchangé */}
      <div className="hidden md:flex flex-1 justify-center">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Switch />
        <NotificationIndicator />
        <UserMenu user={user} isAdmin={isAdmin} />
      </div>
    </nav>
  );
}
