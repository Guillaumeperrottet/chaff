"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrganizationRecovery() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Cette fonction sera appelée au chargement de la page
    const recoverOrganization = async () => {
      try {
        setIsRecovering(true);

        const response = await fetch("/api/user/organization-recovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de la récupération");
        }

        if (data.success) {
          // Recharger la page pour afficher le dashboard avec l'organisation
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        console.error("Erreur de récupération:", err);
      } finally {
        setIsRecovering(false);
      }
    };

    recoverOrganization();
  }, [router]);

  if (isRecovering) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mb-4"></div>
        <p>Configuration de votre espace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Une erreur est survenue : {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return null;
}
