"use client";

import { useState } from "react";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  Loader2,
  Shield,
  ArrowRight,
  X,
  AlertTriangle,
  Info,
  CalendarClock,
  Sparkles,
  Crown,
  Mail,
  Check,
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { Button } from "@/app/components/ui/button";
import UsageLimits from "@/app/components/UsageLimits";
import { Card, CardContent } from "@/app/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { BackButton } from "@/app/components/ui/BackButton";
import Link from "next/link";

type Plan = {
  id: string;
  name: string;
  price: number;
  monthlyPrice: number;
  yearlyPrice: number | null;
  maxUsers: number | null;
  maxMandates: number | null;
  maxStorage: number | null;
  features: string[];
  hasCustomPricing: boolean;
  trialDays: number;
  hasAdvancedReports?: boolean;
  hasApiAccess?: boolean;
  hasCustomBranding?: boolean;
};

type Subscription = {
  id: string;
  organizationId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  cancelAtPeriodEnd: boolean;
  plan: Plan;
};

type SubscriptionDashboardProps = {
  subscription: Subscription | null;
  plans: Plan[];
  isAdmin: boolean;
  organizationId: string;
};

export default function SubscriptionDashboard({
  subscription,
  plans,
  isAdmin,
  organizationId,
}: SubscriptionDashboardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOption, setCancelOption] = useState<"end_period" | "immediate">(
    "end_period"
  );
  const [cancelLoading, setCancelLoading] = useState(false);

  const currentPlan = subscription?.plan;
  const isFreePlan = currentPlan?.name === "FREE";

  // Fonction pour obtenir l'icône pour chaque plan
  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "FREE":
        return <Shield className="h-6 w-6 text-gray-500" />;
      case "PREMIUM":
        return <Sparkles className="h-6 w-6 text-[#d9840d]" />;
      case "SUPER_ADMIN":
        return <Crown className="h-6 w-6 text-[#8b5cf6]" />;
      default:
        return <CreditCard className="h-6 w-6 text-gray-500" />;
    }
  };

  // Fonction pour obtenir la couleur du plan
  const getPlanColor = (planName: string) => {
    switch (planName) {
      case "FREE":
        return {
          gradient: "from-gray-500 to-gray-600",
          button: "bg-gray-600 hover:bg-gray-700",
          border: "border-gray-200",
          accent: "text-gray-600",
          bg: "bg-gray-50 dark:bg-gray-900/20",
        };
      case "PREMIUM":
        return {
          gradient: "from-[#d9840d] to-[#e36002]",
          button: "bg-[#d9840d] hover:bg-[#c6780c]",
          border: "border-[#d9840d]",
          accent: "text-[#d9840d]",
          bg: "bg-[#fff7ed] dark:bg-orange-900/20",
        };
      case "SUPER_ADMIN":
        return {
          gradient: "from-purple-500 to-purple-600",
          button: "bg-purple-600 hover:bg-purple-700",
          border: "border-purple-200",
          accent: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
        };
      default:
        return {
          gradient: "from-gray-500 to-gray-600",
          button: "bg-gray-600 hover:bg-gray-700",
          border: "border-gray-200",
          accent: "text-gray-600",
          bg: "bg-gray-50 dark:bg-gray-900/20",
        };
    }
  };

  // Fonction pour obtenir le nom d'affichage du plan
  const getPlanDisplayName = (planName: string) => {
    switch (planName) {
      case "FREE":
        return "Gratuit";
      case "PREMIUM":
        return "Premium";
      case "SUPER_ADMIN":
        return "Super Admin";
      default:
        return planName;
    }
  };

  // Simplifier les features selon le plan
  const getSimplifiedFeatures = (plan: Plan) => {
    switch (plan.name) {
      case "FREE":
        return [
          "1 utilisateur",
          "Accès dashboard de base",
          "100MB de stockage",
          "Support communauté",
        ];
      case "PREMIUM":
        return [
          "Jusqu'à 10 utilisateurs",
          "Toutes les fonctionnalités",
          "10GB de stockage",
          "Support prioritaire",
          "Rapports avancés",
          "Accès API",
        ];
      default:
        return plan.features.slice(0, 4);
    }
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Obtenir le statut de l'abonnement sous forme d'élément visuel
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <div className="flex items-center text-green-500">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Actif</span>
          </div>
        );
      case "PAST_DUE":
        return (
          <div className="flex items-center text-amber-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Paiement en attente</span>
          </div>
        );
      case "TRIALING":
        return (
          <div className="flex items-center text-blue-500">
            <Calendar className="h-5 w-5 mr-2" />
            <span>Période d&apos;essai</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-[color:var(--muted-foreground)]">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{status}</span>
          </div>
        );
    }
  };

  // Gérer le changement de plan
  const handleSelectPlan = async (plan: Plan) => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent modifier l'abonnement");
      return;
    }

    setLoading(plan.id);

    try {
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: plan.name,
          organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      const data = await response.json();

      // Rediriger vers l'URL de paiement ou le dashboard pour le plan gratuit
      if (data.url) {
        toast.success("Redirection vers la page de paiement...");
        window.location.href = data.url;
      } else if (data.success) {
        toast.success("Plan mis à jour avec succès!");
        window.location.href = "/dashboard?subscription=updated";
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur lors de la sélection du plan: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setLoading(null);
    }
  };

  // Gérer le portail de facturation Stripe
  const handleManageSubscription = async () => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent gérer l'abonnement");
      return;
    }

    setLoading("manage");

    try {
      const response = await fetch("/api/subscriptions/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      const { url } = await response.json();

      // Rediriger vers le portail client Stripe
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur lors de l'accès au portail de gestion: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setLoading(null);
    }
  };

  // Renouveler un abonnement gratuit
  const handleRenewFreePlan = async () => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent renouveler l'abonnement");
      return;
    }

    setLoading("renew");

    try {
      const response = await fetch("/api/subscriptions/renew-free", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      await response.json();

      toast.success("Abonnement gratuit renouvelé avec succès!");
      // Rafraîchir la page pour voir les changements
      window.location.reload();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur lors du renouvellement: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setLoading(null);
    }
  };

  // Gérer l'annulation de l'abonnement
  const handleCancelSubscription = async () => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent annuler l'abonnement");
      return;
    }

    setCancelLoading(true);
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancelImmediately: cancelOption === "immediate",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      const data = await response.json();
      toast.success(data.message);
      setShowCancelModal(false);

      // Rafraîchir la page après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur lors de l'annulation: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setCancelLoading(false);
    }
  };

  // Modal de confirmation d'annulation
  const CancelModal = () => {
    return (
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="bg-[color:var(--card)] text-[color:var(--foreground)] border-[color:var(--border)] sm:max-w-md">
          <DialogTitle className="text-[color:var(--foreground)]">
            Confirmer l&apos;annulation de l&apos;abonnement
          </DialogTitle>
          <DialogDescription className="text-[color:var(--muted-foreground)]">
            Êtes-vous sûr de vouloir annuler votre abonnement ? Cette action
            pourrait limiter l&apos;accès à certaines fonctionnalités.
          </DialogDescription>

          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="end_period"
                  name="cancelOption"
                  value="end_period"
                  checked={cancelOption === "end_period"}
                  onChange={() => setCancelOption("end_period")}
                  className="h-4 w-4 text-[color:var(--primary)]"
                />
                <label
                  htmlFor="end_period"
                  className="text-sm font-medium text-[color:var(--foreground)]"
                >
                  Annuler à la fin de la période de facturation
                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    Votre abonnement restera actif jusqu&apos;au{" "}
                    {formatDate(subscription?.currentPeriodEnd || new Date())}
                  </p>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="immediate"
                  name="cancelOption"
                  value="immediate"
                  checked={cancelOption === "immediate"}
                  onChange={() => setCancelOption("immediate")}
                  className="h-4 w-4 text-[color:var(--primary)]"
                />
                <label
                  htmlFor="immediate"
                  className="text-sm font-medium text-[color:var(--foreground)]"
                >
                  Annuler immédiatement
                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    Votre abonnement sera annulé immédiatement et vous passerez
                    au plan gratuit
                  </p>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelLoading}
              className="bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors touch-target"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className="touch-target"
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Confirmer l'annulation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Fonction pour calculer le pourcentage de la période écoulée
  const getSubscriptionProgress = (start: Date, end: Date): number => {
    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    if (elapsed <= 0) return 0;
    if (elapsed >= total) return 100;

    return Math.floor((elapsed / total) * 100);
  };

  // Fonction pour obtenir le nombre de jours restants
  const getDaysRemaining = (end: Date): number => {
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Fonction pour vérifier si la date de fin est proche (moins de 7 jours)
  const isEndingPeriodSoon = (end: Date): boolean => {
    return getDaysRemaining(end) <= 7;
  };

  // Composant pour afficher un bandeau d'état
  const SubscriptionStatusBanner = ({
    subscription,
  }: {
    subscription: Subscription | null;
  }) => {
    if (!subscription) return null;

    const isPastDue = subscription.status === "PAST_DUE";
    const isCancelled = subscription.cancelAtPeriodEnd;

    // Adaptation des classes pour le mode sombre
    let bgClass, textClass, borderClass;
    let icon = <CheckCircle className="h-5 w-5" />;
    let message = "Votre abonnement est actif.";

    if (isPastDue) {
      bgClass = "bg-red-100 dark:bg-red-950/30";
      borderClass = "border-red-200 dark:border-red-900/50";
      textClass = "text-red-700 dark:text-red-400";
      icon = <AlertCircle className="h-5 w-5" />;
      message =
        "Problème de paiement détecté. Veuillez mettre à jour vos informations de paiement.";
    } else if (isCancelled) {
      bgClass = "bg-amber-100 dark:bg-amber-950/30";
      borderClass = "border-amber-200 dark:border-amber-900/50";
      textClass = "text-amber-700 dark:text-amber-400";
      icon = <Info className="h-5 w-5" />;
      message = `Votre abonnement sera annulé le ${formatDate(subscription.currentPeriodEnd)}. Vous passerez ensuite au forfait gratuit.`;
    } else if (isEndingPeriodSoon(subscription.currentPeriodEnd)) {
      bgClass = "bg-blue-100 dark:bg-blue-950/30";
      borderClass = "border-blue-200 dark:border-blue-900/50";
      textClass = "text-blue-700 dark:text-blue-400";
      icon = <CalendarClock className="h-5 w-5" />;
      message = `Renouvellement prévu dans ${getDaysRemaining(subscription.currentPeriodEnd)} jours.`;
    } else {
      bgClass = "bg-green-100 dark:bg-green-950/30";
      borderClass = "border-green-200 dark:border-green-900/50";
      textClass = "text-green-700 dark:text-green-400";
    }

    return (
      <div
        className={`p-4 mb-6 rounded-lg border ${bgClass} ${borderClass} ${textClass} flex items-start gap-3`}
      >
        {icon}
        <div>
          <p className="font-medium">{message}</p>
          {isPastDue && (
            <Button
              variant="default"
              size="sm"
              className="mt-2 touch-target active:scale-95 transition-transform"
              onClick={handleManageSubscription}
            >
              Mettre à jour le paiement
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Composant pour afficher une timeline de la période d'abonnement
  const SubscriptionTimeline = ({
    subscription,
  }: {
    subscription: Subscription | null;
  }) => {
    if (!subscription) return null;

    const progress = getSubscriptionProgress(
      new Date(subscription.currentPeriodStart),
      new Date(subscription.currentPeriodEnd)
    );

    const daysRemaining = getDaysRemaining(subscription.currentPeriodEnd);

    return (
      <div className="mb-6 p-4 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg">
        <h3 className="text-md font-medium mb-3 text-[color:var(--foreground)]">
          Période d&apos;abonnement
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-[color:var(--muted-foreground)]">
            <span>{formatDate(subscription.currentPeriodStart)}</span>
            <span>{formatDate(subscription.currentPeriodEnd)}</span>
          </div>

          <Progress
            value={progress}
            className="h-2 bg-[color:var(--muted)] [&>div]:bg-[color:var(--primary)]"
          />

          <div className="flex justify-between items-center">
            <span className="text-sm text-[color:var(--muted-foreground)]">
              Progression: {progress}%
            </span>
            <span
              className={`text-sm font-medium ${daysRemaining <= 7 ? "text-amber-600 dark:text-amber-500" : "text-[color:var(--foreground)]"}`}
            >
              {daysRemaining} jours restants
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Composant pour les détails de facturation
  const BillingDetails = ({
    subscription,
  }: {
    subscription: Subscription | null;
  }) => {
    if (!subscription || !subscription.stripeSubscriptionId) return null;

    return (
      <div className="mb-6 p-4 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg">
        <h3 className="text-md font-medium mb-3 text-[color:var(--foreground)]">
          Détails de facturation
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-[color:var(--muted-foreground)]">
              Prochain paiement
            </span>
            <span className="text-sm font-medium text-[color:var(--foreground)]">
              {formatDate(subscription.currentPeriodEnd)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-[color:var(--muted-foreground)]">
              Montant
            </span>
            <span className="text-sm font-medium text-[color:var(--foreground)]">
              {subscription.plan.monthlyPrice}€ / mois
            </span>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded text-amber-700 dark:text-amber-400 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>Pas de renouvellement prévu</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header avec navigation */}
      <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton
              href="/profile"
              label="Retour au profil"
              loadingMessage="Retour au profil..."
            />
            <div className="h-4 w-px bg-[color:var(--border)]"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[color:var(--primary)] rounded-lg flex items-center justify-center">
                <CreditCard
                  size={16}
                  className="text-[color:var(--primary-foreground)]"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[color:var(--foreground)]">
                  Gestion de l&apos;abonnement
                </h1>
                <p className="text-xs text-[color:var(--muted-foreground)] hidden sm:block">
                  Gérez votre abonnement et vos préférences de facturation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        {/* Section abonnement actuel */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-[color:var(--foreground)]">
            Abonnement actuel
          </h2>

          {subscription && (
            <SubscriptionStatusBanner subscription={subscription} />
          )}

          <Card className="bg-[color:var(--card)] border-[color:var(--border)] shadow-sm">
            <CardContent className="p-6">
              {subscription ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-[color:var(--foreground)]">
                      Plan {getPlanDisplayName(subscription.plan.name)}
                    </h3>
                    <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
                      {subscription.plan.hasCustomPricing
                        ? "Prix personnalisé"
                        : subscription.plan.price === 0
                          ? "Gratuit"
                          : `${subscription.plan.monthlyPrice}€/mois`}
                    </p>
                    {getStatusBadge(subscription.status)}

                    {subscription.cancelAtPeriodEnd && (
                      <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-md text-sm">
                        Cet abonnement sera annulé le{" "}
                        {formatDate(subscription.currentPeriodEnd)}
                      </div>
                    )}

                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2 text-[color:var(--foreground)]">
                        Fonctionnalités incluses:
                      </h4>
                      <ul className="space-y-1">
                        {getSimplifiedFeatures(subscription.plan).map(
                          (feature, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-[color:var(--foreground)]">
                                {feature}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {!isFreePlan && subscription.stripeSubscriptionId && (
                      <>
                        <SubscriptionTimeline subscription={subscription} />
                        <BillingDetails subscription={subscription} />
                      </>
                    )}

                    {isAdmin && (
                      <div className="flex flex-col gap-3">
                        {!isFreePlan && subscription.stripeSubscriptionId ? (
                          <>
                            <Button
                              onClick={handleManageSubscription}
                              disabled={loading === "manage"}
                              className="w-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:opacity-90 transition-all touch-target active:scale-95"
                            >
                              {loading === "manage" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CreditCard className="mr-2 h-4 w-4" />
                              )}
                              Gérer le paiement
                            </Button>

                            {/* Bouton pour annuler l'abonnement */}
                            <Button
                              onClick={() => setShowCancelModal(true)}
                              variant="outline"
                              className="w-full text-red-500 dark:text-red-400 border-red-200 dark:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-300 transition-colors touch-target active:scale-95"
                              disabled={
                                loading !== null ||
                                subscription.cancelAtPeriodEnd
                              }
                            >
                              <X className="mr-2 h-4 w-4" />
                              {subscription.cancelAtPeriodEnd
                                ? "Annulation programmée"
                                : "Annuler l'abonnement"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={handleRenewFreePlan}
                            disabled={loading === "renew"}
                            className="w-full bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors touch-target active:scale-95"
                            variant="outline"
                          >
                            {loading === "renew" ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Calendar className="mr-2 h-4 w-4" />
                            )}
                            Renouveler l&apos;abonnement gratuit
                          </Button>
                        )}

                        <Button
                          onClick={() => (window.location.href = "/pricing")}
                          className={`w-full transition-colors touch-target active:scale-95 ${
                            isFreePlan
                              ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:opacity-90"
                              : "bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                          }`}
                          variant={isFreePlan ? "default" : "outline"}
                        >
                          <ArrowRight className="mr-2 h-4 w-4" />
                          {isFreePlan
                            ? "Passer à un forfait payant"
                            : "Modifier mon forfait"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Shield className="h-12 w-12 text-[color:var(--muted-foreground)] mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-[color:var(--foreground)]">
                    Aucun abonnement actif
                  </h3>
                  <p className="text-[color:var(--muted-foreground)] mb-4">
                    Vous n&apos;avez pas d&apos;abonnement actif pour le moment.
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={() => (window.location.href = "/pricing")}
                      className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:opacity-90 transition-colors touch-target active:scale-95"
                    >
                      Voir les forfaits disponibles
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Nouvelle section avec UsageLimits */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-[color:var(--foreground)]">
            Utilisation actuelle
          </h2>
          <UsageLimits />
        </div>

        {/* Section plans disponibles - Seulement FREE et PREMIUM */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
              Plans disponibles
            </h2>

            <div className="flex items-center space-x-2 bg-[color:var(--muted)] rounded-lg p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-3 py-1 text-sm rounded-md transition-colors touch-target ${
                  billingCycle === "monthly"
                    ? "bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm"
                    : "text-[color:var(--muted-foreground)]"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-3 py-1 text-sm rounded-md transition-colors touch-target ${
                  billingCycle === "yearly"
                    ? "bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm"
                    : "text-[color:var(--muted-foreground)]"
                }`}
              >
                Annuel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => {
              const colors = getPlanColor(plan.name);
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isPopular = plan.name === "PREMIUM";
              const simplifiedFeatures = getSimplifiedFeatures(plan);

              return (
                <Card
                  key={plan.id}
                  className={`bg-[color:var(--card)] border-[color:var(--border)] overflow-hidden transition-all duration-300 h-[480px] flex flex-col relative ${
                    isCurrentPlan
                      ? "border-2 border-[color:var(--primary)] shadow-lg shadow-[color:var(--primary)]/10"
                      : "shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Badge populaire */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="flex items-center gap-1 bg-gradient-to-r from-[#d9840d] to-[#e36002] text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        Populaire
                      </div>
                    </div>
                  )}

                  {/* Badge plan actuel */}
                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] px-2 py-1 rounded-full text-xs font-medium">
                        Plan actuel
                      </div>
                    </div>
                  )}

                  {/* En-tête coloré */}
                  <div
                    className={`h-2 w-full bg-gradient-to-r ${colors.gradient}`}
                  ></div>

                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        {getPlanIcon(plan.name)}
                      </div>
                      <h3 className={`text-lg font-bold ${colors.accent}`}>
                        {getPlanDisplayName(plan.name)}
                      </h3>
                    </div>

                    <div className="mb-6">
                      {plan.hasCustomPricing ? (
                        <div className="text-2xl font-bold text-[color:var(--foreground)]">
                          Sur mesure
                        </div>
                      ) : (
                        <div className="flex items-end">
                          <span className="text-2xl font-bold text-[color:var(--foreground)]">
                            {plan.price === 0
                              ? "Gratuit"
                              : billingCycle === "monthly"
                                ? `${plan.monthlyPrice}€`
                                : plan.yearlyPrice
                                  ? `${plan.yearlyPrice}€`
                                  : `${plan.monthlyPrice * 12}€`}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-[color:var(--muted-foreground)] ml-1 text-sm">
                              /{billingCycle === "monthly" ? "mois" : "an"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {billingCycle === "yearly" &&
                      plan.yearlyPrice &&
                      plan.monthlyPrice * 12 > plan.yearlyPrice && (
                        <div className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-2 rounded-md mb-4 border border-green-200 dark:border-green-900/50">
                          Économisez{" "}
                          {Math.round(
                            100 -
                              (plan.yearlyPrice / (plan.monthlyPrice * 12)) *
                                100
                          )}
                          % avec le forfait annuel
                        </div>
                      )}

                    <ul className="space-y-3 mb-6 flex-grow">
                      {simplifiedFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div
                            className={`w-4 h-4 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center mt-0.5 flex-shrink-0 mr-3`}
                          >
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="text-[color:var(--foreground)] text-sm leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      <Button
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full touch-target active:scale-95 transition-transform ${
                          isCurrentPlan
                            ? "bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                            : colors.button + " text-white hover:opacity-90"
                        }`}
                        variant={isCurrentPlan ? "outline" : "default"}
                        disabled={loading !== null || !isAdmin || isCurrentPlan}
                      >
                        {loading === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Chargement...
                          </>
                        ) : isCurrentPlan ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Plan actuel
                          </>
                        ) : (
                          <>
                            Sélectionner ce plan
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {!isAdmin && (
            <div className="mt-4 p-4 bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md text-amber-700 dark:text-amber-400">
              Seuls les administrateurs peuvent gérer les abonnements. Contactez
              l&apos;administrateur de votre organisation pour modifier votre
              abonnement.
            </div>
          )}
        </div>

        {/* Plan Sur mesure séparé */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-[color:var(--foreground)] mb-2">
              Besoin d&apos;un plan sur mesure ?
            </h3>
            <p className="text-[color:var(--muted-foreground)]">
              Pour les besoins spécifiques ou les grandes équipes
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-2 border-amber-200 dark:border-amber-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>

                <h4 className="text-xl font-bold text-amber-700 dark:text-amber-400 mb-2">
                  Solution personnalisée
                </h4>
                <p className="text-amber-600 dark:text-amber-500 mb-4 text-sm">
                  Fonctionnalités sur mesure pour votre organisation
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Check className="w-4 h-4" />
                    <span>Utilisateurs illimités</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Check className="w-4 h-4" />
                    <span>Stockage illimité</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Check className="w-4 h-4" />
                    <span>Support dédié</span>
                  </div>
                </div>

                <Link href="/contact?subject=Demande%20Plan%20Sur%20Mesure">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                    <Mail className="mr-2 h-4 w-4" />
                    Nous contacter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section FAQ */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4 text-[color:var(--foreground)]">
            Questions fréquentes
          </h2>
          <Card className="bg-[color:var(--card)] border-[color:var(--border)] shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-medium mb-2 text-[color:var(--foreground)]">
                  Comment fonctionne la facturation ?
                </h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  La facturation est mensuelle ou annuelle, selon le cycle que
                  vous choisissez. Vous pouvez changer de cycle à tout moment
                  depuis votre portail de paiement.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-[color:var(--foreground)]">
                  Puis-je annuler mon abonnement ?
                </h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Oui, vous pouvez annuler votre abonnement à tout moment. Votre
                  abonnement restera actif jusqu&apos;à la fin de la période en
                  cours, puis basculera automatiquement vers le plan gratuit.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-[color:var(--foreground)]">
                  Que se passe-t-il si je dépasse les limites de mon forfait ?
                </h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Vous serez notifié lorsque vous approchez des limites de votre
                  forfait. Si vous dépassez ces limites, vous devrez passer à un
                  forfait supérieur pour pouvoir continuer à ajouter de nouveaux
                  utilisateurs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal de confirmation d'annulation */}
        <CancelModal />
      </main>
    </div>
  );
}
