"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { fr } from "date-fns/locale";
import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";

type Notification = {
  id: number;
  type: string;
  content: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
  task?: {
    id: string;
    name: string;
    article: {
      id: string;
      title: string;
      sector: {
        id: string;
        name: string;
        object: {
          id: string;
          nom: string;
        };
      };
    };
  } | null;
};

interface NotificationsListProps {
  notifications: Notification[];
}

export function NotificationsList({
  notifications: initialNotifications,
}: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const router = useRouter();

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((n) => !n.read);

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/mark-read`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Mettre à jour l'état local
        setNotifications(
          notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setNotifications(
          notifications.map((notification) => ({
            ...notification,
            read: true,
          }))
        );
      }
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lue si nécessaire
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Le chemin de base vers l'article
    const baseLink = notification.link;

    // Utiliser le lien task s'il est disponible
    if (notification.task) {
      const taskLink =
        `/dashboard/objet/${notification.task.article.sector.object.id}` +
        `/secteur/${notification.task.article.sector.id}` +
        `/article/${notification.task.article.id}` +
        `/task/${notification.task.id}`;

      router.push(taskLink);
    }
    // Sinon, utiliser le lien existant
    else if (baseLink) {
      console.log("Navigating to link:", baseLink);
      router.push(baseLink);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <span className="text-[color:var(--primary)]">📋</span>;
      case "TASK_COMPLETED":
        return (
          <span className="text-[color:var(--success-foreground)]">✅</span>
        );
      case "COMMENT_ADDED":
        return <span className="text-[color:var(--info-foreground)]">💬</span>;
      default:
        return (
          <Bell className="h-4 w-4 text-[color:var(--muted-foreground)]" />
        );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={
              filter === "all"
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                : "border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/80"
            }
          >
            Toutes ({notifications.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className={
              filter === "unread"
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                : "border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/80"
            }
          >
            Non lues ({unreadCount})
          </Button>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={markAllAsRead}
            className="border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/80"
          >
            <Check className="mr-1 h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 text-[color:var(--muted-foreground)]">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg mb-2 text-[color:var(--foreground)]">
            Aucune notification
          </p>
          <p className="text-sm">
            {filter === "unread"
              ? "Vous avez lu toutes vos notifications"
              : "Vous n'avez pas encore reçu de notifications"}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--border)]">
          {filteredNotifications.map((notification) => (
            <li
              key={notification.id}
              className={`hover:bg-[color:var(--muted)] transition-colors cursor-pointer ${
                !notification.read ? "bg-[color:var(--info-background)]/10" : ""
              }`}
            >
              <div
                className="p-4 flex gap-4"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[color:var(--muted)]">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[color:var(--foreground)] mb-1">
                    {notification.content}
                  </p>
                  {notification.task && (
                    <p className="text-sm text-[color:var(--muted-foreground)] truncate mb-1">
                      {notification.task.article.sector.object.nom} ›{" "}
                      {notification.task.article.sector.name} ›{" "}
                      {notification.task.name}
                    </p>
                  )}
                  <p className="text-xs text-[color:var(--muted-foreground)]">
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
                    <Check className="h-5 w-5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
