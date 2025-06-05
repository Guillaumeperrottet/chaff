"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// Durée d'inactivité maximale en millisecondes (4 heures)
const MAX_INACTIVITY_TIME = 4 * 60 * 60 * 1000;

export function UnifiedSessionManager() {
  const router = useRouter();
  const lastActivityTime = useRef(Date.now());
  const pageHidden = useRef(false);

  useEffect(() => {
    // Fonction pour mettre à jour le temps de dernière activité
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
      localStorage.setItem(
        "lastActivityTime",
        lastActivityTime.current.toString()
      );
    };

    // Fonction pour déconnecter l'utilisateur
    const logoutUser = async () => {
      try {
        await authClient.signOut();
        localStorage.setItem("forceLogout", "true");
        router.push("/");
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
      }
    };

    // Fonction pour vérifier l'inactivité
    const checkInactivity = () => {
      const storedTime = parseInt(
        localStorage.getItem("lastActivityTime") || "0",
        10
      );
      const currentTime = Date.now();
      const lastActive = Math.max(lastActivityTime.current, storedTime || 0);

      if (currentTime - lastActive > MAX_INACTIVITY_TIME) {
        logoutUser();
      }
    };

    // Gestionnaire de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pageHidden.current = true;
        localStorage.setItem("appHiddenAt", Date.now().toString());
      } else if (pageHidden.current) {
        pageHidden.current = false;
        // Vérifier si déconnexion forcée
        const forceLogout = localStorage.getItem("forceLogout");
        if (forceLogout === "true") {
          localStorage.removeItem("forceLogout");
          router.push("/");
        }
        // Vérifier l'inactivité au retour
        checkInactivity();
      }
    };

    // Gestionnaire avant fermeture
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isRefresh = e.preventDefault !== undefined;
      localStorage.setItem(
        "appClosingState",
        isRefresh ? "refresh" : "complete_close"
      );
    };

    // Gestionnaire après chargement
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) {
        const closingState = localStorage.getItem("appClosingState");
        if (closingState === "complete_close") {
          localStorage.removeItem("appClosingState");
          logoutUser();
        } else if (closingState === "refresh") {
          localStorage.removeItem("appClosingState");
        }
      }
    };

    // Initialisation
    if (!localStorage.getItem("sessionId")) {
      localStorage.setItem("sessionId", `session_${Date.now()}`);
    }

    // Vérification initiale
    checkInactivity();
    updateActivity();

    // Événements d'activité utilisateur
    const events = ["mousedown", "keypress", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity);
    });

    // Autres événements
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pageshow", handlePageShow);

    // Vérification périodique
    const intervalId = setInterval(checkInactivity, 60 * 1000);

    // Nettoyage
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pageshow", handlePageShow);
      clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
