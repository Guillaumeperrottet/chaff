"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface Subscription {
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface Plan {
  name: string;
  hasCustomPricing?: boolean;
  price: number;
}

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/subscriptions/details");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Une erreur est survenue");
        }

        setSubscription(data.subscription);
        setPlan(data.plan);
      } catch (error) {
        console.error("Erreur:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération de l'abonnement"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Afficher un message en fonction de l'état de l'abonnement
  const getStatusMessage = () => {
    if (!subscription) return null;

    switch (subscription.status) {
      case "ACTIVE":
        return (
          <div className="flex items-center text-green-500 dark:text-green-400">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Abonnement actif</span>
          </div>
        );
      case "PAST_DUE":
        return (
          <div className="flex items-center text-amber-500 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Paiement en retard</span>
          </div>
        );
      case "CANCELED":
        return (
          <div className="flex items-center text-[color:var(--muted-foreground)]">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Abonnement annulé</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-4 border border-[color:var(--border)] rounded-lg animate-pulse bg-[color:var(--muted)]">
        <div className="h-6 w-2/3 bg-[color:var(--border)] rounded mb-3"></div>
        <div className="h-4 w-1/2 bg-[color:var(--border)] rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
        <p className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          {error}
        </p>
      </div>
    );
  }

  // Si aucun plan, on affiche un message d'erreur
  if (!plan) {
    return (
      <div className="p-4 border border-amber-200 dark:border-amber-900/50 rounded-lg bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
        <p className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          Impossible de récupérer les informations de votre plan
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-[color:var(--border)] rounded-lg bg-[color:var(--card)] shadow-sm">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium flex items-center text-[color:var(--foreground)]">
            <CreditCard className="h-5 w-5 mr-2 text-[color:var(--primary)]" />
            Plan {plan.name}
          </h3>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            {plan.hasCustomPricing
              ? "Prix personnalisé"
              : plan.price === 0
                ? "Gratuit"
                : `${plan.price}€/mois`}
          </p>
          {subscription && (
            <div className="mt-2">
              {getStatusMessage()}
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                  {subscription.cancelAtPeriodEnd
                    ? `Se termine le ${formatDate(
                        subscription.currentPeriodEnd
                      )}`
                    : `Prochain renouvellement le ${formatDate(
                        subscription.currentPeriodEnd
                      )}`}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {plan.name === "FREE" && (
            <Button
              onClick={handleUpgrade}
              className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:opacity-90 transition-colors touch-target active:scale-95"
            >
              Passer au premium
            </Button>
          )}
          {subscription &&
            subscription.status === "ACTIVE" &&
            plan.name !== "FREE" && (
              <Button
                onClick={() => router.push("/pricing")}
                variant="outline"
                className="bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors touch-target active:scale-95"
              >
                Gérer l&apos;abonnement
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
