"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
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
  CalendarIcon,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calculator,
  DollarSign,
  BarChart3,
  RefreshCw,
  FileSpreadsheet,
  Info,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import PrintableCAReport from "@/app/components/ca/PrintableCAReport";

// Types pour les données CA
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

interface Comparison {
  period: PeriodData;
  comparison: {
    previous: number;
    percentage: number | null;
  };
  yearOverYear: {
    previousYearRevenue: number;
    previousYearPayroll?: number;
    revenueGrowth: number | null;
    payrollGrowth: number | null;
  };
}

interface CAResponse {
  mandate: {
    id: string;
    name: string;
    group: string;
  };
  periods: PeriodData[];
  comparisons: Comparison[];
  summary: {
    totalPeriods: number;
    grandTotal: number;
    averagePerPeriod: number;
    bestPeriod: PeriodData;
    worstPeriod: PeriodData;
    totalPayrollCost: number;
    globalPayrollRatio: number | null;
    yearOverYearGrowth: {
      revenue: number | null;
      payroll: number | null;
    };
  };
  meta: {
    year: number;
    startMonth: number;
    period: string;
    generatedAt: string;
  };
}

export default function MandateCAPage() {
  const params = useParams();
  const router = useRouter();
  const mandateId = params.id as string;

  const [caData, setCAData] = useState<CAResponse | null>(null);
  const [availableMandates, setAvailableMandates] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedSemester, setSelectedSemester] = useState(() => {
    // Démarrer sur le semestre actuel
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return currentMonth <= 6 ? "1" : "2";
  });

  // Charger les données CA depuis l'API (maintenant pour 6 mois par semestre)
  useEffect(() => {
    const loadCAData = async () => {
      try {
        setLoading(true);

        // Calculer les mois pour le semestre sélectionné
        const startMonth = selectedSemester === "1" ? 1 : 7;
        const endMonth = selectedSemester === "1" ? 6 : 12;

        const response = await fetch(
          `/api/mandats/${mandateId}/ca?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months`
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données CA");
        }

        const data = await response.json();
        setCAData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des données CA:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    loadCAData();
  }, [mandateId, selectedYear, selectedSemester]);

  // Charger la liste des mandats disponibles
  useEffect(() => {
    const loadAvailableMandates = async () => {
      try {
        const response = await fetch("/api/mandats");
        if (response.ok) {
          const mandates = await response.json();
          setAvailableMandates(
            mandates.map((m: { id: string; name: string }) => ({
              id: m.id,
              name: m.name,
            }))
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement des mandats:", error);
      }
    };
    loadAvailableMandates();
  }, []);

  const handleRefresh = () => {
    const loadCAData = async () => {
      try {
        setLoading(true);

        // Calculer les mois pour le semestre sélectionné
        const startMonth = selectedSemester === "1" ? 1 : 7;
        const endMonth = selectedSemester === "1" ? 6 : 12;

        const response = await fetch(
          `/api/mandats/${mandateId}/ca?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months`
        );
        if (!response.ok) throw new Error("Erreur lors du chargement");
        const data = await response.json();
        setCAData(data);
        toast.success("Données actualisées");
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors de l'actualisation");
      } finally {
        setLoading(false);
      }
    };
    loadCAData();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    try {
      toast.loading("Génération de l'export...");

      // Calculer les mois pour le semestre sélectionné
      const startMonth = selectedSemester === "1" ? 1 : 7;
      const endMonth = selectedSemester === "1" ? 6 : 12;

      const response = await fetch(
        `/api/export/ca/${mandateId}?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months`
      );

      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const semesterName = selectedSemester === "1" ? "S1" : "S2";
      a.download = `ca_${caData?.mandate.name}_${selectedYear}_${semesterName}.csv`;
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
    return new Intl.NumberFormat("fr-CH", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number | null, showSign = true) => {
    if (value === null) return "-";
    const formatted = Math.abs(value).toFixed(1);
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

  // Créer la structure de données pour le tableau
  const tableData = () => {
    if (!caData)
      return { rows: [], totals: {}, comparisons: {}, payrollTotals: {} };

    // Obtenir tous les jours uniques
    const allDays = new Set<number>();
    caData.periods.forEach((period) => {
      period.dailyValues.forEach((dv) => {
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
        const dayValue = period.dailyValues.find(
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

  // Fonction pour naviguer vers un autre mandat
  const handleMandateChange = (newMandateId: string) => {
    router.push(`/dashboard/mandates/${newMandateId}`);
  };

  const { rows, totals } = tableData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!caData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucune donnée CA trouvée pour ce mandat
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header moderne avec card élégante */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              {/* Avatar avec gradient */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {caData.mandate.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Infos du mandat */}
              <div>
                {/* Nom du mandat avec menu déroulant discret */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200 group">
                        {caData.mandate.name}
                        <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {availableMandates
                        .filter((mandate) => mandate.id !== mandateId)
                        .map((mandate) => (
                          <DropdownMenuItem
                            key={mandate.id}
                            onClick={() => handleMandateChange(mandate.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {mandate.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {mandate.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Voir l&apos;analyse CA
                                </div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      {availableMandates.filter(
                        (mandate) => mandate.id !== mandateId
                      ).length === 0 && (
                        <DropdownMenuItem disabled>
                          <div className="text-muted-foreground">
                            Aucun autre mandat disponible
                          </div>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>
                    Analyse CA • {selectedSemester === "1" ? "1er" : "2ème"}{" "}
                    semestre
                  </span>
                  <span className="text-blue-600">•</span>
                  <span>
                    {selectedSemester === "1"
                      ? "Janvier - Juin"
                      : "Juillet - Décembre"}{" "}
                    {selectedYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="hover:bg-green-50 hover:border-green-300 transition-all duration-200"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>

          {/* Sélecteurs d'année et semestre intégrés */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Période :
                </span>

                {/* Sélecteur d'année */}
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-28 h-8">
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
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1er semestre</SelectItem>
                    <SelectItem value="2">2ème semestre</SelectItem>
                  </SelectContent>
                </Select>

                <span className="text-xs text-muted-foreground">
                  {selectedSemester === "1"
                    ? "Janvier - Juin"
                    : "Juillet - Décembre"}
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
                <TableHead className="sticky left-0 bg-white border-r w-[60px] text-center text-sm p-2">
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
                  <TableCell className="sticky left-0 bg-white border-r font-medium text-center py-1 text-sm p-2">
                    {row.day.toString().padStart(2, "0")}
                  </TableCell>
                  {caData.periods.map((_, index) => (
                    <TableCell
                      key={index}
                      className="text-center border-r px-1 py-1 whitespace-nowrap"
                    >
                      <div className="flex justify-between items-center space-x-1 text-[11px]">
                        {/* Année précédente */}
                        <div className="flex-1 text-left text-muted-foreground">
                          {row.values[`period_${index}`]?.previous > 0
                            ? formatCurrency(
                                row.values[`period_${index}`].previous
                              )
                            : "-"}
                        </div>
                        {/* Année courante */}
                        <div className="flex-1 text-right">
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
              <TableRow className="bg-blue-50 font-medium">
                <TableCell className="sticky left-0 bg-blue-50 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold">Total CA</span>
                </TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-[11px]">
                      <div className="flex-1 text-left text-blue-600">
                        {formatCurrency(
                          (
                            totals as Record<
                              string,
                              { current: number; previous: number }
                            >
                          )[`period_${index}`]?.previous || 0
                        )}
                      </div>
                      <div className="flex-1 text-right font-bold text-blue-700">
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

              {/* Ligne évolution CA */}
              <TableRow className="bg-indigo-50 font-medium">
                <TableCell className="sticky left-0 bg-indigo-50 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold text-indigo-800">
                    Évol. CA %
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-center items-center text-xs">
                      {period.yearOverYear.revenueGrowth !== null ? (
                        <span
                          className={`font-bold ${
                            period.yearOverYear.revenueGrowth >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {period.yearOverYear.revenueGrowth >= 0 ? "+" : ""}
                          {period.yearOverYear.revenueGrowth.toFixed(1)}%
                        </span>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne évolution du cumul */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="sticky left-0 bg-gray-100 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold">Cumul</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-gray-600 cursor-help hover:text-gray-700 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-xs bg-white border border-gray-200 shadow-lg p-3"
                        sideOffset={8}
                      >
                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-gray-900">
                            Cumul depuis le début du semestre
                          </div>
                          <div className="text-gray-600">
                            Somme progressive des valeurs depuis le début de la
                            période sélectionnée pour l&apos;année courante et
                            l&apos;année précédente.
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
                            Permet de comparer la progression des objectifs par
                            rapport à l&apos;année précédente.
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
                    <div className="flex justify-between items-center space-x-1 text-[11px]">
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
              <TableRow className="bg-emerald-50 font-medium">
                <TableCell className="sticky left-0 bg-emerald-50 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold text-emerald-800">
                      Évol. Cumul %
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-emerald-600 cursor-help hover:text-emerald-700 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-xs bg-white border border-gray-200 shadow-lg p-3"
                        sideOffset={8}
                      >
                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-gray-900">
                            Évolution des cumuls
                          </div>
                          <div className="text-gray-600">
                            Compare les cumuls de l&apos;année courante avec les
                            cumuls de l&apos;année précédente à la même période.
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-600">
                              <span className="font-medium">Gauche :</span>{" "}
                              Évolution cumul MS
                            </div>
                            <div className="text-gray-600">
                              <span className="font-medium">Droite :</span>{" "}
                              Évolution cumul CA
                            </div>
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            Formule : ((Cumul actuel - Cumul N-1) ÷ Cumul N-1) ×
                            100
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
                    <div className="flex justify-between items-center space-x-1 text-xs">
                      {/* Note: Comme on affiche maintenant seulement le CA dans les cumuls, 
                          on peut simplifier cette ligne pour afficher seulement l'évolution du cumul CA */}
                      <div className="flex-1 text-center font-bold">
                        {period.cumulativeRevenueGrowth !== null &&
                        period.cumulativeRevenueGrowth !== undefined ? (
                          <span
                            className={
                              period.cumulativeRevenueGrowth >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {period.cumulativeRevenueGrowth >= 0 ? "+" : ""}
                            {period.cumulativeRevenueGrowth.toFixed(1)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne séparatrice vide */}
              <TableRow className="h-4">
                <TableCell className="sticky left-0 bg-white border-r"></TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell key={index} className="border-r"></TableCell>
                ))}
              </TableRow>

              {/* Ligne masse salariale
              <TableRow className="bg-green-50 font-medium">
                <TableCell className="sticky left-0 bg-green-50 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold">Masse Sal.</span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-[11px]">
                      <div className="flex-1 text-right text-green-600">
                        {(
                          payrollTotals as Record<
                            string,
                            { current: number; previous: number }
                          >
                        )[`period_${index}`]?.previous > 0
                          ? formatCurrency(
                              (
                                payrollTotals as Record<
                                  string,
                                  { current: number; previous: number }
                                >
                              )[`period_${index}`].previous
                            )
                          : "-"}
                      </div>
                      <div className="flex-1 text-left">
                        {period.payrollData ? (
                          <div className="space-y-1">
                            <div className="font-bold text-green-700">
                              {formatCurrency(period.payrollData.totalCost)}
                            </div>
                            {period.payrollData.employeeCount && (
                              <div className="text-[10px] text-green-600">
                                {period.payrollData.employeeCount} emp.
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow> */}

              {/* Ligne ratio */}
              {/* <TableRow className="bg-yellow-50 font-medium">
                <TableCell className="sticky left-0 bg-yellow-50 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold">Ratio %</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-yellow-600 cursor-help hover:text-yellow-700 transition-colors" />
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
                            Formule : (Masse salariale ÷ Chiffre
                            d&apos;affaires) × 100
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-600 font-medium">
                              Seuils recommandés :
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>{"< 25%"} : Excellent</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>25-35% : Bon</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span>35-50% : Attention</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>{"> 50%"} : Critique</span>
                            </div>
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
                    <div className="flex justify-between items-center space-x-1 text-xs">
                      <div className="flex-1 text-center font-bold text-yellow-700">
                        {period.payrollToRevenueRatio
                          ? `${period.payrollToRevenueRatio.toFixed(1)}%`
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow> */}

              {/* Ligne évolution */}
              <TableRow className="bg-purple-50 font-medium">
                <TableCell className="sticky left-0 bg-purple-50 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold">Évol. %</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-purple-600 cursor-help hover:text-purple-700 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-xs bg-white border border-gray-200 shadow-lg p-3"
                        sideOffset={8}
                      >
                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-gray-900">
                            Évolution annuelle
                          </div>
                          <div className="text-gray-600">
                            Compare les données du mois actuel avec le même mois
                            de l&apos;année précédente.
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-600">
                              <span className="font-medium">Gauche :</span>{" "}
                              Évolution de la masse salariale
                            </div>
                            <div className="text-gray-600">
                              <span className="font-medium">Droite :</span>{" "}
                              Évolution du CA
                            </div>
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            Formule : ((Valeur actuelle - Valeur N-1) ÷ Valeur
                            N-1) × 100
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
                    <div className="flex justify-between items-center space-x-1 text-xs">
                      <div className="flex-1 text-right font-bold">
                        {period.yearOverYear.payrollGrowth !== null ? (
                          <span
                            className={
                              period.yearOverYear.payrollGrowth >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {period.yearOverYear.payrollGrowth >= 0 ? "+" : ""}
                            {period.yearOverYear.payrollGrowth.toFixed(1)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="flex-1 text-left font-bold">
                        {period.yearOverYear.revenueGrowth !== null ? (
                          <span
                            className={
                              period.yearOverYear.revenueGrowth >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {period.yearOverYear.revenueGrowth >= 0 ? "+" : ""}
                            {period.yearOverYear.revenueGrowth.toFixed(1)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Composant d'impression (caché à l'écran, visible à l'impression) */}
        <div className="hidden print:block">
          <PrintableCAReport caData={caData} selectedYear={selectedYear} />
        </div>

        {/* Statistiques de performance - En bas de page */}
        <div className="print:hidden">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">CA Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.grandTotal)}
                  </div>
                  {caData.summary.yearOverYearGrowth.revenue !== null && (
                    <div className="flex items-center text-xs">
                      {getGrowthIcon(caData.summary.yearOverYearGrowth.revenue)}
                      <span className="ml-1">
                        {formatPercentage(
                          caData.summary.yearOverYearGrowth.revenue
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
                          false
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
                <CardTitle className="text-base">Évolution annuelle</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getGrowthIcon(caData.summary.yearOverYearGrowth.revenue)}
                    <span className="text-sm">
                      CA:{" "}
                      {formatPercentage(
                        caData.summary.yearOverYearGrowth.revenue
                      )}
                    </span>
                  </div>
                  {caData.summary.yearOverYearGrowth.payroll !== null && (
                    <div className="flex items-center gap-2">
                      {getGrowthIcon(caData.summary.yearOverYearGrowth.payroll)}
                      <span className="text-sm">
                        MS:{" "}
                        {formatPercentage(
                          caData.summary.yearOverYearGrowth.payroll
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="text-sm text-gray-600 print:hidden">
          <p>
            Données générées le{" "}
            {new Date(caData.meta.generatedAt).toLocaleString("fr-CH")} |
            Comparaisons avec {parseInt(selectedYear) - 1} |
            {selectedSemester === "1" ? "1er semestre" : "2ème semestre"}{" "}
            {selectedYear} | Ratios masse salariale inclus
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
