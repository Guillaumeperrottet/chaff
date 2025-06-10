import { useState, useEffect } from "react";
import { FeatureAccess } from "@/lib/access-control";

export function useFeatureAccess(feature: FeatureAccess) {
  const [hasAccess, setHasAccess] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch(`/api/access/check?feature=${feature}`);
        const data = await response.json();
        setHasAccess(data.hasAccess || false);
      } catch (error) {
        console.error("Erreur vérification accès:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  return { hasAccess: hasAccess ?? false, loading };
}
