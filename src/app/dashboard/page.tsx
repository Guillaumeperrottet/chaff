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
      fetchDashboardData(); // Recharger les données
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    }
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

                            {/* 🔧 NOUVEAU: Badge d'alerte pour saisies anciennes */}
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
                  onClick={() => router.push("/dashboard/mandates/Create")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un mandat
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer avec totaux */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Affichage de {filteredData.length} campus sur{" "}
              {dashboardData.totals.totalMandates} au total
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="font-medium">
                Total:{" "}
                <span className="text-lg">
                  {new Intl.NumberFormat("fr-CH", {
                    style: "currency",
                    currency: "CHF",
                  }).format(dashboardData.totals.totalRevenue)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
