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
} from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/app/components/ui/BackButton";
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
  const mandateId = params.id as string;

  const [caData, setCAData] = useState<CAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [startMonth, setStartMonth] = useState("1");
  const [period, setPeriod] = useState("12months");

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
        <BackButton href="/dashboard" label="Retour au dashboard" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!caData) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard" label="Retour au dashboard" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucune donnée CA trouvée pour ce mandat
          </p>
        </div>
      </div>
    );
  }

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

  const { rows, totals, payrollTotals } = tableData();

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton href="/dashboard" label="Retour au dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analyse CA - {caData.mandate.name}
          </h1>
          <p className="text-muted-foreground">
            Suivi détaillé du chiffre d&apos;affaires avec comparaisons
            annuelles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Contrôles de période */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Sélection de période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Année</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mois de début</label>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(2024, month - 1).toLocaleDateString("fr-FR", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">3 mois</SelectItem>
                  <SelectItem value="6months">6 mois</SelectItem>
                  <SelectItem value="12months">12 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau principal - Affichage écran */}
      <div className="overflow-x-auto border rounded-lg print:hidden">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-white border-r w-[50px] text-center">
                Jour
              </TableHead>
              {caData.periods.map((period, index) => (
                <TableHead
                  key={index}
                  className="text-center w-[120px] border-r"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{period.label}</div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Actuel</span>
                      <span>Précédent</span>
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.day}>
                <TableCell className="sticky left-0 bg-white border-r font-medium text-center">
                  {row.day.toString().padStart(2, "0")}
                </TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell key={index} className="text-center border-r">
                    <div className="flex justify-between items-center space-x-1 text-[10px]">
                      <div className="flex-1 text-left">
                        {row.values[`period_${index}`]?.current > 0
                          ? (
                              row.values[`period_${index}`].current / 1000
                            ).toFixed(0) + "k"
                          : "-"}
                      </div>
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

            {/* Ligne des totaux */}
            <TableRow className="bg-blue-50 font-medium">
              <TableCell className="sticky left-0 bg-blue-50 border-r text-center">
                Total CA
              </TableCell>
              {caData.periods.map((_, index) => (
                <TableCell key={index} className="text-center border-r">
                  <div className="flex justify-between items-center space-x-1 text-[10px]">
                    <div className="flex-1 text-left font-bold text-blue-700">
                      {(
                        (
                          totals as Record<
                            string,
                            { current: number; previous: number }
                          >
                        )[`period_${index}`]?.current / 1000
                      ).toFixed(0)}
                      k
                    </div>
                    <div className="flex-1 text-right text-blue-600">
                      {(
                        (
                          totals as Record<
                            string,
                            { current: number; previous: number }
                          >
                        )[`period_${index}`]?.previous / 1000
                      ).toFixed(0)}
                      k
                    </div>
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne masse salariale */}
            <TableRow className="bg-green-50 font-medium">
              <TableCell className="sticky left-0 bg-green-50 border-r text-center">
                Masse Sal.
              </TableCell>
              {caData.periods.map((period, index) => (
                <TableCell key={index} className="text-center border-r">
                  <div className="flex justify-between items-center space-x-1 text-[10px]">
                    <div className="flex-1 text-left">
                      {period.payrollData ? (
                        <div className="font-bold text-green-700">
                          {(period.payrollData.totalCost / 1000).toFixed(0)}k
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
          </TableBody>
        </Table>
      </div>

      {/* Statistiques de performance */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:hidden">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
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
                  {formatPercentage(caData.summary.yearOverYearGrowth.revenue)}{" "}
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
            <div className="text-sm text-muted-foreground">
              Ratio global:{" "}
              {caData.summary.globalPayrollRatio
                ? formatPercentage(caData.summary.globalPayrollRatio, false)
                : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleur Mois</CardTitle>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Évolution</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getGrowthIcon(caData.summary.yearOverYearGrowth.revenue)}
                <span className="text-sm">
                  CA:{" "}
                  {formatPercentage(caData.summary.yearOverYearGrowth.revenue)}
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

      {/* Composant d'impression (caché à l'écran, visible à l'impression) */}
      <div className="hidden print:block">
        <PrintableCAReport caData={caData} selectedYear={selectedYear} />
      </div>

      {/* Informations supplémentaires */}
      <div className="text-sm text-gray-600 print:hidden">
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
