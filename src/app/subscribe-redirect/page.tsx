"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Loader2,
  Check,
  ArrowRight,
  Shield,
  BarChart3,
  Star,
} from "lucide-react";

// Plans simplifiés (repris de votre stripe-client.ts)
const PLAN_DETAILS = {
  FREE: {
    id: "FREE",
    name: "Gratuit",
    description: "Pour découvrir l'application",
    price: 0,
    monthlyPrice: 0,
    features: [
      "1 utilisateur",
      "Accès dashboard de base",
      "100MB de stockage",
      "Support communauté",
    ],
    popular: false,
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    description: "Plan complet pour professionnels",
    price: 29,
    monthlyPrice: 29,
    features: [
      "Jusqu'à 10 utilisateurs",
      "Toutes les fonctionnalités",
      "10GB de stockage",
      "Support prioritaire",
      "Rapports avancés",
      "Accès API",
    ],
    popular: true,
  },
} as const;

// Skeleton de chargement
const SubscribeRedirectSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-6 shadow-lg animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2 mb-6">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Composant qui utilise useSearchParams
function SubscribeRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Récupérer le plan depuis les paramètres URL
  const planFromUrl = searchParams.get("plan");
  const redirectPlan = planFromUrl?.toUpperCase() || "PREMIUM";

  useEffect(() => {
    // Auto-sélectionner le plan de l'URL si valide
    if (
      planFromUrl &&
      PLAN_DETAILS[planFromUrl.toUpperCase() as keyof typeof PLAN_DETAILS]
    ) {
      setSelectedPlan(redirectPlan);
    } else {
      setSelectedPlan("PREMIUM"); // Plan par défaut
    }
  }, [planFromUrl, redirectPlan]);

  const handlePlanSelection = async (planId: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setSelectedPlan(planId);

    try {
      // Appeler l'API pour créer la session de checkout
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType: planId }),
      });

      const data = await response.json();

      if (data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(
          data.error || "Erreur lors de la création de la session"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du plan:", error);
      setIsProcessing(false);
      // Rediriger vers le dashboard en cas d'erreur
      router.push("/dashboard");
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Votre compte a été créé avec succès ! Sélectionnez le plan qui
            correspond le mieux à vos besoins.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
          {Object.entries(PLAN_DETAILS).map(([planId, plan]) => (
            <Card
              key={planId}
              className={`relative transition-all duration-300 cursor-pointer hover:shadow-xl ${
                selectedPlan === planId
                  ? "ring-2 ring-orange-500 shadow-xl"
                  : "hover:shadow-lg"
              } ${plan.popular ? "border-orange-500" : ""}`}
              onClick={() => !isProcessing && setSelectedPlan(planId)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Populaire
                </Badge>
              )}

              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  {planId === "FREE" ? (
                    <Shield className="w-8 h-8 text-white" />
                  ) : (
                    <BarChart3 className="w-8 h-8 text-white" />
                  )}
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {plan.price > 0 ? (
                    <div>
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.price}€
                      </span>
                      <span className="text-gray-500">/mois</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">
                      Gratuit
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanSelection(planId)}
                  disabled={isProcessing}
                  className={`w-full ${
                    selectedPlan === planId
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  {isProcessing && selectedPlan === planId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : selectedPlan === planId ? (
                    <>
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    "Sélectionner"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bouton pour passer */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isProcessing}
            className="text-gray-600 border-gray-300"
          >
            Passer pour l&apos;instant, aller au dashboard
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Vous pourrez toujours changer de plan plus tard
          </p>
        </div>
      </div>
    </div>
  );
}

// Page principale avec Suspense
export default function SubscribeRedirectPage() {
  return (
    <Suspense fallback={<SubscribeRedirectSkeleton />}>
      <SubscribeRedirectContent />
    </Suspense>
  );
}
