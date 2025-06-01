// src/hooks/useTaskUpdates.ts - Hook pour gérer les mises à jour de tâches
import { useState } from "react";
import { toast } from "sonner";

interface Task {
  id: string;
  name: string;
  realizationDate: Date | null;
  // autres propriétés...
}

interface UseTaskUpdatesOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  showToasts?: boolean;
}

/**
 * Hook personnalisé pour gérer les mises à jour de tâches
 */
export function useTaskUpdates(options: UseTaskUpdatesOptions = {}) {
  const { onSuccess, onError, showToasts = true } = options;
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  /**
   * Met à jour la date d'une tâche
   */
  const updateTaskDate = async (
    taskId: string,
    newDate: Date
  ): Promise<boolean> => {
    if (!taskId || !newDate) {
      console.error("ID de tâche ou nouvelle date manquante");
      return false;
    }

    setIsUpdating(true);

    try {
      // Formatter la date pour l'API
      const formattedDate = newDate.toISOString();

      // Appel à l'API pour mettre à jour uniquement la date
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          realizationDate: formattedDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Erreur ${response.status}: ${errorData?.error || response.statusText}`
        );
      }

      // Parse response but ignore the result
      await response.json();

      // Afficher une notification de succès si activé
      if (showToasts) {
        toast.success("Date mise à jour avec succès");
      }

      // Appeler le callback de succès si fourni
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la date:", error);

      // Afficher une notification d'erreur si activé
      if (showToasts) {
        toast.error(
          error instanceof Error
            ? `Erreur: ${error.message}`
            : "Erreur lors de la mise à jour de la date"
        );
      }

      // Appeler le callback d'erreur si fourni
      if (onError) {
        onError(error);
      }

      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Dupliquer une tâche à une nouvelle date
   */
  const duplicateTaskToDate = async (
    taskToDuplicate: Task,
    newDate: Date
  ): Promise<boolean> => {
    if (!taskToDuplicate || !newDate) {
      console.error("Tâche ou nouvelle date manquante");
      return false;
    }

    setIsUpdating(true);

    try {
      // Préparation des données pour la duplication
      const { ...taskData } = taskToDuplicate;

      // Appel à l'API pour créer une nouvelle tâche
      const response = await fetch(`/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...taskData,
          name: `${taskToDuplicate.name} (copie)`,
          realizationDate: newDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Erreur ${response.status}: ${errorData?.error || response.statusText}`
        );
      }

      // Afficher une notification de succès si activé
      if (showToasts) {
        toast.success("Tâche dupliquée avec succès");
      }

      // Appeler le callback de succès si fourni
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la duplication de la tâche:", error);

      // Afficher une notification d'erreur si activé
      if (showToasts) {
        toast.error(
          error instanceof Error
            ? `Erreur: ${error.message}`
            : "Erreur lors de la duplication de la tâche"
        );
      }

      // Appeler le callback d'erreur si fourni
      if (onError) {
        onError(error);
      }

      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateTaskDate,
    duplicateTaskToDate,
    isUpdating,
  };
}
