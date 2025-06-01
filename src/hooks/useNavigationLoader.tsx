"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useNavigationLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Fonction pour naviguer avec indicateur de chargement
  const navigateWithLoading = useCallback(
    (
      url: string,
      options?: {
        loadingTimeout?: number; // timeout en ms
        onComplete?: () => void; // callback après navigation
      }
    ) => {
      setIsLoading(true);

      // Configurer un timeout pour désactiver le loader si la navigation prend trop de temps
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, options?.loadingTimeout || 5000); // 5 secondes par défaut

      // Naviguer vers l'URL
      router.push(url);

      // Détecter quand la navigation est terminée
      // (approximation, car Next.js ne fournit pas d'événement de navigation complète)
      setTimeout(() => {
        setIsLoading(false);
        clearTimeout(timeout);

        if (options?.onComplete) {
          options.onComplete();
        }
      }, 300); // petit délai pour laisser la page se charger
    },
    [router]
  );

  return {
    isLoading,
    navigateWithLoading,
    setIsLoading, // exposé pour contrôle manuel
  };
}
