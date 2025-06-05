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
  Calculator,
  Building2,
  MapPin,
  Search,
  Upload,
  BarChart3,
  DollarSign,
  Calendar,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  active: boolean;
  totalRevenue: number;
  lastEntry: Date | null;

  // Données spécifiques à la masse salariale
  hasPayrollData?: boolean;
  lastPayrollEntry?: Date | null;
  currentMonthRatio?: number | null;
  employeeCount?: number;
}

interface PayrollSummary {
  totalMandates: number;
  mandatesWithData: number;
  totalEmployees: number;
  globalRatio: number | null;
  averageRatio: number | null;
}

export default function PayrollIndexPage() {
  const router = useRouter();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Charger les mandats avec données de masse salariale
      const response = await fetch("/api/mandats?includePayrollStats=true");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setMandates(data.mandates || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les mandats
  const filteredMandates = mandates.filter((mandate) => {
    const matchesSearch = mandate.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesGroup =
      groupFilter === "all" ||
      (groupFilter === "hebergement" && mandate.group === "HEBERGEMENT") ||
      (groupFilter === "restauration" && mandate.group === "RESTAURATION");
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "with-data" && mandate.hasPayrollData) ||
      (statusFilter === "no-data" && !mandate.hasPayrollData) ||
      (statusFilter === "active" && mandate.active) ||
      (statusFilter === "inactive" && !mandate.active);

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const handleViewPayroll = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}/payroll`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Jamais";
    return new Date(date).toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return "-";
    return `${value.toFixed(1)}%`;
  };

  const getRatioColor = (ratio: number | null) => {
    if (ratio === null) return "text-muted-foreground";
    if (ratio < 25) return "text-green-600";
    if (ratio < 35) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatioStatus = (ratio: number | null) => {
    if (ratio === null)
      return { label: "Pas de données", variant: "outline" as const };
    if (ratio < 25) return { label: "Excellent", variant: "default" as const };
    if (ratio < 35) return { label: "Bon", variant: "secondary" as const };
    if (ratio < 50)
      return { label: "Attention", variant: "destructive" as const };
    return { label: "Critique", variant: "destructive" as const };
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Masse salariale</h1>
          <p className="text-muted-foreground">
            Gestion et analyse de la masse salariale par établissement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/payroll/simple-import")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Gastrotime
          </Button>
          <Button onClick={() => router.push("/dashboard/analytics")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Vue d'ensemble */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Établissements
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalMandates}</div>
              <p className="text-xs text-muted-foreground">
                {summary.mandatesWithData} avec données MS
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Employés total
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Tous établissements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ratio global
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getRatioColor(summary.globalRatio)}`}
              >
                {formatPercentage(summary.globalRatio)}
              </div>
              <p className="text-xs text-muted-foreground">
                Masse sal. / CA total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ratio moyen</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getRatioColor(summary.averageRatio)}`}
              >
                {formatPercentage(summary.averageRatio)}
              </div>
              <p className="text-xs text-muted-foreground">
                Moyenne établissements
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des établissements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Établissements</CardTitle>
              <CardDescription>
                Sélectionnez un établissement pour gérer sa masse salariale
              </CardDescription>
            </div>

            {/* Filtres */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="hebergement">Hébergement</SelectItem>
                  <SelectItem value="restauration">Restauration</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="with-data">Avec données MS</SelectItem>
                  <SelectItem value="no-data">Sans données MS</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm ||
                groupFilter !== "all" ||
                statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setGroupFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Établissement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">CA Total</TableHead>
                <TableHead className="text-center">Employés</TableHead>
                <TableHead className="text-center">Ratio actuel</TableHead>
                <TableHead className="text-center">Status MS</TableHead>
                <TableHead>Dernière saisie MS</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMandates.map((mandate) => {
                const ratioStatus = getRatioStatus(
                  mandate.currentMonthRatio ?? null
                );
                return (
                  <TableRow key={mandate.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{mandate.name}</div>
                      {!mandate.active && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          mandate.group === "HEBERGEMENT"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {mandate.group === "HEBERGEMENT" ? (
                          <>
                            <Building2 className="mr-1 h-3 w-3" />
                            Hébergement
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-1 h-3 w-3" />
                            Restauration
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(mandate.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-center">
                      {mandate.employeeCount || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className={getRatioColor(
                          mandate.currentMonthRatio ?? null
                        )}
                      >
                        {formatPercentage(mandate.currentMonthRatio ?? null)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={ratioStatus.variant}>
                        {ratioStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(mandate.lastPayrollEntry ?? null)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleViewPayroll(mandate.id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Calculator className="mr-2 h-4 w-4" />
                        Gérer MS
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredMandates.length === 0 && (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                Aucun établissement trouvé
              </h3>
              <p className="text-muted-foreground mb-4">
                {mandates.length === 0
                  ? "Commencez par créer votre premier établissement"
                  : "Essayez de modifier vos filtres de recherche"}
              </p>
              {mandates.length === 0 && (
                <Button
                  onClick={() => router.push("/dashboard/mandates/create")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Créer un établissement
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guide rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guide rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Upload className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">1. Importer les données</h4>
                <p className="text-sm text-muted-foreground">
                  Utilisez l&apos;import Gastrotime pour charger les données
                  horaires
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">2. Saisir manuellement</h4>
                <p className="text-sm text-muted-foreground">
                  Ou saisissez directement les montants de masse salariale
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">3. Analyser les ratios</h4>
                <p className="text-sm text-muted-foreground">
                  Suivez l&apos;évolution du ratio masse salariale / chiffre
                  d&apos;affaires
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
