// src/app/dashboard/mandates/[id]/payroll/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { FeatureButton } from "@/app/components/FeatureButton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Badge } from "@/app/components/ui/badge";
import { BackButton } from "@/app/components/ui/BackButton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  History,
  Eye,
  Trash2,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ImportHistory {
  id: string;
  filename: string;
  importDate: string;
  period: string;
  periodFormatted: string;
  importType: string;
  totalEmployees: number;
  totalHours: number;
  totalGrossAmount: number;
  socialCharges: number;
  totalCost: number;
  defaultHourlyRate?: number;
  status: string;
  notes?: string;
  employeeEntries: Array<{
    id: string;
    firstName: string;
    lastName: string;
    totalHours: number;
    hourlyRate: number;
    grossAmount: number;
    rateSource: string;
    employeeFound: boolean;
  }>;
  _count: {
    employeeEntries: number;
  };
}

interface HistoryData {
  mandate: {
    id: string;
    name: string;
    group: string;
  };
  imports: ImportHistory[];
  statistics: {
    totalImports: number;
    totalEmployees: number;
    totalHours: number;
    totalAmount: number;
    totalCost: number;
    averageHoursPerImport: number;
    averageCostPerImport: number;
  };
  evolutionData: Array<{
    period: string;
    monthName: string;
    totalEmployees: number;
    totalHours: number;
    totalCost: number;
    costEvolution: number | null;
  }>;
}

export default function PayrollHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const mandateId = params.id as string;

  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchHistoryData();
  }, [mandateId, selectedYear]);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/mandats/${mandateId}/payroll/history?year=${selectedYear}&limit=50`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement");
      }

      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImport = async (importId: string) => {
    if (!confirm("Supprimer cet import ? Cette action est irréversible.")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/mandats/${mandateId}/payroll/history?importId=${importId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Import supprimé avec succès");
      fetchHistoryData();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleViewDetails = (importItem: ImportHistory) => {
    setSelectedImport(importItem);
    setShowDetails(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEvolutionIcon = (evolution: number | null) => {
    if (evolution === null) return null;
    return evolution >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getEvolutionColor = (evolution: number | null) => {
    if (evolution === null) return "text-muted-foreground";
    return evolution >= 0 ? "text-green-600" : "text-red-600";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton href={`/dashboard/mandates/${mandateId}/payroll`} />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!historyData) {
    return (
      <div className="space-y-6">
        <BackButton href={`/dashboard/mandates/${mandateId}/payroll`} />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Erreur lors du chargement</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton
        href={`/dashboard/mandates/${mandateId}/payroll`}
        label="Retour à la masse salariale"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Historique - {historyData.mandate.name}
          </h1>
          <p className="text-muted-foreground">
            Historique des imports de masse salariale
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FeatureButton
            feature="payroll"
            variant="outline"
            onClick={() => router.push("/dashboard/payroll/simple-import")}
          >
            Nouvel import
          </FeatureButton>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total imports</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyData.statistics.totalImports}
            </div>
            <p className="text-xs text-muted-foreground">
              Année {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total employés
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyData.statistics.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">
              Tous imports confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total heures</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyData.statistics.totalHours.toFixed(0)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne: {historyData.statistics.averageHoursPerImport.toFixed(0)}
              h/import
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(historyData.statistics.totalCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne:{" "}
              {formatCurrency(historyData.statistics.averageCostPerImport)}
              /import
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques d'évolution */}
      {historyData.evolutionData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Évolution des coûts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyData.evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Coût total",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalCost"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Heures par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={historyData.evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value}h`, "Total heures"]}
                  />
                  <Bar dataKey="totalHours" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des imports */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des imports</CardTitle>
          <CardDescription>
            {historyData.imports.length} import(s) pour {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyData.imports.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Aucun import trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Aucun import n&apos;a été effectué pour l&apos;année{" "}
                {selectedYear}
              </p>
              <FeatureButton
                feature="payroll"
                onClick={() => router.push("/dashboard/payroll/simple-import")}
              >
                Premier import
              </FeatureButton>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead className="text-center">Employés</TableHead>
                  <TableHead className="text-right">Heures</TableHead>
                  <TableHead className="text-right">Coût total</TableHead>
                  <TableHead className="text-center">Évolution</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.imports.map((importItem) => {
                  const evolution = historyData.evolutionData.find(
                    (e) => e.period === importItem.period
                  )?.costEvolution;

                  return (
                    <TableRow key={importItem.id}>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(importItem.importDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {importItem.periodFormatted}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {importItem.importType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{importItem.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {importItem.totalEmployees}
                      </TableCell>
                      <TableCell className="text-right">
                        {importItem.totalHours.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(importItem.totalCost)}
                      </TableCell>
                      <TableCell className="text-center">
                        {evolution !== null && evolution !== undefined && (
                          <div
                            className={`flex items-center justify-center gap-1 ${getEvolutionColor(evolution ?? null)}`}
                          >
                            {getEvolutionIcon(evolution ?? null)}
                            <span className="text-sm font-medium">
                              {evolution > 0 ? "+" : ""}
                              {evolution.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(importItem)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteImport(importItem.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog détails import */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Détails - {selectedImport?.periodFormatted}
            </DialogTitle>
            <DialogDescription>
              Import du{" "}
              {selectedImport && formatDate(selectedImport.importDate)}
            </DialogDescription>
          </DialogHeader>

          {selectedImport && (
            <div className="space-y-6">
              {/* Résumé */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedImport.totalEmployees}
                  </div>
                  <div className="text-sm text-muted-foreground">Employés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedImport.totalHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total heures
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedImport.totalGrossAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Brut</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(selectedImport.totalCost)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>

              {/* Détail par employé */}
              <div>
                <h4 className="font-medium mb-3">Détail par employé</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead className="text-right">Heures</TableHead>
                      <TableHead className="text-right">Taux/h</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Source taux</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedImport.employeeEntries.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </TableCell>
                        <TableCell className="text-right">
                          {employee.totalHours.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(employee.hourlyRate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(employee.grossAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {employee.rateSource === "database"
                              ? "Base"
                              : employee.rateSource === "csv"
                                ? "CSV"
                                : "Défaut"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              employee.employeeFound ? "default" : "secondary"
                            }
                          >
                            {employee.employeeFound ? "Trouvé" : "Nouveau"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
