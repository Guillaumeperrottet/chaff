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
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Calculator,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
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

  // Calculer les totaux pour un groupe (SIMPLIFIÉ - Seulement CA)
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

  // Calculer le total général (SIMPLIFIÉ - Seulement CA)
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

  // Composant pour rendre une ligne de campus (SIMPLIFIÉ)
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
      {/* COLONNE RATIO SIMPLIFIÉE */}
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
      {/* Colonnes CA journalières SIMPLIFIÉES (seulement CA) */}
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

  // Composant pour rendre une ligne de sous-total (SIMPLIFIÉ SANS RATIO ET COMPTEUR)
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
    groupData?: Array<DashboardData & { payroll?: PayrollRatioData }>;
  }) => {
    return (
      <TableRow className={`${bgColor} hover:${bgColor} border-t-2`}>
        <TableCell colSpan={4} className={`font-semibold ${textColor} py-3`}>
          <span>{label}</span>
        </TableCell>
        {dashboardData?.columnLabels.map((col) => (
          <TableCell
            key={col.key}
            className={`text-center font-semibold ${textColor} py-3`}
          >
            <div className="text-lg">
              {formatCurrency(totals[col.key] || 0)}
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
        </div>
        <div className="flex items-center gap-4">
          {/* Action principale mise en avant */}
          <Button
            onClick={() => router.push("/dashboard/dayvalues/create")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 text-base font-semibold"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Ajouter un CA
          </Button>

          {/* Séparateur visuel */}
          <div className="h-8 w-px bg-border"></div>

          {/* Actions secondaires groupées */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/dashboard/analytics")}
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>

            <Button
              onClick={() => router.push("/dashboard/payroll")}
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Masse salariale
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres modernisée */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-6">
          {/* Section de recherche et filtres */}
          <div className="flex items-center gap-4 flex-1">
            {/* Recherche principale */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un campus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 hover:bg-white"
              />
            </div>

            {/* Filtres avec labels */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Catégorie
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[160px] h-10 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-white transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="hebergement">Hébergement</SelectItem>
                    <SelectItem value="restauration">Restauration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Statut
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-10 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-white transition-colors">
                    <SelectValue />
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
          </div>

          {/* Indicateur de résultats avec style badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 px-3 py-1.5"
            >
              <span className="font-semibold">{mergedData.length}</span>
              <span className="ml-1">
                campus trouvé{mergedData.length > 1 ? "s" : ""}
              </span>
            </Badge>

            {/* Bouton de reset des filtres (si filtres actifs) */}
            {(searchTerm ||
              categoryFilter !== "all" ||
              statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              >
                <span className="text-xs">Effacer filtres</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table principale simplifiée */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">
                Vue d&apos;ensemble du chiffre d&apos;affaires journalier
              </CardTitle>
              <CardDescription className="text-slate-600">
                Chiffre d&apos;affaires journalier et ratios de masse salariale
                par campus
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-700 border-blue-200"
              >
                {mergedData.length} campus
              </Badge>
              {payrollRatios && (
                <Badge
                  variant="outline"
                  className="text-xs border-emerald-200 text-emerald-700"
                >
                  {payrollRatios.summary.mandatesWithData} avec données MS
                </Badge>
              )}
            </div>
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
                  {/* COLONNE RATIO AVEC TOOLTIP SIMPLIFIÉ */}
                  <TableHead className="text-center min-w-[120px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center gap-1 cursor-help group">
                            <span className="font-medium">Ratio %</span>
                            <Info className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs bg-white border border-gray-200 shadow-sm p-3"
                          sideOffset={8}
                        >
                          <div className="space-y-2.5 text-xs">
                            {/* Formule */}
                            <div>
                              <div className="text-gray-600 mb-1">
                                Formule :
                              </div>
                              <div className="font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded text-center">
                                (Masse Salariale ÷ CA) × 100
                              </div>
                            </div>

                            {/* Seuils */}
                            <div>
                              <div className="text-gray-600 mb-1.5">
                                Seuils :
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span>&lt; 25%</span>
                                  <span className="text-gray-500">
                                    Excellent
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <span>25-35%</span>
                                  <span className="text-gray-500">Bon</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                  <span>35-50%</span>
                                  <span className="text-gray-500">
                                    Attention
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                  <span>&gt; 50%</span>
                                  <span className="text-gray-500">
                                    Critique
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  {/* Colonnes des jours SIMPLIFIÉES */}
                  {dashboardData.columnLabels.map((col) => (
                    <TableHead
                      key={col.key}
                      className="text-center min-w-[100px]"
                    >
                      <div className="font-medium">{col.label}</div>
                    </TableHead>
                  ))}
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

              {/* Total général SIMPLIFIÉ SANS RATIO */}
              {mergedData.length > 0 && categoryFilter === "all" && (
                <TableFooter>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border-t-4 border-gray-300">
                    <TableCell
                      colSpan={4}
                      className="font-bold text-gray-900 py-4"
                    >
                      <span className="text-lg">Total général</span>
                    </TableCell>
                    {dashboardData.columnLabels.map((col) => (
                      <TableCell
                        key={col.key}
                        className="text-center font-bold text-gray-900 py-4"
                      >
                        <div className="text-xl">
                          {formatCurrency(grandTotals[col.key] || 0)}
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
    </div>
  );
}
