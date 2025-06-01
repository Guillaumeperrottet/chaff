"use client";

import { EnrichedUser } from "@/lib/auth-session";
import { Button } from "@/app/components/ui/button";
import {
  Users,
  Settings,
  Bell,
  CreditCard,
  Plus,
  Building2,
  UserPlus,
} from "lucide-react";

interface DashboardClientProps {
  user: EnrichedUser;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const quickActions = [
    {
      title: "Inviter un utilisateur",
      description: "Ajouter un membre à votre organisation",
      icon: UserPlus,
      action: () => console.log("Invite user"),
      condition: user.isAdmin,
    },
    {
      title: "Gérer l'organisation",
      description: "Paramètres et configuration",
      icon: Building2,
      action: () => console.log("Manage org"),
      condition: user.isAdmin,
    },
    {
      title: "Ajouter du contenu",
      description: "Créer votre premier élément",
      icon: Plus,
      action: () => console.log("Add content"),
      condition: true,
    },
  ];

  const stats = [
    {
      title: "Utilisateurs",
      value: user.Organization ? "1+" : "1",
      icon: Users,
      description: "Membres actifs",
    },
    {
      title: "Organisation",
      value: user.Organization?.name || "Personnel",
      icon: Building2,
      description: "Votre espace",
    },
    {
      title: "Plan",
      value: user.planType || "FREE",
      icon: CreditCard,
      description: "Abonnement actuel",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Bienvenue, {user.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {user.Organization?.name || "Espace personnel"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions
              .filter((action) => action.condition)
              .map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-card border border-border rounded-lg p-6 text-left hover:bg-muted/50 transition-colors shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="text-center py-12">
            <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Prêt à commencer ?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Votre dashboard est prêt ! Vous pouvez maintenant ajouter vos
              propres fonctionnalités et personnaliser cette interface selon vos
              besoins.
            </p>
            <div className="flex gap-3 justify-center">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter du contenu
              </Button>
              <Button variant="outline">Voir la documentation</Button>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚀 Template prêt à l&apos;emploi
          </h3>
          <p className="text-blue-800 mb-4">Ce dashboard inclut déjà :</p>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>
              ✅ Authentification complète (inscription, connexion, vérification
              email)
            </li>
            <li>✅ Gestion des organisations et invitations</li>
            <li>✅ Système d&apos;abonnements avec Stripe</li>
            <li>✅ Notifications en temps réel</li>
            <li>✅ Gestion des utilisateurs et permissions</li>
            <li>✅ Interface responsive et moderne</li>
          </ul>
          <p className="text-blue-800 mt-4 text-sm">
            Personnalisez cette page selon vos besoins métier !
          </p>
        </div>
      </div>
    </div>
  );
}
