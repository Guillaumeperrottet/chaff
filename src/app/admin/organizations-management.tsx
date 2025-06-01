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
import {
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Plus,
  Users,
  FileText,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  objectCount: number;
  subscription?: {
    id: string;
    planName: string;
    status: string;
  };
}

interface OrganizationsManagementProps {
  hideCreateButton?: boolean;
}

export function OrganizationsManagement({
  hideCreateButton = false,
}: OrganizationsManagementProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Charger les organisations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/organizations");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des organisations");
        }
        const data = await response.json();
        setOrganizations(data.organizations);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de charger les organisations");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Filtrer les organisations
  const filteredOrganizations = organizations.filter((org) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      (org.subscription?.planName &&
        org.subscription.planName.toLowerCase().includes(searchLower))
    );
  });

  // Fonction pour éditer une organisation
  const handleEditOrg = (org: Organization) => {
    setSelectedOrg(org);
    setIsEditing(true);
  };

  // Fonction pour supprimer une organisation
  const handleDeleteOrg = async (orgId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cette organisation et tous ses utilisateurs et données ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      // Mettre à jour la liste des organisations
      setOrganizations(organizations.filter((org) => org.id !== orgId));
      toast.success("Organisation supprimée avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression de l'organisation");
    }
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveOrg = async () => {
    if (!selectedOrg) return;

    try {
      const response = await fetch(
        `/api/admin/organizations/${selectedOrg.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedOrg),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      // Mettre à jour la liste des organisations
      const updatedOrganizations = organizations.map((org) => {
        if (org.id === selectedOrg.id) {
          return selectedOrg;
        }
        return org;
      });

      setOrganizations(updatedOrganizations);
      setIsEditing(false);
      setSelectedOrg(null);
      toast.success("Organisation mise à jour avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour de l'organisation");
    }
  };

  // Fonction pour voir les détails d'une organisation
  const handleViewOrgDetails = (orgId: string) => {
    window.open(`/admin/organizations/${orgId}`, "_blank");
  };

  // Fonction pour créer une nouvelle organisation
  const handleCreateOrg = () => {
    const newOrg: Organization = {
      id: "",
      name: "Nouvelle Organisation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userCount: 0,
      objectCount: 0,
    };

    setSelectedOrg(newOrg);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Organisations</CardTitle>
          <CardDescription>
            Administrez toutes les organisations du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une organisation..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setOrganizations([])}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
              {!hideCreateButton && (
                <Button onClick={handleCreateOrg}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle organisation
                </Button>
              )}
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
                    <TableHead>Nom</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Objets</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Aucune organisation trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrganizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">
                          {org.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-blue-500" />
                            <span>{org.userCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1 text-amber-500" />
                            <span>{org.objectCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {org.subscription ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                org.subscription.status === "ACTIVE"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-gray-50 text-gray-600"
                              }`}
                            >
                              {org.subscription.planName}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(org.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOrgDetails(org.id)}
                              title="Voir les détails"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOrg(org)}
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteOrg(org.id)}
                              title="Supprimer"
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

      {isEditing && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedOrg.id
                ? "Modifier l'organisation"
                : "Créer une organisation"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <Input
                  value={selectedOrg.name}
                  onChange={(e) =>
                    setSelectedOrg({ ...selectedOrg, name: e.target.value })
                  }
                />
              </div>

              {selectedOrg.id && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Plan d&apos;abonnement
                    </label>
                    <select
                      value={selectedOrg.subscription?.planName || "FREE"}
                      className="w-full px-3 py-2 border rounded-md"
                      onChange={(e) => {
                        setSelectedOrg({
                          ...selectedOrg,
                          subscription: {
                            ...selectedOrg.subscription,
                            planName: e.target.value,
                            id: selectedOrg.subscription?.id || "",
                            status:
                              selectedOrg.subscription?.status || "ACTIVE",
                          },
                        });
                      }}
                    >
                      <option value="FREE">Gratuit</option>
                      <option value="PERSONAL">Particulier</option>
                      <option value="PROFESSIONAL">Indépendant</option>
                      <option value="ENTERPRISE">Entreprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Statut de l&apos;abonnement
                    </label>
                    <select
                      value={selectedOrg.subscription?.status || "ACTIVE"}
                      className="w-full px-3 py-2 border rounded-md"
                      onChange={(e) => {
                        setSelectedOrg({
                          ...selectedOrg,
                          subscription: {
                            ...selectedOrg.subscription,
                            status: e.target.value,
                            id: selectedOrg.subscription?.id || "",
                            planName:
                              selectedOrg.subscription?.planName || "FREE",
                          },
                        });
                      }}
                    >
                      <option value="ACTIVE">Actif</option>
                      <option value="TRIALING">Essai</option>
                      <option value="CANCELED">Annulé</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedOrg(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSaveOrg}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
