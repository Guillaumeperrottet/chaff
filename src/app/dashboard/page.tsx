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

  // Calculer les totaux filtrés
  const calculateFilteredTotals = () => {
    if (!dashboardData) return null;

    const dailyTotals: Record<string, number> = {};
    const hebergementTotals: Record<string, number> = {};
    const restaurationTotals: Record<string, number> = {};

    // Calculer les totaux pour les données filtrées
    filteredData.forEach((item) => {
      dashboardData.columnLabels.forEach((col) => {
        const value = parseFloat(item.values[col.key] || "0");

        // Total général
        dailyTotals[col.key] = (dailyTotals[col.key] || 0) + value;

        // Sous-totaux par catégorie
        if (item.category === "Hébergement") {
          hebergementTotals[col.key] =
            (hebergementTotals[col.key] || 0) + value;
        } else if (item.category === "Restauration") {
          restaurationTotals[col.key] =
            (restaurationTotals[col.key] || 0) + value;
        }
      });
    });

    return {
      dailyTotals,
      hebergementTotals,
      restaurationTotals,
    };
  };

  const filteredTotals = calculateFilteredTotals();

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
    router.push("/dashboard/DayValues/Create");
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
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer le mandat "${mandateName}" ?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/mandats/${mandateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast.success("Mandat supprimé avec succès");
      fetchDashboardData();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

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

  return (
    <div className="space-y-6">
      {/* Header avec titre et actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campus</h1>
          <p className="text-muted-foreground">
            Tableau de bord des valeurs journalières
          </p>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Table principale */}
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
                {filteredData.map((campus) => (
                  <TableRow key={campus.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-medium">{campus.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge
                              variant={
                                campus.status === "active"
                                  ? "default"
                                  : campus.status === "new"
                                    ? "secondary"
                                    : campus.status === "warning"
                                      ? "destructive"
                                      : "outline"
                              }
                              className="text-xs"
                            >
                              {campus.category}
                            </Badge>

                            {campus.daysSinceLastEntry !== null &&
                              campus.daysSinceLastEntry > 7 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {campus.daysSinceLastEntry > 30
                                    ? `⚠️ ${Math.floor(campus.daysSinceLastEntry / 30)}M`
                                    : `⚠️ ${campus.daysSinceLastEntry}J`}
                                </Badge>
                              )}

                            {campus.status === "new" && (
                              <Badge variant="secondary" className="text-xs">
                                🆕 Nouveau
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-sm font-medium">
                          {campus.lastEntry || "Jamais"}
                        </div>
                        {campus.daysSinceLastEntry !== null && (
                          <div
                            className={`text-xs ${
                              campus.daysSinceLastEntry === 0
                                ? "text-green-600"
                                : campus.daysSinceLastEntry <= 3
                                  ? "text-blue-600"
                                  : campus.daysSinceLastEntry <= 7
                                    ? "text-yellow-600"
                                    : campus.daysSinceLastEntry <= 30
                                      ? "text-orange-600"
                                      : "text-red-600"
                            }`}
                          >
                            {campus.daysSinceLastEntry === 0 &&
                              "🟢 Aujourd'hui"}
                            {campus.daysSinceLastEntry === 1 && "🟡 Hier"}
                            {campus.daysSinceLastEntry > 1 &&
                              campus.daysSinceLastEntry <= 7 &&
                              `🟡 ${campus.daysSinceLastEntry} jours`}
                            {campus.daysSinceLastEntry > 7 &&
                              campus.daysSinceLastEntry <= 30 &&
                              `🟠 ${campus.daysSinceLastEntry} jours`}
                            {campus.daysSinceLastEntry > 30 &&
                              `🔴 ${Math.floor(campus.daysSinceLastEntry / 30)} mois`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-blue-600">
                        {campus.performance}
                      </div>
                    </TableCell>
                    {dashboardData.columnLabels.map((col) => (
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
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(campus.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditMandate(campus.id)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              handleDeleteMandate(campus.id, campus.name)
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              {/* Section des totaux */}
              {filteredTotals && (
                <TableFooter>
                  {/* Sous-total Hébergement */}
                  <TableRow className="bg-blue-50 hover:bg-blue-50">
                    <TableCell
                      colSpan={3}
                      className="font-medium text-blue-700"
                    >
                      Hébergement
                    </TableCell>
                    {dashboardData.columnLabels.map((col) => (
                      <TableCell
                        key={col.key}
                        className="text-center font-medium text-blue-700"
                      >
                        {formatCurrency(
                          filteredTotals.hebergementTotals[col.key] || 0
                        )}
                      </TableCell>
                    ))}
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Sous-total Restauration */}
                  <TableRow className="bg-orange-50 hover:bg-orange-50">
                    <TableCell
                      colSpan={3}
                      className="font-medium text-orange-700"
                    >
                      Restauration
                    </TableCell>
                    {dashboardData.columnLabels.map((col) => (
                      <TableCell
                        key={col.key}
                        className="text-center font-medium text-orange-700"
                      >
                        {formatCurrency(
                          filteredTotals.restaurationTotals[col.key] || 0
                        )}
                      </TableCell>
                    ))}
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Total général */}
                  <TableRow className="bg-gray-100 hover:bg-gray-100">
                    <TableCell colSpan={3} className="font-bold text-gray-900">
                      Total
                    </TableCell>
                    {dashboardData.columnLabels.map((col) => (
                      <TableCell
                        key={col.key}
                        className="text-center font-bold text-gray-900"
                      >
                        {formatCurrency(
                          filteredTotals.dailyTotals[col.key] || 0
                        )}
                      </TableCell>
                    ))}
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Aucun campus trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {dashboardData.data.length === 0
                  ? "Commencez par créer votre premier mandat"
                  : "Essayez de modifier vos filtres de recherche"}
              </p>
              {dashboardData.data.length === 0 && (
                <Button
                  onClick={() => router.push("/dashboard/mandates/create")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un mandat
                </Button>
              )}
            </div>
          )}
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
                    {
                      filteredData.filter(
                        (item) => item.category === "Hébergement"
                      ).length
                    }
                  </span>
                </div>
                {filteredTotals && dashboardData.columnLabels.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Total semaine:</span>
                    <span className="font-medium text-blue-700">
                      {formatCurrency(
                        Object.values(filteredTotals.hebergementTotals).reduce(
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
                    {
                      filteredData.filter(
                        (item) => item.category === "Restauration"
                      ).length
                    }
                  </span>
                </div>
                {filteredTotals && dashboardData.columnLabels.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Total semaine:</span>
                    <span className="font-medium text-orange-700">
                      {formatCurrency(
                        Object.values(filteredTotals.restaurationTotals).reduce(
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
          {filteredTotals && dashboardData.columnLabels.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">TOTAL PÉRIODE:</span>
                <span className="font-bold text-xl text-primary">
                  {formatCurrency(
                    Object.values(filteredTotals.dailyTotals).reduce(
                      (a, b) => a + b,
                      0
                    )
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
