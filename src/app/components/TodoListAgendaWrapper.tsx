// src/app/components/TodoListAgendaWrapper.tsx - Modifié avec la fonction de mise à jour de tâches
"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTasks } from "@/hooks/useData";
import { useTaskUpdates } from "@/hooks/useTaskUpdates"; // Nouveau hook

// Import dynamique du composant TodoListAgenda
const TodoListAgenda = dynamic(() => import("./TodoListAgenda"), {
  ssr: false,
});

// Définir un dataVersion pour le suivi des changements
const DATA_VERSION_KEY = "plannikeeper-data-version";

export default function TodoListAgendaWrapper() {
  const [selectedObjectId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false); // État pour détecter si on est sur mobile

  // Utiliser le hook useTasks
  const { mutate } = useTasks(selectedObjectId);

  // Utiliser le nouveau hook pour les mises à jour de tâches
  const { updateTaskDate, isUpdating } = useTaskUpdates({
    onSuccess: () => {
      // Rafraîchir les données après une mise à jour réussie
      refreshDataSilently();
    },
  });

  // Détection du mode mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Fonction pour rafraîchir les données silencieusement
  const refreshDataSilently = useCallback(async () => {
    // Éviter les rafraîchissements simultanés
    if (isRefreshing || isUpdating) return Promise.resolve();

    setIsRefreshing(true);

    try {
      // Invalider et recharger les données
      await mutate();

      // Incrémenter la version des données pour forcer un re-rendu
      const newVersion = dataVersion + 1;
      setDataVersion(newVersion);

      // Stocker la nouvelle version dans localStorage
      localStorage.setItem(DATA_VERSION_KEY, newVersion.toString());

      return Promise.resolve(); // Résoudre la promesse en cas de succès
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
      return Promise.reject(error); // Rejeter la promesse en cas d'erreur
    } finally {
      setIsRefreshing(false);
    }
  }, [dataVersion, mutate, isRefreshing, isUpdating]);

  // Écouter les événements de visibilité pour rafraîchir les données
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshDataSilently();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshDataSilently]);

  // Récupérer la version des données stockée lors du montage
  useEffect(() => {
    const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
    if (storedVersion) {
      setDataVersion(parseInt(storedVersion, 10));
    }
  }, []);

  // Force un rafraîchissement périodique en mode PWA
  useEffect(() => {
    // Définir un type personnalisé pour navigator avec la propriété standalone
    interface NavigatorWithStandalone extends Navigator {
      standalone?: boolean;
    }
    // Vérifier si nous sommes en PWA
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true;

    if (isPWA) {
      // Rafraîchir les données toutes les 5 minutes en mode PWA
      const interval = setInterval(
        () => {
          if (document.visibilityState === "visible") {
            refreshDataSilently();
          }
        },
        5 * 60 * 1000
      ); // 5 minutes

      return () => clearInterval(interval);
    }

    // Ajouter un rafraîchissement périodique même en mode non-PWA mais moins fréquent
    const interval = setInterval(
      () => {
        if (document.visibilityState === "visible") {
          refreshDataSilently();
        }
      },
      10 * 60 * 1000
    ); // 10 minutes

    return () => clearInterval(interval);
  }, [refreshDataSilently]);

  // Handler pour le rafraîchissement manuel
  const handleRefresh = useCallback(() => {
    refreshDataSilently();
  }, [refreshDataSilently]);

  // Handler pour mettre à jour la date d'une tâche (utilisé pour le drag and drop)
  const handleUpdateTaskDate = useCallback(
    async (taskId: string, newDate: Date): Promise<void> => {
      if (isMobile) return; // Ne pas autoriser sur mobile
      await updateTaskDate(taskId, newDate);
    },
    [updateTaskDate, isMobile]
  );

  return (
    <TodoListAgenda
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing || isUpdating}
      refreshKey={dataVersion}
      updateTaskDate={handleUpdateTaskDate} // Passer la fonction de mise à jour de tâches
      isMobile={isMobile} // Passer l'état mobile pour désactiver le drag sur mobile
    />
  );
}
