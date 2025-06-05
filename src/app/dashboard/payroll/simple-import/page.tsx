// src/app/dashboard/payroll/simple-import/page.tsx
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
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { BackButton } from "@/app/components/ui/BackButton";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  Calculator,
  Users,
  Clock,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface Mandate {
  id: string;
  name: string;
  group: string;
}

interface ProcessedEmployee {
  name: string;
  hours: number;
  rate: number;
  amount: number;
  employeeFound: boolean;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    period: string;
    totalEmployees: number;
    totalHours: number;
    totalGrossAmount: number;
    socialCharges: number;
    totalCost: number;
    processedEmployees: ProcessedEmployee[];
  };
}

export default function SimpleImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMandateId, setSelectedMandateId] = useState<string>("");
  const [period, setPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<string>("25");
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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

    // Vérifications
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Veuillez sélectionner un fichier CSV");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      toast.error("Fichier trop volumineux (max 10MB)");
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedMandateId || !period || !defaultHourlyRate) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mandateId", selectedMandateId);
      formData.append("period", period);
      formData.append("defaultHourlyRate", defaultHourlyRate);

      const response = await fetch("/api/payroll/simple-import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'import");
      }

      setImportResult(result);
      toast.success("Import réalisé avec succès!");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'import"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
            Import Gastrotime Simplifié
          </h1>
          <p className="text-muted-foreground">
            Importez directement le total des heures depuis votre export
            Gastrotime
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire d'import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Configuration de l&apos;import
            </CardTitle>
            <CardDescription>
              Paramètres pour traiter votre fichier CSV Gastrotime
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection de l'établissement */}
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
                disabled={isUploading}
              />
            </div>

            {/* Taux horaire par défaut */}
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
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Sera appliqué à tous les employés du fichier
              </p>
            </div>

            {/* Sélection du fichier */}
            <div className="space-y-2">
              <Label htmlFor="file">
                Fichier CSV Gastrotime <span className="text-red-500">*</span>
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
                  disabled={isUploading}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {selectedFile
                    ? "Changer de fichier"
                    : "Sélectionner fichier CSV"}
                </Button>

                {selectedFile && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Aperçu du calcul */}
            {selectedFile && selectedMandateId && defaultHourlyRate && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Résumé :</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Établissement:</span>
                    <span className="font-medium">{selectedMandate?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Période:</span>
                    <span className="font-medium">
                      {new Date(period + "-01").toLocaleDateString("fr-CH", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux horaire:</span>
                    <span className="font-medium">
                      {defaultHourlyRate} CHF/h
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>Fichier:</span>
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleImport}
                disabled={
                  !selectedFile ||
                  !selectedMandateId ||
                  !period ||
                  !defaultHourlyRate ||
                  isUploading
                }
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculer la masse salariale
                  </>
                )}
              </Button>

              {(selectedFile || importResult) && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isUploading}
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Format attendu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Structure du fichier CSV :</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div>
                    • <span className="font-medium">EmplID</span> - ID employé
                    (optionnel)
                  </div>
                  <div>
                    • <span className="font-medium">FirstName</span> - Prénom
                  </div>
                  <div>
                    • <span className="font-medium">LastName</span> - Nom
                  </div>
                  <div>
                    • <span className="font-medium">0001, 0015, ...</span> -
                    Codes horaires
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">Fonctionnement :</h4>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>
                      Tous les codes horaires (0001, 0015, etc.) sont
                      additionnés
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>Total heures × Taux horaire = Salaire brut</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>+ 22% charges sociales = Coût total</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span>Ajout automatique à la masse salariale du mois</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résultats de l'import */}
      {importResult && importResult.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import réalisé avec succès
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Statistiques globales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.data.totalEmployees}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" />
                  Employés
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {importResult.data.totalHours.toFixed(1)}h
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Total heures
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(importResult.data.totalGrossAmount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Salaire brut
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(importResult.data.totalCost)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Coût total
                </div>
              </div>
            </div>

            {/* Détail par employé */}
            <div className="space-y-3">
              <h4 className="font-medium">Détail par employé :</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead className="text-right">Heures</TableHead>
                    <TableHead className="text-right">Taux/h</TableHead>
                    <TableHead className="text-right">Montant brut</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResult.data.processedEmployees.map((emp, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-right">
                        {emp.hours.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(emp.rate)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(emp.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={emp.employeeFound ? "default" : "secondary"}
                        >
                          {emp.employeeFound ? "Trouvé" : "Nouveau"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Actions après import */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() =>
                  router.push(
                    `/dashboard/mandates/${selectedMandateId}/payroll`
                  )
                }
              >
                Voir la masse salariale
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Nouvel import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
