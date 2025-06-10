"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

  // 🔧 États pour éviter les boucles et optimiser les performances
  const [hasCheckedOrganization, setHasCheckedOrganization] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const organizationCheckRef = useRef<Promise<void> | null>(null);
  const lastCheckedUserId = useRef<string | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour vérifier si la page actuelle est publique
  const isPublicPage = useCallback(() => {
    return (
      PUBLIC_PAGES.includes(pathname) ||
      INVITATION_PAGES.some((page) => pathname.startsWith(page)) ||
      pathname.startsWith("/auth/") ||
      pathname.startsWith("/api/")
    );
  }, [pathname]);

  // 🧹 Cleanup function pour nettoyer les timeouts
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Fonction pour vérifier et créer l'organisation si nécessaire
  const ensureUserHasOrganization = useCallback(
    async (userId: string) => {
      // 🛡️ Éviter les appels multiples
      if (organizationCheckRef.current) {
        return organizationCheckRef.current;
      }

      // 🛡️ Ne pas refaire si déjà vérifié pour cette session
      if (hasCheckedOrganization) {
        return;
      }

      const checkPromise = (async () => {
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

          // ✅ Marquer comme vérifié
          setHasCheckedOrganization(true);
        } catch (error) {
          console.error(
            "❌ Erreur lors de la vérification d'organisation:",
            error
          );
          // En cas d'erreur, marquer quand même comme vérifié pour éviter la boucle
          setHasCheckedOrganization(true);
        } finally {
          // 🧹 Nettoyer la référence
          organizationCheckRef.current = null;
        }
      })();

      organizationCheckRef.current = checkPromise;
      return checkPromise;
    },
    [hasCheckedOrganization]
  );

  // 🔧 Reset des états quand l'utilisateur change
  useEffect(() => {
    // Reset seulement si l'utilisateur a vraiment changé
    if (session?.user?.id && session.user.id !== lastCheckedUserId.current) {
      setHasCheckedOrganization(false);
      setIsRedirecting(false);
      lastCheckedUserId.current = session.user.id;
    }
  }, [session?.user?.id]);

  // 🔧 Reset quand la route change vers une page publique
  useEffect(() => {
    if (isPublicPage()) {
      setIsRedirecting(false);
    }
  }, [pathname, isPublicPage]);

  // Initialiser le service de session
  useEffect(() => {
    if (typeof window !== "undefined") {
      SessionService.init();
    }
  }, []);

  // Gestion de l'authentification et des redirections
  useEffect(() => {
    // 🛡️ Éviter les actions si déjà en cours de redirection
    if (isRedirecting) {
      return;
    }

    // Attendre que le chargement soit terminé
    if (isPending) {
      return;
    }

    // Si erreur de session, rediriger vers la connexion
    if (error && !isPublicPage()) {
      console.log("❌ Erreur de session, redirection vers /signin");
      setIsRedirecting(true);
      // 🕐 Délai pour éviter les redirections trop rapides
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/signin");
      }, 100);
      return;
    }

    // Si pas de session et page protégée, rediriger vers signin
    if (!session?.user && !isPublicPage()) {
      console.log("🔐 Pas de session, redirection vers /signin");
      setIsRedirecting(true);
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/signin");
      }, 100);
      return;
    }

    // Si utilisateur connecté sur une page publique d'auth, rediriger vers dashboard
    if (session?.user && (pathname === "/signin" || pathname === "/signup")) {
      console.log("👤 Utilisateur connecté, redirection vers /dashboard");
      setIsRedirecting(true);
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/dashboard");
      }, 100);
      return;
    }

    // 🔧 Vérification organisation uniquement si nécessaire
    if (
      session?.user &&
      !isPublicPage() &&
      !hasCheckedOrganization &&
      !organizationCheckRef.current
    ) {
      ensureUserHasOrganization(session.user.id);
    }
  }, [
    session,
    isPending,
    error,
    pathname,
    router,
    hasCheckedOrganization,
    ensureUserHasOrganization,
    isPublicPage,
    isRedirecting,
  ]);

  // Gestion de l'email non vérifié
  useEffect(() => {
    // 🛡️ Éviter si déjà en redirection
    if (isRedirecting) {
      return;
    }

    if (session?.user && !session.user.emailVerified && !isPublicPage()) {
      console.log("📧 Email non vérifié, redirection vers vérification");
      setIsRedirecting(true);
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/auth/email-verification-required");
      }, 100);
    }
  }, [session, pathname, router, isPublicPage, isRedirecting]);

  // Ce composant ne rend rien, il ne fait que gérer la logique de session
  return null;
}
