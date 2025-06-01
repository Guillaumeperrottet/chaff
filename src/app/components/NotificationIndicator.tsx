// src/app/components/NotificationIndicator.tsx
"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import NotificationsPanel from "@/app/components/NotificationsPanel";
import { useNotifications } from "./notification-provider";

export default function NotificationIndicator() {
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  const closePanel = () => {
    setShowPanel(false);
    // Facultatif: rafraîchir le compteur après fermeture
    refreshUnreadCount();
  };

  const handleNotificationsRead = () => {
    // Le compteur est mis à jour automatiquement par refreshUnreadCount
    refreshUnreadCount();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePanel}
        className="relative p-2 rounded-full"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[color:var(--destructive)] text-white text-xs flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {showPanel && (
        <NotificationsPanel
          onClose={closePanel}
          onNotificationsRead={handleNotificationsRead}
        />
      )}
    </div>
  );
}
