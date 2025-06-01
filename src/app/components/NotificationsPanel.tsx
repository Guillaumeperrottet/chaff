"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { fr } from "date-fns/locale";
import { Bell, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "./notification-provider";

// Types comme avant...
type Notification = {
  id: number;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: {
    objectName?: string;
    taskName?: string;
    assignerName?: string;
    taskId?: number;
  };
  task?: {
    id: number;
    article: {
      id: number;
      sector: {
        id: number;
        object: {
          id: number;
        };
      };
    };
  };
  link?: string;
};

type NotificationsPanelProps = {
  onClose: () => void;
  onNotificationsRead: () => void;
};

export default function NotificationsPanel({
  onClose,
  onNotificationsRead,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const { refreshUnreadCount } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<number[]>(
    []
  );

  // Fetch notifications de manière indépendante
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10");

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Appeler fetch au montage
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mettre à jour la liste des notifications visibles quand notifications change
  useEffect(() => {
    const unreadNotifications = notifications
      .filter((n) => !n.read)
      .map((n) => n.id);
    setVisibleNotifications(unreadNotifications);
  }, [notifications]);

  // La fonction markAsRead définie une seule fois avec useCallback
  const markAsRead = useCallback(
    async (notificationId: number, updateUI: boolean = true) => {
      try {
        const response = await fetch(
          `/api/notifications/${notificationId}/mark-read`,
          { method: "POST" }
        );

        if (response.ok) {
          if (updateUI) {
            setNotifications((prevNotifications) =>
              prevNotifications.map((notification) =>
                notification.id === notificationId
                  ? { ...notification, read: true }
                  : notification
              )
            );

            setVisibleNotifications((prev) =>
              prev.filter((id) => id !== notificationId)
            );

            refreshUnreadCount();
            onNotificationsRead();
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erreur lors du marquage de la notification:", error);
        return false;
      }
    },
    [refreshUnreadCount, onNotificationsRead]
  );

  // Fonction markVisibleNotificationsAsRead définie avec useCallback
  const markVisibleNotificationsAsRead = useCallback(async () => {
    if (visibleNotifications.length === 0) return;

    try {
      await Promise.all(
        visibleNotifications.map((id) => markAsRead(id, false))
      );

      refreshUnreadCount();
      onNotificationsRead();
    } catch (error) {
      console.error(
        "Erreur lors du marquage des notifications comme lues:",
        error
      );
    }
  }, [
    visibleNotifications,
    markAsRead,
    refreshUnreadCount,
    onNotificationsRead,
  ]);

  // Gestionnaire de clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        markVisibleNotificationsAsRead();
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, markVisibleNotificationsAsRead]);

  // Fonction markAllAsRead également avec useCallback
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            read: true,
          }))
        );

        setVisibleNotifications([]);
        refreshUnreadCount();
        onNotificationsRead();
      }
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error);
    }
  }, [refreshUnreadCount, onNotificationsRead]);

  // handleNotificationClick avec useCallback
  // Modification à apporter dans src/app/components/NotificationsPanel.tsx
  // Localisez la fonction handleNotificationClick et vérifiez qu'elle ressemble à ceci:

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Marquer comme lu si nécessaire
      if (!notification.read) {
        markAsRead(notification.id);
      }

      // Le chemin de base vers l'article
      const baseLink = notification.link;

      // Vérifier si nous avons l'ID de tâche dans les données
      if (
        notification.data &&
        typeof notification.data === "object" &&
        "taskId" in notification.data
      ) {
        const taskId = notification.data?.taskId;
        const taskLink = `${baseLink}/task/${taskId}`;

        console.log("Navigating to task:", taskLink);

        // Utiliser router.push pour la navigation
        router.push(taskLink);
        onClose();
      }
      // Sinon, utiliser le lien existant
      else if (baseLink) {
        console.log("Navigating to link:", baseLink);
        router.push(baseLink);
        onClose();
      }
    },
    [markAsRead, router, onClose]
  );

  // Fonction handleClosePanel
  const handleClosePanel = useCallback(() => {
    markVisibleNotificationsAsRead();
    onClose();
  }, [markVisibleNotificationsAsRead, onClose]);

  // getNotificationIcon en tant que fonction simple
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <span className="text-[color:var(--primary)]">📋</span>;
      case "TASK_COMPLETED":
        return <span className="text-green-500">✅</span>;
      case "TASK_OVERDUE":
        return <span className="text-red-500">⏰</span>;
      case "TASK_DUE_SOON":
        return <span className="text-orange-500">⚡</span>;
      case "COMMENT_ADDED":
        return <span className="text-blue-500">💬</span>;
      case "TASK_UPDATED":
        return <span className="text-purple-500">✏️</span>;
      case "DOCUMENT_UPLOADED":
        return <span className="text-green-600">📎</span>;
      case "USER_ADDED_TO_OBJECT":
        return <span className="text-indigo-500">🔑</span>;
      case "USER_REMOVED_FROM_OBJECT":
        return <span className="text-red-400">🚫</span>;
      default:
        return (
          <Bell className="h-4 w-4 text-[color:var(--muted-foreground)]" />
        );
    }
  };

  // getNotificationTypeLabel en tant que fonction simple
  const getNotificationTypeLabel = (type: string) => {
    const labels = {
      TASK_ASSIGNED: "Tâche assignée",
      TASK_COMPLETED: "Tâche terminée",
      TASK_OVERDUE: "Tâche en retard",
      TASK_DUE_SOON: "Échéance proche",
      COMMENT_ADDED: "Nouveau commentaire",
      TASK_UPDATED: "Tâche modifiée",
      DOCUMENT_UPLOADED: "Nouveau document",
      USER_ADDED_TO_OBJECT: "Nouvel accès",
      USER_REMOVED_FROM_OBJECT: "Accès retiré",
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Le reste du code de rendu comme avant...
  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[80vh] overflow-hidden bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg z-50"
    >
      <div className="p-3 border-b border-[color:var(--border)] flex justify-between items-center bg-[color:var(--muted)]">
        <h3 className="font-medium text-[color:var(--foreground)]">
          Notifications
        </h3>
        <div className="flex gap-2">
          <button
            onClick={markAllAsRead}
            className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
          >
            Tout marquer comme lu
          </button>
          <button
            onClick={handleClosePanel}
            className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[60vh]">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--primary)]"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-[color:var(--muted-foreground)]">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucune notification</p>
          </div>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:var(--muted)] transition-colors cursor-pointer ${
                  !notification.read
                    ? "bg-[color:var(--info-background)]/10"
                    : ""
                }`}
              >
                <div
                  className="p-3 flex gap-3"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[color:var(--muted)]">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[color:var(--muted-foreground)] bg-[color:var(--muted)] px-2 py-1 rounded">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                    </div>
                    <p className="text-sm text-[color:var(--foreground)] mb-1">
                      {notification.content}
                    </p>

                    {/* Afficher les informations détaillées de la tâche */}
                    {notification.data && notification.data.objectName && (
                      <div className="text-xs text-[color:var(--muted-foreground)] space-y-1 mt-1">
                        {notification.data.taskName && (
                          <p className="flex items-center gap-1">
                            <span className="font-medium">Tâche:</span>
                            {notification.data.taskName}
                          </p>
                        )}
                        <p className="flex items-center gap-1">
                          <span className="font-medium">Objet:</span>
                          {notification.data.objectName}
                        </p>
                        {notification.data.assignerName && (
                          <p className="flex items-center gap-1">
                            <span className="font-medium">Assignée par:</span>
                            {notification.data.assignerName}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      className="flex-shrink-0 text-[color:var(--primary)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      title="Marquer comme lu"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-2 border-t border-[color:var(--border)] text-center">
        <a
          href="/profile/notifications"
          className="text-xs text-[color:var(--primary)] hover:underline"
          onClick={() => handleClosePanel()}
        >
          Voir toutes les notifications
        </a>
      </div>
    </div>
  );
}
