// src/app/dashboard/analytics/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  Loader2,
  Download,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  PieChart,
  Activity,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Separator } from "@/app/components/ui/separator";
import Switch from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalMandates: number;
    totalValues: number;
    averageDaily: number;
    totalPayroll?: number;
    averagePayrollRatio?: number;
    growth: {
      revenue: number;
      mandates: number;
      values: number;
      payroll?: number;
    };
  };
  timeSeriesData: Array<{
    date: string;
    totalRevenue: number;
    hebergementRevenue: number;
    restaurationRevenue: number;
    valueCount: number;
    payrollCost?: number;
    payrollRatio?: number;
  }>;
  mandatePerformance: Array<{
    id: string;
    name: string;
    group: string;
    totalRevenue: number;
    valueCount: number;
    averageDaily: number;
    lastEntry: string | null;
    growthPercentage: number;
    payrollCost?: number;
    payrollRatio?: number;
    profitability?: "high" | "medium" | "low" | "critical";
  }>;
  topMandatesData: Array<{
    id: string;
    name: string;
    group: string;
    totalRevenue: number;
    valueCount: number;
    averageDaily: number;
    lastEntry: string | null;
    growthPercentage: number;
  }>;
  groupAnalysis: {
    hebergement: {
      totalRevenue: number;
      mandateCount: number;
      averagePerMandate: number;
      topMandate: { name: string; revenue: number } | null;
      payrollCost?: number;
      averagePayrollRatio?: number;
    };
    restauration: {
      totalRevenue: number;
      mandateCount: number;
      averagePerMandate: number;
      topMandate: { name: string; revenue: number } | null;
      payrollCost?: number;
      averagePayrollRatio?: number;
    };
  };
  periodicAnalysis: {
    daily: Array<{
      dayName: string;
      averageRevenue: number;
      totalValues: number;
      averagePayrollRatio?: number;
    }>;
    monthly: Array<{
      month: string;
      totalRevenue: number;
      totalValues: number;
      averageDaily: number;
      payrollCost?: number;
      payrollRatio?: number;
    }>;
  };
  profitabilityAnalysis?: {
    topProfitable: Array<{
      id: string;
      name: string;
      payrollRatio: number;
      revenue: number;
    }>;
    atRisk: Array<{
      id: string;
      name: string;
      payrollRatio: number;
      revenue: number;
    }>;
    improving: Array<{
      id: string;
      name: string;
      payrollRatio: number;
      trend: number;
    }>;
  };
}

interface AnalyticsResponse {
  data: AnalyticsData;
  meta: {
    period: {
      start: string;
      end: string;
      days: number;
    };
    generatedAt: string;
  };
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState("overview");
  const [showPayrollData, setShowPayrollData] = useState(true);
  const [sortBy, setSortBy] = useState("revenue");
  const [chartTimeUnit, setChartTimeUnit] = useState("day");

  // États pour les périodes individuelles de chaque section
  const [overviewPeriod, setOverviewPeriod] = useState("30");
  const [topMandatesPeriod, setTopMandatesPeriod] = useState("30");
  const [mandatesPeriod, setMandatesPeriod] = useState("30");

  // Charger les données analytics avec les périodes spécifiques
  const fetchAnalytics = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // Construire les paramètres avec les périodes spécifiques
        const params = new URLSearchParams({
          period: "3650", // Période principale large pour les données temporelles
          overviewPeriod: overviewPeriod,
          topMandatesPeriod: topMandatesPeriod,
          mandatesPeriod: mandatesPeriod,
        });

        const response = await fetch(
          `/api/dashboard/analytics?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des analytics");
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors du chargement des analytics");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [overviewPeriod, topMandatesPeriod, mandatesPeriod]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]); // Recharger quand fetchAnalytics change

  const handleExportAnalytics = async () => {
    try {
      toast.loading("Génération du rapport...");

      const response = await fetch(`/api/export/analytics?period=730`); // 2 ans pour avoir toutes les données
      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Rapport téléchargé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const formatted = Math.abs(value).toFixed(1);
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  const getProfitabilityColor = (ratio?: number) => {
    if (!ratio) return "text-gray-500";
    if (ratio <= 30) return "text-green-600";
    if (ratio <= 50) return "text-yellow-600";
    if (ratio <= 70) return "text-orange-600";
    return "text-red-600";
  };

  const getProfitabilityLabel = (ratio?: number) => {
    if (!ratio) return "N/A";
    if (ratio <= 30) return "Excellent";
    if (ratio <= 50) return "Bon";
    if (ratio <= 70) return "Attention";
    return "Critique";
  };
  const formatRatio = (ratio?: number) => {
    if (!ratio) return "N/A";
    return `${ratio.toFixed(1)}%`;
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

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Erreur lors du chargement des données
          </p>
          <Button onClick={() => fetchAnalytics()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const { data, meta } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Analyses détaillées de vos performances
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPayrollData(!showPayrollData)}
            className={showPayrollData ? "bg-primary/10" : ""}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Masse salariale
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAnalytics}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[400px]">
              <DialogHeader>
                <DialogTitle>Paramètres avancés</DialogTitle>
                <DialogDescription>
                  Personnalisez l&apos;affichage des analytics.
                </DialogDescription>
              </DialogHeader>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showPayrollData">
                    Afficher masse salariale
                  </Label>
                  <Switch
                    checked={showPayrollData}
                    onCheckedChange={setShowPayrollData}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sortByRevenue">
                    Trier par revenue par défaut
                  </Label>
                  <Switch
                    checked={sortBy === "revenue"}
                    onCheckedChange={(checked: boolean) =>
                      setSortBy(checked ? "revenue" : "growth")
                    }
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Vue d&apos;ensemble</h2>
        <Select value={overviewPeriod} onValueChange={setOverviewPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 jours</SelectItem>
            <SelectItem value="30">30 jours</SelectItem>
            <SelectItem value="90">3 mois</SelectItem>
            <SelectItem value="365">1 an</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.overview.totalRevenue)}
            </div>
            <div
              className={`flex items-center text-xs ${getGrowthColor(data.overview.growth.revenue)}`}
            >
              {getGrowthIcon(data.overview.growth.revenue)}
              <span className="ml-1">
                {formatPercentage(data.overview.growth.revenue)} vs période
                précédente
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mandats</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalMandates}
            </div>
            <div
              className={`flex items-center text-xs ${getGrowthColor(data.overview.growth.mandates)}`}
            >
              {getGrowthIcon(data.overview.growth.mandates)}
              <span className="ml-1">
                {formatPercentage(data.overview.growth.mandates)} vs période
                précédente
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Moyenne Journalière
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.overview.averageDaily)}
            </div>
            <p className="text-xs text-muted-foreground">
              Par jour sur la période
            </p>
          </CardContent>
        </Card>

        {showPayrollData && data.overview.totalPayroll && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ratio Masse Salariale
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span
                  className={getProfitabilityColor(
                    data.overview.averagePayrollRatio
                  )}
                >
                  {formatRatio(data.overview.averagePayrollRatio)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {getProfitabilityLabel(data.overview.averagePayrollRatio)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation des vues */}
      <div className="flex items-center space-x-1 border-b">
        {[
          { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
          { id: "mandates", label: "Performance mandats", icon: Building2 },
          { id: "groups", label: "Analyse par groupe", icon: PieChart },
          { id: "periods", label: "Analyse temporelle", icon: Activity },
        ].map((view) => {
          const IconComponent = view.icon;
          return (
            <Button
              key={view.id}
              variant={selectedView === view.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedView(view.id)}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {view.label}
            </Button>
          );
        })}
      </div>

      {/* Contenu des vues */}
      {selectedView === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top mandats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top 5 mandats</CardTitle>
                  <CardDescription>
                    Mandats les plus performants sur{" "}
                    {topMandatesPeriod === "7"
                      ? "7 jours"
                      : topMandatesPeriod === "30"
                        ? "30 jours"
                        : topMandatesPeriod === "90"
                          ? "3 mois"
                          : "1 an"}
                  </CardDescription>
                </div>
                <Select
                  value={topMandatesPeriod}
                  onValueChange={setTopMandatesPeriod}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">3 mois</SelectItem>
                    <SelectItem value="365">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topMandatesData?.map((mandate, index) => (
                  <div key={mandate.id} className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{mandate.name}</span>
                        <span className="font-bold">
                          {formatCurrency(mandate.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{mandate.group}</span>
                        <span>{mandate.valueCount} saisies</span>
                      </div>
                    </div>
                  </div>
                )) ?? (
                  <p className="text-sm text-muted-foreground">
                    Aucune donnée disponible pour cette période
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Evolution temporelle */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Évolution du chiffre d&apos;affaires</CardTitle>
                  <CardDescription>
                    {chartTimeUnit === "day" && "Revenue journalier"}
                    {chartTimeUnit === "month" &&
                      "Revenue mensuel depuis le début de l'année"}
                    {chartTimeUnit === "year" &&
                      "Revenue annuel - toutes les années disponibles"}
                    {chartTimeUnit !== "year" && " sur la période sélectionnée"}
                  </CardDescription>
                </div>
                <Select value={chartTimeUnit} onValueChange={setChartTimeUnit}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Unité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Par jour</SelectItem>
                    <SelectItem value="month">Par mois</SelectItem>
                    <SelectItem value="year">Par année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      // Logique d'agrégation basée sur l'unité de temps sélectionnée
                      const timeData = new Map();

                      // Pour les années, utiliser toutes les données disponibles, pas seulement la période filtrée
                      const dataToProcess =
                        chartTimeUnit === "year"
                          ? data.timeSeriesData // Toutes les données pour les années
                          : data.timeSeriesData; // Pour les autres unités, on garde le filtrage existant

                      dataToProcess.forEach((day) => {
                        const date = new Date(day.date);
                        let timeKey, timeLabel;

                        // Filtrer par année en cours pour les mois
                        if (chartTimeUnit === "month") {
                          const currentYear = new Date().getFullYear();
                          if (date.getFullYear() !== currentYear) {
                            return; // Ignorer les données qui ne sont pas de l'année en cours
                          }
                        }

                        switch (chartTimeUnit) {
                          case "day":
                            timeKey = day.date;
                            timeLabel = date.toLocaleDateString("fr-CH", {
                              day: "2-digit",
                              month: "2-digit",
                            });
                            break;

                          case "month":
                            timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                            timeLabel = date.toLocaleDateString("fr-CH", {
                              month: "short",
                              year: "2-digit",
                            });
                            break;

                          case "year":
                            timeKey = date.getFullYear().toString();
                            timeLabel = date.getFullYear().toString();
                            break;
                        }

                        if (!timeData.has(timeKey)) {
                          timeData.set(timeKey, {
                            date: timeLabel,
                            timeKey: timeKey, // Ajouter la clé pour le tri
                            totalRevenue: 0,
                            hebergementRevenue: 0,
                            restaurationRevenue: 0,
                            count: 0,
                          });
                        }

                        const existing = timeData.get(timeKey);
                        existing.totalRevenue += day.totalRevenue;
                        existing.hebergementRevenue += day.hebergementRevenue;
                        existing.restaurationRevenue += day.restaurationRevenue;
                        existing.count++;
                      });

                      // Trier par date et limiter selon la période
                      let sortedData = Array.from(timeData.values()).sort(
                        (a, b) => {
                          // Tri basé sur la clé timeKey pour un ordre chronologique correct
                          if (chartTimeUnit === "day") {
                            return a.timeKey.localeCompare(b.timeKey);
                          } else if (
                            chartTimeUnit === "month" ||
                            chartTimeUnit === "year"
                          ) {
                            return a.timeKey.localeCompare(b.timeKey);
                          }
                          return a.date.localeCompare(b.date);
                        }
                      );

                      // Limiter le nombre de points selon l'unité de temps
                      if (chartTimeUnit === "day") {
                        sortedData = sortedData.slice(-60); // Max 60 jours
                      }
                      // Pour les mois et années, pas de limitation supplémentaire car déjà filtrés

                      return sortedData;
                    })()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      interval={
                        chartTimeUnit === "day" ? "preserveStartEnd" : 0
                      }
                      angle={chartTimeUnit === "day" ? -45 : 0}
                      textAnchor={chartTimeUnit === "day" ? "end" : "middle"}
                      height={chartTimeUnit === "day" ? 60 : 30}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <p className="font-medium">{label}</p>
                              <div className="space-y-1">
                                {payload.map((entry, index) => (
                                  <p
                                    key={index}
                                    className="text-sm"
                                    style={{ color: entry.color }}
                                  >
                                    {entry.name === "totalRevenue" && "Total: "}
                                    {entry.name === "hebergementRevenue" &&
                                      "Hébergement: "}
                                    {entry.name === "restaurationRevenue" &&
                                      "Restauration: "}
                                    {formatCurrency(entry.value as number)}
                                  </p>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{
                        fill: "#2563eb",
                        strokeWidth: 2,
                        r:
                          chartTimeUnit === "day"
                            ? 3
                            : chartTimeUnit === "month"
                              ? 4
                              : 5,
                      }}
                      activeDot={{ r: 6 }}
                      name="totalRevenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="hebergementRevenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{
                        fill: "#10b981",
                        strokeWidth: 2,
                        r:
                          chartTimeUnit === "day"
                            ? 2
                            : chartTimeUnit === "month"
                              ? 3
                              : 4,
                      }}
                      name="hebergementRevenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="restaurationRevenue"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{
                        fill: "#f59e0b",
                        strokeWidth: 2,
                        r:
                          chartTimeUnit === "day"
                            ? 2
                            : chartTimeUnit === "month"
                              ? 3
                              : 4,
                      }}
                      name="restaurationRevenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === "mandates" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Performance détaillée des mandats</CardTitle>
                <CardDescription>
                  Analyse complète de chaque mandat sur la période
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={mandatesPeriod}
                  onValueChange={setMandatesPeriod}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">3 mois</SelectItem>
                    <SelectItem value="365">1 an</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="growth">Croissance</SelectItem>
                    <SelectItem value="values">Nb Saisies</SelectItem>
                    {showPayrollData && (
                      <SelectItem value="payroll">Ratio MS</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mandat</TableHead>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Revenue Total</TableHead>
                  <TableHead>Nb Saisies</TableHead>
                  <TableHead>Moyenne/Saisie</TableHead>
                  <TableHead>Croissance</TableHead>
                  {showPayrollData && <TableHead>Ratio MS</TableHead>}
                  <TableHead>Dernière Saisie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.mandatePerformance
                  .sort((a, b) => {
                    switch (sortBy) {
                      case "growth":
                        return b.growthPercentage - a.growthPercentage;
                      case "values":
                        return b.valueCount - a.valueCount;
                      case "payroll":
                        return (
                          (a.payrollRatio || 100) - (b.payrollRatio || 100)
                        );
                      default:
                        return b.totalRevenue - a.totalRevenue;
                    }
                  })
                  .map((mandate) => (
                    <TableRow key={mandate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{mandate.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {mandate.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mandate.group === "Hébergement"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {mandate.group === "Hébergement" ? (
                            <Building2 className="mr-1 h-3 w-3" />
                          ) : (
                            <MapPin className="mr-1 h-3 w-3" />
                          )}
                          {mandate.group}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {formatCurrency(mandate.totalRevenue)}
                      </TableCell>
                      <TableCell>{mandate.valueCount}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(mandate.averageDaily)}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`flex items-center ${getGrowthColor(mandate.growthPercentage)}`}
                        >
                          {getGrowthIcon(mandate.growthPercentage)}
                          <span className="ml-1">
                            {formatPercentage(mandate.growthPercentage)}
                          </span>
                        </div>
                      </TableCell>
                      {showPayrollData && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-mono ${getProfitabilityColor(mandate.payrollRatio)}`}
                            >
                              {formatRatio(mandate.payrollRatio)}
                            </span>
                            {mandate.payrollRatio &&
                              mandate.payrollRatio > 60 && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground">
                        {mandate.lastEntry
                          ? new Date(mandate.lastEntry).toLocaleDateString(
                              "fr-CH"
                            )
                          : "Jamais"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedView === "groups" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-blue-600" />
                Hébergement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue total</span>
                <span className="font-bold">
                  {formatCurrency(data.groupAnalysis.hebergement.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre de mandats</span>
                <span>{data.groupAnalysis.hebergement.mandateCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Moyenne par mandat
                </span>
                <span>
                  {formatCurrency(
                    data.groupAnalysis.hebergement.averagePerMandate
                  )}
                </span>
              </div>
              {showPayrollData &&
                data.groupAnalysis.hebergement.payrollCost && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Masse salariale
                      </span>
                      <span className="font-mono">
                        {formatCurrency(
                          data.groupAnalysis.hebergement.payrollCost
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Ratio MS/CA moyen
                      </span>
                      <span
                        className={`font-bold ${getProfitabilityColor(data.groupAnalysis.hebergement.averagePayrollRatio)}`}
                      >
                        {formatRatio(
                          data.groupAnalysis.hebergement.averagePayrollRatio
                        )}
                      </span>
                    </div>
                  </>
                )}
              {data.groupAnalysis.hebergement.topMandate && (
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Top performer
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {data.groupAnalysis.hebergement.topMandate.name}
                    </span>
                    <span className="font-bold">
                      {formatCurrency(
                        data.groupAnalysis.hebergement.topMandate.revenue
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-orange-600" />
                Restauration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue total</span>
                <span className="font-bold">
                  {formatCurrency(data.groupAnalysis.restauration.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre de mandats</span>
                <span>{data.groupAnalysis.restauration.mandateCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Moyenne par mandat
                </span>
                <span>
                  {formatCurrency(
                    data.groupAnalysis.restauration.averagePerMandate
                  )}
                </span>
              </div>
              {showPayrollData &&
                data.groupAnalysis.restauration.payrollCost && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Masse salariale
                      </span>
                      <span className="font-mono">
                        {formatCurrency(
                          data.groupAnalysis.restauration.payrollCost
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Ratio MS/CA moyen
                      </span>
                      <span
                        className={`font-bold ${getProfitabilityColor(data.groupAnalysis.restauration.averagePayrollRatio)}`}
                      >
                        {formatRatio(
                          data.groupAnalysis.restauration.averagePayrollRatio
                        )}
                      </span>
                    </div>
                  </>
                )}
              {data.groupAnalysis.restauration.topMandate && (
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Top performer
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {data.groupAnalysis.restauration.topMandate.name}
                    </span>
                    <span className="font-bold">
                      {formatCurrency(
                        data.groupAnalysis.restauration.topMandate.revenue
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === "periods" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance par jour de la semaine</CardTitle>
              <CardDescription>
                Analyse des tendances hebdomadaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.periodicAnalysis.daily.map((day) => (
                  <div
                    key={day.dayName}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <span className="font-medium">{day.dayName}</span>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(day.averageRevenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.totalValues} saisies
                        </div>
                      </div>
                      {showPayrollData && day.averagePayrollRatio && (
                        <div className="text-right">
                          <div
                            className={`text-sm font-bold ${getProfitabilityColor(day.averagePayrollRatio)}`}
                          >
                            {formatRatio(day.averagePayrollRatio)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            MS
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance mensuelle</CardTitle>
              <CardDescription>
                Évolution mensuelle avec rentabilité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.periodicAnalysis.monthly.map((month) => (
                  <div
                    key={month.month}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <span className="font-medium">{month.month}</span>
                      <div className="text-xs text-muted-foreground">
                        {month.totalValues} saisies • Moy:{" "}
                        {formatCurrency(month.averageDaily)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {formatCurrency(month.totalRevenue)}
                      </div>
                      {showPayrollData && month.payrollRatio && (
                        <div
                          className={`text-xs font-medium ${getProfitabilityColor(month.payrollRatio)}`}
                        >
                          MS: {formatRatio(month.payrollRatio)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Méta informations */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Période analysée:{" "}
              {new Date(meta.period.start).toLocaleDateString("fr-CH")} -{" "}
              {new Date(meta.period.end).toLocaleDateString("fr-CH")} (
              {meta.period.days} jours)
            </div>
            <div>
              Généré le: {new Date(meta.generatedAt).toLocaleString("fr-CH")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
