"use client";

import { ReactNode, useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/app/components/ui/button";
import { Lock, Crown } from "lucide-react";
import Link from "next/link";

type FeatureAccess = string;

interface FeatureGuardProps {
  feature: FeatureAccess;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGuard({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGuardProps) {
  const { data: session } = useSession();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setHasAccess(false);
      return;
    }

    // Vérifier l'accès côté client
    fetch(`/api/access/check?feature=${feature}`)
      .then((res) => res.json())
      .then((data) => setHasAccess(data.hasAccess))
      .catch(() => setHasAccess(false));
  }, [session, feature]);

  if (hasAccess === null) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded"></div>;
  }

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    if (showUpgradePrompt) {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Fonctionnalité Premium
          </h3>
          <p className="text-gray-600 mb-4">
            Cette fonctionnalité nécessite un plan Premium.
          </p>
          <Link href="/pricing">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600">
              <Crown className="mr-2 h-4 w-4" />
              Passer au Premium
            </Button>
          </Link>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
