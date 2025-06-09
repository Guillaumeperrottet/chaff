// src/app/pricing/page.tsx - Version nettoyée
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Check, Crown, Shield, Star } from "lucide-react";

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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const handleSelectPlan = (planId: string) => {
    if (planId === "SUPER_ADMIN") {
      // Plan admin non accessible publiquement
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
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choisissez votre plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Commencez gratuitement et évoluez selon vos besoins
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
                    className={`w-full ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {plan.price === 0
                      ? "Commencer gratuitement"
                      : "Choisir ce plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
