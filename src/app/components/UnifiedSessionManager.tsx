"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-client";
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

  // 🔧 États pour éviter les boucles
  const [isRedirecting, setIsRedirecting] = useState(false);
  const checkedUserIds = useRef(new Set<string>()); // ✨ useRef pour éviter re-renders
  const organizationCheckRef = useRef<Promise<void> | null>(null);

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
      // 🛡️ Si déjà vérifié pour cet utilisateur, ne pas refaire
      if (checkedUserIds.current.has(userId)) {
        console.log("✅ Organisation déjà vérifiée pour:", userId);
        return;
      }

      // 🛡️ Éviter les appels multiples simultanés
      if (organizationCheckRef.current) {
        console.log("⏳ Vérification déjà en cours, attente...");
        return organizationCheckRef.current;
      }

      const checkPromise = (async () => {
        try {
          // console.log("🔍 Vérification de l'organisation pour:", userId);

          const response = await fetch("/api/users/organization-check");
          if (!response.ok) {
            throw new Error(`Erreur ${response.status}`);
          }

          const data = await response.json();
          // console.log("📊 Résultat vérification organisation:", data);

          // ✅ TOUJOURS marquer comme vérifié, même si tout va bien
          checkedUserIds.current.add(userId);

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
          } else {
            // console.log("✅ Utilisateur a déjà une organisation valide");
          }
        } catch (error) {
          console.error(
            "❌ Erreur lors de la vérification d'organisation:",
            error
          );
          // ✅ Marquer comme vérifié même en cas d'erreur pour éviter la boucle
          checkedUserIds.current.add(userId);
        } finally {
          // 🧹 Nettoyer la référence
          organizationCheckRef.current = null;
        }
      })();

      organizationCheckRef.current = checkPromise;
      return checkPromise;
    },
    [] // ✨ Pas de dépendances car on utilise des refs
  );

  // 🔧 Nettoyer le Set quand l'utilisateur change
  useEffect(() => {
    if (session?.user?.id) {
      // Ne garder que l'utilisateur actuel dans le Set
      checkedUserIds.current.clear();
    }
  }, [session?.user?.id]);

  // 🔧 Reset la redirection quand la route change vers une page publique
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

  // 🔧 EFFET PRINCIPAL - Gestion de l'authentification
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
      router.push("/signin");
      return;
    }

    // Si pas de session et page protégée, rediriger vers signin
    if (!session?.user && !isPublicPage()) {
      console.log("🔐 Pas de session, redirection vers /signin");
      setIsRedirecting(true);
      router.push("/signin");
      return;
    }

    // Si utilisateur connecté sur une page publique d'auth, rediriger vers dashboard
    if (session?.user && (pathname === "/signin" || pathname === "/signup")) {
      console.log("👤 Utilisateur connecté, redirection vers /dashboard");
      console.log("Session user:", session.user);
      console.log("Current pathname:", pathname);
      console.log("📍 Début de la redirection...");
      setIsRedirecting(true);

      // Ajouter un délai pour voir si la redirection se fait
      setTimeout(() => {
        console.log("🚀 Exécution de router.push('/dashboard')");
        router.push("/dashboard");
      }, 1000);
      return;
    }

    // 🔧 Vérification email
    if (session?.user && !session.user.emailVerified && !isPublicPage()) {
      console.log("📧 Email non vérifié, redirection vers vérification");
      setIsRedirecting(true);
      router.push("/auth/email-verification-required");
      return;
    }

    // 🔧 Vérification organisation - UNIQUEMENT si pas encore vérifiée
    if (
      session?.user &&
      !isPublicPage() &&
      !checkedUserIds.current.has(session.user.id) &&
      !organizationCheckRef.current
    ) {
      // console.log(
      //   "🏢 Lancement vérification organisation pour:",
      //   session.user.id
      // );
      ensureUserHasOrganization(session.user.id);
    }
  }, [
    session,
    isPending,
    error,
    pathname,
    router,
    ensureUserHasOrganization,
    isPublicPage,
    isRedirecting,
  ]);

  // Ce composant ne rend rien, il ne fait que gérer la logique de session
  return null;
}
