"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calculator,
  Building2,
  MapPin,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PayrollRatioData {
  mandateId: string;
  mandateName: string;
  mandateGroup: string;
  year: number;
  month: number;
  monthName: string;

  totalRevenue: number;
  revenueEntries: number;
  averageDailyRevenue: number;

  payrollAmount: number | null;
  payrollSource: "manual" | "calculated" | null;
  employeeCount: number | null;

  payrollToRevenueRatio: number | null;
  ratioStatus: "excellent" | "good" | "warning" | "critical" | "no-data";

  previousMonthRatio: number | null;
  ratioTrend: "up" | "down" | "stable" | "no-data";
}

interface DashboardPayrollResponse {
  currentPeriod: {
    year: number;
    month: number;
    monthName: string;
  };
  mandatesData: PayrollRatioData[];
  summary: {
    totalMandates: number;
    mandatesWithData: number;
    totalRevenue: number;
    totalPayroll: number;
    globalRatio: number | null;
    averageRatio: number | null;
    ratioDistribution: {
      excellent: number;
      good: number;
      warning: number;
      critical: number;
      noData: number;
    };
  };
  trends: {
    revenueChange: number;
    payrollChange: number;
    ratioChange: number;
  };
}

export default function PayrollRatioCard() {
  const router = useRouter();
  const [payrollData, setPayrollData] =
    useState<DashboardPayrollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (currentDate.getMonth() + 1).toString()
  );

  useEffect(() => {
    fetchPayrollData();
  }, [selectedYear, selectedMonth]);

  const fetchPayrollData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/dashboard/payroll-ratios?year=${selectedYear}&month=${selectedMonth}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement");
      }

      const data = await response.json();
      setPayrollData(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des ratios");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatPercentage = (value: number | null, decimals = 1) => {
    if (value === null) return "-";
    return `${value.toFixed(decimals)}%`;
  };

  const getRatioIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "good":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRatioColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getTrendIcon = (trend: string, className = "h-4 w-4") => {
    switch (trend) {
      case "up":
        return <TrendingUp className={`${className} text-red-600`} />;
      case "down":
        return <TrendingDown className={`${className} text-green-600`} />;
      case "stable":
        return <Minus className={`${className} text-blue-600`} />;
      default:
        return <Minus className={`${className} text-gray-400`} />;
    }
  };

  const handleAddPayroll = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}/payroll`);
  };

  const handleViewDetails = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}/payroll`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ratios Masse salariale / CA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!payrollData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ratios Masse salariale / CA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Erreur lors du chargement</p>
            <Button onClick={() => fetchPayrollData()} className="mt-4">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grouper par catégorie
  const hebergementData = payrollData.mandatesData.filter(
    (m) => m.mandateGroup === "HEBERGEMENT"
  );
  const restaurationData = payrollData.mandatesData.filter(
    (m) => m.mandateGroup === "RESTAURATION"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Ratios Masse salariale / CA
            </CardTitle>
            <CardDescription>
              Analyse des coûts de personnel par rapport au chiffre
              d&apos;affaires
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  const monthName = new Date(0, i).toLocaleDateString("fr-CH", {
                    month: "long",
                  });
                  return (
                    <SelectItem key={month} value={month.toString()}>
                      {monthName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPayrollData(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques globales */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {payrollData.summary.mandatesWithData}/
              {payrollData.summary.totalMandates}
            </div>
            <div className="text-sm text-muted-foreground">
              Mandats avec données
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(payrollData.summary.totalRevenue)}
            </div>
            <div className="text-sm text-muted-foreground">CA total</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(payrollData.summary.totalPayroll)}
            </div>
            <div className="text-sm text-muted-foreground">Masse salariale</div>
          </div>

          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getRatioColor(
                payrollData.summary.globalRatio
                  ? payrollData.summary.globalRatio < 25
                    ? "excellent"
                    : payrollData.summary.globalRatio < 35
                      ? "good"
                      : payrollData.summary.globalRatio < 50
                        ? "warning"
                        : "critical"
                  : "no-data"
              )}`}
            >
              {formatPercentage(payrollData.summary.globalRatio)}
            </div>
            <div className="text-sm text-muted-foreground">Ratio global</div>
          </div>
        </div>

        {/* Distribution des ratios */}
        <div className="space-y-2">
          <h4 className="font-medium">Distribution des ratios</h4>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div className="text-center">
              <div className="text-green-600 font-bold">
                {payrollData.summary.ratioDistribution.excellent}
              </div>
              <div className="text-muted-foreground">Excellent (&lt;25%)</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-bold">
                {payrollData.summary.ratioDistribution.good}
              </div>
              <div className="text-muted-foreground">Bon (25-35%)</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-600 font-bold">
                {payrollData.summary.ratioDistribution.warning}
              </div>
              <div className="text-muted-foreground">Attention (35-50%)</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-bold">
                {payrollData.summary.ratioDistribution.critical}
              </div>
              <div className="text-muted-foreground">Critique (&gt;50%)</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-bold">
                {payrollData.summary.ratioDistribution.noData}
              </div>
              <div className="text-muted-foreground">Sans données</div>
            </div>
          </div>

          {/* Barre de progression visuelle */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="bg-green-500"
              style={{
                width: `${(payrollData.summary.ratioDistribution.excellent / payrollData.summary.totalMandates) * 100}%`,
              }}
            />
            <div
              className="bg-blue-500"
              style={{
                width: `${(payrollData.summary.ratioDistribution.good / payrollData.summary.totalMandates) * 100}%`,
              }}
            />
            <div
              className="bg-yellow-500"
              style={{
                width: `${(payrollData.summary.ratioDistribution.warning / payrollData.summary.totalMandates) * 100}%`,
              }}
            />
            <div
              className="bg-red-500"
              style={{
                width: `${(payrollData.summary.ratioDistribution.critical / payrollData.summary.totalMandates) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Tableau détaillé */}
        <div className="space-y-4">
          {/* Section Hébergement */}
          {hebergementData.length > 0 && (
            <div>
              <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Hébergement ({hebergementData.length})
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mandat</TableHead>
                    <TableHead className="text-right">CA</TableHead>
                    <TableHead className="text-right">Masse sal.</TableHead>
                    <TableHead className="text-right">Ratio</TableHead>
                    <TableHead className="text-center">Tendance</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hebergementData.map((mandate) => (
                    <TableRow key={mandate.mandateId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {mandate.mandateName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {mandate.revenueEntries} saisies CA
                              {mandate.employeeCount &&
                                ` • ${mandate.employeeCount} employés`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {mandate.totalRevenue > 0
                          ? formatCurrency(mandate.totalRevenue)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {mandate.payrollAmount ? (
                          <div>
                            <div>{formatCurrency(mandate.payrollAmount)}</div>
                            <Badge variant="secondary" className="text-xs">
                              {mandate.payrollSource === "manual"
                                ? "Manuel"
                                : "Calculé"}
                            </Badge>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 ${getRatioColor(mandate.ratioStatus)}`}
                        >
                          {getRatioIcon(mandate.ratioStatus)}
                          <span className="font-medium">
                            {formatPercentage(mandate.payrollToRevenueRatio)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getTrendIcon(mandate.ratioTrend)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1">
                          {mandate.payrollAmount ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleViewDetails(mandate.mandateId)
                              }
                            >
                              Voir
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAddPayroll(mandate.mandateId)
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Section Restauration */}
          {restaurationData.length > 0 && (
            <div>
              <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Restauration ({restaurationData.length})
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mandat</TableHead>
                    <TableHead className="text-right">CA</TableHead>
                    <TableHead className="text-right">Masse sal.</TableHead>
                    <TableHead className="text-right">Ratio</TableHead>
                    <TableHead className="text-center">Tendance</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurationData.map((mandate) => (
                    <TableRow key={mandate.mandateId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {mandate.mandateName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {mandate.revenueEntries} saisies CA
                              {mandate.employeeCount &&
                                ` • ${mandate.employeeCount} employés`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {mandate.totalRevenue > 0
                          ? formatCurrency(mandate.totalRevenue)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {mandate.payrollAmount ? (
                          <div>
                            <div>{formatCurrency(mandate.payrollAmount)}</div>
                            <Badge variant="secondary" className="text-xs">
                              {mandate.payrollSource === "manual"
                                ? "Manuel"
                                : "Calculé"}
                            </Badge>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 ${getRatioColor(mandate.ratioStatus)}`}
                        >
                          {getRatioIcon(mandate.ratioStatus)}
                          <span className="font-medium">
                            {formatPercentage(mandate.payrollToRevenueRatio)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getTrendIcon(mandate.ratioTrend)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1">
                          {mandate.payrollAmount ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleViewDetails(mandate.mandateId)
                              }
                            >
                              Voir
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAddPayroll(mandate.mandateId)
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer avec recommandations */}
        {payrollData.summary.ratioDistribution.critical > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {payrollData.summary.ratioDistribution.critical} mandat(s) ont
                un ratio critique (&gt;50%)
              </span>
            </div>
            <p className="text-red-600 text-sm mt-1">
              Vérifiez les coûts de personnel et optimisez si nécessaire.
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Données pour {payrollData.currentPeriod.monthName}{" "}
          {payrollData.currentPeriod.year} • Seuils: Excellent &lt;25%, Bon
          25-35%, Attention 35-50%, Critique &gt;50%
        </div>
      </CardContent>
    </Card>
  );
}
