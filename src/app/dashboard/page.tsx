// src/app/dashboard/page.tsx - Mobile-friendly SANS changer le desktop
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
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
  Filter,
  Menu,
  ChevronRight,
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

// Types inchangés (copier depuis votre code original)
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

  // NOUVEAUX états pour mobile seulement
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Détecter mobile sans affecter desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fonctions fetch inchangées (copier depuis votre code)
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

  // Filtrer les données (inchangé)
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

  // Fusionner les données CA et Payroll (inchangé)
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

  // Fonctions utilitaires inchangées
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
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

  // Grouper les données par catégorie et calculer les totaux (inchangé)
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

  // Calculer les totaux pour un groupe (inchangé)
  const calculateGroupTotals = (
    groupData: (DashboardData & { payroll?: PayrollRatioData })[]
  ) => {
    if (!dashboardData) return {};
    const totals: Record<string, number> = {};

    dashboardData.columnLabels.forEach((col) => {
      const dailyCATotal = groupData.reduce((sum, item) => {
        const valueStr = item.values[col.key] || "0,00";
        const value = parseFloat(valueStr.replace(",", "."));
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
      totals[col.key] = dailyCATotal;
    });

    return totals;
  };

  // Calculer le total général (inchangé)
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

  // NOUVEAU : Composant Card pour MOBILE SEULEMENT
  const MobileCampusCard = ({
    campus,
  }: {
    campus: DashboardData & { payroll?: PayrollRatioData };
  }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* Header avec nom et catégorie */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{campus.name}</h3>
            <Badge
              variant={
                campus.category === "Hébergement" ? "default" : "secondary"
              }
              className="text-xs mt-1"
            >
              {campus.category}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/mandates/${campus.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Voir détails CA
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Performance</div>
            <div className="font-semibold text-blue-600">
              {campus.performance}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Ratio MS</div>
            {campus.payroll ? (
              <div
                className={`flex items-center gap-1 ${getRatioColor(campus.payroll.payrollToRevenueRatio)}`}
              >
                {getRatioIcon(campus.payroll.ratioTrend)}
                <span className="font-semibold">
                  {formatPercentage(campus.payroll.payrollToRevenueRatio)}
                </span>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">-</div>
            )}
          </div>
        </div>

        {/* Dernière saisie */}
        <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
          <span>Dernière saisie:</span>
          <span className="font-medium">{campus.lastEntry || "Jamais"}</span>
        </div>

        {/* CA récents (derniers 3 jours seulement sur mobile) */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs font-medium text-blue-900 mb-2">
            CA récent
          </div>
          <div className="grid grid-cols-3 gap-2">
            {dashboardData?.columnLabels.slice(-3).map((col) => (
              <div key={col.key} className="text-center">
                <div className="text-xs text-blue-700">{col.label}</div>
                <div className="text-sm font-semibold text-blue-900">
                  {campus.values[col.key] || "0.00"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton voir plus */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/mandates/${campus.id}`)}
          className="w-full mt-3 text-blue-600"
        >
          Voir tous les détails
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  // NOUVEAU : Composant filtres mobile
  const MobileFilters = () => (
    <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Filtres</SheetTitle>
          <SheetDescription>
            Filtrez les données du tableau de bord
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Recherche */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Nom de l'établissement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Catégorie</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="hebergement">Hébergement</SelectItem>
                <SelectItem value="restauration">Restauration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="warning">Attention</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bouton reset */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}
            className="w-full"
          >
            Réinitialiser
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Composant pour rendre une ligne de campus (DESKTOP INCHANGÉ)
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

  // Composant pour rendre une ligne de sous-total (DESKTOP INCHANGÉ)
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

        {/* Actions - CONDITIONNELLES selon mobile/desktop */}
        {isMobile ? (
          /* Version MOBILE - Layout empilé */
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Button
              onClick={() => router.push("/dashboard/dayvalues/create")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un CA
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Menu className="mr-2 h-4 w-4" />
                  Plus d&apos;actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/analytics")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/payroll")}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Masse salariale
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          /* Version DESKTOP - EXACTEMENT comme votre code original */
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/dashboard/dayvalues/create")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 text-base font-semibold"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un CA
            </Button>

            <div className="h-8 w-px bg-border"></div>

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
        )}
      </div>

      {/* Table principale avec filtres intégrés dans le CardHeader */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-white border-b border-slate-200 py-2">
          <div className="relative flex items-center min-h-[60px]">
            {/* Titre parfaitement centré */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <CardTitle className="text-xl font-bold text-slate-800 mb-2">
                Vue d&apos;ensemble du chiffre d&apos;affaires journalier
              </CardTitle>
              <CardDescription className="text-slate-600">
                <Link
                  href="/dashboard/mandates"
                  className="underline text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Index des mandats
                </Link>
              </CardDescription>
            </div>

            {/* Filtres - CONDITIONNELS selon mobile/desktop */}
            <div className="absolute right-0 flex items-center gap-3">
              {isMobile ? (
                /* Version MOBILE - Bouton filtres */
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  {(searchTerm ||
                    categoryFilter !== "all" ||
                    statusFilter !== "all") && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {
                        [
                          searchTerm,
                          categoryFilter !== "all",
                          statusFilter !== "all",
                        ].filter(Boolean).length
                      }
                    </Badge>
                  )}
                </Button>
              ) : (
                /* Version DESKTOP - EXACTEMENT comme votre code original */
                <>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 w-40 text-xs border-slate-200 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 bg-white/80 placeholder:text-slate-400"
                    />
                  </div>

                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs border-slate-200 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 bg-white/80">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes catégories</SelectItem>
                      <SelectItem value="hebergement">Hébergement</SelectItem>
                      <SelectItem value="restauration">Restauration</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-28 h-8 text-xs border-slate-200 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 bg-white/80">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="new">Nouveau</SelectItem>
                      <SelectItem value="warning">Attention</SelectItem>
                    </SelectContent>
                  </Select>

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
                      className="h-8 px-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      ✕
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Affichage conditionnel : Cards sur mobile, Table sur desktop */}
          {isMobile ? (
            /* Version MOBILE - Cards */
            <div className="space-y-4">
              {mergedData.length === 0 ? (
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
              ) : (
                mergedData.map((campus) => (
                  <MobileCampusCard key={campus.id} campus={campus} />
                ))
              )}
            </div>
          ) : (
            /* Version DESKTOP - Table EXACTEMENT comme votre code original */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Campus</TableHead>
                    <TableHead className="min-w-[120px]">
                      Dernière saisie
                    </TableHead>
                    <TableHead className="min-w-[150px]">Top</TableHead>
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
                              <div>
                                <div className="text-gray-600 mb-1">
                                  Formule :
                                </div>
                                <div className="font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded text-center">
                                  (Masse Salariale ÷ CA) × 100
                                </div>
                              </div>
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

                {/* Total général EXACTEMENT comme votre code original */}
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
          )}
        </CardContent>
      </Card>

      {/* Composant filtres mobile */}
      <MobileFilters />
    </div>
  );
}
