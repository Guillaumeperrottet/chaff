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
import { BackButton } from "@/app/components/ui/BackButton";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Types pour les données CA
interface DayCAData {
  date: string;
  value: number;
  formattedDate: string;
}

interface PeriodData {
  year: number;
  month: number;
  label: string;
  totalValue: number;
  dailyValues: DayCAData[];
  averageDaily: number;
  daysWithData: number;
  cumulativeTotal?: number;
}

interface Comparison {
  period: PeriodData;
  comparison: {
    previous: number;
    percentage: number | null;
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
  const [startMonth, setStartMonth] = useState("7"); // Juillet par défaut
  const [period, setPeriod] = useState("6months");

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

  const formatPercentage = (value: number | null) => {
    if (value === null) return "-";
    const formatted = Math.abs(value).toFixed(2);
    const color = value >= 0 ? "text-green-600" : "text-red-600";
    return (
      <span className={color}>
        {value >= 0 ? "+" : "-"}
        {formatted}%
      </span>
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

  // Créer la structure de données pour le tableau
  const tableData = () => {
    if (!caData) return { rows: [], totals: {}, comparisons: {} };

    // Obtenir tous les jours uniques
    const allDays = new Set<number>();
    caData.periods.forEach((period) => {
      period.dailyValues.forEach((dv) => {
        const day = new Date(dv.date).getDate();
        allDays.add(day);
      });
    });

    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    // Construire les lignes du tableau
    const rows = sortedDays.map((day) => {
      const values: Record<string, number> = {};

      caData.periods.forEach((period, index) => {
        const dayValue = period.dailyValues.find(
          (dv) => new Date(dv.date).getDate() === day
        );
        values[`period_${index}`] = dayValue?.value || 0;
      });

      return { day, values };
    });

    // Calculer les totaux
    const totals: Record<string, number> = {};
    const averages: Record<string, number> = {};

    caData.periods.forEach((period, index) => {
      totals[`period_${index}`] = period.totalValue;
      averages[`period_${index}`] = period.averageDaily;
    });

    return { rows, totals, averages };
  };

  const { rows, totals, averages } = tableData();

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
          <Link href="/dashboard/dayvalues" className="hover:underline">
            Valeurs journalières
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/dashboard/mandates" className="hover:underline">
            Mandants
          </Link>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">
          {caData.mandate.name}
        </h1>
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
            <SelectItem value="1">Janvier</SelectItem>
            <SelectItem value="7">Juillet</SelectItem>
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

      {/* Table des données */}
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
                  className="text-center min-w-[120px] border-r"
                >
                  <div className="font-medium">{period.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {period.year}
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
                  <TableCell key={index} className="text-center border-r">
                    {row.values[`period_${index}`] > 0
                      ? formatCurrency(row.values[`period_${index}`])
                      : "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Ligne des totaux */}
            <TableRow className="bg-gray-100 font-medium">
              <TableCell className="sticky left-0 bg-gray-100 border-r">
                Total
              </TableCell>
              {caData.periods.map((_, index) => (
                <TableCell key={index} className="text-center border-r">
                  {formatCurrency(
                    totals[`period_${index}` as keyof typeof totals] || 0
                  )}
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne moyenne */}
            <TableRow className="bg-gray-50">
              <TableCell className="sticky left-0 bg-gray-50 border-r">
                Moyenne
              </TableCell>
              {caData.periods.map((_, index) => (
                <TableCell key={index} className="text-center border-r">
                  {formatCurrency(
                    averages?.[`period_${index}` as keyof typeof averages] || 0
                  )}
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne comparaison */}
            <TableRow className="bg-blue-50">
              <TableCell className="sticky left-0 bg-blue-50 border-r">
                Évolution
              </TableCell>
              {caData.comparisons.map((comp, index) => (
                <TableCell key={index} className="text-center border-r">
                  {formatPercentage(comp.comparison.percentage)}
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne cumul */}
            <TableRow className="bg-yellow-50 font-medium">
              <TableCell className="sticky left-0 bg-yellow-50 border-r">
                Cumul
              </TableCell>
              {caData.periods.map((period, index) => (
                <TableCell key={index} className="text-center border-r">
                  {formatCurrency(period.cumulativeTotal || 0)}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Résumé */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total période</div>
          <div className="text-2xl font-bold">
            {formatCurrency(caData.summary.grandTotal)}
          </div>
          <div className="text-xs text-muted-foreground">
            {caData.summary.totalPeriods} mois
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Meilleure période</div>
          <div className="text-2xl font-bold">
            {formatCurrency(caData.summary.bestPeriod.totalValue)}
          </div>
          <div className="text-xs text-muted-foreground">
            {caData.summary.bestPeriod.label}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Moyenne mensuelle</div>
          <div className="text-2xl font-bold">
            {formatCurrency(caData.summary.averagePerPeriod)}
          </div>
          <div className="text-xs text-muted-foreground">
            Sur {caData.summary.totalPeriods} mois
          </div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="text-sm text-gray-600">
        <p>
          Données générées le{" "}
          {new Date(caData.meta.generatedAt).toLocaleString("fr-CH")}
        </p>
      </div>
    </div>
  );
}
