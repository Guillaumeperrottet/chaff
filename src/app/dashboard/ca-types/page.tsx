"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  BarChart3,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Download,
  CalendarIcon,
  Info,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import PremiumBurgerButton from "@/app/components/ui/BurgerButton";
import PrintableTypesCAReport from "@/app/components/ca/PrintableTypesCAReport";

// Types pour les données CA par types
interface DayCAData {
  date: string;
  value: number;
  formattedDate: string;
}

interface PayrollData {
  year: number;
  month: number;
  grossAmount: number;
  socialCharges: number;
  totalCost: number;
  employeeCount?: number;
}

interface PeriodData {
  year: number;
  month: number;
  label: string;
  totalValue: number;
  dailyValues: DayCAData[];
  previousYearDailyValues: DayCAData[];
  averageDaily: number;
  daysWithData: number;
  cumulativeTotal?: number;
  cumulativePayroll?: number;
  cumulativePreviousYearRevenue?: number;
  cumulativePreviousYearPayroll?: number;
  cumulativeRevenueGrowth?: number | null;
  cumulativePayrollGrowth?: number | null;
  payrollData?: PayrollData;
  payrollToRevenueRatio?: number;
  yearOverYear: {
    previousYearRevenue: number;
    previousYearPayroll?: number;
    revenueGrowth: number | null;
    payrollGrowth: number | null;
  };
}

interface TypeBreakdown {
  id: string;
  name: string;
  label: string;
  totalRevenue: number;
  totalPayroll: number;
  contribution: number;
  mandatesCount: number;
}

interface TypesCAResponse {
  organization: {
    name: string;
    totalTypes: number;
  };
  periods: PeriodData[];
  summary: {
    totalPeriods: number;
    grandTotal: number;
    grandTotalExcludingCurrentMonth: number; // Nouveau champ
    averagePerPeriod: number;
    bestPeriod: PeriodData;
    worstPeriod: PeriodData;
    totalPayrollCost: number;
    globalPayrollRatio: number | null;
    yearOverYearGrowth: {
      revenue: number | null;
      revenueExcludingCurrentMonth: number | null;
      payroll: number | null;
    };
    typesBreakdown: TypeBreakdown[];
  };
  meta: {
    year: number;
    startMonth: number;
    period: string;
    generatedAt: string;
  };
}

export default function TypesCAPage() {
  const router = useRouter();
  const [caData, setCaData] = useState<TypesCAResponse | null>(null);
  const [availableTypes, setAvailableTypes] = useState<
    Array<{ id: string; name: string; label: string }>
  >([]);
  const [selectedType, setSelectedType] = useState("HEBERGEMENT"); // Type par défaut
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedSemester, setSelectedSemester] = useState(() => {
    // Démarrer sur le semestre actuel
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return currentMonth <= 6 ? "1" : "2";
  });
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // Charger les types disponibles
  useEffect(() => {
    const loadAvailableTypes = async () => {
      try {
        // Types par défaut + types personnalisés
        const defaultTypes = [
          { id: "HEBERGEMENT", name: "HEBERGEMENT", label: "Hébergement" },
          { id: "RESTAURATION", name: "RESTAURATION", label: "Restauration" },
        ];

        // TODO: Ajouter la logique pour charger les types personnalisés depuis l'API
        setAvailableTypes(defaultTypes);
      } catch (error) {
        console.error("Erreur lors du chargement des types:", error);
      }
    };
    loadAvailableTypes();
  }, []);

  // Charger les données CA par type depuis l'API
  useEffect(() => {
    const loadTypesCAData = async () => {
      try {
        setLoading(true);

        // Calculer les mois selon la sélection
        let startMonth, endMonth, period;

        if (selectedSemester === "annee") {
          startMonth = 1;
          endMonth = 12;
          period = "12months";
        } else {
          startMonth = selectedSemester === "1" ? 1 : 7;
          endMonth = selectedSemester === "1" ? 6 : 12;
          period = "6months";
        }

        const response = await fetch(
          `/api/mandats/ca-types?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=${period}&type=${selectedType}`
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données CA par type");
        }

        const data = await response.json();
        setCaData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des données CA:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    loadTypesCAData();
  }, [selectedYear, selectedSemester, selectedType]);

  // Fermer le menu burger avec la touche Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsBurgerMenuOpen(false);
      }
    };

    if (isBurgerMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isBurgerMenuOpen]);

  const handleRefresh = () => {
    const loadTypesCAData = async () => {
      try {
        setLoading(true);

        const startMonth = selectedSemester === "1" ? 1 : 7;
        const endMonth = selectedSemester === "1" ? 6 : 12;

        const response = await fetch(
          `/api/mandats/ca-types?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months&type=${selectedType}`
        );
        if (!response.ok) throw new Error("Erreur lors du chargement");
        const data = await response.json();
        setCaData(data);
        toast.success("Données actualisées");
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors de l'actualisation");
      } finally {
        setLoading(false);
      }
    };
    loadTypesCAData();
  };

  const handlePrint = () => {
    window.print();
  };

  // Fonction pour naviguer vers un autre type
  const handleTypeChange = (newTypeId: string) => {
    setSelectedType(newTypeId);
  };

  // Fonction pour obtenir le label d'un type
  const getTypeLabel = (typeId: string): string => {
    const type = availableTypes.find((t) => t.id === typeId);
    return type?.label || typeId;
  };

  const handleExport = async () => {
    try {
      toast.loading("Génération de l'export par type...");

      const startMonth = selectedSemester === "1" ? 1 : 7;
      const endMonth = selectedSemester === "1" ? 6 : 12;

      const response = await fetch(
        `/api/export/ca-types?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months&type=${selectedType}`
      );

      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const semesterName = selectedSemester === "1" ? "S1" : "S2";
      const typeLabel = getTypeLabel(selectedType);
      a.download = `ca_${typeLabel.toLowerCase()}_${selectedYear}_${semesterName}.csv`;
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

  const formatCurrency = (amount: number) => {
    // Formatage manuel avec apostrophe suisse si Intl ne fonctionne pas
    try {
      const formatted = new Intl.NumberFormat("de-CH", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(amount);

      // Si le formatage ne contient pas d'apostrophe, forcer manuellement
      if (amount >= 1000 && !formatted.includes("'")) {
        const parts = amount.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
        return `${integerPart}.${parts[1]}`;
      }

      return formatted;
    } catch {
      // Fallback manuel
      const parts = amount.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
      return `${integerPart}.${parts[1]}`;
    }
  };

  const formatPercentage = (
    value: number | null,
    showSign = true,
    decimals = 1
  ) => {
    if (value === null) return "-";
    const formatted = new Intl.NumberFormat("fr-CH", {
      style: "decimal",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.abs(value));
    const sign = value >= 0 ? "+" : "-";
    const color = value >= 0 ? "text-green-600" : "text-red-600";
    return (
      <span className={color}>
        {showSign && sign}
        {formatted}%
      </span>
    );
  };

  const getGrowthIcon = (value: number | null) => {
    if (value === null) return null;
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTypeIcon = (typeId: string) => {
    if (typeId === "HEBERGEMENT") return <Building2 className="h-4 w-4" />;
    if (typeId === "RESTAURATION") return <MapPin className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />; // Icône par défaut
  };

  // Créer la structure de données pour le tableau
  const tableData = () => {
    if (!caData)
      return { rows: [], totals: {}, comparisons: {}, payrollTotals: {} };

    // Obtenir tous les jours uniques
    const allDays = new Set<number>();
    caData.periods.forEach((period) => {
      period.dailyValues?.forEach((dv) => {
        const day = new Date(dv.date).getDate();
        allDays.add(day);
      });
      period.previousYearDailyValues?.forEach((dv) => {
        const day = new Date(dv.date).getDate();
        allDays.add(day);
      });
    });

    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    // Construire les lignes du tableau
    const rows = sortedDays.map((day) => {
      const values: Record<string, { current: number; previous: number }> = {};

      caData.periods.forEach((period, index) => {
        const dayValue = period.dailyValues?.find(
          (dv) => new Date(dv.date).getDate() === day
        );
        const previousDayValue = period.previousYearDailyValues?.find(
          (dv) => new Date(dv.date).getDate() === day
        );

        values[`period_${index}`] = {
          current: dayValue?.value || 0,
          previous: previousDayValue?.value || 0,
        };
      });

      return { day, values };
    });

    // Calculer les totaux
    const totals: Record<string, { current: number; previous: number }> = {};
    const payrollTotals: Record<string, { current: number; previous: number }> =
      {};

    caData.periods.forEach((period, index) => {
      totals[`period_${index}`] = {
        current: period.totalValue,
        previous: period.yearOverYear.previousYearRevenue,
      };

      payrollTotals[`period_${index}`] = {
        current: period.payrollData?.totalCost || 0,
        previous: period.yearOverYear.previousYearPayroll || 0,
      };
    });

    return { rows, totals, payrollTotals };
  };

  const { rows, totals } = tableData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (!caData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucune donnée CA par types trouvée
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header moderne avec card élégante */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 gap-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Avatar avec gradient */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${
                    selectedType === "HEBERGEMENT"
                      ? "from-blue-500 to-blue-600"
                      : "from-orange-500 to-orange-600"
                  } rounded-xl flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg`}
                >
                  {getTypeIcon(selectedType)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Infos par types */}
              <div className="flex-1 min-w-0">
                {/* Nom avec menu déroulant discret pour sélection de type */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 text-xl md:text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors duration-200 group truncate">
                        <span className="truncate">
                          {getTypeLabel(selectedType)} -{" "}
                          {caData.organization.name}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity duration-200 text-purple-500 flex-shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {/* Sélection des types disponibles */}
                      {availableTypes.map((type) => (
                        <DropdownMenuItem
                          key={type.id}
                          onClick={() => handleTypeChange(type.id)}
                          className={`cursor-pointer ${
                            selectedType === type.id ? "bg-purple-50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 bg-gradient-to-br ${
                                type.id === "HEBERGEMENT"
                                  ? "from-blue-500 to-blue-600"
                                  : "from-orange-500 to-orange-600"
                              } rounded-lg flex items-center justify-center text-white font-bold text-sm`}
                            >
                              {getTypeIcon(type.id)}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {type.label}
                                {selectedType === type.id && (
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Analyse quotidienne {type.label.toLowerCase()}
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}

                      <div className="border-t my-1"></div>

                      {/* Navigation vers autres vues */}
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard/ca-global")}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">CA Global</div>
                            <div className="text-xs text-muted-foreground">
                              Vue consolidée globale
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard")}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            <BarChart3 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">
                              Dashboard Principal
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Vue d&apos;ensemble des mandats
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>
                    Analyse consolidée par type •{" "}
                    {selectedSemester === "1"
                      ? "1er semestre"
                      : selectedSemester === "2"
                        ? "2ème semestre"
                        : "Année complète"}
                  </span>
                  <span className="text-purple-600">•</span>
                  <span>
                    {selectedSemester === "1"
                      ? "Janvier - Juin"
                      : selectedSemester === "2"
                        ? "Juillet - Décembre"
                        : "Janvier - Décembre"}{" "}
                    {selectedYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons d'action - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>

            {/* Menu Burger - Mobile uniquement */}
            <div className="md:hidden relative">
              <PremiumBurgerButton
                isOpen={isBurgerMenuOpen}
                onClick={() => setIsBurgerMenuOpen(!isBurgerMenuOpen)}
                variant="subtle"
              />

              {/* Menu dropdown mobile */}
              <AnimatePresence>
                {isBurgerMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setIsBurgerMenuOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50 overflow-hidden"
                    >
                      <div className="py-2">
                        <button
                          onClick={() => {
                            handleRefresh();
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <RefreshCw className="mr-3 h-4 w-4 text-slate-500" />
                          Actualiser
                        </button>

                        <button
                          onClick={() => {
                            handleExport();
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <FileSpreadsheet className="mr-3 h-4 w-4 text-slate-500" />
                          Exporter
                        </button>

                        <button
                          onClick={() => {
                            handlePrint();
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="mr-3 h-4 w-4 text-slate-500" />
                          Imprimer
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sélecteurs d'année et semestre intégrés */}
          <div className="px-4 md:px-6 py-3 bg-gray-50 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Période :
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Sélecteur d'année */}
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2022, 2023, 2024, 2025].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sélecteur de semestre */}
                  <Select
                    value={selectedSemester}
                    onValueChange={setSelectedSemester}
                  >
                    <SelectTrigger className="w-30 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1er semestre</SelectItem>
                      <SelectItem value="2">2ème semestre</SelectItem>
                      <SelectItem value="annee">Année</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <span className="text-xs text-muted-foreground">
                  {selectedSemester === "1"
                    ? "Janvier - Juin"
                    : selectedSemester === "2"
                      ? "Juillet - Décembre"
                      : "Janvier - Décembre"}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <span>Année précédente</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span>Année courante</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau optimisé pour 6 mois par semestre - AFFICHAGE ÉCRAN */}
        <div className="overflow-x-auto border rounded-lg print:hidden">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="border-r w-[60px] text-center text-sm p-2">
                  Jour
                </TableHead>
                {caData.periods.map((period, index) => (
                  <TableHead
                    key={index}
                    className="text-center w-[180px] border-r px-1 py-2"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {period.label.split(" ")[0]}
                      </div>
                      <div className="text-xs">
                        {period.label.split(" ")[1]}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{parseInt(selectedYear) - 1}</span>
                        <span>Actuel</span>
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.day} className="h-8">
                  <TableCell className="border-r font-medium text-center py-1 text-sm p-2">
                    {row.day.toString().padStart(2, "0")}
                  </TableCell>
                  {caData.periods.map((_, index) => (
                    <TableCell
                      key={index}
                      className="text-center border-r px-1 py-1 whitespace-nowrap"
                    >
                      <div className="flex justify-between items-center space-x-1 text-sm">
                        {/* Année précédente */}
                        <div className="flex-1 text-left text-muted-foreground">
                          {row.values[`period_${index}`]?.previous > 0
                            ? formatCurrency(
                                row.values[`period_${index}`].previous
                              )
                            : "-"}
                        </div>
                        {/* Année courante - LECTURE SEULE POUR LA VUE PAR TYPES */}
                        <div className="flex-1 text-right font-medium">
                          {row.values[`period_${index}`]?.current > 0
                            ? formatCurrency(
                                row.values[`period_${index}`].current
                              )
                            : "-"}
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* Ligne des totaux CA */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold">Total CA</span>
                </TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      <div className="flex-1 text-left text-muted-foreground">
                        {formatCurrency(
                          (
                            totals as Record<
                              string,
                              { current: number; previous: number }
                            >
                          )[`period_${index}`]?.previous || 0
                        )}
                      </div>
                      <div className="flex-1 text-right font-bold">
                        {formatCurrency(
                          (
                            totals as Record<
                              string,
                              { current: number; previous: number }
                            >
                          )[`period_${index}`]?.current || 0
                        )}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne total jour (moyenne journalière) */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold">CA jour</span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      {/* Année précédente - moyenne journalière */}
                      <div className="flex-1 text-left text-muted-foreground">
                        {period.yearOverYear.previousYearRevenue > 0
                          ? formatCurrency(
                              period.yearOverYear.previousYearRevenue /
                                (period.previousYearDailyValues?.filter(
                                  (dv) => dv.value > 0
                                ).length || 1)
                            )
                          : "-"}
                      </div>
                      {/* Année courante - moyenne journalière */}
                      <div className="flex-1 text-right font-bold">
                        {period.daysWithData > 0
                          ? formatCurrency(period.averageDaily)
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne évolution CA basée sur moyenne journalière */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold">CA %</span>
                </TableCell>
                {caData.periods.map((period, index) => {
                  // Calculer l'évolution basée sur les moyennes journalières
                  const currentAverage = period.averageDaily;
                  const previousAverage =
                    period.yearOverYear.previousYearRevenue > 0 &&
                    period.previousYearDailyValues
                      ? period.yearOverYear.previousYearRevenue /
                        period.previousYearDailyValues.filter(
                          (dv) => dv.value > 0
                        ).length
                      : 0;

                  const averageGrowth =
                    previousAverage > 0
                      ? ((currentAverage - previousAverage) / previousAverage) *
                        100
                      : null;

                  return (
                    <TableCell
                      key={index}
                      className="text-center border-r px-1 py-2 whitespace-nowrap"
                    >
                      <div className="flex justify-center items-center text-sm">
                        {averageGrowth !== null
                          ? formatPercentage(averageGrowth, true, 2)
                          : "-"}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Ligne évolution du cumul */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold">CA cumul</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-xs bg-white border border-gray-200 shadow-lg p-3"
                        sideOffset={8}
                      >
                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-gray-900">
                            Cumul par types depuis le début du semestre
                          </div>
                          <div className="text-gray-600">
                            Somme progressive des valeurs par types
                            d&apos;établissement depuis le début de la période
                            sélectionnée.
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-600">
                              <span className="font-medium">Gauche :</span>{" "}
                              Cumul année précédente
                            </div>
                            <div className="text-gray-600">
                              <span className="font-medium">Droite :</span>{" "}
                              Cumul année courante
                            </div>
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            Vue consolidée par types d&apos;établissements.
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      {/* Année précédente - à gauche */}
                      <div className="flex-1 text-left text-muted-foreground">
                        {period.cumulativePreviousYearRevenue
                          ? formatCurrency(period.cumulativePreviousYearRevenue)
                          : "-"}
                      </div>
                      {/* Année courante - à droite */}
                      <div className="flex-1 text-right font-bold">
                        {period.cumulativeTotal
                          ? formatCurrency(period.cumulativeTotal)
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne évolution du cumul */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold">Cumul %</span>
                  </div>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      <div className="flex-1 text-center font-bold">
                        {period.cumulativeRevenueGrowth !== null &&
                        period.cumulativeRevenueGrowth !== undefined
                          ? formatPercentage(
                              period.cumulativeRevenueGrowth,
                              true,
                              2
                            )
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne séparatrice vide */}
              <TableRow className="h-4">
                <TableCell className="border-r"></TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell key={index} className="border-r"></TableCell>
                ))}
              </TableRow>

              {/* Ligne des totaux Masse salariale */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold">Masse sal.</span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      {/* Année précédente - masse salariale */}
                      <div className="flex-1 text-left text-muted-foreground">
                        {period.yearOverYear.previousYearPayroll
                          ? formatCurrency(
                              period.yearOverYear.previousYearPayroll
                            )
                          : "-"}
                      </div>
                      {/* Année courante - masse salariale */}
                      <div className="flex-1 text-right font-bold">
                        {period.payrollData?.totalCost
                          ? formatCurrency(period.payrollData.totalCost)
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne pourcentage Masse salariale / CA */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold">Masse sal. %</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-xs bg-white border border-gray-200 shadow-lg p-3"
                        sideOffset={8}
                      >
                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-gray-900">
                            Ratio Masse salariale / CA
                          </div>
                          <div className="text-gray-600">
                            Pourcentage que représente la masse salariale par
                            rapport au chiffre d&apos;affaires du mois.
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            Un ratio élevé peut indiquer des coûts salariaux
                            importants par rapport aux revenus.
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                {caData.periods.map((period, index) => {
                  // Calculer le ratio pour l'année précédente
                  const previousPayrollRatio =
                    period.yearOverYear.previousYearRevenue > 0 &&
                    period.yearOverYear.previousYearPayroll
                      ? (period.yearOverYear.previousYearPayroll /
                          period.yearOverYear.previousYearRevenue) *
                        100
                      : null;

                  // Ratio pour l'année courante
                  const currentPayrollRatio =
                    period.payrollToRevenueRatio ?? null;

                  return (
                    <TableCell
                      key={index}
                      className="text-center border-r px-1 py-2 whitespace-nowrap"
                    >
                      <div className="flex justify-between items-center space-x-1 text-sm">
                        {/* Année précédente - ratio */}
                        <div className="flex-1 text-left text-muted-foreground">
                          {previousPayrollRatio !== null
                            ? formatPercentage(previousPayrollRatio, false, 1)
                            : "-"}
                        </div>
                        {/* Année courante - ratio */}
                        <div className="flex-1 text-right font-bold">
                          {currentPayrollRatio !== null
                            ? formatPercentage(currentPayrollRatio, false, 1)
                            : "-"}
                        </div>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Statistiques de performance par types - En bas de page */}
        <div className="print:hidden">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>
              Les statistiques excluent le mois en cours car il n&apos;est pas
              complet.
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Nouvelle carte pour le cumul annuel réel */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Cumul Annuel</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {caData.periods.length > 0
                      ? formatCurrency(
                          caData.periods[caData.periods.length - 1]
                            .cumulativeTotal || 0
                        )
                      : formatCurrency(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Depuis janvier {selectedYear}
                  </div>
                  {caData.periods.length > 0 &&
                    caData.periods[caData.periods.length - 1]
                      .cumulativeRevenueGrowth !== null &&
                    caData.periods[caData.periods.length - 1]
                      .cumulativeRevenueGrowth !== undefined && (
                      <div className="flex items-center text-sm">
                        {getGrowthIcon(
                          caData.periods[caData.periods.length - 1]
                            .cumulativeRevenueGrowth!
                        )}
                        <span className="ml-1">
                          {formatPercentage(
                            caData.periods[caData.periods.length - 1]
                              .cumulativeRevenueGrowth!,
                            true,
                            2
                          )}{" "}
                          vs {parseInt(selectedYear) - 1}
                        </span>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">CA Type</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      caData.summary.grandTotalExcludingCurrentMonth
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedSemester === "1"
                      ? "1er semestre"
                      : selectedSemester === "2"
                        ? "2ème semestre"
                        : "Année complète"}{" "}
                    {selectedYear}
                  </div>
                  {caData.summary.yearOverYearGrowth
                    .revenueExcludingCurrentMonth !== null && (
                    <div className="flex items-center text-sm">
                      {getGrowthIcon(
                        caData.summary.yearOverYearGrowth
                          .revenueExcludingCurrentMonth
                      )}
                      <span className="ml-1">
                        {formatPercentage(
                          caData.summary.yearOverYearGrowth
                            .revenueExcludingCurrentMonth,
                          true,
                          2
                        )}{" "}
                        vs {parseInt(selectedYear) - 1}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Masse Salariale</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.totalPayrollCost)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ratio global:{" "}
                    {caData.summary.globalPayrollRatio
                      ? formatPercentage(
                          caData.summary.globalPayrollRatio,
                          false,
                          2
                        )
                      : "-"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Meilleur Mois</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.bestPeriod.totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {caData.summary.bestPeriod.label}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Pire Mois</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.worstPeriod.totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {caData.summary.worstPeriod.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Détail par types */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Détail par types d&apos;établissements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(caData.summary.typesBreakdown &&
                caData.summary.typesBreakdown.length > 0 &&
                caData.summary.typesBreakdown.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                        {getTypeIcon(type.id)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {type.mandatesCount} mandats
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm font-bold">
                        {formatCurrency(type.totalRevenue)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {type.contribution.toFixed(1)}% du total
                      </div>
                    </div>
                  </div>
                ))) || (
                <div className="text-center text-muted-foreground">
                  Aucun type trouvé
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations supplémentaires */}
        <div className="text-sm text-gray-600 print:hidden">
          <p>
            Données générées le{" "}
            {new Date(caData.meta.generatedAt).toLocaleString("fr-CH")} |
            Comparaisons avec {parseInt(selectedYear) - 1} |
            {selectedSemester === "1" ? "1er semestre" : "2ème semestre"}{" "}
            {selectedYear} | Vue consolidée par types d&apos;établissements
          </p>
        </div>

        {/* Composant d'impression - masqué à l'écran, visible uniquement à l'impression */}
        <div className="print:block hidden">
          <PrintableTypesCAReport
            caData={caData}
            selectedYear={selectedYear}
            selectedSemester={selectedSemester}
            selectedType={selectedType}
            typeLabel={getTypeLabel(selectedType)}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
