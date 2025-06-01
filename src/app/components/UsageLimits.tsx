"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Users, Building2 } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import Link from "next/link";

interface UsageLimitData {
  allowed: boolean;
  current: number;
  limit: number | null;
  unlimited: boolean;
}

export default function UsageLimits() {
  const [limits, setLimits] = useState<{
    users: UsageLimitData | null;
    objects: UsageLimitData | null;
  }>({
    users: null,
    objects: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const usersResponse = await fetch("/api/limits/users");
        const objectsResponse = await fetch("/api/limits/objects");

        if (!usersResponse.ok || !objectsResponse.ok) {
          throw new Error("Erreur lors de la récupération des limites");
        }

        const usersData = await usersResponse.json();
        const objectsData = await objectsResponse.json();

        setLimits({
          users: usersData,
          objects: objectsData,
        });
      } catch (error) {
        console.error("Erreur:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération des limites"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border border-[color:var(--border)] rounded-lg animate-pulse bg-[color:var(--muted)]">
        <div className="h-6 w-2/3 bg-[color:var(--border)] rounded mb-3"></div>
        <div className="h-4 w-1/2 bg-[color:var(--border)] rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-100 dark:bg-red-950/30">
        <p className="text-red-700 dark:text-red-400 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          {error}
        </p>
      </div>
    );
  }

  const renderLimitStatus = (type: "users" | "objects") => {
    const data = limits[type];

    if (!data) return null;

    const percentUsed = data.unlimited
      ? 0
      : Math.round((data.current / (data.limit || 1)) * 100);
    const isNearLimit = percentUsed >= 80;
    const isAtLimit = percentUsed >= 100;

    // Classes adaptées pour le mode sombre
    let progressBgClass = "bg-[color:var(--muted)]";
    let progressIndicatorClass = "bg-[color:var(--primary)]";
    let textColorClass = "text-[color:var(--foreground)]";

    if (isAtLimit) {
      progressBgClass = "bg-red-200 dark:bg-red-900/30";
      progressIndicatorClass = "bg-red-500 dark:bg-red-600";
      textColorClass = "text-red-600 dark:text-red-400";
    } else if (isNearLimit) {
      progressBgClass = "bg-amber-200 dark:bg-amber-900/30";
      progressIndicatorClass = "bg-amber-500 dark:bg-amber-600";
      textColorClass = "text-amber-600 dark:text-amber-400";
    }

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            {type === "users" ? (
              <Users className="h-5 w-5 mr-2 text-[color:var(--primary)]" />
            ) : (
              <Building2 className="h-5 w-5 mr-2 text-[color:var(--primary)]" />
            )}
            <span className="font-medium text-[color:var(--foreground)]">
              {type === "users" ? "Utilisateurs" : "Objets"}
            </span>
          </div>
          <div className="text-sm">
            {data.unlimited ? (
              <span className="text-green-500 dark:text-green-400">
                Illimité
              </span>
            ) : (
              <span className={textColorClass}>
                {data.current} / {data.limit}
              </span>
            )}
          </div>
        </div>

        {!data.unlimited && (
          <Progress
            value={percentUsed > 100 ? 100 : percentUsed}
            className={`h-2 ${progressBgClass} ${progressIndicatorClass}`}
          />
        )}

        {(isAtLimit || isNearLimit) && !data.unlimited && (
          <div className={`text-xs mt-1 ${textColorClass}`}>
            {isAtLimit
              ? `Limite ${type === "users" ? "d'utilisateurs" : "d'objets"} atteinte.`
              : `Vous approchez de votre limite ${type === "users" ? "d'utilisateurs" : "d'objets"}.`}{" "}
            <Link
              href="/pricing"
              className="underline text-[color:var(--primary)] hover:opacity-90 transition-opacity"
            >
              Passer à un forfait supérieur
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 border border-[color:var(--border)] rounded-lg bg-[color:var(--card)] shadow-sm">
      <h3 className="text-lg font-medium mb-4 text-[color:var(--foreground)]">
        Utilisation
      </h3>

      {renderLimitStatus("users")}
      {renderLimitStatus("objects")}
    </div>
  );
}
