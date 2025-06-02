"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Building2, MapPin } from "lucide-react";
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

interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  active: boolean;
  lastEntry?: string;
  totalRevenue: number;
  _count: {
    dayValues: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function MandatsPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [filteredMandates, setFilteredMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchMandates();
  }, []);

  const fetchMandates = async () => {
    try {
      const response = await fetch("/api/mandats?includeInactive=true");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setMandates(data);
    } catch {
      toast.error("Erreur lors du chargement des mandats");
    } finally {
      setLoading(false);
    }
  };

  const filterMandates = useCallback(() => {
    let filtered = mandates;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter((mandate) =>
        mandate.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par groupe
    if (groupFilter !== "all") {
      filtered = filtered.filter((mandate) => mandate.group === groupFilter);
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((mandate) =>
        statusFilter === "active" ? mandate.active : !mandate.active
      );
    }

    setFilteredMandates(filtered);
  }, [mandates, searchTerm, groupFilter, statusFilter]);

  useEffect(() => {
    filterMandates();
  }, [filterMandates]);

  const getGroupLabel = (group: string) => {
    return group === "HEBERGEMENT" ? "Hébergement" : "Restauration";
  };

  const getGroupIcon = (group: string) => {
    return group === "HEBERGEMENT" ? Building2 : MapPin;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CH");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mandats</h1>
            <p className="text-muted-foreground">
              Gérez vos établissements et leurs données
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
    total: mandates.length,
    active: mandates.filter((m) => m.active).length,
    hebergement: mandates.filter((m) => m.group === "HEBERGEMENT").length,
    restauration: mandates.filter((m) => m.group === "RESTAURATION").length,
    totalRevenue: mandates.reduce((sum, m) => sum + m.totalRevenue, 0),
  };

  const handleCreateNew = () => {
    // Navigate to create new mandate page
    window.location.href = "/dashboard/mandats/nouveau";
  };

  const handleViewMandate = (mandateId: string) => {
    // Navigate to view mandate page
    window.location.href = `/dashboard/mandats/${mandateId}`;
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mandats</h1>
          <p className="text-muted-foreground">
            Gérez vos établissements et leurs données
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau mandat
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total mandats</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hébergement</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hebergement}</div>
            <p className="text-xs text-muted-foreground">établissements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restauration</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.restauration}</div>
            <p className="text-xs text-muted-foreground">établissements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">cumulé</p>
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
                  placeholder="Rechercher par nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tous les groupes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                <SelectItem value="HEBERGEMENT">Hébergement</SelectItem>
                <SelectItem value="RESTAURATION">Restauration</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des mandats</CardTitle>
          <CardDescription>
            {filteredMandates.length} mandat(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Groupe</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière saisie</TableHead>
                <TableHead>Nb. valeurs</TableHead>
                <TableHead>CA Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMandates.map((mandate) => {
                const GroupIcon = getGroupIcon(mandate.group);
                return (
                  <TableRow
                    key={mandate.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewMandate(mandate.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <GroupIcon className="h-4 w-4 text-muted-foreground" />
                        {mandate.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getGroupLabel(mandate.group)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mandate.active ? "default" : "secondary"}>
                        {mandate.active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {mandate.lastEntry
                        ? formatDate(mandate.lastEntry)
                        : "Aucune"}
                    </TableCell>
                    <TableCell>{mandate._count.dayValues}</TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(mandate.totalRevenue)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewMandate(mandate.id);
                        }}
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredMandates.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Aucun mandat trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {mandates.length === 0
                  ? "Commencez par créer votre premier mandat"
                  : "Essayez de modifier vos filtres de recherche"}
              </p>
              {mandates.length === 0 && (
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer le premier mandat
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
