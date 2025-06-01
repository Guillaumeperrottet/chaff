// Dans src/app/subscribe-redirect/page.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getClientUser } from "@/lib/auth-client-utils";

export default function SubscribeRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planType = searchParams.get("plan") || "FREE";

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Vérifier si l'utilisateur est connecté et vérifié
        const currentUser = await getClientUser();

        if (!currentUser) {
          router.push("/signin");
          return;
        }

        if (!currentUser.emailVerified) {
          router.push("/auth/email-verification-required");
          return;
        }

        // Si le plan est gratuit, rediriger directement vers le dashboard
        if (planType === "FREE") {
          router.push("/dashboard");
          return;
        }

        // Pour les plans payants, créer la session de paiement
        const response = await fetch("/api/subscriptions/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planType: planType,
          }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("URL de paiement non disponible");
        }
      } catch (err) {
        console.error("Erreur lors de la redirection:", err);
        router.push("/dashboard");
      }
    };

    handleRedirect();
  }, [planType, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">
          Préparation de votre compte...
        </h2>
        <p>Veuillez patienter pendant que nous préparons votre espace.</p>
      </div>
    </div>
  );
}
