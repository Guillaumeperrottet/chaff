"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Upload,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

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
  gastrotimeImport?: {
    id: string;
    period: string;
    totalCost: number;
    totalEmployees: number;
    importDate: string;
  }; // ✅ NOUVEAU: Import Gastrotime
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
  const router = useRouter();
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

  // ✅ NOUVEAU: État pour les seuils de ratio personnalisables avec persistance
  const [ratioThresholds, setRatioThresholds] = useState({
    good: 30, // Vert si < 30%
    medium: 50, // Jaune si < 50%
    // Rouge si >= 50%
  });
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);

  // ✅ NOUVEAU: Charger les seuils depuis localStorage au démarrage
  useEffect(() => {
    const savedThresholds = localStorage.getItem("payroll-ratio-thresholds");
    if (savedThresholds) {
      try {
        const parsed = JSON.parse(savedThresholds);
        setRatioThresholds(parsed);
      } catch (error) {
        console.error("Erreur lors du chargement des seuils:", error);
      }
    }
  }, []);

  // ✅ NOUVEAU: Sauvegarder les seuils dans localStorage quand ils changent
  const updateRatioThresholds = useCallback(
    (newThresholds: typeof ratioThresholds) => {
      setRatioThresholds(newThresholds);
      localStorage.setItem(
        "payroll-ratio-thresholds",
        JSON.stringify(newThresholds)
      );
      toast.success("Seuils de couleur sauvegardés");
    },
    []
  );

  const [formData, setFormData] = useState({
    month: "",
    grossAmount: "",
    socialChargesRate: "",
    employeeCount: "",
    notes: "",
  });

  // ✅ FIX: Utiliser useCallback pour éviter la recréation de la fonction
  const fetchPayrollData = useCallback(async () => {
    if (!mandateId) return;

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
  }, [mandateId, selectedYear]); // ✅ FIX: Dépendances correctes

  // ✅ FIX: useEffect avec les bonnes dépendances
  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]); // ✅ FIX: Utiliser fetchPayrollData mémorisée

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
        socialCharges: formData.socialChargesRate
          ? (parseFloat(formData.grossAmount) *
              parseFloat(formData.socialChargesRate)) /
            100
          : (parseFloat(formData.grossAmount) * 22) / 100,
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
      fetchPayrollData(); // ✅ Utiliser la fonction mémorisée
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = useCallback((summary: PayrollSummary) => {
    if (!summary.manualEntry) return;

    setEditingEntry(summary.manualEntry);
    // Calculer le taux de charges sociales à partir du montant
    const socialChargesRate =
      summary.manualEntry.socialCharges && summary.manualEntry.grossAmount
        ? (
            (summary.manualEntry.socialCharges /
              summary.manualEntry.grossAmount) *
            100
          ).toString()
        : "";

    setFormData({
      month: summary.month.toString(),
      grossAmount: summary.manualEntry.grossAmount.toString(),
      socialChargesRate: socialChargesRate,
      employeeCount: summary.manualEntry.employeeCount?.toString() || "",
      notes: summary.manualEntry.notes || "",
    });
    setIsDialogOpen(true);
  }, []); // ✅ FIX: Mémoriser pour éviter les re-renders

  const handleDelete = useCallback(
    async (year: number, month: number) => {
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
        fetchPayrollData(); // ✅ Utiliser la fonction mémorisée
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors de la suppression");
      }
    },
    [mandateId, fetchPayrollData]
  ); // ✅ FIX: Dépendances correctes

  // ✅ NOUVEAU: Fonction pour supprimer un import Gastrotime
  const handleDeleteGastrotimeImport = useCallback(
    async (importId: string) => {
      if (
        !confirm(
          "Supprimer cet import Gastrotime ? Cette action est irréversible."
        )
      )
        return;

      try {
        const response = await fetch(`/api/payroll/delete-import/${importId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la suppression");
        }

        toast.success("Import Gastrotime supprimé avec succès");
        fetchPayrollData(); // Recharger les données
      } catch (error) {
        console.error("Erreur:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression"
        );
      }
    },
    [fetchPayrollData]
  );

  const resetForm = useCallback(() => {
    setFormData({
      month: "",
      grossAmount: "",
      socialChargesRate: "",
      employeeCount: "",
      notes: "",
    });
    setEditingEntry(null);
  }, []); // ✅ FIX: Mémoriser pour éviter les re-renders

  const openNewEntryDialog = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]); // ✅ FIX: Dépendance correcte

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  }, []); // ✅ FIX: Mémoriser pour éviter les re-renders

  const formatPercentage = useCallback((value: number | null) => {
    if (value === null) return "-";
    return `${value.toFixed(1)}%`;
  }, []); // ✅ FIX: Mémoriser pour éviter les re-renders

  const getRatioColor = useCallback(
    (ratio: number | null) => {
      if (ratio === null) return "text-muted-foreground";
      if (ratio < ratioThresholds.good) return "text-green-600";
      if (ratio < ratioThresholds.medium) return "text-yellow-600";
      return "text-red-600";
    },
    [ratioThresholds]
  ); // ✅ FIX: Mémoriser pour éviter les re-renders

  const getRatioIcon = useCallback(
    (ratio: number | null) => {
      if (ratio === null) return null;
      if (ratio < ratioThresholds.good)
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    },
    [ratioThresholds]
  ); // ✅ FIX: Mémoriser pour éviter les re-renders

  // ✅ NOUVEAU: Fonction pour extraire le taux de charges sociales des notes
  const extractSocialChargesRate = useCallback((notes: string | undefined) => {
    if (!notes) return null;
    // Chercher le pattern "charges sociales: XX%"
    const match = notes.match(/charges sociales:\s*(\d+(?:\.\d+)?)%/);
    return match ? parseFloat(match[1]) : null;
  }, []);

  // ✅ FIX: Gestion de l'état de chargement initial
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

  // ✅ FIX: Gestion de l'erreur de chargement
  if (!payrollData) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/mandates" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Erreur lors du chargement</p>
          <Button onClick={fetchPayrollData} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Navigation */}
        <BackButton
          href="/dashboard/payroll"
          label="Retour a la masse salariale"
        />

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
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/dashboard/payroll/import-with-validation?mandateId=${mandateId}`
                )
              }
            >
              <Upload className="mr-2 h-4 w-4" />
              Import avec Gastrotime
            </Button>
            <Button onClick={openNewEntryDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Saisie manuelle
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
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Ratio moyen
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowThresholdSettings(true)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Configurer les seuils de couleur"
                >
                  <Calculator className="h-3 w-3" />
                </Button>
              </div>
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
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Ratio %</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="text-xs">
                            <div className="font-medium mb-1">
                              Personnaliser les couleurs
                            </div>
                            <div>
                              Cliquez sur l&apos;icône calculatrice{" "}
                              <Calculator className="h-3 w-3 inline mx-1" />{" "}
                              dans les statistiques pour configurer les seuils
                              de couleur des ratios.
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    Charges sociales
                  </TableHead>
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
                        {summary.gastrotimeImport && (
                          <Badge variant="secondary" className="text-xs">
                            Gastrotime
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
                      {summary.manualEntry || summary.gastrotimeImport ? (
                        <>
                          {summary.manualEntry
                            ? formatCurrency(summary.manualEntry.totalCost)
                            : formatCurrency(
                                summary.gastrotimeImport!.totalCost
                              )}
                          <div className="text-xs text-muted-foreground">
                            {summary.manualEntry ? (
                              <>
                                +
                                {formatCurrency(
                                  summary.manualEntry.socialCharges
                                )}{" "}
                                charges
                              </>
                            ) : (
                              <span className="italic">Import Gastrotime</span>
                            )}
                          </div>
                        </>
                      ) : (
                        "-"
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
                    <TableCell className="text-center">
                      {(() => {
                        // Pour les imports Gastrotime, extraire le taux depuis les notes
                        if (summary.manualEntry?.notes) {
                          const socialChargesRate = extractSocialChargesRate(
                            summary.manualEntry.notes
                          );
                          if (socialChargesRate !== null) {
                            return (
                              <div className="text-sm font-medium text-primary">
                                {socialChargesRate}%
                              </div>
                            );
                          }
                        }

                        // Pour les saisies manuelles, calculer le pourcentage si possible
                        if (
                          summary.manualEntry?.grossAmount &&
                          summary.manualEntry?.socialCharges
                        ) {
                          const rate =
                            (summary.manualEntry.socialCharges /
                              summary.manualEntry.grossAmount) *
                            100;
                          return (
                            <div className="text-sm text-muted-foreground">
                              {rate.toFixed(1)}%
                            </div>
                          );
                        }

                        return <span className="text-muted-foreground">-</span>;
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      {summary.manualEntry?.employeeCount ||
                        summary.gastrotimeImport?.totalEmployees ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {summary.manualEntry?.notes && (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                            {summary.manualEntry.notes}
                          </span>
                          {/* Afficher le taux de charges sociales si c'est un import Gastrotime */}
                          {(() => {
                            const socialChargesRate = extractSocialChargesRate(
                              summary.manualEntry.notes
                            );
                            return socialChargesRate !== null ? (
                              <div className="text-xs text-muted-foreground italic">
                                Charges sociales: {socialChargesRate}%
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {summary.manualEntry ? (
                          // Actions pour saisie manuelle
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(summary)}
                              title="Modifier la saisie manuelle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(summary.year, summary.month)
                              }
                              title="Supprimer la saisie manuelle"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : summary.gastrotimeImport ? (
                          // Actions pour import Gastrotime
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteGastrotimeImport(
                                summary.gastrotimeImport!.id
                              )
                            }
                            title="Supprimer l'import Gastrotime"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          // Bouton d'ajout si aucune donnée
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
                            title="Ajouter une saisie manuelle"
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
                <Label htmlFor="socialChargesRate">
                  Taux de charges sociales (%)
                </Label>
                <Input
                  id="socialChargesRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.socialChargesRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialChargesRate: e.target.value,
                    }))
                  }
                  placeholder="22"
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour utiliser 22% par défaut
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
                        Charges sociales ({formData.socialChargesRate || "22"}%)
                        :
                      </span>
                      <span className="float-right font-medium">
                        {formatCurrency(
                          formData.socialChargesRate
                            ? (parseFloat(formData.grossAmount) || 0) *
                                (parseFloat(formData.socialChargesRate) / 100)
                            : (parseFloat(formData.grossAmount) || 0) * 0.22
                        )}
                      </span>
                    </div>
                    <div className="col-span-2 border-t pt-2">
                      <span className="font-medium">
                        Coût total employeur :
                      </span>
                      <span className="float-right font-bold text-primary">
                        {formatCurrency(
                          (parseFloat(formData.grossAmount) || 0) +
                            (formData.socialChargesRate
                              ? (parseFloat(formData.grossAmount) || 0) *
                                (parseFloat(formData.socialChargesRate) / 100)
                              : (parseFloat(formData.grossAmount) || 0) * 0.22)
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

        {/* ✅ NOUVEAU: Dialog de configuration des seuils */}
        <Dialog
          open={showThresholdSettings}
          onOpenChange={setShowThresholdSettings}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Configuration des seuils de couleur</DialogTitle>
              <DialogDescription>
                Personnalisez les seuils pour l&apos;affichage coloré des ratios
                masse salariale / CA
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <div className="flex-1">
                    <Label htmlFor="goodThreshold">
                      Ratio excellent (vert)
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        Moins de
                      </span>
                      <Input
                        id="goodThreshold"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={ratioThresholds.good}
                        onChange={(e) =>
                          updateRatioThresholds({
                            ...ratioThresholds,
                            good: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                  <div className="flex-1">
                    <Label htmlFor="mediumThreshold">
                      Ratio acceptable (jaune)
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        Entre {ratioThresholds.good}% et
                      </span>
                      <Input
                        id="mediumThreshold"
                        type="number"
                        min={ratioThresholds.good}
                        max="100"
                        step="1"
                        value={ratioThresholds.medium}
                        onChange={(e) =>
                          updateRatioThresholds({
                            ...ratioThresholds,
                            medium: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <div className="flex-1">
                    <Label>Ratio élevé (rouge)</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ratioThresholds.medium}% et plus
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Aperçu des couleurs :</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Exemple 25%</span>
                    <span className={getRatioColor(25)}>
                      ■{" "}
                      {25 < ratioThresholds.good
                        ? "Vert"
                        : 25 < ratioThresholds.medium
                          ? "Jaune"
                          : "Rouge"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exemple 40%</span>
                    <span className={getRatioColor(40)}>
                      ■{" "}
                      {40 < ratioThresholds.good
                        ? "Vert"
                        : 40 < ratioThresholds.medium
                          ? "Jaune"
                          : "Rouge"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exemple 55%</span>
                    <span className={getRatioColor(55)}>
                      ■{" "}
                      {55 < ratioThresholds.good
                        ? "Vert"
                        : 55 < ratioThresholds.medium
                          ? "Jaune"
                          : "Rouge"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              {" "}
              <Button
                variant="outline"
                onClick={() => {
                  // Réinitialiser aux valeurs par défaut
                  updateRatioThresholds({ good: 30, medium: 50 });
                }}
              >
                Valeurs par défaut
              </Button>
              <Button onClick={() => setShowThresholdSettings(false)}>
                Appliquer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
