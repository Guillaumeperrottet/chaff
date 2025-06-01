"use client";

import { useState } from "react";
import { toast } from "sonner";
import Switch from "@/app/components/ui/switch";
import { Bell, BellOff } from "lucide-react";

interface NotificationPreferencesProps {
  initialEnabled: boolean;
}

export function NotificationPreferences({
  initialEnabled,
}: NotificationPreferencesProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const newState = !enabled;

      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationsEnabled: newState,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des préférences");
      }

      setEnabled(newState);
      toast.success(
        newState
          ? "Les notifications ont été activées"
          : "Les notifications ont été désactivées"
      );
    } catch (error) {
      console.error("Erreur complète:", error);
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {enabled ? (
            <Bell className="h-5 w-5 text-[color:var(--primary)]" />
          ) : (
            <BellOff className="h-5 w-5 text-[color:var(--muted-foreground)]" />
          )}
          <div>
            <p className="font-medium text-[color:var(--foreground)]">
              Notifications
            </p>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {enabled
                ? "Vous recevez des notifications"
                : "Vous ne recevez pas de notifications"}
            </p>
          </div>
        </div>
        <div className="relative">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
            checkedIcon={
              <Bell className="h-4 w-4 text-[color:var(--primary-foreground)]" />
            }
            uncheckedIcon={
              <BellOff className="h-4 w-4 text-[color:var(--muted-foreground)]" />
            }
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="p-4 rounded-lg bg-[color:var(--muted)] text-sm">
          <h3 className="font-medium mb-2 text-[color:var(--foreground)]">
            À propos des notifications
          </h3>
          <p className="text-[color:var(--muted-foreground)] mb-2">
            Les notifications vous informent des événements importants comme :
          </p>
          <ul className="space-y-2 list-disc pl-5 text-[color:var(--muted-foreground)]">
            <li>Lorsque vous êtes assigné à une tâche</li>
            <li>Lorsqu&apos;une tâche est terminée</li>
            <li>Lorsque quelqu&apos;un commente une tâche que vous suivez</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
