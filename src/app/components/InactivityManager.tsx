// src/app/components/InactivityManager.tsx
"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// Durée d'inactivité maximale en millisecondes (4 heures)
const MAX_INACTIVITY_TIME = 4 * 60 * 60 * 1000;

export function InactivityManager() {
  const router = useRouter();
  const lastActivityTime = useRef(Date.now());

  useEffect(() => {
    // Fonction pour mettre à jour le temps de dernière activité
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
      // Stocker également dans localStorage pour persistance entre les sessions
      window.localStorage.setItem(
        "lastActivityTime",
        lastActivityTime.current.toString()
      );
    };

    // Fonction pour vérifier l'inactivité
    const checkInactivity = () => {
      const storedTime = parseInt(
        window.localStorage.getItem("lastActivityTime") || "0",
        10
      );
      const currentTime = Date.now();

      // Utiliser le temps le plus récent (soit de cette session, soit stocké)
      const lastActive = Math.max(lastActivityTime.current, storedTime || 0);

      // Si plus de 4 heures se sont écoulées depuis la dernière activité
      if (currentTime - lastActive > MAX_INACTIVITY_TIME) {
        // Déconnecter l'utilisateur
        authClient
          .signOut()
          .then(() => {
            // Rediriger vers la page de connexion
            router.push("/signin");
          })
          .catch((error) => {
            console.error("Erreur lors de la déconnexion:", error);
          });
      }
    };

    // Vérifier l'inactivité au chargement initial
    checkInactivity();

    // Mettre à jour l'activité sur les événements utilisateur
    const events = ["mousedown", "keypress", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity);
    });

    // Vérifier périodiquement l'inactivité (toutes les minutes)
    const intervalId = setInterval(checkInactivity, 60 * 1000);

    // Mettre à jour l'activité initiale
    updateActivity();

    // Nettoyer les écouteurs lors du démontage
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(intervalId);
    };
  }, [router]);

  return null; // Ce composant ne rend rien visuellement
}
