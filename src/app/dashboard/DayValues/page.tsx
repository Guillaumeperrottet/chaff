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
import { toast } from "sonner";

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
export default function ValeursPage() {
  const router = useRouter();
  const [dayValues, setDayValues] = useState<DayValue[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [filteredValues, setFilteredValues] = useState<DayValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mandateFilter, setMandateFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  useEffect(() => {
    Promise.all([fetchDayValues(), fetchMandates()]).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    filterValues();
  }, [dayValues, searchTerm, mandateFilter, dateRange]);

  const fetchDayValues = async () => {
    try {
      const response = await fetch("/api/valeurs?limit=100");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setDayValues(data.data || []);
    } catch {
      toast.error("Erreur lors du chargement des valeurs");
    }
  };

  const fetchMandates = async () => {
    try {
      const response = await fetch("/api/mandats");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setMandates(data);
    } catch {
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
    router.push("/dashboard/valeurs/nouvelle");
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

      toast.success("Export téléchargé avec succès");
    } catch {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
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
          </p>
        </div>
        <div className="flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(
                            `/dashboard/valeurs/${value.id}/modifier`
                          );
                        }}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredValues.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Aucune valeur trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {dayValues.length === 0
                  ? "Commencez par saisir votre première valeur"
                  : "Essayez de modifier vos filtres de recherche"}
              </p>
              {dayValues.length === 0 && (
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Première saisie
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
