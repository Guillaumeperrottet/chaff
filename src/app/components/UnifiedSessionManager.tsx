"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/hooks/useSession";
import { useRouter, usePathname } from "next/navigation";
import { SessionService } from "@/lib/session-service";

// Pages publiques qui ne nécessitent pas d'authentification
const PUBLIC_PAGES = [
  "/",
  "/signin",
  "/signup",
  "/pricing",
  "/about",
  "/contact",
  "/auth/verification-success",
  "/auth/verification-failed",
  "/auth/email-verification-required",
];

// Pages d'invitation qui ont leur propre logique
const INVITATION_PAGES = ["/invite", "/join"];

export function UnifiedSessionManager() {
  const { data: session, isPending, error } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(false);

  // Fonction pour vérifier si la page actuelle est publique
  const isPublicPage = useCallback(() => {
    return (
      PUBLIC_PAGES.includes(pathname) ||
      INVITATION_PAGES.some((page) => pathname.startsWith(page)) ||
      pathname.startsWith("/auth/") ||
      pathname.startsWith("/api/")
    );
  }, [pathname]);

  // Fonction pour vérifier et créer l'organisation si nécessaire
  const ensureUserHasOrganization = useCallback(
    async (userId: string) => {
      if (isChecking) return; // Éviter les appels multiples

      setIsChecking(true);
      try {
        console.log("🔍 Vérification de l'organisation pour:", userId);

        const response = await fetch("/api/users/organization-check");
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }

        const data = await response.json();
        console.log("📊 Résultat vérification organisation:", data);

        // Si l'utilisateur n'a pas d'organisation, tenter la récupération
        if (!data.user?.organizationId) {
          console.log(
            "⚠️ Utilisateur sans organisation, tentative de récupération..."
          );

          const recoveryResponse = await fetch(
            "/api/user/organization-recovery",
            {
              method: "POST",
            }
          );

          if (recoveryResponse.ok) {
            const recoveryData = await recoveryResponse.json();
            console.log("✅ Récupération réussie:", recoveryData);
          } else {
            console.error("❌ Échec de la récupération d'organisation");
          }
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors de la vérification d'organisation:",
          error
        );
      } finally {
        setIsChecking(false);
      }
    },
    [isChecking]
  );

  // Initialiser le service de session
  useEffect(() => {
    if (typeof window !== "undefined") {
      SessionService.init();
    }
  }, []);

  // Gestion de l'authentification et des redirections
  useEffect(() => {
    // Attendre que le chargement soit terminé
    if (isPending) return;

    // Si erreur de session, rediriger vers la connexion
    if (error && !isPublicPage()) {
      console.log("❌ Erreur de session, redirection vers /signin");
      router.push("/signin");
      return;
    }

    // Si pas de session et page protégée, rediriger vers signin
    if (!session?.user && !isPublicPage()) {
      console.log("🔐 Pas de session, redirection vers /signin");
      router.push("/signin");
      return;
    }

    // Si utilisateur connecté sur une page publique d'auth, rediriger vers dashboard
    if (session?.user && (pathname === "/signin" || pathname === "/signup")) {
      console.log("👤 Utilisateur connecté, redirection vers /dashboard");
      router.push("/dashboard");
      return;
    }

    // Si utilisateur connecté, vérifier qu'il a une organisation
    if (session?.user && !isPublicPage()) {
      ensureUserHasOrganization(session.user.id);
    }
  }, [
    session,
    isPending,
    error,
    pathname,
    router,
    isChecking,
    ensureUserHasOrganization,
    isPublicPage,
  ]);

  // Gestion de l'email non vérifié
  useEffect(() => {
    if (session?.user && !session.user.emailVerified && !isPublicPage()) {
      console.log("📧 Email non vérifié, redirection vers vérification");
      router.push("/auth/email-verification-required");
    }
  }, [session, pathname, router, isPublicPage]);

  // Ce composant ne rend rien, il ne fait que gérer la logique de session
  return null;
}
