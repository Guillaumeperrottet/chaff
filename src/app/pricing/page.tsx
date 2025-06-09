// src/app/pricing/page.tsx - Version hybride avec gestion contextuelle
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Check,
  Crown,
  Shield,
  Star,
  ArrowLeft,
  Lock,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// Messages contextuels selon la fonctionnalité (nouveau)
const FEATURE_MESSAGES = {
  payroll: {
    title: "Accès à la Masse Salariale",
    description: "La gestion de la masse salariale nécessite un plan Premium",
    icon: DollarSign,
    features: [
      "Import des données Gastrotime",
      "Calcul automatique des charges sociales",
      "Ratios masse salariale / CA",
      "Historique des imports",
      "Gestion des employés",
    ],
  },
  advanced_reports: {
    title: "Analytics Avancés",
    description: "Les rapports avancés sont réservés aux abonnés Premium",
    icon: BarChart3,
    features: [
      "Analytics détaillés par période",
      "Comparaisons année précédente",
      "Performance par mandat",
      "Analyse par groupe (Hébergement/Restauration)",
      "Export des rapports",
    ],
  },
};

// Plans simplifiés - seulement 3 plans
const PLANS = [
  {
    id: "FREE",
    name: "Gratuit",
    price: 0,
    description: "Pour découvrir l'application",
    features: [
      "1 utilisateur",
      "Accès dashboard de base",
      "100MB de stockage",
      "Support communauté",
      "Fonctionnalités limitées",
    ],
    icon: Shield,
    color: "gray",
    popular: false,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: 29,
    description: "Plan complet pour professionnels",
    features: [
      "Jusqu'à 10 utilisateurs",
      "Toutes les fonctionnalités",
      "10GB de stockage",
      "Support prioritaire",
      "Rapports avancés",
    ],
    icon: Star,
    color: "orange",
    popular: true,
  },
  {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    price: null, // Pas affiché
    description: "Accès administrateur complet",
    features: [
      "Accès administrateur complet",
      "Gestion système",
      "Support dédié",
    ],
    icon: Crown,
    color: "purple",
    popular: false,
    hidden: true, // Caché pour les utilisateurs normaux
  },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(false);

  // Paramètres de contexte depuis la redirection (nouveau)
  const feature =
    (searchParams.get("feature") as keyof typeof FEATURE_MESSAGES) || null;
  const reason = searchParams.get("reason");
  const returnTo = searchParams.get("returnTo");

  const featureInfo = feature ? FEATURE_MESSAGES[feature] : null;
  const FeatureIcon = featureInfo?.icon;

  useEffect(() => {
    // Afficher un message si l'utilisateur arrive via une restriction d'accès
    if (reason === "access_denied" && featureInfo) {
      toast.error(`Accès refusé: ${featureInfo.title}`, {
        description: featureInfo.description,
        duration: 6000,
      });
    }
  }, [reason, featureInfo]);

  const handleSelectPlan = async (planId: string) => {
    if (planId === "SUPER_ADMIN") {
      // Plan admin non accessible publiquement
      return;
    }

    if (planId === "FREE") {
      router.push("/signup?plan=FREE");
      return;
    }

    // Pour le plan Premium, gérer l'upgrade via Stripe
    if (planId === "PREMIUM") {
      setIsLoading(true);

      try {
        const response = await fetch("/api/subscriptions/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType: "PREMIUM",
            returnUrl: returnTo || "/dashboard",
          }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(
            data.error || "Erreur lors de la création de la session"
          );
        }
      } catch (error) {
        console.error("Erreur upgrade:", error);
        toast.error("Erreur lors de la souscription");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    router.push(`/signup?plan=${planId}`);
  };

  const getColorClasses = (color: string) => {
    const colors = {
      gray: "border-gray-200 text-gray-600",
      orange: "border-orange-200 text-orange-600",
      purple: "border-purple-200 text-purple-600",
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  // Filtrer les plans visibles
  const visiblePlans = PLANS.filter((plan) => !plan.hidden);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header contextuel si restriction d'accès (nouveau) */}
      {featureInfo && reason === "access_denied" && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            {returnTo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au dashboard
              </Button>
            )}
          </div>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Fonctionnalité Premium Requise
                  </h3>
                  <p className="text-orange-700 mt-1">
                    {featureInfo.description}
                  </p>
                </div>
                {FeatureIcon && (
                  <FeatureIcon className="h-8 w-8 text-orange-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {featureInfo
              ? `Débloquez: ${featureInfo.title}`
              : "Choisissez votre plan"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {featureInfo
              ? "Passez au plan Premium pour accéder à toutes les fonctionnalités avancées"
              : "Commencez gratuitement et évoluez selon vos besoins"}
          </p>

          {/* Toggle billing cycle */}
          <div className="flex items-center justify-center mt-8">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Annuel
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                  -15%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {visiblePlans.map((plan) => {
            const Icon = plan.icon;
            const yearlyPrice = plan.price
              ? Math.floor(plan.price * 12 * 0.85)
              : 0; // 15% reduction
            const displayPrice =
              billingCycle === "yearly" ? yearlyPrice : plan.price;

            return (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? "border-2 border-primary shadow-lg scale-105" : "border"} transition-all duration-300 hover:shadow-lg`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                      Populaire
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center ${getColorClasses(plan.color)}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {displayPrice === 0 ? "Gratuit" : `${displayPrice}€`}
                    </span>
                    {displayPrice && displayPrice > 0 && (
                      <span className="text-muted-foreground">
                        /{billingCycle === "yearly" ? "an" : "mois"}
                      </span>
                    )}
                  </div>
                  {billingCycle === "yearly" &&
                    plan.price &&
                    plan.price > 0 && (
                      <p className="text-sm text-green-600 font-medium">
                        Économisez {plan.price * 12 - yearlyPrice}€/an
                      </p>
                    )}
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading && plan.id === "PREMIUM"}
                    className={`w-full ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {isLoading && plan.id === "PREMIUM" ? (
                      <>
                        <Zap className="mr-2 h-4 w-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        {plan.price === 0
                          ? "Commencer gratuitement"
                          : plan.id === "PREMIUM"
                            ? "Passer au Premium"
                            : "Choisir ce plan"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Section spécifique à la fonctionnalité bloquée (nouveau) */}
        {featureInfo && (
          <Card className="max-w-2xl mx-auto mb-16 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {FeatureIcon && (
                  <FeatureIcon className="h-5 w-5 text-primary" />
                )}
                Fonctionnalités {featureInfo.title}
              </CardTitle>
              <p className="text-muted-foreground">
                Voici ce que vous débloquez avec le plan Premium:
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {featureInfo.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="p-1 bg-primary/10 rounded-full">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="text-muted-foreground">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment
                depuis votre tableau de bord.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                Y a-t-il une période d&apos;essai ?
              </h3>
              <p className="text-muted-foreground">
                Le plan gratuit vous permet de tester l&apos;application sans
                limite de temps avec des fonctionnalités de base.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                Comment fonctionne la facturation ?
              </h3>
              <p className="text-muted-foreground">
                La facturation est automatique et sécurisée via Stripe. Vous
                pouvez annuler à tout moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
