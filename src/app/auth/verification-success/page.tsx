"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";

// Skeleton de chargement
const VerificationSkeleton = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-orange-200/30">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-6"></div>
        <div className="h-12 bg-gray-200 rounded w-full mx-auto"></div>
      </div>
    </div>
  </div>
);

// Composant qui utilise useSearchParams
function VerificationSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Votre compte a été vérifié avec succès"
  );
  const [attempts, setAttempts] = useState(0);

  // Récupérer les paramètres pour déterminer la redirection
  const planType = searchParams.get("plan") || "FREE";
  const inviteCode = searchParams.get("code");

  // Fonction pour tester si l'utilisateur a rejoint une organisation
  const checkJoinedOrganization = useCallback(async () => {
    try {
      const response = await fetch("/api/users/organization-check");
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      console.log("📊 Vérification organisation:", data);
      return data.success && data.user?.organizationId;
    } catch (err) {
      console.error("❌ Erreur lors de la vérification d'organisation:", err);
      return false;
    }
  }, []);

  // Fonction pour créer une organisation de secours
  const createRecoveryOrganization = useCallback(async () => {
    try {
      console.log("🔄 Tentative de création d'organisation de secours...");
      const response = await fetch("/api/user/organization-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Réponse API brute:", text);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("✅ Réponse de récupération:", data);
      if (data.success) {
        setMessage("Organisation créée avec succès! Redirection en cours...");
        return true;
      } else {
        setError(data.error || "Échec de création de l'organisation");
        return false;
      }
    } catch (err) {
      console.error("❌ Erreur lors de la récupération:", err);
      setError(`Erreur: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }, []);

  const handleRedirect = useCallback(() => {
    setIsRedirecting(true);
    if (inviteCode) {
      // Utilisateur avec invitation - rediriger directement vers le tableau de bord
      router.push(`/dashboard`);
    } else {
      // Nouvel utilisateur - vérifier s'il faut passer par la page d'abonnement
      if (planType !== "FREE") {
        router.push(`/subscribe-redirect?plan=${planType}`);
      } else {
        router.push(`/dashboard`);
      }
    }
  }, [inviteCode, planType, router]);

  useEffect(() => {
    let isMounted = true;
    const userId = searchParams.get("userId");
    console.log("📍 Verification Success Page - Paramètres:", {
      userId,
      planType,
      inviteCode,
    });

    // Fonction pour vérifier et configurer la redirection
    const setupRedirection = async () => {
      if (!isMounted) return;
      try {
        // Attendre un peu pour permettre aux hooks de s'exécuter
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // D'abord, vérifier si l'utilisateur a déjà rejoint une organisation
        const hasOrganization = await checkJoinedOrganization();
        if (hasOrganization) {
          console.log("✅ L'utilisateur a bien rejoint une organisation");
          if (inviteCode) {
            setMessage(
              "Vous avez bien rejoint l'organisation! Redirection en cours..."
            );
          } else {
            setMessage(
              "Votre compte et votre organisation ont été créés avec succès! Redirection en cours..."
            );
          }
          // Configurer la redirection
          setTimeout(() => {
            if (isMounted) {
              handleRedirect();
            }
          }, 1500);
        } else if (attempts < 1) {
          // Premier essai échoué, tenter une récupération
          setAttempts(1);
          console.log(
            "⚠️ L'utilisateur n'a pas d'organisation, tentative de récupération..."
          );
          const recoverySuccess = await createRecoveryOrganization();
          if (recoverySuccess && isMounted) {
            setTimeout(() => {
              if (isMounted) {
                handleRedirect();
              }
            }, 1500);
          }
        } else {
          // Échec après la récupération
          setError(
            "Impossible de configurer votre compte correctement. Veuillez contacter le support."
          );
        }
      } catch (err) {
        console.error("❌ Erreur globale:", err);
        if (isMounted) {
          setError(
            "Une erreur s'est produite. Veuillez réessayer ou contacter le support."
          );
        }
      } finally {
        if (isMounted) {
          setIsProcessing(false);
        }
      }
    };

    // Lancer la vérification
    setupRedirection();
    return () => {
      isMounted = false;
    };
  }, [
    searchParams,
    planType,
    inviteCode,
    createRecoveryOrganization,
    attempts,
    handleRedirect,
    checkJoinedOrganization,
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-orange-200/30">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Email vérifié !
          </h2>
          <p className="mt-2 text-gray-600">{message}</p>
          {isProcessing && (
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-orange-600 mr-2" />
              <span className="text-sm text-gray-600">
                Configuration en cours...
              </span>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {inviteCode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                🎉 Vous avez été ajouté à l&apos;organisation avec succès !
              </p>
            </div>
          )}
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-center">
            <Button
              onClick={handleRedirect}
              disabled={isRedirecting || isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-md"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection...
                </>
              ) : (
                "Continuer vers l'application"
              )}
            </Button>
          </div>
          {!error && !isProcessing && (
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Vous serez redirigé automatiquement dans quelques secondes...
              </p>
            </div>
          )}
          {error && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Réessayer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Page principale avec Suspense
export default function VerificationSuccessPage() {
  return (
    <Suspense fallback={<VerificationSkeleton />}>
      <VerificationSuccessContent />
    </Suspense>
  );
}
