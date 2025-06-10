// src/app/components/LimitAlert.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface LimitAlertProps {
  type: "warning" | "critical" | "blocked";
  title: string;
  message: string;
  current?: number;
  limit?: number | null;
  showUpgrade?: boolean;
  showManageSubscription?: boolean;
  className?: string;
}

export default function LimitAlert({
  type,
  title,
  message,
  current,
  limit,
  showUpgrade = true,
  showManageSubscription = false,
  className = "",
}: LimitAlertProps) {
  const router = useRouter();

  const getAlertStyles = () => {
    switch (type) {
      case "warning":
        return {
          container: "bg-orange-50 border-orange-200",
          icon: "text-orange-600",
          title: "text-orange-800",
          message: "text-orange-700",
          button: "bg-orange-600 hover:bg-orange-700",
          outlineButton: "border-orange-300 text-orange-700 hover:bg-orange-50",
        };
      case "critical":
        return {
          container: "bg-red-50 border-red-200",
          icon: "text-red-600",
          title: "text-red-800",
          message: "text-red-700",
          button: "bg-red-600 hover:bg-red-700",
          outlineButton: "border-red-300 text-red-700 hover:bg-red-50",
        };
      case "blocked":
        return {
          container:
            "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
          icon: "text-blue-600",
          title: "text-blue-800",
          message: "text-blue-700",
          button: "bg-blue-600 hover:bg-blue-700",
          outlineButton: "border-blue-300 text-blue-700 hover:bg-blue-50",
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`p-4 border rounded-lg ${styles.container} ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 ${styles.icon} mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
          <p className={`text-xs ${styles.message} mt-1`}>
            {message}
            {current !== undefined && limit && (
              <span className="font-medium">
                {" "}
                ({current}/{limit})
              </span>
            )}
          </p>

          {(showUpgrade || showManageSubscription) && (
            <div className="flex gap-2 mt-3">
              {showUpgrade && type === "blocked" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/pricing")}
                  className={styles.outlineButton}
                >
                  Voir les options
                </Button>
              )}
              {showManageSubscription && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/profile/subscription")}
                  className={styles.outlineButton}
                >
                  Gérer l&apos;abonnement
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
