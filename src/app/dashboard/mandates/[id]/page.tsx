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
import { Download, Loader2, TrendingUp, TrendingDown } from "lucide-react";
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
    <div className="flex gap-6">
      {/* Contenu principal */}
      <div className="flex-1 space-y-6">
        {/* Navigation */}
        <BackButton href="/dashboard/mandates" label="Retour aux mandats" />

        {/* Header simplifié */}
        <div className="border-b pb-4">
          <nav className="flex items-center space-x-4 text-sm text-blue-600 mb-4">
            <Link href="/dashboard" className="hover:underline">
              Campus
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/dashboard/mandates" className="hover:underline">
              Mandants
            </Link>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {caData.mandate.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    caData.mandate.group === "HEBERGEMENT"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {caData.mandate.group === "HEBERGEMENT"
                    ? "Hébergement"
                    : "Restauration"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {caData.summary.totalPeriods} mois •{" "}
                  {formatCurrency(caData.summary.grandTotal)}
                </span>
              </div>
            </div>

            {/* Filtres compacts */}
            <div className="flex items-center space-x-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-20">
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

              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    return (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(0, i).toLocaleDateString("fr-CH", {
                          month: "short",
                        })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">6M</SelectItem>
                  <SelectItem value="12months">12M</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Table des données - Design condensé et responsive */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Données mensuelles {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="sticky left-0 bg-white border-r w-16 text-xs font-medium">
                      Jour
                    </TableHead>
                    {caData.periods.map((period, index) => (
                      <TableHead
                        key={index}
                        className="text-center w-20 px-1 border-r"
                      >
                        <div className="text-xs font-medium">
                          {period.label.split(" ")[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {period.year}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {rows.slice(0, 31).map((row) => (
                    <TableRow key={row.day} className="border-b">
                      <TableCell className="sticky left-0 bg-white border-r font-medium text-center p-1">
                        {row.day.toString().padStart(2, "0")}
                      </TableCell>
                      {caData.periods.map((_, index) => (
                        <TableCell
                          key={index}
                          className="text-center border-r p-1"
                        >
                          <div className="space-y-1">
                            {/* Année courante */}
                            <div className="font-medium text-slate-900">
                              {row.values[`period_${index}`]?.current > 0
                                ? (
                                    row.values[`period_${index}`].current / 1000
                                  ).toFixed(0) + "k"
                                : "-"}
                            </div>
                            {/* Année précédente - plus discret */}
                            <div className="text-muted-foreground text-xs">
                              {row.values[`period_${index}`]?.previous > 0
                                ? (
                                    row.values[`period_${index}`].previous /
                                    1000
                                  ).toFixed(0) + "k"
                                : "-"}
                            </div>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  {/* Ligne des totaux - plus compacte */}
                  <TableRow className="bg-blue-50 font-medium border-b-2">
                    <TableCell className="sticky left-0 bg-blue-50 border-r text-center p-1">
                      <div className="text-xs font-bold text-blue-700">
                        Total
                      </div>
                    </TableCell>
                    {caData.periods.map((_, index) => (
                      <TableCell
                        key={index}
                        className="text-center border-r p-1"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-blue-700 text-xs">
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
                          <div className="text-blue-600 text-xs">
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

                  {/* Ligne masse salariale - compacte */}
                  <TableRow className="bg-green-50 font-medium">
                    <TableCell className="sticky left-0 bg-green-50 border-r text-center p-1">
                      <div className="text-xs font-bold text-green-700">MS</div>
                    </TableCell>
                    {caData.periods.map((period, index) => (
                      <TableCell
                        key={index}
                        className="text-center border-r p-1"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-green-700 text-xs">
                            {period.payrollData
                              ? (period.payrollData.totalCost / 1000).toFixed(
                                  0
                                ) + "k"
                              : "-"}
                          </div>
                          <div className="text-green-600 text-xs">
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

                  {/* Ligne ratio - très compacte */}
                  <TableRow className="bg-yellow-50">
                    <TableCell className="sticky left-0 bg-yellow-50 border-r text-center p-1">
                      <div className="text-xs font-bold text-yellow-700">%</div>
                    </TableCell>
                    {caData.periods.map((period, index) => (
                      <TableCell
                        key={index}
                        className="text-center border-r p-1"
                      >
                        <div className="space-y-1">
                          <div
                            className={`font-bold text-xs ${
                              period.payrollToRevenueRatio
                                ? period.payrollToRevenueRatio < 30
                                  ? "text-green-700"
                                  : period.payrollToRevenueRatio < 50
                                    ? "text-yellow-700"
                                    : "text-red-700"
                                : ""
                            }`}
                          >
                            {period.payrollToRevenueRatio
                              ? period.payrollToRevenueRatio.toFixed(0) + "%"
                              : "-"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(
                              ratios as Record<
                                string,
                                { current: number; previous: number }
                              >
                            )[`period_${index}`]?.previous > 0
                              ? (
                                  ratios as Record<
                                    string,
                                    { current: number; previous: number }
                                  >
                                )[`period_${index}`].previous.toFixed(0) + "%"
                              : "-"}
                          </div>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Informations supplémentaires - plus discrètes */}
        <div className="text-xs text-muted-foreground text-center border-t pt-4">
          Données générées le{" "}
          {new Date(caData.meta.generatedAt).toLocaleString("fr-CH")} |
          Comparaisons avec {parseInt(selectedYear) - 1} | Montants en milliers
          (k)
        </div>
      </div>

      {/* Sidebar avec statistiques discrètes */}
      <div className="w-80 space-y-4">
        {/* Indicateurs principaux - compacts */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Résumé {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">CA Total</div>
                <div className="font-semibold">
                  {formatCurrency(caData.summary.grandTotal)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">MS Total</div>
                <div className="font-semibold">
                  {formatCurrency(caData.summary.totalPayrollCost)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Ratio Global
                </div>
                <div className="font-semibold">
                  {caData.summary.globalPayrollRatio
                    ? formatPercentage(caData.summary.globalPayrollRatio, false)
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Moyenne/Mois
                </div>
                <div className="font-semibold">
                  {formatCurrency(caData.summary.averagePerPeriod)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Évolutions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Évolutions annuelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Chiffre d&apos;affaires
              </span>
              <div className="flex items-center gap-1">
                {getGrowthIcon(caData.summary.yearOverYearGrowth.revenue)}
                {formatPercentage(caData.summary.yearOverYearGrowth.revenue)}
              </div>
            </div>
            {caData.summary.yearOverYearGrowth.payroll !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Masse salariale</span>
                <div className="flex items-center gap-1">
                  {getGrowthIcon(caData.summary.yearOverYearGrowth.payroll)}
                  {formatPercentage(caData.summary.yearOverYearGrowth.payroll)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Meilleur mois</div>
              <div className="text-sm font-medium text-green-600">
                {caData.summary.bestPeriod.label}
              </div>
              <div className="text-sm">
                {formatCurrency(caData.summary.bestPeriod.totalValue)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Plus faible mois
              </div>
              <div className="text-sm font-medium text-red-600">
                {caData.summary.worstPeriod.label}
              </div>
              <div className="text-sm">
                {formatCurrency(caData.summary.worstPeriod.totalValue)}
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Écart</div>
              <div className="text-sm font-medium">
                {formatCurrency(
                  caData.summary.bestPeriod.totalValue -
                    caData.summary.worstPeriod.totalValue
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
