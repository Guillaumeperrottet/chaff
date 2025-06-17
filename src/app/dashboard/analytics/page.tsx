// src/app/dashboard/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  Building2,
  MapPin,
  Loader2,
  Download,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Target,
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
  const [period, setPeriod] = useState("30");
  const [selectedView, setSelectedView] = useState("overview");
  const [showPayrollData, setShowPayrollData] = useState(true);
  const [selectedMandateType, setSelectedMandateType] = useState("all");
  const [sortBy, setSortBy] = useState("revenue");

  // Charger les données analytics
  const fetchAnalytics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/dashboard/analytics?period=${period}`);

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
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportAnalytics = async () => {
    try {
      toast.loading("Génération du rapport...");

      const response = await fetch(`/api/export/analytics?period=${period}`);
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
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">3 derniers mois</SelectItem>
              <SelectItem value="365">Dernière année</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedMandateType}
            onValueChange={setSelectedMandateType}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="hebergement">Hébergement</SelectItem>
              <SelectItem value="restauration">Restauration</SelectItem>
            </SelectContent>
          </Select>

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              Saisies Totales
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalValues}
            </div>
            <div
              className={`flex items-center text-xs ${getGrowthColor(data.overview.growth.values)}`}
            >
              {getGrowthIcon(data.overview.growth.values)}
              <span className="ml-1">
                {formatPercentage(data.overview.growth.values)} vs période
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
              Par saisie sur la période
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
          { id: "profitability", label: "Rentabilité", icon: Target },
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
          {/* Evolution temporelle */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution du chiffre d&apos;affaires</CardTitle>
              <CardDescription>
                Revenue journalier sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.timeSeriesData.slice(-7).map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString("fr-CH", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">
                        {formatCurrency(day.totalRevenue)}
                      </span>
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (day.totalRevenue /
                                Math.max(
                                  ...data.timeSeriesData.map(
                                    (d) => d.totalRevenue
                                  )
                                )) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top mandats */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 mandats</CardTitle>
              <CardDescription>
                Mandats les plus performants sur la période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.mandatePerformance
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .slice(0, 5)
                  .map((mandate, index) => (
                    <div
                      key={mandate.id}
                      className="flex items-center space-x-3"
                    >
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
                  ))}
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
                  .filter(
                    (mandate) =>
                      selectedMandateType === "all" ||
                      (selectedMandateType === "hebergement" &&
                        mandate.group === "Hébergement") ||
                      (selectedMandateType === "restauration" &&
                        mandate.group === "Restauration")
                  )
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

      {selectedView === "profitability" && showPayrollData && (
        <div className="space-y-6">
          {/* Vue d'ensemble de la rentabilité */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Target className="mr-2 h-5 w-5 text-green-600" />
                  Top Rentables
                </CardTitle>
                <CardDescription>
                  Mandats avec les meilleurs ratios MS/CA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.profitabilityAnalysis?.topProfitable
                    ?.slice(0, 5)
                    .map((mandate) => (
                      <div
                        key={mandate.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {mandate.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(mandate.revenue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${getProfitabilityColor(mandate.payrollRatio)}`}
                          >
                            {formatRatio(mandate.payrollRatio)}
                          </div>
                        </div>
                      </div>
                    )) ?? (
                    <p className="text-sm text-muted-foreground">
                      Aucune donnée disponible
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />À
                  Risque
                </CardTitle>
                <CardDescription>
                  Mandats avec ratios MS/CA élevés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.profitabilityAnalysis?.atRisk
                    ?.slice(0, 5)
                    .map((mandate) => (
                      <div
                        key={mandate.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {mandate.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(mandate.revenue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${getProfitabilityColor(mandate.payrollRatio)}`}
                          >
                            {formatRatio(mandate.payrollRatio)}
                          </div>
                        </div>
                      </div>
                    )) ?? (
                    <p className="text-sm text-muted-foreground">
                      Aucune donnée disponible
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                  En Amélioration
                </CardTitle>
                <CardDescription>
                  Mandats avec tendance positive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.profitabilityAnalysis?.improving
                    ?.slice(0, 5)
                    .map((mandate) => (
                      <div
                        key={mandate.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {mandate.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tendance: {formatPercentage(mandate.trend)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${getProfitabilityColor(mandate.payrollRatio)}`}
                          >
                            {formatRatio(mandate.payrollRatio)}
                          </div>
                        </div>
                      </div>
                    )) ?? (
                    <p className="text-sm text-muted-foreground">
                      Aucune donnée disponible
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Évolution des ratios dans le temps */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des ratios masse salariale</CardTitle>
              <CardDescription>
                Comparaison revenue vs masse salariale par mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.periodicAnalysis.monthly.map((month) => (
                  <div
                    key={month.month}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{month.month}</span>
                      <div className="text-sm text-muted-foreground">
                        Revenue: {formatCurrency(month.totalRevenue)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold text-lg ${getProfitabilityColor(month.payrollRatio)}`}
                      >
                        {formatRatio(month.payrollRatio)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        MS:{" "}
                        {month.payrollCost
                          ? formatCurrency(month.payrollCost)
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === "profitability" && !showPayrollData && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                Données de masse salariale requises
              </h3>
              <p className="mt-2 text-muted-foreground">
                Activez l&apos;affichage des données de masse salariale pour
                voir l&apos;analyse de rentabilité.
              </p>
              <Button className="mt-4" onClick={() => setShowPayrollData(true)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Activer les données de masse salariale
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedView === "profitability" && showPayrollData && (
        <div className="space-y-6">
          {/* Vue d'ensemble de la rentabilité */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Target className="mr-2 h-5 w-5 text-green-600" />
                  Top Rentables
                </CardTitle>
                <CardDescription>
                  Mandats avec les meilleurs ratios MS/CA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.profitabilityAnalysis?.topProfitable
                    ?.slice(0, 5)
                    .map((mandate) => (
                      <div
                        key={mandate.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {mandate.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(mandate.revenue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${getProfitabilityColor(mandate.payrollRatio)}`}
                          >
                            {formatRatio(mandate.payrollRatio)}
                          </div>
                        </div>
                      </div>
                    )) ?? (
                    <p className="text-sm text-muted-foreground">
                      Aucune donnée disponible
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />À
                  Risque
                </CardTitle>
                <CardDescription>
                  Mandats avec ratios MS/CA élevés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.profitabilityAnalysis?.atRisk
                    ?.slice(0, 5)
                    .map((mandate) => (
                      <div
                        key={mandate.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {mandate.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(mandate.revenue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${getProfitabilityColor(mandate.payrollRatio)}`}
                          >
                            {formatRatio(mandate.payrollRatio)}
                          </div>
                        </div>
                      </div>
                    )) ?? (
                    <p className="text-sm text-muted-foreground">
                      Aucune donnée disponible
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                  En Amélioration
                </CardTitle>
                <CardDescription>
                  Mandats avec tendance positive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.profitabilityAnalysis?.improving
                    ?.slice(0, 5)
                    .map((mandate) => (
                      <div
                        key={mandate.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {mandate.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tendance: {formatPercentage(mandate.trend)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${getProfitabilityColor(mandate.payrollRatio)}`}
                          >
                            {formatRatio(mandate.payrollRatio)}
                          </div>
                        </div>
                      </div>
                    )) ?? (
                    <p className="text-sm text-muted-foreground">
                      Aucune donnée disponible
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Évolution des ratios dans le temps */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des ratios masse salariale</CardTitle>
              <CardDescription>
                Comparaison revenue vs masse salariale par mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.periodicAnalysis.monthly.map((month) => (
                  <div
                    key={month.month}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{month.month}</span>
                      <div className="text-sm text-muted-foreground">
                        Revenue: {formatCurrency(month.totalRevenue)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold text-lg ${getProfitabilityColor(month.payrollRatio)}`}
                      >
                        {formatRatio(month.payrollRatio)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        MS:{" "}
                        {month.payrollCost
                          ? formatCurrency(month.payrollCost)
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === "profitability" && !showPayrollData && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                Données de masse salariale requises
              </h3>{" "}
              <p className="mt-2 text-muted-foreground">
                Activez l&apos;affichage des données de masse salariale pour
                voir l&apos;analyse de rentabilité.
              </p>
              <Button className="mt-4" onClick={() => setShowPayrollData(true)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Activer les données de masse salariale
              </Button>
            </div>
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
