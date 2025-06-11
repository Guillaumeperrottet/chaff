"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner";

// Types pour les données CA améliorées
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
  previousYearDailyValues: DayCAData[]; // Nouvelles données journalières année précédente
  averageDaily: number;
  daysWithData: number;
  cumulativeTotal?: number;
  cumulativePayroll?: number;

  // Nouvelles données masse salariale
  payrollData?: PayrollData;
  payrollToRevenueRatio?: number;

  // Données comparaison année précédente
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

    // Nouveaux indicateurs
    totalPayrollCost: number;
    globalPayrollRatio: number | null;

    // Comparaisons annuelles
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
  const mandateId = params.id as string;

  const [caData, setCAData] = useState<CAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  // Toujours afficher l'année complète (janvier à décembre)
  const [startMonth] = useState("1"); // Toujours commencer en janvier
  const [period] = useState("12months"); // Toujours 12 mois

  // Charger les données CA depuis l'API
  useEffect(() => {
    const loadCAData = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/mandats/${mandateId}/ca?year=${selectedYear}&startMonth=${startMonth}&period=${period}`
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
  }, [mandateId, selectedYear, startMonth, period]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    try {
      toast.loading("Génération de l'export...");

      const response = await fetch(
        `/api/export/ca/${mandateId}?year=${selectedYear}&startMonth=${startMonth}&period=${period}`
      );

      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `ca_${caData?.mandate.name}_${selectedYear}.csv`;
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

  // Créer la structure de données pour le tableau avec comparaison annuelle
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
      // Ajouter aussi les jours de l'année précédente
      period.previousYearDailyValues?.forEach((dv) => {
        const day = new Date(dv.date).getDate();
        allDays.add(day);
      });
    });

    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    // Construire les lignes du tableau avec données année courante et précédente
    const rows = sortedDays.map((day) => {
      const values: Record<string, { current: number; previous: number }> = {};

      caData.periods.forEach((period, index) => {
        // Année courante
        const dayValue = period.dailyValues.find(
          (dv) => new Date(dv.date).getDate() === day
        );

        // Année précédente
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

    // Calculer les totaux pour année courante et précédente
    const totals: Record<string, { current: number; previous: number }> = {};
    const payrollTotals: Record<string, { current: number; previous: number }> =
      {};
    const ratios: Record<string, { current: number; previous: number }> = {};

    caData.periods.forEach((period, index) => {
      totals[`period_${index}`] = {
        current: period.totalValue,
        previous: period.yearOverYear.previousYearRevenue,
      };

      payrollTotals[`period_${index}`] = {
        current: period.payrollData?.totalCost || 0,
        previous: period.yearOverYear.previousYearPayroll || 0,
      };

      const currentRatio = period.payrollToRevenueRatio || 0;
      const previousRatio =
        period.yearOverYear.previousYearRevenue > 0 &&
        period.yearOverYear.previousYearPayroll
          ? (period.yearOverYear.previousYearPayroll /
              period.yearOverYear.previousYearRevenue) *
            100
          : 0;

      ratios[`period_${index}`] = {
        current: currentRatio,
        previous: previousRatio,
      };
    });

    return { rows, totals, payrollTotals, ratios };
  };

  const { rows, totals, payrollTotals, ratios } = tableData();

  return (
    <div className="space-y-6">
      {/* Styles spécifiques pour l'impression */}
      <style jsx global>{`
        @media print {
          /* Cacher la navbar et autres éléments non nécessaires */
          nav,
          header,
          .navbar,
          .print-hidden {
            display: none !important;
          }

          /* Forcer le body à occuper toute la page */
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          /* Page 1: Tableau uniquement */
          .print-table-page {
            page-break-after: always;
            height: 100vh;
            width: 100%;
            margin: 0;
            padding: 0.5cm;
          }

          /* Optimiser le tableau pour l'impression */
          .print-table {
            font-size: 5px !important;
            width: 100% !important;
            margin: 0 !important;
            line-height: 1 !important;
          }

          .print-table th,
          .print-table td {
            padding: 1px !important;
            border: 0.5px solid #333 !important;
            font-size: 5px !important;
            line-height: 1 !important;
          }

          .print-table th {
            font-size: 4px !important;
            font-weight: bold !important;
          }

          /* Réduire les hauteurs des lignes */
          .print-table tr {
            height: auto !important;
            min-height: 8px !important;
          }

          /* Optimiser les colonnes */
          .print-table .sticky {
            width: 20px !important;
          }

          .print-table .month-col {
            width: 35px !important;
          }

          /* Page 2: Statistiques ultra-compactes pour une seule page */
          .print-stats-page {
            page-break-before: always;
            height: 100vh;
            width: 100%;
            margin: 0;
            padding: 0.3cm;
            display: flex;
            flex-direction: column;
          }

          /* Optimiser les cartes de statistiques pour l'impression */
          .print-stats {
            page-break-inside: avoid;
            margin-top: 0 !important;
            flex: 1;
            font-size: 5px !important;
            line-height: 1 !important;
          }

          /* Optimiser les cartes individuelles pour tenir sur 1 page */
          .print-stats .grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 3px !important;
          }

          /* Réduire drastiquement la taille des cartes à l'impression */
          .print-stats .grid > * {
            font-size: 5px !important;
            padding: 3px !important;
            line-height: 1 !important;
          }

          .print-stats .text-2xl {
            font-size: 7px !important;
            line-height: 1 !important;
            font-weight: bold !important;
          }

          .print-stats .text-xl {
            font-size: 6px !important;
            line-height: 1 !important;
          }

          .print-stats .text-lg {
            font-size: 6px !important;
            line-height: 1 !important;
            font-weight: 600 !important;
          }

          .print-stats .text-base {
            font-size: 5px !important;
            line-height: 1 !important;
          }

          .print-stats .text-sm {
            font-size: 4px !important;
            line-height: 1 !important;
          }

          .print-stats .text-xs {
            font-size: 3px !important;
            line-height: 1 !important;
          }

          /* Réduire drastiquement les marges et espacements des statistiques */
          .print-stats .space-y-6 > * + * {
            margin-top: 4px !important;
          }

          .print-stats .space-y-4 > * + * {
            margin-top: 2px !important;
          }

          .print-stats .space-y-2 > * + * {
            margin-top: 1px !important;
          }

          .print-stats .mb-4 {
            margin-bottom: 2px !important;
          }

          .print-stats .mb-2 {
            margin-bottom: 1px !important;
          }

          .print-stats .p-6 {
            padding: 3px !important;
          }

          .print-stats .gap-4 {
            gap: 2px !important;
          }

          .print-stats .gap-2 {
            gap: 1px !important;
          }

          /* Optimiser les icônes à l'extrême */
          .print-stats .h-5 {
            height: 4px !important;
            width: 4px !important;
          }

          .print-stats .h-4 {
            height: 3px !important;
            width: 3px !important;
          }

          /* Optimiser les cartes */
          .print-stats .border {
            border: 0.5px solid #ddd !important;
          }

          .print-stats .rounded-lg {
            border-radius: 1px !important;
          }

          .print-stats .shadow-sm {
            box-shadow: none !important;
          }

          /* Optimiser les en-têtes de cartes */
          .print-stats
            .flex.flex-row.items-center.justify-between.space-y-0.pb-2 {
            padding-bottom: 0 !important;
            margin-bottom: 1px !important;
          }

          /* Optimiser le contenu des cartes */
          .print-stats .space-y-2 {
            margin-top: 0 !important;
          }

          .print-stats .space-y-2 > * {
            margin-top: 0 !important;
          }

          .print-stats .space-y-2 > * + * {
            margin-top: 1px !important;
          }

          /* Optimiser les flexbox */
          .print-stats .flex.items-center {
            gap: 1px !important;
          }

          .print-stats .flex.items-center.gap-2 {
            gap: 1px !important;
          }

          /* Forcer les grilles en 4 colonnes même sur mobiles */
          .print-stats .md\\:grid-cols-2,
          .print-stats .lg\\:grid-cols-4 {
            grid-template-columns: repeat(4, 1fr) !important;
          }

          /* Optimiser davantage les contenus de cartes */
          .print-stats [class*="CardHeader"] {
            padding: 1px !important;
          }

          .print-stats [class*="CardContent"] {
            padding: 1px !important;
          }

          /* Titre page 2 optimisé */
          .print-title h1 {
            font-size: 8px !important;
            line-height: 1 !important;
            font-weight: bold !important;
            margin-bottom: 2px !important;
          }

          .print-title p {
            font-size: 5px !important;
            line-height: 1 !important;
            margin-bottom: 2px !important;
          }

          /* Retirer les couleurs de fond pour économiser l'encre */
          .print-table tr {
            background-color: white !important;
          }

          /* Garder les bordures importantes */
          .print-table td,
          .print-table th {
            border: 1px solid #333 !important;
          }

          /* Configuration des pages */
          @page {
            margin: 0.3cm;
            size: A4 landscape;
          }

          /* Optimiser encore plus pour une seule page */
          .print-table-page {
            height: auto !important;
            min-height: 100vh;
            overflow: hidden;
          }

          /* Réduire au maximum toutes les marges internes */
          .print-table * {
            margin: 0 !important;
            padding: 1px !important;
          }

          /* Forcer une largeur fixe très petite pour les colonnes */
          .print-table th,
          .print-table td {
            width: 30px !important;
            max-width: 30px !important;
            min-width: 30px !important;
            font-size: 4px !important;
            line-height: 0.8 !important;
            padding: 0.5px !important;
          }

          /* Colonne jour encore plus petite */
          .print-table th:first-child,
          .print-table td:first-child {
            width: 15px !important;
            max-width: 15px !important;
            min-width: 15px !important;
          }

          /* Titre d'impression optimisé */
          .print-title {
            text-align: center;
            margin-bottom: 10px !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }

          .print-title h1 {
            font-size: 14px !important;
            margin-bottom: 5px !important;
          }

          .print-title p {
            font-size: 10px !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Header modernisé */}
      <div className="bg-white rounded-lg border shadow-sm print-hidden">
        {/* Header principal */}
        <div className="px-6 py-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {caData.mandate.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {caData.mandate.name}
                  </h1>
                  <div className="flex items-center space-x-3">
                    <p className="text-sm text-muted-foreground">
                      Vue annuelle complète • {selectedYear} vs{" "}
                      {parseInt(selectedYear) - 1}
                    </p>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      Actif
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions du header */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                Actualiser
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 border-blue-200"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>

        {/* Sélecteur d'année intégré */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Année :</span>
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
              <span className="text-xs text-muted-foreground">
                Période complète : Janvier - Décembre
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span>Année courante</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <span>Année précédente</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 1: Tableau uniquement */}
      <div className="print-table-page">
        {/* Titre pour la page tableau */}
        <div className="hidden print:block print-title">
          <h1 className="text-xl font-bold mb-2">
            Analyse Chiffre d&apos;Affaires - {caData.mandate.name}
          </h1>
          <p className="text-sm text-gray-700 mb-4">
            Données détaillées par jour - {selectedYear} vs{" "}
            {parseInt(selectedYear) - 1}
          </p>
        </div>

        {/* Tableau optimisé pour l'année complète */}
        <div className="overflow-x-auto border rounded-lg print-table">
          <Table className="text-xs print-table">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white border-r w-[50px] text-center text-xs p-1 print:w-[20px]">
                  Jour
                </TableHead>
                {caData.periods.map((period, index) => (
                  <TableHead
                    key={index}
                    className="text-center w-[120px] border-r px-1 py-1 month-col print:w-[35px]"
                  >
                    <div className="space-y-0.5">
                      <div className="font-medium text-xs print:text-[4px]">
                        {period.label.split(" ")[0]}
                      </div>
                      <div className="text-[10px] print:text-[3px]">
                        {period.label.split(" ")[1]}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground print:text-[3px]">
                        <span>Curr</span>
                        <span>Prev</span>
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.day} className="h-6 print:h-auto">
                  <TableCell className="sticky left-0 bg-white border-r font-medium text-center py-0.5 text-xs p-1 print:text-[5px] print:p-0">
                    {row.day.toString().padStart(2, "0")}
                  </TableCell>
                  {caData.periods.map((_, index) => (
                    <TableCell
                      key={index}
                      className="text-center border-r px-0.5 py-0.5 whitespace-nowrap print:text-[4px] print:p-0"
                    >
                      <div className="flex justify-between items-center space-x-0.5 text-[10px] print:text-[4px] print:space-x-0">
                        {/* Année courante */}
                        <div className="flex-1 text-left">
                          {row.values[`period_${index}`]?.current > 0
                            ? (
                                row.values[`period_${index}`].current / 1000
                              ).toFixed(0) + "k"
                            : "-"}
                        </div>
                        {/* Année précédente */}
                        <div className="flex-1 text-right text-muted-foreground">
                          {row.values[`period_${index}`]?.previous > 0
                            ? (
                                row.values[`period_${index}`].previous / 1000
                              ).toFixed(0) + "k"
                            : "-"}
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* Ligne des totaux CA */}
              <TableRow className="bg-blue-50 font-medium print:bg-white">
                <TableCell className="sticky left-0 bg-blue-50 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Total CA
                  </span>
                </TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="flex justify-between items-center space-x-0.5 text-[10px] print:text-[4px] print:space-x-0">
                      <div className="flex-1 text-left font-bold text-blue-700">
                        {(
                          ((
                            totals as Record<
                              string,
                              { current: number; previous: number }
                            >
                          )[`period_${index}`]?.current || 0) / 1000
                        ).toFixed(0)}
                        k
                      </div>
                      <div className="flex-1 text-right text-blue-600">
                        {(
                          ((
                            totals as Record<
                              string,
                              { current: number; previous: number }
                            >
                          )[`period_${index}`]?.previous || 0) / 1000
                        ).toFixed(0)}
                        k
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne masse salariale */}
              <TableRow className="bg-green-50 font-medium print:bg-white">
                <TableCell className="sticky left-0 bg-green-50 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Masse Sal.
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="flex justify-between items-center space-x-0.5 text-[10px] print:text-[4px] print:space-x-0">
                      <div className="flex-1 text-left">
                        {period.payrollData ? (
                          <div className="space-y-0.5 print:space-y-0">
                            <div className="font-bold text-green-700">
                              {(period.payrollData.totalCost / 1000).toFixed(0)}
                              k
                            </div>
                            {period.payrollData.employeeCount && (
                              <div className="text-[9px] text-green-600 print:text-[3px]">
                                {period.payrollData.employeeCount}emp
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="flex-1 text-right text-green-600">
                        {(
                          payrollTotals as Record<
                            string,
                            { current: number; previous: number }
                          >
                        )[`period_${index}`]?.previous > 0
                          ? (
                              (
                                payrollTotals as Record<
                                  string,
                                  { current: number; previous: number }
                                >
                              )[`period_${index}`].previous / 1000
                            ).toFixed(0) + "k"
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne ratio */}
              <TableRow className="bg-yellow-50 font-medium print:bg-white">
                <TableCell className="sticky left-0 bg-yellow-50 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Ratio %
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="flex justify-between items-center space-x-0.5 text-[10px] print:text-[4px] print:space-x-0">
                      <div className="flex-1 text-left">
                        {period.payrollToRevenueRatio ? (
                          <span
                            className={`font-medium ${
                              period.payrollToRevenueRatio < 30
                                ? "text-green-700"
                                : period.payrollToRevenueRatio < 50
                                  ? "text-yellow-700"
                                  : "text-red-700"
                            }`}
                          >
                            {period.payrollToRevenueRatio.toFixed(0)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        {((
                          ratios as Record<
                            string,
                            { current: number; previous: number }
                          >
                        )[`period_${index}`]?.previous || 0) > 0 ? (
                          <span
                            className={`${
                              ((
                                ratios as Record<
                                  string,
                                  { current: number; previous: number }
                                >
                              )[`period_${index}`]?.previous || 0) < 30
                                ? "text-green-600"
                                : ((
                                      ratios as Record<
                                        string,
                                        { current: number; previous: number }
                                      >
                                    )[`period_${index}`]?.previous || 0) < 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {(
                              (
                                ratios as Record<
                                  string,
                                  { current: number; previous: number }
                                >
                              )[`period_${index}`]?.previous || 0
                            ).toFixed(0)}
                            %
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne évolution */}
              <TableRow className="bg-purple-50 font-medium print:bg-white">
                <TableCell className="sticky left-0 bg-purple-50 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Évolution
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="space-y-0.5 print:space-y-0">
                      {/* Évolution CA */}
                      <div className="flex items-center justify-center gap-0.5 print:gap-0">
                        {getGrowthIcon(period.yearOverYear.revenueGrowth)}
                        <span className="text-[9px] font-medium print:text-[3px]">
                          {period.yearOverYear.revenueGrowth !== null
                            ? (period.yearOverYear.revenueGrowth >= 0
                                ? "+"
                                : "") +
                              period.yearOverYear.revenueGrowth.toFixed(0) +
                              "%"
                            : "-"}
                        </span>
                      </div>
                      {/* Évolution masse salariale */}
                      {period.yearOverYear.payrollGrowth !== null && (
                        <div className="flex items-center justify-center gap-0.5 print:gap-0">
                          {getGrowthIcon(period.yearOverYear.payrollGrowth)}
                          <span className="text-[9px] font-medium print:text-[3px]">
                            MS:{" "}
                            {(period.yearOverYear.payrollGrowth >= 0
                              ? "+"
                              : "") +
                              period.yearOverYear.payrollGrowth.toFixed(0)}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne cumul */}
              <TableRow className="bg-gray-100 font-bold print:bg-white">
                <TableCell className="sticky left-0 bg-gray-100 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Cumul
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="flex justify-between items-center space-x-0.5 text-[10px] print:text-[4px] print:space-x-0">
                      <div className="flex-1 text-left">
                        <div className="text-blue-700 font-bold">
                          {((period.cumulativeTotal || 0) / 1000).toFixed(0)}k
                        </div>
                        {period.cumulativePayroll && (
                          <div className="text-green-700 text-[9px] print:text-[3px]">
                            MS: {(period.cumulativePayroll / 1000).toFixed(0)}k
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-right text-muted-foreground">
                        <div className="text-blue-600">
                          {/* Cumul année précédente calculé */}
                          {caData.periods
                            .slice(0, index + 1)
                            .reduce(
                              (sum, p) =>
                                sum + p.yearOverYear.previousYearRevenue,
                              0
                            ) > 0 &&
                            (
                              caData.periods
                                .slice(0, index + 1)
                                .reduce(
                                  (sum, p) =>
                                    sum + p.yearOverYear.previousYearRevenue,
                                  0
                                ) / 1000
                            ).toFixed(0) + "k"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* PAGE 2: Statistiques uniquement */}
      <div className="print-stats-page">
        {/* Titre pour la page statistiques */}
        <div className="hidden print:block print-title">
          <h1 className="text-xl font-bold mb-2">
            Indicateurs de Performance - {caData.mandate.name}
          </h1>
          <p className="text-sm text-gray-700 mb-4">
            Analyse statistique - {selectedYear} | Généré le{" "}
            {new Date().toLocaleDateString("fr-CH")}
          </p>
        </div>

        {/* Section des statistiques et indicateurs de performance */}
        <div className="space-y-6 print-stats">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Indicateurs de performance {selectedYear}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    CA Total
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
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
                    {formatCurrency(caData.summary.totalPayrollCost)}
                  </div>
                  {caData.summary.yearOverYearGrowth.payroll !== null && (
                    <div className="flex items-center text-xs">
                      {getGrowthIcon(caData.summary.yearOverYearGrowth.payroll)}
                      <span className="ml-1">
                        {formatPercentage(
                          caData.summary.yearOverYearGrowth.payroll
                        )}{" "}
                        vs {parseInt(selectedYear) - 1}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ratio Global
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {caData.summary.globalPayrollRatio
                      ? formatPercentage(
                          caData.summary.globalPayrollRatio,
                          false
                        )
                      : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Masse sal. / CA
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Meilleur Mois
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.bestPeriod.totalValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {caData.summary.bestPeriod.label}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Analyse détaillée
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Période analysée</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {caData.summary.totalPeriods} mois
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Moyenne mensuelle:{" "}
                      {formatCurrency(caData.summary.averagePerPeriod)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance CA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-green-600">
                      Meilleur:{" "}
                      {formatCurrency(caData.summary.bestPeriod.totalValue)}
                    </div>
                    <div className="text-sm text-red-600">
                      Plus faible:{" "}
                      {formatCurrency(caData.summary.worstPeriod.totalValue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Écart:{" "}
                      {formatCurrency(
                        caData.summary.bestPeriod.totalValue -
                          caData.summary.worstPeriod.totalValue
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Masse Salariale</CardTitle>
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
                <CardHeader>
                  <CardTitle className="text-base">
                    Évolution annuelle
                  </CardTitle>
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
                        {getGrowthIcon(
                          caData.summary.yearOverYearGrowth.payroll
                        )}
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
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="text-sm text-gray-600 print-hidden">
        <p>
          Données générées le{" "}
          {new Date(caData.meta.generatedAt).toLocaleString("fr-CH")} |
          Comparaisons avec {parseInt(selectedYear) - 1} | Ratios masse
          salariale inclus
        </p>
      </div>
    </div>
  );
}
