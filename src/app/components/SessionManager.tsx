// src/app/components/SessionManager.tsx
"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SessionManager() {
  const router = useRouter();

  useEffect(() => {
    let pageHidden = false;

    // Fonction pour déconnecter l'utilisateur
    const logoutUser = async () => {
      try {
        await authClient.signOut();
        // Rediriger vers la page de connexion lors du prochain chargement
        window.localStorage.setItem("forceLogout", "true");
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
      }
    };

    // Gestionnaire d'événement quand la visibilité de la page change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pageHidden = true;
        // Enregistrer le timestamp quand la page est cachée
        window.localStorage.setItem("appHiddenAt", Date.now().toString());
      } else if (pageHidden) {
        pageHidden = false;
        // Si la page était cachée et devient visible à nouveau, vérifier si l'utilisateur s'est déconnecté
        const forceLogout = window.localStorage.getItem("forceLogout");
        if (forceLogout === "true") {
          window.localStorage.removeItem("forceLogout");
          router.push("/signin");
        }
      }
    };

    // Lorsque l'application se recharge après avoir été complètement fermée
    const checkIfWasClosed = () => {
      // Vérifier s'il y avait une navigation active quand l'app a été fermée
      const appClosingState = window.localStorage.getItem("appClosingState");

      if (appClosingState === "complete_close") {
        // L'app a été complètement fermée et non rafraîchie
        window.localStorage.removeItem("appClosingState");
        logoutUser();
      }
    };

    // Fonction appelée juste avant la fermeture de la page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Détecter si c'est un refresh (F5) ou une fermeture
      // Pour un refresh, e.preventDefault() est généralement appelé
      const isRefresh = e.preventDefault !== undefined;

      // Si c'est un refresh, on ne va pas déconnecter
      if (isRefresh) {
        window.localStorage.setItem("appClosingState", "refresh");
      } else {
        window.localStorage.setItem("appClosingState", "complete_close");
      }
    };

    // Écouteur pour détecter si la page se recharge (F5)
    const handlePageShow = (e: PageTransitionEvent) => {
      // Si persisted est true, cela signifie que la page vient du cache (retour/avance)
      // Si false, cela signifie un nouveau chargement
      if (!e.persisted) {
        // C'est un nouveau chargement, vérifier si c'était un refresh
        const closingState = window.localStorage.getItem("appClosingState");
        if (closingState === "refresh") {
          // C'était un refresh, on ne déconnecte pas
          window.localStorage.removeItem("appClosingState");
        }
      }
    };

    // Générer un ID de session
    if (!window.localStorage.getItem("sessionId")) {
      window.localStorage.setItem("sessionId", `session_${Date.now()}`);
    }

    // Exécuter la vérification au chargement
    checkIfWasClosed();

    // Ajouter les écouteurs d'événements
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pageshow", handlePageShow);

    // Nettoyer les écouteurs lors du démontage
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  return null; // Ce composant ne rend rien visuellement
}
