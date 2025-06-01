// src/hooks/useAccessControl.tsx
"use client";

import { useState, useEffect } from "react";
import { AccessLevel } from "@/lib/auth-session";

type AccessControlResult = {
  isLoading: boolean;
  hasAccess: boolean;
  error: string | null;
};

export function useAccessControl(
  entityType: "object" | "sector" | "article" | "task",
  entityId: string,
  requiredLevel: AccessLevel
): AccessControlResult {
  const [result, setResult] = useState<AccessControlResult>({
    isLoading: true,
    hasAccess: false,
    error: null,
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch(`/api/access-control`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType, entityId, requiredLevel }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la vérification des accès");
        }

        const data = await response.json();
        setResult({
          isLoading: false,
          hasAccess: data.hasAccess,
          error: null,
        });
      } catch (error) {
        setResult({
          isLoading: false,
          hasAccess: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    checkAccess();
  }, [entityType, entityId, requiredLevel]);

  return result;
}
