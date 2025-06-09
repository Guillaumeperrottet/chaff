"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Calendar,
  FileDown,
  Building2,
  MapPin,
  Loader2,
  Edit,
  Trash2,
  Undo2,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { toast } from "sonner";
import EmptyState from "@/app/components/EmptyState";

interface DayValue {
  id: string;
  date: string;
  value: number;
  mandateId: string;
  mandate: {
    id: string;
    name: string;
    group: "HEBERGEMENT" | "RESTAURATION";
  };
  createdAt: string;
  updatedAt: string;
}

interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
}

interface ApiResponse {
  data: DayValue[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function ValeursPage() {
  const router = useRouter();
  const [dayValues, setDayValues] = useState<DayValue[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [filteredValues, setFilteredValues] = useState<DayValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mandateFilter, setMandateFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // État pour la corbeille des valeurs supprimées
  const [deletedValues, setDeletedValues] = useState<Map<string, DayValue>>(
    new Map()
  );

  useEffect(() => {
    Promise.all([fetchDayValues(), fetchMandates()]).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    filterValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayValues, searchTerm, mandateFilter, dateRange]);

  const fetchDayValues = async () => {
    try {
      const response = await fetch("/api/valeurs?limit=100");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data: ApiResponse = await response.json();
      setDayValues(data.data || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des valeurs");
    }
  };

  const fetchMandates = async () => {
    try {
      const response = await fetch("/api/mandats");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setMandates(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des mandats");
    }
  };

  const filterValues = () => {
    let filtered = dayValues;

    // Filtre par recherche (nom du mandat)
    if (searchTerm) {
      filtered = filtered.filter((value) =>
        value.mandate.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par mandat
    if (mandateFilter !== "all") {
      filtered = filtered.filter((value) => value.mandate.id === mandateFilter);
    }

    // Filtre par période
    if (dateRange !== "all") {
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      filtered = filtered.filter((value) => new Date(value.date) >= cutoffDate);
    }

    // Trier par date décroissante
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setFilteredValues(filtered);
  };

  const handleCreateNew = () => {
    router.push("/dashboard/dayvalues/create");
  };

  const handleEdit = (valueId: string) => {
    router.push(`/dashboard/dayvalues/${valueId}/edit`);
  };

  const handleDelete = async (valueId: string) => {
    try {
      // 1. Trouver la valeur à supprimer
      const valueToDelete = dayValues.find((v) => v.id === valueId);
      if (!valueToDelete) {
        toast.error("Valeur introuvable");
        return;
      }

      setDeletingId(valueId);

      // 2. Supprimer côté serveur
      const response = await fetch(`/api/valeurs/${valueId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      // 3. Sauvegarder dans la corbeille temporaire
      setDeletedValues((prev) => new Map(prev).set(valueId, valueToDelete));

      // 4. Retirer de la liste locale immédiatement
      setDayValues((prev) => prev.filter((v) => v.id !== valueId));

      // 5. Toast avec option d'annulation
      toast.success("Valeur supprimée", {
        description: `Saisie du ${formatDate(valueToDelete.date)} pour ${valueToDelete.mandate.name}`,
        duration: 10000, // 10 secondes
        action: {
          label: "Annuler",
          onClick: () => handleUndoDelete(valueId, valueToDelete),
        },
      });

      // 6. Programmer le nettoyage
      setTimeout(() => {
        setDeletedValues((prev) => {
          const newMap = new Map(prev);
          newMap.delete(valueId);
          return newMap;
        });
      }, 10000);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Fonction pour annuler une suppression
  const handleUndoDelete = async (valueId: string, originalValue: DayValue) => {
    try {
      // 1. Recréer la valeur côté serveur
      const response = await fetch("/api/valeurs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: originalValue.date,
          value: originalValue.value,
          mandateId: originalValue.mandateId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la restauration");
      }

      const restoredValue = await response.json();

      // 2. Remettre dans la liste
      setDayValues((prev) => [...prev, restoredValue]);

      // 3. Retirer de la corbeille
      setDeletedValues((prev) => {
        const newMap = new Map(prev);
        newMap.delete(valueId);
        return newMap;
      });

      // 4. Confirmation
      toast.success("Valeur restaurée", {
        description: `Saisie du ${formatDate(originalValue.date)} restaurée`,
        icon: <Undo2 className="h-4 w-4" />,
      });
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      toast.error("Impossible de restaurer la valeur");
    }
  };

  // Fonction pour vider la corbeille
  const handleEmptyTrash = () => {
    const count = deletedValues.size;
    setDeletedValues(new Map());

    toast.info("Corbeille vidée", {
      description: `${count} valeur(s) définitivement supprimée(s)`,
    });
  };

  const handleExport = async () => {
    try {
      toast.loading("Génération de l'export...");

      const queryParams = new URLSearchParams();
      if (mandateFilter !== "all") queryParams.set("mandateId", mandateFilter);
      if (dateRange !== "all") {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));
        queryParams.set("startDate", cutoffDate.toISOString().split("T")[0]);
      }

      const response = await fetch(`/api/export/valeurs?${queryParams}`);
      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `valeurs_${new Date().toISOString().split("T")[0]}.csv`;
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

  const getGroupIcon = (group: string) => {
    return group === "HEBERGEMENT" ? Building2 : MapPin;
  };

  const getGroupLabel = (group: string) => {
    return group === "HEBERGEMENT" ? "Hébergement" : "Restauration";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Valeurs journalières
            </h1>
            <p className="text-muted-foreground">
              Consultez et gérez les saisies quotidiennes
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const stats = {
    total: filteredValues.length,
    totalValue: filteredValues.reduce((sum, v) => sum + v.value, 0),
    avgValue:
      filteredValues.length > 0
        ? filteredValues.reduce((sum, v) => sum + v.value, 0) /
          filteredValues.length
        : 0,
    uniqueMandates: new Set(filteredValues.map((v) => v.mandate.id)).size,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Valeurs journalières
          </h1>
          <p className="text-muted-foreground">
            Consultez et gérez les saisies quotidiennes
            {deletedValues.size > 0 && (
              <span className="ml-2">
                <Badge variant="secondary" className="text-xs">
                  {deletedValues.size} en corbeille
                </Badge>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton corbeille si elle n'est pas vide */}
          {deletedValues.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmptyTrash}
              className="text-muted-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Vider ({deletedValues.size})
            </Button>
          )}

          <Button variant="outline" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle saisie
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total saisies</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.uniqueMandates} mandat(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              période sélectionnée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Moyen</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.avgValue)}
            </div>
            <p className="text-xs text-muted-foreground">par jour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Établissements
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueMandates}</div>
            <p className="text-xs text-muted-foreground">avec saisies</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher et filtrer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par établissement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={mandateFilter} onValueChange={setMandateFilter}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Tous les établissements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les établissements</SelectItem>
                {mandates.map((mandate) => {
                  const GroupIcon = getGroupIcon(mandate.group);
                  return (
                    <SelectItem key={mandate.id} value={mandate.id}>
                      <div className="flex items-center gap-2">
                        <GroupIcon className="h-4 w-4" />
                        {mandate.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">3 derniers mois</SelectItem>
                <SelectItem value="365">Dernière année</SelectItem>
                <SelectItem value="all">Toutes les périodes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des valeurs</CardTitle>
          <CardDescription>
            {filteredValues.length} saisie(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Saisi le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredValues.map((value) => {
                const GroupIcon = getGroupIcon(value.mandate.group);
                return (
                  <TableRow key={value.id}>
                    <TableCell className="font-medium font-mono">
                      {formatDate(value.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GroupIcon className="h-4 w-4 text-muted-foreground" />
                        {value.mandate.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getGroupLabel(value.mandate.group)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {formatCurrency(value.value)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(value.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleEdit(value.id)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(value.id)}
                            className="text-red-600"
                            disabled={deletingId === value.id}
                          >
                            {deletingId === value.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredValues.length === 0 && (
            <EmptyState
              type="dayvalues"
              mandateCount={mandates.length}
              onPrimaryAction={handleCreateNew}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
