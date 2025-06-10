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
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalMandates: number;
    totalValues: number;
    averageDaily: number;
    growth: {
      revenue: number;
      mandates: number;
      values: number;
    };
  };
  timeSeriesData: Array<{
    date: string;
    totalRevenue: number;
    hebergementRevenue: number;
    restaurationRevenue: number;
    valueCount: number;
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
  }>;
  groupAnalysis: {
    hebergement: {
      totalRevenue: number;
      mandateCount: number;
      averagePerMandate: number;
      topMandate: { name: string; revenue: number } | null;
    };
    restauration: {
      totalRevenue: number;
      mandateCount: number;
      averagePerMandate: number;
      topMandate: { name: string; revenue: number } | null;
    };
  };
  periodicAnalysis: {
    daily: Array<{
      dayName: string;
      averageRevenue: number;
      totalValues: number;
    }>;
    monthly: Array<{
      month: string;
      totalRevenue: number;
      totalValues: number;
      averageDaily: number;
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
  }, [period]);

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
        </div>
      </div>

      {/* Vue d'ensemble */}
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
      </div>

      {/* Navigation des vues */}
      <div className="flex items-center space-x-1 border-b">
        {[
          { id: "overview", label: "Vue d'ensemble" },
          { id: "mandates", label: "Performance mandats" },
          { id: "groups", label: "Analyse par groupe" },
          { id: "periods", label: "Analyse temporelle" },
        ].map((view) => (
          <Button
            key={view.id}
            variant={selectedView === view.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView(view.id)}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            {view.label}
          </Button>
        ))}
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
            <CardTitle>Performance détaillée des mandats</CardTitle>
            <CardDescription>
              Analyse complète de chaque mandat sur la période
            </CardDescription>
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
                  <TableHead>Dernière Saisie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.mandatePerformance
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
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
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.periodicAnalysis.daily.map((day) => (
                  <div
                    key={day.dayName}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{day.dayName}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm">
                        {formatCurrency(day.averageRevenue)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({day.totalValues} saisies)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.periodicAnalysis.monthly.map((month) => (
                  <div
                    key={month.month}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{month.month}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm">
                        {formatCurrency(month.totalRevenue)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({month.totalValues} saisies)
                      </span>
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
