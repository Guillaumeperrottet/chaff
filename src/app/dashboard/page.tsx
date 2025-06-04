"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/app/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Undo2,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { toast } from "sonner";

interface DashboardData {
  id: string;
  name: string;
  lastEntry: string | null;
  daysSinceLastEntry: number | null;
  performance: string;
  values: Record<string, string>;
  category: string;
  status: string;
  totalRevenue: number;
}

interface ColumnLabel {
  key: string;
  label: string;
}

interface DashboardResponse {
  data: DashboardData[];
  totals: {
    totalRevenue: number;
    totalMandates: number;
    activeMandates: number;
    dailyTotals: Record<string, number>;
    subtotalsByCategory: {
      hebergement: Record<string, number>;
      restauration: Record<string, number>;
    };
  };
  columnLabels: ColumnLabel[];
  meta: {
    dateRange: {
      start: string;
      end: string;
    };
    generatedAt: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // État pour gérer les éléments supprimés (corbeille temporaire)
  const [deletedItems, setDeletedItems] = useState<Map<string, DashboardData>>(
    new Map()
  );

  // Charger les données du dashboard
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/data");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données du dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les données
  const filteredData =
    dashboardData?.data.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "hebergement" && item.category === "Hébergement") ||
        (categoryFilter === "restauration" && item.category === "Restauration");
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    }) || [];

  // Grouper les données par catégorie et calculer les totaux CORRIGÉS
  const groupedData = () => {
    if (!dashboardData) return { hebergement: [], restauration: [] };

    const hebergement = filteredData.filter(
      (item) => item.category === "Hébergement"
    );
    const restauration = filteredData.filter(
      (item) => item.category === "Restauration"
    );

    return { hebergement, restauration };
  };

  // SOLUTION SIMPLIFIÉE: Calculer les totaux pour un groupe
  const calculateGroupTotals = (groupData: DashboardData[]) => {
    if (!dashboardData) return {};

    const totals: Record<string, number> = {};
    dashboardData.columnLabels.forEach((col) => {
      totals[col.key] = groupData.reduce((sum, item) => {
        // SOLUTION: Parse simple avec virgule décimale seulement
        const valueStr = item.values[col.key] || "0,00";
        const value = parseFloat(valueStr.replace(",", "."));

        // Debug
        if (
          process.env.NODE_ENV === "development" &&
          !isNaN(value) &&
          value > 0
        ) {
          console.log(`🔍 ${item.name} - ${col.key}: ${valueStr} -> ${value}`);
        }

        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    });

    return totals;
  };

  // SOLUTION SIMPLIFIÉE: Calculer le total général
  const calculateGrandTotal = () => {
    if (!dashboardData) return {};

    const totals: Record<string, number> = {};
    dashboardData.columnLabels.forEach((col) => {
      totals[col.key] = filteredData.reduce((sum, item) => {
        // SOLUTION: Parse simple avec virgule décimale seulement
        const valueStr = item.values[col.key] || "0,00";
        const value = parseFloat(valueStr.replace(",", "."));
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    });

    return totals;
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/export/valeurs");
      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export téléchargé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  const handleImport = () => {
    router.push("/dashboard/import");
  };

  const handleAddValue = () => {
    router.push("/dashboard/dayvalues/create");
  };

  const handleViewDetails = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}`);
  };

  const handleEditMandate = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}/edit`);
  };

  const handleDeleteMandate = async (
    mandateId: string,
    mandateName: string
  ) => {
    try {
      // 1. Récupérer les données complètes avant suppression
      const mandateResponse = await fetch(`/api/mandats/${mandateId}`);
      if (!mandateResponse.ok)
        throw new Error("Impossible de récupérer les données");

      const mandateBackup = await mandateResponse.json();

      // 2. Supprimer côté serveur
      const response = await fetch(`/api/mandats/${mandateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      // 3. Trouver l'élément dans les données dashboard
      const deletedItem = dashboardData?.data.find(
        (item) => item.id === mandateId
      );

      if (deletedItem) {
        // 4. Sauvegarder dans la corbeille temporaire
        setDeletedItems((prev) => new Map(prev).set(mandateId, deletedItem));

        // 5. Retirer immédiatement de l'UI
        setDashboardData((prev) =>
          prev
            ? {
                ...prev,
                data: prev.data.filter((item) => item.id !== mandateId),
              }
            : null
        );

        // 6. Afficher le toast avec action d'annulation
        toast.success("Mandat supprimé", {
          description: `"${mandateName}" a été supprimé avec succès`,
          duration: 15000, // 15 secondes pour annuler
          action: {
            label: "Annuler",
            onClick: async () => {
              await handleUndoDelete(mandateId, mandateBackup, deletedItem);
            },
          },
        });

        // 7. Programmer la suppression définitive de la corbeille après 15 secondes
        setTimeout(() => {
          setDeletedItems((prev) => {
            const newMap = new Map(prev);
            newMap.delete(mandateId);
            return newMap;
          });
        }, 15000);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    }
  };

  // Fonction pour annuler une suppression
  const handleUndoDelete = async (
    mandateId: string,
    mandateBackup: {
      id: string;
      name: string;
      group: string;
      active: boolean;
    },
    dashboardItem: DashboardData
  ) => {
    try {
      // 1. Recréer le mandat côté serveur
      const response = await fetch("/api/mandats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: mandateBackup.id, // Garder le même ID si possible
          name: mandateBackup.name,
          group: mandateBackup.group,
          active: mandateBackup.active,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la restauration");
      }

      // 2. Restaurer dans l'UI immédiatement
      setDashboardData((prev) =>
        prev
          ? {
              ...prev,
              data: [...prev.data, dashboardItem],
            }
          : null
      );

      // 3. Retirer de la corbeille temporaire
      setDeletedItems((prev) => {
        const newMap = new Map(prev);
        newMap.delete(mandateId);
        return newMap;
      });

      // 4. Afficher confirmation
      toast.success("Mandat restauré", {
        description: `"${mandateBackup.name}" a été restauré avec succès`,
        icon: <Undo2 className="h-4 w-4" />,
      });

      // 5. Rafraîchir les données pour être sûr
      setTimeout(() => {
        fetchDashboardData();
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      toast.error("Erreur lors de la restauration du mandat");
    }
  };

  // Fonction pour vider la corbeille (si nécessaire)
  const handleEmptyTrash = () => {
    if (deletedItems.size === 0) return;

    toast.warning("Corbeille vidée", {
      description: `${deletedItems.size} élément(s) définitivement supprimé(s)`,
    });

    setDeletedItems(new Map());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // COMPOSANT CORRIGÉ : Rendre une ligne de campus (badges supprimés)
  const CampusRow = ({ campus }: { campus: DashboardData }) => (
    <TableRow key={campus.id} className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center space-x-2">
          <div>
            <div className="font-medium">{campus.name}</div>
            <div className="text-sm text-muted-foreground">
              <Badge
                variant={
                  campus.category === "Hébergement" ? "default" : "secondary"
                }
                className="text-xs"
              >
                {campus.category}
              </Badge>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {/* CORRECTION: Affichage simplifié sans badges temporels */}
        <div className="text-sm font-medium">
          {campus.lastEntry || "Jamais"}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium text-blue-600">
          {campus.performance}
        </div>
      </TableCell>
      {dashboardData?.columnLabels.map((col) => (
        <TableCell key={col.key} className="text-center">
          <div className="text-sm font-medium">
            {campus.values[col.key] || "0.00"}
          </div>
        </TableCell>
      ))}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewDetails(campus.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditMandate(campus.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDeleteMandate(campus.id, campus.name)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  // Composant pour rendre une ligne de sous-total
  const SubtotalRow = ({
    label,
    totals,
    bgColor,
    textColor,
  }: {
    label: string;
    totals: Record<string, number>;
    bgColor: string;
    textColor: string;
  }) => (
    <TableRow className={`${bgColor} hover:${bgColor}`}>
      <TableCell colSpan={3} className={`font-medium ${textColor}`}>
        {label}
      </TableCell>
      {dashboardData?.columnLabels.map((col) => (
        <TableCell
          key={col.key}
          className={`text-center font-medium ${textColor}`}
        >
          {formatCurrency(totals[col.key] || 0)}
        </TableCell>
      ))}
      <TableCell></TableCell>
    </TableRow>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Erreur lors du chargement des données
          </p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const grouped = groupedData();
  const hebergementTotals = calculateGroupTotals(grouped.hebergement);
  const restaurationTotals = calculateGroupTotals(grouped.restauration);
  const grandTotals = calculateGrandTotal();

  return (
    <div className="space-y-6">
      {/* Header avec titre et actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campus</h1>
          <p className="text-muted-foreground">
            Tableau de bord des valeurs journalières
            {deletedItems.size > 0 && (
              <span className="ml-2">
                <Badge variant="secondary" className="text-xs">
                  {deletedItems.size} élément(s) en corbeille
                </Badge>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Bouton pour vider la corbeille si elle n'est pas vide */}
          {deletedItems.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmptyTrash}
              className="text-muted-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Vider corbeille ({deletedItems.size})
            </Button>
          )}

          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Période
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtres
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button size="sm" onClick={handleAddValue}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un campus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="hebergement">Hébergement</SelectItem>
              <SelectItem value="restauration">Restauration</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="new">Nouveau</SelectItem>
              <SelectItem value="warning">Attention</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DEBUG: Afficher les totaux calculés pour vérifier */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm">
              🔧 DEBUG - Totaux calculés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div>Hébergement: {JSON.stringify(hebergementTotals)}</div>
              <div>Restauration: {JSON.stringify(restaurationTotals)}</div>
              <div>Total: {JSON.stringify(grandTotals)}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table principale avec totaux intégrés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Valeurs journalières</CardTitle>
              <CardDescription>
                Vue d&apos;ensemble des performances par campus
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredData.length} campus
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Campus</TableHead>
                  <TableHead className="min-w-[120px]">
                    Dernière saisie
                  </TableHead>
                  <TableHead className="min-w-[150px]">Top</TableHead>
                  {dashboardData.columnLabels.map((col) => (
                    <TableHead
                      key={col.key}
                      className="text-center min-w-[100px]"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Section Hébergement */}
                {categoryFilter === "all" ||
                categoryFilter === "hebergement" ? (
                  <>
                    {grouped.hebergement.map((campus) => (
                      <CampusRow key={campus.id} campus={campus} />
                    ))}
                    {grouped.hebergement.length > 0 && (
                      <SubtotalRow
                        label="Hébergement"
                        totals={hebergementTotals}
                        bgColor="bg-blue-50"
                        textColor="text-blue-700"
                      />
                    )}
                  </>
                ) : null}

                {/* Section Restauration */}
                {categoryFilter === "all" ||
                categoryFilter === "restauration" ? (
                  <>
                    {grouped.restauration.map((campus) => (
                      <CampusRow key={campus.id} campus={campus} />
                    ))}
                    {grouped.restauration.length > 0 && (
                      <SubtotalRow
                        label="Restauration"
                        totals={restaurationTotals}
                        bgColor="bg-orange-50"
                        textColor="text-orange-700"
                      />
                    )}
                  </>
                ) : null}

                {/* Affichage quand aucun campus */}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">
                        Aucun campus trouvé
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {dashboardData.data.length === 0
                          ? "Commencez par créer votre premier mandat"
                          : "Essayez de modifier vos filtres de recherche"}
                      </p>
                      {dashboardData.data.length === 0 && (
                        <Button
                          onClick={() =>
                            router.push("/dashboard/mandates/create")
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Créer un mandat
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              {/* Total général */}
              {filteredData.length > 0 && categoryFilter === "all" && (
                <TableFooter>
                  <TableRow className="bg-gray-100 hover:bg-gray-100">
                    <TableCell colSpan={3} className="font-bold text-gray-900">
                      Total
                    </TableCell>
                    {dashboardData.columnLabels.map((col) => (
                      <TableCell
                        key={col.key}
                        className="text-center font-bold text-gray-900"
                      >
                        {formatCurrency(grandTotals[col.key] || 0)}
                      </TableCell>
                    ))}
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer avec résumé */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Résumé général */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">
                RÉSUMÉ GÉNÉRAL
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Campus affichés:</span>
                  <span className="font-medium">{filteredData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total mandats:</span>
                  <span className="font-medium">
                    {dashboardData.totals.totalMandates}
                  </span>
                </div>
              </div>
            </div>

            {/* Hébergement */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-blue-700">HÉBERGEMENT</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Campus:</span>
                  <span className="font-medium text-blue-700">
                    {grouped.hebergement.length}
                  </span>
                </div>
                {dashboardData.columnLabels.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Total semaine:</span>
                    <span className="font-medium text-blue-700">
                      {formatCurrency(
                        Object.values(hebergementTotals).reduce(
                          (a, b) => a + b,
                          0
                        )
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Restauration */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-orange-700">
                RESTAURATION
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Campus:</span>
                  <span className="font-medium text-orange-700">
                    {grouped.restauration.length}
                  </span>
                </div>
                {dashboardData.columnLabels.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Total semaine:</span>
                    <span className="font-medium text-orange-700">
                      {formatCurrency(
                        Object.values(restaurationTotals).reduce(
                          (a, b) => a + b,
                          0
                        )
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Total général en bas */}
          {filteredData.length > 0 && dashboardData.columnLabels.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">TOTAL PÉRIODE:</span>
                <span className="font-bold text-xl text-primary">
                  {formatCurrency(
                    Object.values(grandTotals).reduce((a, b) => a + b, 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
