// src/app/profile/notifications/daily-summary-preferences.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import Switch from "@/app/components/ui/switch";
import { Calendar, CalendarX } from "lucide-react";

interface DailySummaryPreferencesProps {
  initialEnabled: boolean;
}

export function DailySummaryPreferences({
  initialEnabled,
}: DailySummaryPreferencesProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const newState = !enabled;

      const response = await fetch("/api/profile/daily-summary-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailySummaryEnabled: newState,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des préférences");
      }

      setEnabled(newState);
      toast.success(
        newState
          ? "Les récapitulatifs quotidiens ont été activés"
          : "Les récapitulatifs quotidiens ont été désactivés"
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
            <Calendar className="h-5 w-5 text-[color:var(--primary)]" />
          ) : (
            <CalendarX className="h-5 w-5 text-[color:var(--muted-foreground)]" />
          )}
          <div>
            <p className="font-medium text-[color:var(--foreground)]">
              Récapitulatif quotidien
            </p>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {enabled
                ? "Vous recevez un récapitulatif quotidien de l'activité"
                : "Vous ne recevez pas de récapitulatif quotidien"}
            </p>
          </div>
        </div>
        <div className="relative">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
            checkedIcon={
              <Calendar className="h-4 w-4 text-[color:var(--primary-foreground)]" />
            }
            uncheckedIcon={
              <CalendarX className="h-4 w-4 text-[color:var(--muted-foreground)]" />
            }
          />
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-[color:var(--muted)] text-sm">
        <h3 className="font-medium mb-2 text-[color:var(--foreground)]">
          À propos du récapitulatif quotidien
        </h3>
        <p className="text-[color:var(--muted-foreground)] mb-2">
          Si activé, vous recevrez chaque matin (vers 7h) un email récapitulant
          :
        </p>
        <ul className="space-y-2 list-disc pl-5 text-[color:var(--muted-foreground)]">
          <li>Les tâches ajoutées la veille, organisées par objet</li>
          <li>Les tâches terminées la veille, organisées par objet</li>
          <li>Un résumé avec le nombre total d&apos;activités</li>
          <li>
            Les détails pour chaque objet (secteur, article, assigné à...)
          </li>
        </ul>
        <p className="text-[color:var(--muted-foreground)] mt-2 font-medium">
          📧 Même sans activité, vous recevrez un email pour vous tenir informé.
        </p>
      </div>
    </div>
  );
}
