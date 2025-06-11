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
import { Check, Shield, Star } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    id: "FREE",
    name: "Gratuit",
    price: 0,
    description: "Pour découvrir l'application",
    features: [
      "1 utilisateur",
      "Toutes les fonctionnalités",
      "100MB de stockage",
      "Support communauté",
    ],
    icon: Shield,
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
    ],
    icon: Star,
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (planId === "FREE") {
      router.push("/signup?plan=FREE");
      return;
    }

    if (planId === "PREMIUM") {
      setIsLoading(true);
      try {
        const response = await fetch("/api/subscriptions/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType: "PREMIUM",
            returnUrl: "/dashboard",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Toutes les fonctionnalités sont disponibles sur tous les plans.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-8 max-w-4xl mx-auto md:grid-cols-2">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const displayPrice =
              plan.price === 0
                ? 0
                : billingCycle === "yearly"
                  ? Math.round(plan.price * 0.83)
                  : plan.price;

            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  plan.popular
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                      Plus populaire
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full border-2 border-gray-200">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <p className="text-muted-foreground">{plan.description}</p>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-foreground">
                      {plan.price === 0 ? (
                        "Gratuit"
                      ) : (
                        <>
                          {displayPrice}CHF
                          <span className="text-lg font-normal text-muted-foreground">
                            /mois
                          </span>
                        </>
                      )}
                    </div>
                    {plan.price > 0 && billingCycle === "yearly" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Facturé {displayPrice * 12}CHF annuellement
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading}
                    className={`w-full ${
                      plan.id === "PREMIUM"
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

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Toutes les fonctionnalités sont disponibles sur tous les plans.
          </p>
          <p className="text-sm text-muted-foreground">
            Questions ? Contactez-nous à{" "}
            <a
              href="mailto:support@chaff.ch"
              className="text-primary hover:underline"
            >
              support@chaff.ch
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
