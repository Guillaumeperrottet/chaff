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
  Calculator,
  DollarSign,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
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

interface PayrollRatioData {
  mandateId: string;
  mandateName: string;
  mandateGroup: string;
  year: number;
  month: number;
  monthName: string;
  totalRevenue: number;
  revenueEntries: number;
  averageDailyRevenue: number;
  payrollAmount: number | null;
  payrollSource: "manual" | "calculated" | null;
  employeeCount: number | null;
  payrollToRevenueRatio: number | null;
  ratioStatus: "excellent" | "good" | "warning" | "critical" | "no-data";
  previousMonthRatio: number | null;
  ratioTrend: "up" | "down" | "stable" | "no-data";
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

interface PayrollRatiosResponse {
  currentPeriod: {
    year: number;
    month: number;
    monthName: string;
  };
  mandatesData: PayrollRatioData[];
  summary: {
    totalMandates: number;
    mandatesWithData: number;
    totalRevenue: number;
    totalPayroll: number;
    globalRatio: number | null;
    averageRatio: number | null;
    ratioDistribution: {
      excellent: number;
      good: number;
      warning: number;
      critical: number;
      noData: number;
    };
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [payrollRatios, setPayrollRatios] =
    useState<PayrollRatiosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // État pour gérer les éléments supprimés (corbeille temporaire)
  // const [deletedItems, setDeletedItems] = useState<Map<string, DashboardData>>(new Map());

  // Charger les données du dashboard
  useEffect(() => {
    Promise.all([fetchDashboardData(), fetchPayrollRatios()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/data");
      if (!response.ok)
        throw new Error("Erreur lors du chargement des données CA");
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données CA");
    }
  };

  const fetchPayrollRatios = async () => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await fetch(
        `/api/dashboard/payroll-ratios?year=${year}&month=${month}`
      );
      if (!response.ok) throw new Error("Erreur lors du chargement des ratios");
      const data = await response.json();
      setPayrollRatios(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des ratios masse salariale");
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

  // Fusionner les données CA et Payroll
  const getMergedData = () => {
    return filteredData.map((caData) => {
      const payrollData = payrollRatios?.mandatesData.find(
        (p) => p.mandateId === caData.id
      );
      return {
        ...caData,
        payroll: payrollData,
      };
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return "-";
    return `${value.toFixed(1)}%`;
  };

  // Fonction utilitaire pour calculer la masse salariale journalière
  const getDailyPayrollAmount = (
    monthlyAmount: number,
    year?: number,
    month?: number
  ) => {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month !== undefined ? month : currentDate.getMonth();

    // Obtenir le nombre de jours dans le mois
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    return monthlyAmount / daysInMonth;
  };

  const getRatioColor = (ratio: number | null) => {
    if (ratio === null) return "text-muted-foreground";
    if (ratio < 25) return "text-green-600";
    if (ratio < 35) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatioIcon = (trend: string | undefined) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-red-600" />;
    if (trend === "down")
      return <TrendingDown className="h-3 w-3 text-green-600" />;
    return null;
  };

  // Grouper les données par catégorie et calculer les totaux
  const groupedData = () => {
    if (!dashboardData) return { hebergement: [], restauration: [] };
    const mergedData = getMergedData();

    const hebergement = mergedData.filter(
      (item) => item.category === "Hébergement"
    );
    const restauration = mergedData.filter(
      (item) => item.category === "Restauration"
    );

    return { hebergement, restauration };
  };

  // Calculer les totaux pour un groupe
  const calculateGroupTotals = (
    groupData: (DashboardData & { payroll?: PayrollRatioData })[]
  ) => {
    if (!dashboardData) return {};

    const totals: Record<string, number> = {};

    dashboardData.columnLabels.forEach((col) => {
      // Total CA pour cette colonne/jour
      const dailyCATotal = groupData.reduce((sum, item) => {
        const valueStr = item.values[col.key] || "0,00";
        const value = parseFloat(valueStr.replace(",", "."));
        return sum + (isNaN(value) ? 0 : value);
      }, 0);

      totals[col.key] = dailyCATotal;
    });

    return totals;
  };

  // Fonction séparée pour les totaux de masse salariale journalière
  const calculateGroupPayrollTotals = (
    groupData: (DashboardData & { payroll?: PayrollRatioData })[]
  ) => {
    return groupData.reduce((sum, item) => {
      if (item.payroll?.payrollAmount) {
        // Convertir en montant journalier
        return sum + getDailyPayrollAmount(item.payroll.payrollAmount);
      }
      return sum;
    }, 0);
  };

  // Calculer le total général
  const calculateGrandTotal = () => {
    if (!dashboardData) return {};
    const mergedData = getMergedData();

    const totals: Record<string, number> = {};
    dashboardData.columnLabels.forEach((col) => {
      totals[col.key] = mergedData.reduce((sum, item) => {
        const valueStr = item.values[col.key] || "0,00";
        const value = parseFloat(valueStr.replace(",", "."));
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    });

    return totals;
  };

  // Composant pour rendre une ligne de campus avec données payroll
  const CampusRow = ({
    campus,
  }: {
    campus: DashboardData & { payroll?: PayrollRatioData };
  }) => (
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
        <div className="text-sm font-medium">
          {campus.lastEntry || "Jamais"}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium text-blue-600">
          {campus.performance}
        </div>
      </TableCell>
      {/* COLONNE RATIO NETTOYÉE - Sans badges ni nombre d'employés */}
      <TableCell className="text-center">
        {campus.payroll ? (
          <div
            className={`flex items-center justify-center gap-1 ${getRatioColor(campus.payroll.payrollToRevenueRatio)}`}
          >
            {getRatioIcon(campus.payroll.ratioTrend)}
            <span className="font-medium text-sm">
              {formatPercentage(campus.payroll.payrollToRevenueRatio)}
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">-</div>
        )}
      </TableCell>
      {/* Colonnes CA journalières */}
      {dashboardData?.columnLabels.map((col) => (
        <TableCell key={col.key} className="text-center">
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {campus.values[col.key] || "0.00"}
            </div>
            {campus.payroll?.payrollAmount && (
              <div className="text-xs text-muted-foreground border-t pt-1">
                {formatCurrency(
                  getDailyPayrollAmount(campus.payroll.payrollAmount)
                )}
              </div>
            )}
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
              onClick={() => router.push(`/dashboard/mandates/${campus.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Voir les détails CA
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/mandates/${campus.id}/payroll`)
              }
            >
              <Calculator className="mr-2 h-4 w-4" />
              Masse salariale
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/mandates/${campus.id}/edit`)
              }
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/employees?mandateId=${campus.id}`)
              }
            >
              <Users className="mr-2 h-4 w-4" />
              Voir employés
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
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
    groupData,
  }: {
    label: string;
    totals: Record<string, number>;
    bgColor: string;
    textColor: string;
    groupData: Array<DashboardData & { payroll?: PayrollRatioData }>;
  }) => {
    const groupDailyPayrollTotal = calculateGroupPayrollTotals(groupData);
    const groupRevenueTotal = Object.values(totals).reduce((a, b) => a + b, 0);

    // Calculate monthly payroll total for ratio
    const groupMonthlyPayrollTotal = groupData.reduce(
      (sum, item) => sum + (item.payroll?.payrollAmount || 0),
      0
    );

    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate();
    const estimatedMonthlyRevenue = groupRevenueTotal * daysInMonth;

    const groupRatio =
      estimatedMonthlyRevenue > 0
        ? (groupMonthlyPayrollTotal / estimatedMonthlyRevenue) * 100
        : null;

    const establishmentsCount = groupData.filter(
      (item) => item.payroll?.employeeCount
    ).length;

    return (
      <TableRow className={`${bgColor} hover:${bgColor} border-t-2`}>
        <TableCell colSpan={3} className={`font-semibold ${textColor} py-3`}>
          <div className="flex items-center justify-between">
            <span>{label}</span>
            <span className="text-sm font-normal opacity-80">
              {establishmentsCount} établissement
              {establishmentsCount > 1 ? "s" : ""}
            </span>
          </div>
        </TableCell>
        <TableCell className={`text-center font-semibold ${textColor} py-3`}>
          <div className="text-lg">{formatPercentage(groupRatio)}</div>
        </TableCell>
        {dashboardData?.columnLabels.map((col) => (
          <TableCell
            key={col.key}
            className={`text-center font-semibold ${textColor} py-3`}
          >
            <div className="space-y-1">
              <div className="text-lg">
                {formatCurrency(totals[col.key] || 0)}
              </div>
              <div className="text-xs opacity-70 font-normal">
                MS: {formatCurrency(groupDailyPayrollTotal)}
              </div>
            </div>
          </TableCell>
        ))}
        <TableCell></TableCell>
      </TableRow>
    );
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
          <Button
            onClick={() =>
              Promise.all([fetchDashboardData(), fetchPayrollRatios()])
            }
            className="mt-4"
          >
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
  const mergedData = getMergedData();

  return (
    <div className="space-y-6">
      {/* Header avec titre et actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble CA et masse salariale
            {/* Corbeille temporaire désactivée */}
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
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Statistiques rapides - enrichies avec données payroll */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mandats</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totals.totalMandates}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.totals.activeMandates} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("fr-CH", {
                style: "currency",
                currency: "CHF",
              }).format(dashboardData.totals.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Période courante</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Masse Salariale
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrollRatios
                ? new Intl.NumberFormat("fr-CH", {
                    style: "currency",
                    currency: "CHF",
                  }).format(payrollRatios.summary.totalPayroll)
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {payrollRatios?.summary.mandatesWithData || 0} mandats avec
              données
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratio Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getRatioColor(payrollRatios?.summary.globalRatio || null)}`}
            >
              {formatPercentage(payrollRatios?.summary.globalRatio || null)}
            </div>
            <p className="text-xs text-muted-foreground">Masse sal. / CA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribution</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {payrollRatios ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">Excellent:</span>
                  <span>
                    {payrollRatios.summary.ratioDistribution.excellent}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-600">Attention:</span>
                  <span>{payrollRatios.summary.ratioDistribution.warning}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-red-600">Critique:</span>
                  <span>
                    {payrollRatios.summary.ratioDistribution.critical}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>
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

      {/* Table principale unifiée */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vue d&apos;ensemble unifiée</CardTitle>
              <CardDescription>
                CA journalier et ratios de masse salariale par campus
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {mergedData.length} campus
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
                  {/* COLONNE RATIO AVEC TOOLTIP */}
                  <TableHead className="text-center min-w-[120px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center gap-1 cursor-help">
                            <span className="font-medium">Ratio %</span>
                            <Info className="h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs p-3 text-sm"
                          sideOffset={5}
                        >
                          <div className="space-y-2">
                            <div className="font-medium text-xs text-primary">
                              📊 Calcul du ratio masse salariale
                            </div>
                            <div className="text-xs">
                              <div className="mb-1">
                                <span className="font-medium">Formule :</span>
                              </div>
                              <div className="bg-muted/50 p-2 rounded text-center font-mono text-xs">
                                (Masse Salariale ÷ Chiffre d&apos;Affaires) ×
                                100
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div className="mb-1">
                                <span className="font-medium">
                                  Interprétation :
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>&lt; 25% : Excellent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span>25-35% : Bon</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span>35-50% : Attention</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span>&gt; 50% : Critique</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  {/* Colonnes des jours */}
                  {dashboardData.columnLabels.map((col) => (
                    <TableHead
                      key={col.key}
                      className="text-center min-w-[100px]"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{col.label}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          CA / Masse S.
                        </div>
                      </div>
                    </TableHead>
                  ))}
                  {/* SUPPRIMÉ : Ancienne colonne Ratio qui était ici */}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Section Hébergement */}
                {(categoryFilter === "all" ||
                  categoryFilter === "hebergement") && (
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
                        groupData={grouped.hebergement}
                      />
                    )}
                  </>
                )}

                {/* Section Restauration */}
                {(categoryFilter === "all" ||
                  categoryFilter === "restauration") && (
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
                        groupData={grouped.restauration}
                      />
                    )}
                  </>
                )}

                {/* Message si aucun campus */}
                {mergedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
              {mergedData.length > 0 && categoryFilter === "all" && (
                <TableFooter>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border-t-4 border-gray-300">
                    <TableCell
                      colSpan={3}
                      className="font-bold text-gray-900 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">Total général</span>
                        <span className="text-sm font-normal text-gray-600">
                          {mergedData.length} établissement
                          {mergedData.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900 py-4">
                      <div className="text-xl">
                        {payrollRatios &&
                          formatPercentage(payrollRatios.summary.globalRatio)}
                      </div>
                    </TableCell>
                    {dashboardData.columnLabels.map((col) => (
                      <TableCell
                        key={col.key}
                        className="text-center font-bold text-gray-900 py-4"
                      >
                        <div className="space-y-1">
                          <div className="text-xl">
                            {formatCurrency(grandTotals[col.key] || 0)}
                          </div>
                          <div className="text-xs text-gray-600 font-normal">
                            MS:{" "}
                            {payrollRatios &&
                              formatCurrency(
                                getDailyPayrollAmount(
                                  payrollRatios.summary.totalPayroll
                                )
                              )}
                          </div>
                        </div>
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

      {/* Footer unifié avec résumé */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Résumé général */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">
                RÉSUMÉ GÉNÉRAL
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Campus affichés:</span>
                  <span className="font-medium">{mergedData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avec données payroll:</span>
                  <span className="font-medium">
                    {payrollRatios?.summary.mandatesWithData || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* CA */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-blue-700">
                CHIFFRE D&apos;AFFAIRES
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Total période:</span>
                  <span className="font-medium text-blue-700">
                    {formatCurrency(dashboardData.totals.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Moyenne/jour:</span>
                  <span className="font-medium text-blue-700">
                    {dashboardData.columnLabels.length > 0 &&
                      formatCurrency(
                        dashboardData.totals.totalRevenue /
                          dashboardData.columnLabels.length
                      )}
                  </span>
                </div>
              </div>
            </div>

            {/* Masse salariale */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-green-700">
                MASSE SALARIALE
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Total mois:</span>
                  <span className="font-medium text-green-700">
                    {payrollRatios
                      ? formatCurrency(payrollRatios.summary.totalPayroll)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ratio moyen:</span>
                  <span className="font-medium text-green-700">
                    {payrollRatios
                      ? formatPercentage(payrollRatios.summary.averageRatio)
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Indicateurs */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-purple-700">
                INDICATEURS
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Ratios excellents:</span>
                  <span className="font-medium text-green-600">
                    {payrollRatios?.summary.ratioDistribution.excellent || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ratios critiques:</span>
                  <span className="font-medium text-red-600">
                    {payrollRatios?.summary.ratioDistribution.critical || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total général en bas */}
          {mergedData.length > 0 && dashboardData.columnLabels.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">PERFORMANCE GLOBALE:</span>
                <div className="text-right">
                  <div className="font-bold text-xl text-primary">
                    {formatCurrency(
                      Object.values(grandTotals).reduce((a, b) => a + b, 0)
                    )}{" "}
                    CA
                  </div>
                  <div
                    className={`text-sm ${getRatioColor(payrollRatios?.summary.globalRatio || null)}`}
                  >
                    {payrollRatios &&
                      formatPercentage(payrollRatios.summary.globalRatio)}{" "}
                    ratio masse sal.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
