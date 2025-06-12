// src/app/dashboard/payroll/import-with-validation/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import {} from "@/app/components/ui/dialog";
import { BackButton } from "@/app/components/ui/BackButton";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Save,
  X,
  Eye,
  Users,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Mandate {
  id: string;
  name: string;
  group: string;
}

interface ValidationEmployee {
  csvIndex: number;
  employeeId?: string;
  firstName: string;
  lastName: string;
  totalHours: number;
  matchedEmployee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    hourlyRate: number;
    position?: string;
  };
  matchType: "exact" | "partial" | "none";
  matchConfidence: number;
  proposedHourlyRate: number;
  rateSource: "employee" | "default" | "manual";
  estimatedCost: number;
  needsReview: boolean;
  issues: string[];
  isEditing?: boolean;
  manualEmployeeId?: string;
  manualRate?: number;
}

interface ValidationData {
  mandate: { id: string; name: string };
  filename: string;
  defaultHourlyRate: number;
  socialChargesRate: number; // ✅ NOUVEAU: Taux de charges sociales
  validationResults: ValidationEmployee[];
  statistics: {
    totalEmployees: number;
    exactMatches: number;
    partialMatches: number;
    noMatches: number;
    needsReview: number;
    totalHours: number;
    estimatedTotalCost: number;
    estimatedSocialCharges: number; // ✅ NOUVEAU: Charges sociales estimées
    estimatedTotalWithCharges: number; // ✅ NOUVEAU: Coût total avec charges
  };
  canProceed: boolean;
}

export default function ImportWithValidationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMandateId, setSelectedMandateId] = useState<string>("");
  const [period, setPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<string>("25");
  // ✅ NOUVEAU: Taux de charges sociales personnalisable
  const [socialChargesRate, setSocialChargesRate] = useState<string>("22");

  const [validationData, setValidationData] = useState<ValidationData | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchMandates();
  }, []);

  const fetchMandates = async () => {
    try {
      const response = await fetch("/api/mandats");
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setMandates(data.filter((m: Mandate) => m.group));
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des mandats");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Veuillez sélectionner un fichier CSV");
      return;
    }

    setSelectedFile(file);
    setValidationData(null);
  };

  const handleValidate = async () => {
    if (!selectedFile || !selectedMandateId || !defaultHourlyRate || !socialChargesRate) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsValidating(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mandateId", selectedMandateId);
      formData.append("defaultHourlyRate", defaultHourlyRate);
      formData.append("socialChargesRate", socialChargesRate);

      const response = await fetch("/api/payroll/validate-import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la validation");
      }

      setValidationData(result);

      if (result.statistics.needsReview > 0) {
        toast.warning(
          `${result.statistics.needsReview} employé(s) nécessitent une vérification`
        );
      } else {
        toast.success("Validation réussie - Prêt pour l'import");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la validation"
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleEditEmployee = (index: number) => {
    if (!validationData) return;

    const updated = [...validationData.validationResults];
    updated[index] = { ...updated[index], isEditing: true };

    setValidationData({
      ...validationData,
      validationResults: updated,
    });
  };

  const handleSaveEmployee = (
    index: number,
    newRate?: number,
    newEmployeeId?: string
  ) => {
    if (!validationData) return;

    const updated = [...validationData.validationResults];
    const employee = { ...updated[index] };

    if (newRate) {
      employee.proposedHourlyRate = newRate;
      employee.rateSource = "manual";
      employee.estimatedCost = employee.totalHours * newRate * 1.22;
    }

    if (newEmployeeId) {
      employee.manualEmployeeId = newEmployeeId;
      // TODO: Re-search for employee with this ID
    }

    employee.isEditing = false;
    employee.needsReview = false;

    updated[index] = employee;

    setValidationData({
      ...validationData,
      validationResults: updated,
    });
  };

  const handleFinalImport = async () => {
    if (!validationData || !period) {
      toast.error("Données de validation manquantes");
      return;
    }

    setIsImporting(true);

    try {
      const importData = {
        mandateId: validationData.mandate.id,
        period: period,
        employees: validationData.validationResults.map((emp) => ({
          employeeId: emp.manualEmployeeId || emp.employeeId,
          firstName: emp.firstName,
          lastName: emp.lastName,
          totalHours: emp.totalHours,
          hourlyRate: emp.proposedHourlyRate,
          matchedEmployeeId: emp.matchedEmployee?.id,
        })),
        metadata: {
          filename: validationData.filename,
          defaultHourlyRate: validationData.defaultHourlyRate,
          socialChargesRate: validationData.socialChargesRate, // ✅ NOUVEAU
          validationStats: validationData.statistics,
        },
      };

      const response = await fetch("/api/payroll/confirmed-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'import");
      }

      await response.json();
      toast.success("Import réalisé avec succès!");

      // Redirection vers l'historique
      router.push(
        `/dashboard/mandates/${validationData.mandate.id}/payroll/history`
      );
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'import"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const getMatchIcon = (matchType: string) => {
    switch (matchType) {
      case "exact":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "partial":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "none":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getMatchBadge = (matchType: string, confidence: number) => {
    switch (matchType) {
      case "exact":
        return (
          <Badge className="bg-green-100 text-green-800">
            Exact ({confidence}%)
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Partiel ({confidence}%)
          </Badge>
        );
      case "none":
        return <Badge variant="destructive">Aucun</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const selectedMandate = mandates.find((m) => m.id === selectedMandateId);

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton
        href="/dashboard/payroll"
        label="Retour à la masse salariale"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Import avec Validation
          </h1>
          <p className="text-muted-foreground">
            Validez et corrigez les données avant l&apos;import final
          </p>
        </div>
      </div>

      {/* Étape 1: Configuration */}
      {!validationData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Configuration de l&apos;import
            </CardTitle>
            <CardDescription>
              Sélectionnez vos paramètres pour valider le fichier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Établissement */}
              <div className="space-y-2">
                <Label htmlFor="mandate">
                  Établissement <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedMandateId}
                  onValueChange={setSelectedMandateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un établissement..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mandates.map((mandate) => (
                      <SelectItem key={mandate.id} value={mandate.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {mandate.group === "HEBERGEMENT"
                              ? "Hébergement"
                              : "Restauration"}
                          </Badge>
                          {mandate.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Période */}
              <div className="space-y-2">
                <Label htmlFor="period">
                  Période (Mois) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="period"
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
              </div>

              {/* Taux par défaut */}
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">
                  Taux horaire par défaut (CHF){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.05"
                  min="0"
                  value={defaultHourlyRate}
                  onChange={(e) => setDefaultHourlyRate(e.target.value)}
                  placeholder="25.00"
                />
              </div>

              {/* Charges sociales */}
              <div className="space-y-2">
                <Label htmlFor="socialChargesRate">
                  Taux charges sociales (%)
                </Label>
                <Input
                  id="socialChargesRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={socialChargesRate}
                  onChange={(e) => setSocialChargesRate(e.target.value)}
                  placeholder="22.0"
                />
                <p className="text-xs text-muted-foreground">
                  Pourcentage appliqué au salaire brut pour calculer les charges sociales
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Fichier */}
              <div className="space-y-2">
                <Label htmlFor="file">
                  Fichier CSV <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {selectedFile
                      ? selectedFile.name
                      : "Sélectionner fichier CSV"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Bouton validation */}
            <div className="pt-4">
              <Button
                onClick={handleValidate}
                disabled={
                  !selectedFile ||
                  !selectedMandateId ||
                  !defaultHourlyRate ||
                  !socialChargesRate ||
                  isValidating
                }
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Valider le fichier
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Résultats de validation */}
      {validationData && (
        <>
          {/* Statistiques de validation */}
          <Card>
            <CardHeader>
              <CardTitle>Résultats de la validation</CardTitle>
              <CardDescription>
                Analyse du fichier &quot;{validationData.filename}&quot; pour{" "}
                {selectedMandate?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {validationData.statistics.totalEmployees}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    Total employés
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {validationData.statistics.exactMatches}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Correspondances exactes
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {validationData.statistics.partialMatches}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Correspondances partielles
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {validationData.statistics.noMatches}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Aucune correspondance
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      validationData.statistics.estimatedTotalCost
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Salaire brut
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      validationData.statistics.estimatedTotalWithCharges
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Coût total employeur
                  </div>
                  <div className="text-xs text-muted-foreground">
                    (+{validationData.socialChargesRate}% charges)
                  </div>
                </div>
              </div>

              {validationData.statistics.needsReview > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {validationData.statistics.needsReview} employé(s)
                      nécessitent une vérification
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table de validation détaillée */}
          <Card>
            <CardHeader>
              <CardTitle>Validation détaillée</CardTitle>
              <CardDescription>
                Vérifiez et corrigez les données avant l&apos;import final
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé CSV</TableHead>
                    <TableHead>ID CSV</TableHead>
                    <TableHead>Correspondance</TableHead>
                    <TableHead>Employé trouvé</TableHead>
                    <TableHead className="text-right">Heures</TableHead>
                    <TableHead className="text-right">Taux/h</TableHead>
                    <TableHead className="text-right">Coût</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationData.validationResults.map((employee, index) => (
                    <TableRow
                      key={index}
                      className={employee.needsReview ? "bg-yellow-50" : ""}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {employee.employeeId || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMatchIcon(employee.matchType)}
                          {getMatchBadge(
                            employee.matchType,
                            employee.matchConfidence
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.matchedEmployee ? (
                          <div>
                            <div className="font-medium">
                              {employee.matchedEmployee.firstName}{" "}
                              {employee.matchedEmployee.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {employee.matchedEmployee.employeeId}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Aucun</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {employee.totalHours.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right">
                        {employee.isEditing ? (
                          <Input
                            type="number"
                            step="0.05"
                            defaultValue={employee.proposedHourlyRate}
                            className="w-20 h-8"
                            onBlur={(e) => {
                              const newRate = parseFloat(e.target.value);
                              if (!isNaN(newRate)) {
                                handleSaveEmployee(index, newRate);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div>
                            <span>
                              {formatCurrency(employee.proposedHourlyRate)}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {employee.rateSource === "employee"
                                ? "Employé"
                                : employee.rateSource === "manual"
                                  ? "Manuel"
                                  : "Défaut"}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(employee.estimatedCost)}
                      </TableCell>
                      <TableCell>
                        {employee.needsReview ? (
                          <div className="space-y-1">
                            <Badge variant="destructive" className="text-xs">
                              À vérifier
                            </Badge>
                            {employee.issues.map((issue, i) => (
                              <div key={i} className="text-xs text-red-600">
                                {issue}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            Validé
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmployee(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Actions finales */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {isImporting ? (
                  <Button
                    onClick={handleFinalImport}
                    disabled={isImporting}
                    className="flex-1"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Import en cours...
                  </Button>
                ) : (
                  <Button onClick={handleFinalImport} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Confirmer l&apos;import (
                    {validationData.statistics.totalEmployees} employés)
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setValidationData(null)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Recommencer
                </Button>
              </div>

              {validationData.statistics.needsReview > 0 && (
                <div className="mt-3 text-sm text-yellow-700">
                  ⚠️ Attention: {validationData.statistics.needsReview}{" "}
                  employé(s) ont encore des problèmes. L&apos;import est
                  possible mais vérifiez les données.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
