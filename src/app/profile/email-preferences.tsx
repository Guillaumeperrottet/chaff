// src/app/profile/email-preferences.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import Switch from "@/app/components/ui/switch";
import { Mail, MailX } from "lucide-react";

interface EmailPreferencesProps {
  initialEnabled: boolean;
}

export function EmailPreferences({ initialEnabled }: EmailPreferencesProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const newState = !enabled;

      const response = await fetch("/api/profile/email-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailNotificationsEnabled: newState,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des préférences");
      }

      setEnabled(newState);
      toast.success(
        newState
          ? "Les notifications par email ont été activées"
          : "Les notifications par email ont été désactivées"
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
            <Mail className="h-5 w-5 text-[color:var(--primary)]" />
          ) : (
            <MailX className="h-5 w-5 text-[color:var(--muted-foreground)]" />
          )}
          <div>
            <p className="font-medium text-[color:var(--foreground)]">
              Notifications par email
            </p>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {enabled
                ? "Vous recevez des récapitulatifs quotidiens par email"
                : "Vous ne recevez pas de récapitulatifs par email"}
            </p>
          </div>
        </div>
        <div className="relative">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
            checkedIcon={
              <Mail className="h-4 w-4 text-[color:var(--primary-foreground)]" />
            }
            uncheckedIcon={
              <MailX className="h-4 w-4 text-[color:var(--muted-foreground)]" />
            }
          />
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-[color:var(--muted)] text-sm">
        <h3 className="font-medium mb-2 text-[color:var(--foreground)]">
          À propos des emails
        </h3>
        <p className="text-[color:var(--muted-foreground)] mb-2">
          Si activé, vous recevrez chaque matin un récapitulatif des tâches qui
          vous ont été assignées la veille.
        </p>
        <ul className="space-y-2 list-disc pl-5 text-[color:var(--muted-foreground)]">
          <li>Les emails sont envoyés une fois par jour (vers 6h)</li>
          <li>Les récapitulatifs incluent les détails des tâches</li>
          <li>Le format est optimisé pour l&apos;impression</li>
        </ul>
      </div>
    </div>
  );
}
