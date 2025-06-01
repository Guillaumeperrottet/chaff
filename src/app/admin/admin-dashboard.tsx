"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { UsersManagement } from "@/app/admin/users-management";
import { SubscriptionsManagement } from "@/app/admin/subscriptions-management";
import { OrganizationsManagement } from "@/app/admin/organizations-management";
import { SubscriptionLimitsManagement } from "@/app/admin/subscription-limits-management";
import { CompleteUserCreation } from "@/app/admin/complete-user-creation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  ArrowLeft,
  Users,
  Building,
  CreditCard,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  CheckSquare,
  TrendingDown,
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

export function AdminDashboard({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, isLoading, isError, error, refresh } = useAdminStats();

  // Fonction pour gérer l'actualisation manuelle
  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success("Statistiques actualisées");
    } catch {
      toast.error("Erreur lors de l'actualisation");
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "good":
        return <TrendingUp className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getHealthText = (health: string) => {
    switch (health) {
      case "good":
        return "Excellent";
      case "warning":
        return "Attention";
      case "critical":
        return "Critique";
      default:
        return "Inconnu";
    }
  };

  // Fonction pour formater les tendances
  const formatGrowthPercentage = (percentage: number) => {
    if (percentage === 0) return "Aucune croissance";
    return `+${percentage}% cette semaine`;
  };

  const searchParams = useSearchParams();

  // Ajouter useEffect pour gérer les paramètres de retour
  useEffect(() => {
    const upgrade = searchParams.get("upgrade");
    // const orgId = searchParams.get("org");

    if (upgrade === "success") {
      toast.success("Paiement confirmé !", {
        description: "Le plan de l'organisation a été mis à jour avec succès.",
        duration: 5000,
      });

      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Actualiser les données si on est sur l'onglet des limites
      if (activeTab === "limits") {
        // Cette fonction devrait être exposée depuis SubscriptionLimitsManagement
        // ou vous pouvez déclencher un refresh global
        window.location.reload();
      }
    } else if (upgrade === "cancelled") {
      toast.warning("Paiement annulé", {
        description: "Le changement de plan a été annulé.",
      });

      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, activeTab]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Administration Système</h1>
          <p className="text-[color:var(--muted-foreground)]">
            Accès administrateur complet pour {user.email}
          </p>
        </div>
        <div className="flex gap-3">
          <CompleteUserCreation />
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au dashboard
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Vue d&apos;ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            <span>Organisations</span>
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>Abonnements</span>
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Limites</span>
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="mt-6">
          {/* Bouton d'actualisation */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Statistiques générales</h2>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Actualisation..." : "Actualiser"}
            </Button>
          </div>

          {/* Gestion des états de chargement et d'erreur */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Erreur de chargement</span>
              </div>
              <p className="text-red-700 mt-1">
                {error?.message || "Impossible de charger les statistiques"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                Réessayer
              </Button>
            </div>
          )}

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Utilisateurs */}
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Utilisateurs
                  </p>
                  <div className="flex items-baseline gap-2">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold">
                        {stats?.totalUsers || 0}
                      </p>
                    )}
                  </div>
                  {stats?.growth && (
                    <p className="text-xs text-green-600 mt-1">
                      {formatGrowthPercentage(stats.growth.usersPercentage)}
                    </p>
                  )}
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {/* Organisations */}
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Organisations
                  </p>
                  <div className="flex items-baseline gap-2">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold">
                        {stats?.totalOrganizations || 0}
                      </p>
                    )}
                  </div>
                  {stats?.avgUsersPerOrganization && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.avgUsersPerOrganization} utilisateurs/org en
                      moyenne
                    </p>
                  )}
                </div>
                <Building className="h-8 w-8 text-amber-500" />
              </div>
            </div>

            {/* Abonnements actifs */}
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Abonnements actifs
                  </p>
                  <div className="flex items-baseline gap-2">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold">
                        {stats?.activeSubscriptions || 0}
                      </p>
                    )}
                  </div>
                  {stats?.subscriptionRate !== undefined && (
                    <p className="text-xs text-green-600 mt-1">
                      {stats.subscriptionRate}% de taux de conversion
                    </p>
                  )}
                </div>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
            </div>

            {/* État système */}
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    État système
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {isLoading ? (
                      <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <>
                        {stats?.systemHealth &&
                          getHealthIcon(stats.systemHealth)}
                        <span
                          className={`text-sm font-medium ${stats?.systemHealth ? getHealthColor(stats.systemHealth) : "text-gray-500"}`}
                        >
                          {stats?.systemHealth
                            ? getHealthText(stats.systemHealth)
                            : "Inconnu"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Objets immobiliers */}
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Objets immobiliers</h3>
                <Briefcase className="h-6 w-6 text-purple-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  {isLoading ? (
                    <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className="font-medium">
                      {stats?.totalObjects || 0}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Moyenne par organisation
                  </span>
                  {isLoading ? (
                    <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className="font-medium">
                      {stats?.avgObjectsPerOrganization || 0}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tâches */}
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tâches</h3>
                <CheckSquare className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total actives</span>
                  {isLoading ? (
                    <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className="font-medium">
                      {stats?.totalTasks || 0}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Nouveaux utilisateurs (7j)
                  </span>
                  {isLoading ? (
                    <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <span className="font-medium text-green-600">
                      +{stats?.recentUsers || 0}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab("users")}
                className="h-auto p-4 flex flex-col items-start"
              >
                <Users className="h-6 w-6 mb-2 text-blue-500" />
                <span className="font-medium">Gérer les utilisateurs</span>
                <span className="text-sm text-muted-foreground">
                  Voir, modifier et supprimer des utilisateurs
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setActiveTab("limits")}
                className="h-auto p-4 flex flex-col items-start"
              >
                <BarChart3 className="h-6 w-6 mb-2 text-purple-500" />
                <span className="font-medium">Ajuster les limites</span>
                <span className="text-sm text-muted-foreground">
                  Modifier les quotas d&apos;abonnement
                </span>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersManagement hideCreateButton />
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <OrganizationsManagement hideCreateButton />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsManagement hideCreateButton />
        </TabsContent>

        <TabsContent value="limits" className="mt-6">
          <SubscriptionLimitsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
