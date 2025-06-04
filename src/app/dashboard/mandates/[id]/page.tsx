"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import { Badge } from "@/app/components/ui/badge";
import { BackButton } from "@/app/components/ui/BackButton";
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

  // Nouveau: commencer par le mois actuel ou janvier selon la période de l'année
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;

  // Si on est avant juillet, commencer en janvier, sinon commencer en juillet
  const defaultStartMonth = currentMonth < 7 ? "1" : "7";
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [period, setPeriod] = useState("12months"); // 12 mois par défaut

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
        <BackButton href="/dashboard/mandates" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!caData) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/mandates" />
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
      {/* Navigation */}
      <BackButton href="/dashboard/mandates" label="Retour aux mandats" />

      <div className="border-b pb-4">
        <nav className="flex items-center space-x-4 text-sm text-blue-600 mb-4">
          <Link href="/dashboard" className="hover:underline">
            Campus
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/dashboard" className="hover:underline">
            Tableau de bord
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/dashboard/mandates" className="hover:underline">
            Mandants
          </Link>
        </nav>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {caData.mandate.name}
          </h1>
          <Badge
            variant={
              caData.mandate.group === "HEBERGEMENT" ? "default" : "secondary"
            }
          >
            {caData.mandate.group === "HEBERGEMENT"
              ? "Hébergement"
              : "Restauration"}
          </Badge>
        </div>
      </div>

      {/* Indicateurs de performance */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            {caData.summary.yearOverYearGrowth.payroll !== null && (
              <div className="flex items-center text-xs">
                {getGrowthIcon(caData.summary.yearOverYearGrowth.payroll)}
                <span className="ml-1">
                  {formatPercentage(caData.summary.yearOverYearGrowth.payroll)}{" "}
                  vs {parseInt(selectedYear) - 1}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratio Global</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {caData.summary.globalPayrollRatio
                ? formatPercentage(caData.summary.globalPayrollRatio, false)
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Masse sal. / CA</p>
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
      </div>

      {/* Filtres */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-gray-500" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
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

        <Select value={startMonth} onValueChange={setStartMonth}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              return (
                <SelectItem key={month} value={month.toString()}>
                  {new Date(0, i).toLocaleDateString("fr-CH", {
                    month: "long",
                  })}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6months">6 mois</SelectItem>
            <SelectItem value="12months">12 mois</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Table des données avec comparaison année courante vs précédente */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-white border-r min-w-[80px]">
                Jour
              </TableHead>
              {caData.periods.map((period, index) => (
                <TableHead
                  key={index}
                  className="text-center min-w-[200px] border-r"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{period.label}</div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{period.year}</span>
                      <span>{period.year - 1}</span>
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.day}>
                <TableCell className="sticky left-0 bg-white border-r font-medium">
                  {row.day.toString().padStart(2, "0")}
                </TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell key={index} className="text-center border-r p-2">
                    <div className="flex justify-between items-center space-x-2">
                      {/* Année courante */}
                      <div className="flex-1 text-left">
                        {row.values[`period_${index}`]?.current > 0
                          ? formatCurrency(
                              row.values[`period_${index}`].current
                            )
                          : "-"}
                      </div>
                      {/* Année précédente */}
                      <div className="flex-1 text-right text-muted-foreground">
                        {row.values[`period_${index}`]?.previous > 0
                          ? formatCurrency(
                              row.values[`period_${index}`].previous
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
              <TableCell className="sticky left-0 bg-blue-50 border-r">
                Total CA
              </TableCell>
              {caData.periods.map((_, index) => (
                <TableCell key={index} className="text-center border-r p-2">
                  <div className="flex justify-between items-center space-x-2">
                    <div className="flex-1 text-left font-bold text-blue-700">
                      {formatCurrency(
                        (
                          totals as Record<
                            string,
                            { current: number; previous: number }
                          >
                        )[`period_${index}`]?.current || 0
                      )}
                    </div>
                    <div className="flex-1 text-right text-blue-600">
                      {formatCurrency(
                        (
                          totals as Record<
                            string,
                            { current: number; previous: number }
                          >
                        )[`period_${index}`]?.previous || 0
                      )}
                    </div>
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne masse salariale */}
            <TableRow className="bg-green-50 font-medium">
              <TableCell className="sticky left-0 bg-green-50 border-r">
                Masse Sal.
              </TableCell>
              {caData.periods.map((period, index) => (
                <TableCell key={index} className="text-center border-r p-2">
                  <div className="flex justify-between items-center space-x-2">
                    <div className="flex-1 text-left">
                      {period.payrollData ? (
                        <div className="space-y-1">
                          <div className="font-bold text-green-700">
                            {formatCurrency(period.payrollData.totalCost)}
                          </div>
                          {period.payrollData.employeeCount && (
                            <div className="text-xs text-green-600">
                              {period.payrollData.employeeCount} emp.
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
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne ratio */}
            <TableRow className="bg-yellow-50 font-medium">
              <TableCell className="sticky left-0 bg-yellow-50 border-r">
                Ratio %
              </TableCell>
              {caData.periods.map((period, index) => (
                <TableCell key={index} className="text-center border-r p-2">
                  <div className="flex justify-between items-center space-x-2">
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
                          {formatPercentage(
                            period.payrollToRevenueRatio,
                            false
                          )}
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
                          {formatPercentage(
                            (
                              ratios as Record<
                                string,
                                { current: number; previous: number }
                              >
                            )[`period_${index}`]?.previous || 0,
                            false
                          )}
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
            <TableRow className="bg-purple-50 font-medium">
              <TableCell className="sticky left-0 bg-purple-50 border-r">
                Évolution
              </TableCell>
              {caData.periods.map((period, index) => (
                <TableCell key={index} className="text-center border-r p-2">
                  <div className="space-y-1">
                    {/* Évolution CA */}
                    <div className="flex items-center justify-center gap-1">
                      {getGrowthIcon(period.yearOverYear.revenueGrowth)}
                      <span className="text-xs font-medium">
                        CA:{" "}
                        {formatPercentage(period.yearOverYear.revenueGrowth)}
                      </span>
                    </div>
                    {/* Évolution masse salariale */}
                    {period.yearOverYear.payrollGrowth !== null && (
                      <div className="flex items-center justify-center gap-1">
                        {getGrowthIcon(period.yearOverYear.payrollGrowth)}
                        <span className="text-xs font-medium">
                          MS:{" "}
                          {formatPercentage(period.yearOverYear.payrollGrowth)}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne cumul */}
            <TableRow className="bg-gray-100 font-bold">
              <TableCell className="sticky left-0 bg-gray-100 border-r">
                Cumul
              </TableCell>
              {caData.periods.map((period, index) => (
                <TableCell key={index} className="text-center border-r p-2">
                  <div className="flex justify-between items-center space-x-2">
                    <div className="flex-1 text-left">
                      <div className="text-blue-700 font-bold">
                        {formatCurrency(period.cumulativeTotal || 0)}
                      </div>
                      {period.cumulativePayroll && (
                        <div className="text-green-700 text-xs">
                          MS: {formatCurrency(period.cumulativePayroll)}
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
                          formatCurrency(
                            caData.periods
                              .slice(0, index + 1)
                              .reduce(
                                (sum, p) =>
                                  sum + p.yearOverYear.previousYearRevenue,
                                0
                              )
                          )}
                      </div>
                    </div>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Résumé enrichi */}
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
                Meilleur: {formatCurrency(caData.summary.bestPeriod.totalValue)}
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
                  ? formatPercentage(caData.summary.globalPayrollRatio, false)
                  : "-"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évolution annuelle</CardTitle>
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

      {/* Informations supplémentaires */}
      <div className="text-sm text-gray-600">
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
