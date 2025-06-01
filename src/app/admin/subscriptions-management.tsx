"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Edit, Trash2, Search, RefreshCw, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  organization: {
    id: string;
    name: string;
  };
  plan: {
    id: string;
    name: string;
    monthlyPrice: number;
  };
  status: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

interface SubscriptionsManagementProps {
  hideCreateButton?: boolean;
}

export function SubscriptionsManagement({
  hideCreateButton = false,
}: SubscriptionsManagementProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Charger les abonnements
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/subscriptions");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des abonnements");
        }
        const data = await response.json();
        setSubscriptions(data.subscriptions);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de charger les abonnements");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Filtrer les abonnements
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      subscription.organization.name.toLowerCase().includes(searchLower) ||
      subscription.plan.name.toLowerCase().includes(searchLower) ||
      subscription.status.toLowerCase().includes(searchLower)
    );
  });

  // Fonction pour éditer un abonnement
  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsEditing(true);
  };

  // Fonction pour supprimer un abonnement
  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet abonnement ? L'organisation passera au plan gratuit."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      // Mettre à jour la liste des abonnements
      setSubscriptions(
        subscriptions.filter((sub) => sub.id !== subscriptionId)
      );
      toast.success("Abonnement supprimé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression de l'abonnement");
    }
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      const response = await fetch(
        `/api/admin/subscriptions/${selectedSubscription.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: selectedSubscription.organization.name,
            subscription: {
              planName: selectedSubscription.plan.name,
              status: selectedSubscription.status,
              cancelAtPeriodEnd: selectedSubscription.cancelAtPeriodEnd,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      // Recharger les données
      const fetchResponse = await fetch("/api/admin/subscriptions");
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setSubscriptions(data.subscriptions);
      }

      setIsEditing(false);
      setSelectedSubscription(null);
      toast.success("Abonnement mis à jour avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour de l'abonnement"
      );
    }
  };

  // Formater le statut en français
  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      ACTIVE: "Actif",
      PAST_DUE: "En retard",
      CANCELED: "Annulé",
      UNPAID: "Impayé",
      INCOMPLETE: "Incomplet",
      INCOMPLETE_EXPIRED: "Expiré",
      TRIALING: "Essai",
    };

    return statusMap[status] || status;
  };

  // Formater une date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Obtenir la classe CSS pour le statut
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "TRIALING":
        return "text-green-500 bg-green-50 border-green-200";
      case "PAST_DUE":
      case "UNPAID":
        return "text-amber-500 bg-amber-50 border-amber-200";
      case "CANCELED":
      case "INCOMPLETE_EXPIRED":
        return "text-red-500 bg-red-50 border-red-200";
      case "INCOMPLETE":
        return "text-blue-500 bg-blue-50 border-blue-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Abonnements</CardTitle>
          <CardDescription>
            Administrez tous les abonnements des organisations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un abonnement..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
              {!hideCreateButton && <Button>Nouvel abonnement</Button>}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Aucun abonnement trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">
                          {subscription.organization.name}
                        </TableCell>
                        <TableCell>{subscription.plan.name}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(subscription.status)}`}
                          >
                            {formatStatus(subscription.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {subscription.plan.monthlyPrice}€/mois
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(subscription.currentPeriodStart)}
                            {" - "}
                            {formatDate(subscription.currentPeriodEnd)}
                          </div>
                          {subscription.cancelAtPeriodEnd && (
                            <div className="text-red-500 flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Annulé en fin de période
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleEditSubscription(subscription)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteSubscription(subscription.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditing && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Modifier l&apos;abonnement
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Organisation
                </label>
                <Input
                  value={selectedSubscription.organization.name}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Plan</label>
                <select
                  value={selectedSubscription?.plan.name || "FREE"}
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => {
                    setSelectedSubscription({
                      ...selectedSubscription,
                      plan: {
                        ...selectedSubscription.plan,
                        name: e.target.value,
                      },
                    });
                  }}
                >
                  <option value="FREE">Gratuit</option>
                  <option value="PERSONAL">Particulier</option>
                  <option value="PROFESSIONAL">Professionnel</option>
                  <option value="ENTERPRISE">Entreprise</option>
                  <option value="ILLIMITE">Accès Illimité</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  value={selectedSubscription.status}
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => {
                    setSelectedSubscription({
                      ...selectedSubscription,
                      status: e.target.value,
                    });
                  }}
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="TRIALING">Essai</option>
                  <option value="PAST_DUE">En retard</option>
                  <option value="CANCELED">Annulé</option>
                  <option value="UNPAID">Impayé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Date de fin de période
                </label>
                <Input
                  type="date"
                  value={
                    new Date(selectedSubscription.currentPeriodEnd)
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) => {
                    setSelectedSubscription({
                      ...selectedSubscription,
                      currentPeriodEnd: new Date(e.target.value).toISOString(),
                    });
                  }}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cancelAtPeriodEnd"
                  checked={selectedSubscription.cancelAtPeriodEnd}
                  onChange={(e) => {
                    setSelectedSubscription({
                      ...selectedSubscription,
                      cancelAtPeriodEnd: e.target.checked,
                    });
                  }}
                  className="mr-2"
                />
                <label htmlFor="cancelAtPeriodEnd" className="text-sm">
                  Annuler en fin de période
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedSubscription(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSaveSubscription}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
