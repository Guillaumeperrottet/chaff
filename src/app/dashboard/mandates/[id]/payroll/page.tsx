"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { BackButton } from "@/app/components/ui/BackButton";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Calculator,
  TrendingUp,
  TrendingDown,
  Loader2,
  Save,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface PayrollEntry {
  id: string;
  year: number;
  month: number;
  grossAmount: number;
  socialCharges: number;
  totalCost: number;
  employeeCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PayrollSummary {
  year: number;
  month: number;
  monthName: string;
  manualEntry?: PayrollEntry;
  revenue: number;
  revenueEntries: number;
  payrollToRevenueRatio: number | null;
  hasData: boolean;
}

interface PayrollData {
  mandate: {
    id: string;
    name: string;
    group: string;
  };
  year: number;
  period: {
    startMonth: number;
    endMonth: number;
  };
  summary: PayrollSummary[];
  totals: {
    totalPayrollCost: number;
    totalRevenue: number;
    averageRatio: number;
  };
}

export default function MandatePayrollPage() {
  const params = useParams();
  const mandateId = params.id as string;

  const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  // État pour le formulaire de saisie
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    month: "",
    grossAmount: "",
    socialCharges: "",
    employeeCount: "",
    notes: "",
  });

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/mandats/${mandateId}/payroll?year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement");
      }

      const data = await response.json();
      setPayrollData(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!formData.month || !formData.grossAmount) {
      toast.error("Veuillez renseigner le mois et le montant brut");
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        year: parseInt(selectedYear),
        month: parseInt(formData.month),
        grossAmount: parseFloat(formData.grossAmount),
        socialCharges: formData.socialCharges
          ? parseFloat(formData.socialCharges)
          : undefined,
        employeeCount: formData.employeeCount
          ? parseInt(formData.employeeCount)
          : undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch(`/api/mandats/${mandateId}/payroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      toast.success(
        editingEntry
          ? "Saisie mise à jour avec succès"
          : "Saisie créée avec succès"
      );

      setIsDialogOpen(false);
      resetForm();
      fetchPayrollData();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (summary: PayrollSummary) => {
    if (!summary.manualEntry) return;

    setEditingEntry(summary.manualEntry);
    setFormData({
      month: summary.month.toString(),
      grossAmount: summary.manualEntry.grossAmount.toString(),
      socialCharges: summary.manualEntry.socialCharges.toString(),
      employeeCount: summary.manualEntry.employeeCount?.toString() || "",
      notes: summary.manualEntry.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (year: number, month: number) => {
    if (!confirm("Supprimer cette saisie de masse salariale ?")) return;

    try {
      const response = await fetch(
        `/api/mandats/${mandateId}/payroll?year=${year}&month=${month}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Saisie supprimée avec succès");
      fetchPayrollData();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setFormData({
      month: "",
      grossAmount: "",
      socialCharges: "",
      employeeCount: "",
      notes: "",
    });
    setEditingEntry(null);
  };

  const openNewEntryDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return "-";
    return `${value.toFixed(1)}%`;
  };

  const getRatioColor = (ratio: number | null) => {
    if (ratio === null) return "text-muted-foreground";
    if (ratio < 30) return "text-green-600";
    if (ratio < 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatioIcon = (ratio: number | null) => {
    if (ratio === null) return null;
    if (ratio < 35) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <TrendingUp className="h-4 w-4 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/mandates" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!payrollData) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/mandates" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Erreur lors du chargement</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton href="/dashboard/mandates" label="Retour aux mandats" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Masse salariale - {payrollData.mandate.name}
          </h1>
          <p className="text-muted-foreground">
            Saisie manuelle et analyse des ratios CA/Masse salariale
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
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
          <Button onClick={openNewEntryDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle saisie
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Masse salariale totale
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(payrollData.totals.totalPayrollCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Année {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(payrollData.totals.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Année {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratio moyen</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getRatioColor(payrollData.totals.averageRatio)}`}
            >
              {formatPercentage(payrollData.totals.averageRatio)}
            </div>
            <p className="text-xs text-muted-foreground">Masse sal. / CA</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau mensuel */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse mensuelle {selectedYear}</CardTitle>
          <CardDescription>
            Suivi de la masse salariale et des ratios par mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">CA</TableHead>
                <TableHead className="text-right">Masse salariale</TableHead>
                <TableHead className="text-right">Ratio %</TableHead>
                <TableHead className="text-right">Employés</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.summary.map((summary) => (
                <TableRow
                  key={summary.month}
                  className={summary.hasData ? "" : "opacity-50"}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{summary.monthName}</span>
                      {summary.manualEntry && (
                        <Badge variant="default" className="text-xs">
                          Saisi
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.revenue > 0
                      ? formatCurrency(summary.revenue)
                      : "-"}
                    {summary.revenueEntries > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {summary.revenueEntries} saisies
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.manualEntry
                      ? formatCurrency(summary.manualEntry.totalCost)
                      : "-"}
                    {summary.manualEntry && (
                      <div className="text-xs text-muted-foreground">
                        +{formatCurrency(summary.manualEntry.socialCharges)}{" "}
                        charges
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`flex items-center justify-end gap-1 ${getRatioColor(summary.payrollToRevenueRatio)}`}
                    >
                      {getRatioIcon(summary.payrollToRevenueRatio)}
                      <span className="font-medium">
                        {formatPercentage(summary.payrollToRevenueRatio)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.manualEntry?.employeeCount || "-"}
                  </TableCell>
                  <TableCell>
                    {summary.manualEntry?.notes && (
                      <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                        {summary.manualEntry.notes}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {summary.manualEntry ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(summary)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete(summary.year, summary.month)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              month: summary.month.toString(),
                            }));
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(payrollData.totals.totalRevenue)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(payrollData.totals.totalPayrollCost)}
                </TableCell>
                <TableCell
                  className={`text-right font-bold ${getRatioColor(payrollData.totals.averageRatio)}`}
                >
                  {formatPercentage(payrollData.totals.averageRatio)}
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de saisie */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Modifier" : "Nouvelle"} saisie masse salariale
            </DialogTitle>
            <DialogDescription>
              Saisissez les données de masse salariale pour{" "}
              {payrollData.mandate.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Mois *</Label>
                <Select
                  value={formData.month}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, month: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un mois..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      const monthName = new Date(0, i).toLocaleDateString(
                        "fr-CH",
                        { month: "long" }
                      );
                      return (
                        <SelectItem key={month} value={month.toString()}>
                          {monthName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount">Nombre d&apos;employés</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  min="0"
                  value={formData.employeeCount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employeeCount: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grossAmount">Montant brut total * (CHF)</Label>
              <Input
                id="grossAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.grossAmount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    grossAmount: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialCharges">Charges sociales (CHF)</Label>
              <Input
                id="socialCharges"
                type="number"
                step="0.01"
                min="0"
                value={formData.socialCharges}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    socialCharges: e.target.value,
                  }))
                }
                placeholder="Calculé automatiquement à 22%"
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour calcul automatique (22% du brut)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Remarques particulières..."
                rows={3}
              />
            </div>

            {/* Aperçu du calcul */}
            {formData.grossAmount && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium">Aperçu du calcul :</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Montant brut :
                    </span>
                    <span className="float-right font-medium">
                      {formatCurrency(parseFloat(formData.grossAmount) || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Charges sociales :
                    </span>
                    <span className="float-right font-medium">
                      {formatCurrency(
                        parseFloat(formData.socialCharges) ||
                          (parseFloat(formData.grossAmount) || 0) * 0.22
                      )}
                    </span>
                  </div>
                  <div className="col-span-2 border-t pt-2">
                    <span className="font-medium">Coût total employeur :</span>
                    <span className="float-right font-bold text-primary">
                      {formatCurrency(
                        (parseFloat(formData.grossAmount) || 0) +
                          (parseFloat(formData.socialCharges) ||
                            (parseFloat(formData.grossAmount) || 0) * 0.22)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEntry} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
