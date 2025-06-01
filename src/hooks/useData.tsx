// src/hooks/useData.tsx (entièrement refactorisé - sans cache)
import useSWR from "swr";
import { Notification, NotificationsResponse } from "@/types/index";

class FetchError extends Error {
  info?: unknown;
  status?: number;

  constructor(message: string, status?: number, info?: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.info = info;
  }
}

// Fetcher simple sans cache
const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const info = await response.json().catch(() => null);
    throw new FetchError(
      `Erreur ${response.status}: ${response.statusText}`,
      response.status,
      info
    );
  }

  return await response.json();
};

// Hook pour les objets immobiliers
export function useObjects() {
  return useSWR("/api/objet", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000, // 1 minute
  });
}

// Hook pour un objet spécifique
export function useObject(id: string | null) {
  return useSWR(id ? `/api/objet/${id}` : null, fetcher, {
    revalidateOnFocus: true,
  });
}

// Hook pour les secteurs d'un objet
export function useSectors(objectId: string | null) {
  return useSWR(objectId ? `/api/sectors/${objectId}` : null, fetcher, {
    revalidateOnFocus: true,
  });
}

// Hook pour les articles d'un secteur
export function useArticles(sectorId: string | null) {
  return useSWR(
    sectorId ? `/api/sectors/${sectorId}/articles` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );
}

// Hook pour les tâches
export function useTasks(objectId: string | null) {
  const { data, error, mutate } = useSWR(
    objectId ? `/api/tasks/object/${objectId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // 30 secondes
    }
  );

  return {
    tasks: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
    // Fonction vide pour compatibilité avec code existant
    invalidateCache: () => mutate(),
  };
}

// Hook pour une tâche spécifique
export function useTask(taskId: string | null) {
  return useSWR(taskId ? `/api/tasks/${taskId}` : null, fetcher, {
    revalidateOnFocus: true,
  });
}

// Hook pour les documents d'une tâche
export function useTaskDocuments(taskId: string | null) {
  return useSWR(taskId ? `/api/tasks/${taskId}/documents` : null, fetcher);
}

// Hook pour les commentaires d'une tâche
export function useTaskComments(taskId: string | null) {
  return useSWR(taskId ? `/api/tasks/${taskId}/comments` : null, fetcher, {
    refreshInterval: 15000, // 15 secondes
  });
}

// Hook pour les notifications
export function useNotifications(limit = 10, unreadOnly = false) {
  const url = `/api/notifications?limit=${limit}${unreadOnly ? "&unread=true" : ""}`;
  const { data, error, mutate } = useSWR<NotificationsResponse>(url, fetcher, {
    refreshInterval: 30000, // 30 secondes
  });

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: "POST",
      });

      // Mise à jour optimiste
      mutate(
        data
          ? {
              ...data,
              notifications: data.notifications.map((n: Notification) =>
                n.id === notificationId ? { ...n, read: true } : n
              ),
              unreadCount: Math.max(0, data.unreadCount - 1),
            }
          : data,
        false
      );

      // Revalider
      mutate();
    } catch (err) {
      console.error("Erreur lors du marquage de la notification:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      // Mise à jour optimiste
      mutate(
        data
          ? {
              ...data,
              notifications: data.notifications.map((n: Notification) => ({
                ...n,
                read: true,
              })),
              unreadCount: 0,
            }
          : data,
        false
      );

      // Revalider
      mutate();
    } catch (err) {
      console.error(
        "Erreur lors du marquage de toutes les notifications:",
        err
      );
    }
  };

  return {
    notifications: (data?.notifications || []) as Notification[],
    unreadCount: data?.unreadCount || 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
    markAsRead,
    markAllAsRead,
  };
}

// Hook pour gérer les limites d'abonnement
export function useSubscriptionLimits() {
  const { data: objectLimits, error: objectError } = useSWR(
    "/api/limits/objects",
    fetcher
  );

  const { data: userLimits, error: userError } = useSWR(
    "/api/limits/users",
    fetcher
  );

  return {
    objectLimits,
    userLimits,
    isLoading: (!objectLimits && !objectError) || (!userLimits && !userError),
    isError: objectError || userError,
  };
}
