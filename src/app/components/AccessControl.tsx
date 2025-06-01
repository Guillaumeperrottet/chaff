// src/components/AccessControl.tsx
"use client";

import { ReactNode } from "react";
import { useAccessControl } from "@/hooks/useAccessControl";
import { AccessLevel } from "@/lib/auth-session";

type AccessControlProps = {
  entityType: "object" | "sector" | "article" | "task";
  entityId: string;
  requiredLevel: AccessLevel;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function AccessControl({
  entityType,
  entityId,
  requiredLevel,
  children,
  fallback,
}: AccessControlProps) {
  const { isLoading, hasAccess, error } = useAccessControl(
    entityType,
    entityId,
    requiredLevel
  );

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>;
  }

  if (error) {
    console.error("Erreur de contrôle d'accès:", error);
  }

  if (!hasAccess) {
    return (
      fallback || (
        <div className="text-sm text-gray-500 italic">
          Vous n&apos;avez pas les droits suffisants pour cette action.
        </div>
      )
    );
  }

  return <>{children}</>;
}
