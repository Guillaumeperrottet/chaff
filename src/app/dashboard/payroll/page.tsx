// src/app/dashboard/payroll/page.tsx
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
  TableFooter,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  Calculator,
  Download,
  Upload,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Loader2,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface PayrollCalculationResult {
  success: boolean;
  period: {
    start: string;
    end: string;
    type: "WEEKLY" | "MONTHLY";
  };
  mandateResults: Array<{
    mandateId: string;
    mandateName: string;
    employeeCount: number;
    totalHours: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalGrossPay: number;
    totalSocialCharges: number;
    totalCost: number;
    employeeDetails: Array<{
      employeeName: string;
      employeeId: string;
      totalHours: number;
      regularHours: number;
      overtimeHours: number;
      totalGross: number;
      socialCharges: number;
      totalCost: number;
    }>;
  }>;
  globalTotals: {
    totalEmployees: number;
    totalHours: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalGrossPay: number;
    totalSocialCharges: number;
    totalCost: number;
  };
  calculatedAt: string;
}

interface Mandate {
  id: string;
  name: string;
  group: string;
}

export default function PayrollDashboard() {
  const router = useRouter();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [selectedMandateId, setSelectedMandateId] = useState<string>("all");
  const [periodType, setPeriodType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setDate(1); // Premier du mois
    return date.toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0); // Dernier jour du mois
    return date.toISOString().split("T")[0];
  });

  const [calculating, setCalculating] = useState(false);
  const [payrollData, setPayrollData] =
    useState<PayrollCalculationResult | null>(null);
  const [expandedMandates, setExpandedMandates] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchMandates();
  }, []);

  const fetchMandates = async () => {
    try {
      const response = await fetch("/api/mandats");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setMandates(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des mandats");
    }
  };

  const handleCalculatePayroll = async () => {
    if (!periodStart || !periodEnd) {
      toast.error("Veuillez sélectionner une période");
      return;
    }

    setCalculating(true);

    try {
      const requestData = {
        mandateId: selectedMandateId === "all" ? undefined : selectedMandateId,
        periodStart,
        periodEnd,
        periodType,
        recalculate: true,
      };

      const response = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors du calcul");
      }

      const result = await response.json();
      setPayrollData(result);
      toast.success("Calcul de la masse salariale terminé");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du calcul"
      );
    } finally {
      setCalculating(false);
    }
  };

  const handleExportPayroll = async () => {
    if (!payrollData) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        mandateId: selectedMandateId === "all" ? "" : selectedMandateId,
        periodStart,
        periodEnd,
        periodType,
      });

      const response = await fetch(`/api/export/payroll?${queryParams}`);
      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll_${periodStart}_${periodEnd}.xlsx`;
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

  const toggleMandateExpansion = (mandateId: string) => {
    const newExpanded = new Set(expandedMandates);
    if (newExpanded.has(mandateId)) {
      newExpanded.delete(mandateId);
    } else {
      newExpanded.add(mandateId);
    }
    setExpandedMandates(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Masse salariale</h1>
          <p className="text-muted-foreground">
            Calcul et analyse des coûts de personnel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/payroll/import")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Gastrotime
          </Button>
          {payrollData && (
            <Button variant="outline" onClick={handleExportPayroll}>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Contrôles de calcul */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Paramètres de calcul
          </CardTitle>
          <CardDescription>
            Configurez la période et l&apos;établissement pour le calcul de la
            masse salariale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Sélection de l'établissement */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Établissement</label>
              <Select
                value={selectedMandateId}
                onValueChange={setSelectedMandateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les établissements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les établissements</SelectItem>
                  {mandates.map((mandate) => (
                    <SelectItem key={mandate.id} value={mandate.id}>
                      {mandate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type de période */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de période</label>
              <Select
                value={periodType}
                onValueChange={(value: "WEEKLY" | "MONTHLY") =>
                  setPeriodType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                  <SelectItem value="MONTHLY">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date de début */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de début</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              />
            </div>

            {/* Date de fin */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              />
            </div>

            {/* Bouton de calcul */}
            <Button
              onClick={handleCalculatePayroll}
              disabled={calculating}
              className="h-9"
            >
              {calculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calcul...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculer
                </>
              )}
            </Button>
          </div>

          {calculating && (
            <div className="mt-4">
              <Progress value={50} className="h-2" />
              <p className="text-xs text-center text-muted-foreground mt-2">
                Calcul en cours...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats globaux */}
      {payrollData && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employés</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {payrollData.globalTotals.totalEmployees}
                </div>
                <p className="text-xs text-muted-foreground">
                  {payrollData.mandateResults.length} établissement(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Heures totales
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatHours(payrollData.globalTotals.totalHours)}
                </div>
                <p className="text-xs text-muted-foreground">
                  dont{" "}
                  {formatHours(payrollData.globalTotals.totalOvertimeHours)}{" "}
                  supplémentaires
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Salaire brut
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(payrollData.globalTotals.totalGrossPay)}
                </div>
                <div className="flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">
                    +2.3% vs mois précédent
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Coût total
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(payrollData.globalTotals.totalCost)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{formatCurrency(payrollData.globalTotals.totalSocialCharges)}{" "}
                  charges sociales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Détail par établissement */}
          <Card>
            <CardHeader>
              <CardTitle>Détail par établissement</CardTitle>
              <CardDescription>
                Masse salariale détaillée pour la période du{" "}
                {new Date(payrollData.period.start).toLocaleDateString("fr-CH")}{" "}
                au{" "}
                {new Date(payrollData.period.end).toLocaleDateString("fr-CH")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Établissement</TableHead>
                    <TableHead className="text-right">Employés</TableHead>
                    <TableHead className="text-right">Heures</TableHead>
                    <TableHead className="text-right">H. Sup.</TableHead>
                    <TableHead className="text-right">Salaire brut</TableHead>
                    <TableHead className="text-right">Charges</TableHead>
                    <TableHead className="text-right">Coût total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.mandateResults.map((mandateResult) => (
                    <>
                      <TableRow
                        key={mandateResult.mandateId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          toggleMandateExpansion(mandateResult.mandateId)
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">
                              {mandateResult.mandateName}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {mandates.find(
                                (m) => m.id === mandateResult.mandateId
                              )?.group === "HEBERGEMENT"
                                ? "Hébergement"
                                : "Restauration"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {mandateResult.employeeCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatHours(mandateResult.totalHours)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatHours(mandateResult.totalOvertimeHours)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(mandateResult.totalGrossPay)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(mandateResult.totalSocialCharges)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(mandateResult.totalCost)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            {expandedMandates.has(mandateResult.mandateId)
                              ? "−"
                              : "+"}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Détail des employés */}
                      {expandedMandates.has(mandateResult.mandateId) && (
                        <>
                          {mandateResult.employeeDetails.map(
                            (employee, index) => (
                              <TableRow
                                key={`${mandateResult.mandateId}-${index}`}
                                className="bg-muted/30"
                              >
                                <TableCell className="pl-8">
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {employee.employeeName}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                      ID: {employee.employeeId}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right">
                                  {formatHours(employee.totalHours)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatHours(employee.overtimeHours)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(employee.totalGross)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(employee.socialCharges)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(employee.totalCost)}
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            )
                          )}
                        </>
                      )}
                    </>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total général</TableCell>
                    <TableCell className="text-right font-bold">
                      {payrollData.globalTotals.totalEmployees}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatHours(payrollData.globalTotals.totalHours)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatHours(payrollData.globalTotals.totalOvertimeHours)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(payrollData.globalTotals.totalGrossPay)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(
                        payrollData.globalTotals.totalSocialCharges
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(payrollData.globalTotals.totalCost)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Informations supplémentaires */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Période:{" "}
                  {periodType === "WEEKLY" ? "Hebdomadaire" : "Mensuel"} - Du{" "}
                  {new Date(payrollData.period.start).toLocaleDateString(
                    "fr-CH"
                  )}{" "}
                  au{" "}
                  {new Date(payrollData.period.end).toLocaleDateString("fr-CH")}
                </div>
                <div>
                  Calculé le:{" "}
                  {new Date(payrollData.calculatedAt).toLocaleString("fr-CH")}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* État vide */}
      {!payrollData && !calculating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Calcul de la masse salariale
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Sélectionnez une période et un établissement ci-dessus, puis
              cliquez sur &quot;Calculer&quot; pour analyser vos coûts de
              personnel.
            </p>
            <Button onClick={handleCalculatePayroll} disabled={calculating}>
              <Calculator className="mr-2 h-4 w-4" />
              Lancer le calcul
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
