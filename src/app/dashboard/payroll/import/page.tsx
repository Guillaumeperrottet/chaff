// src/app/dashboard/payroll/import/page.tsx
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
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Progress } from "@/app/components/ui/progress";
import { Badge } from "@/app/components/ui/badge";
import { BackButton } from "@/app/components/ui/BackButton";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  Loader2,
  Users,
  Calendar,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface Mandate {
  id: string;
  name: string;
  group: string;
}

interface ImportResult {
  success: boolean;
  importId?: string;
  stats?: {
    totalRecords: number;
    employeesCreated: number;
    employeesUpdated: number;
    timeEntriesCreated: number;
    errors: string[];
  };
}

interface ImportHistoryItem {
  id: string;
  filename: string;
  importDate: string;
  processedRecords: number;
  status: "COMPLETED" | "PARTIAL" | "FAILED" | "PENDING";
}

export default function PayrollImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMandateId, setSelectedMandateId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchMandates();
  }, []);

  const fetchMandates = async () => {
    try {
      const response = await fetch("/api/mandats");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setMandates(data.filter((m: Mandate) => m.group)); // Filtrer les mandats valides
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des mandats");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifications de base
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez Excel (.xlsx) ou CSV (.csv)");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB
      toast.error("Fichier trop volumineux (max 50MB)");
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedMandateId) {
      toast.error("Veuillez sélectionner un fichier et un établissement");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mandateId", selectedMandateId);

      // Simuler le progress pendant l'upload
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const response = await fetch("/api/payroll/import/gastrotime", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'import");
      }

      setImportResult(result);

      if (result.success) {
        toast.success("Import terminé avec succès!");
      } else {
        toast.error("Import terminé avec des erreurs");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'import"
      );
      setImportResult({
        success: false,
        stats: {
          totalRecords: 0,
          employeesCreated: 0,
          employeesUpdated: 0,
          timeEntriesCreated: 0,
          errors: [error instanceof Error ? error.message : "Erreur inconnue"],
        },
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/payroll/template/gastrotime");
      if (!response.ok) throw new Error("Erreur lors du téléchargement");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_gastrotime_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Template téléchargé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du téléchargement du template");
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton href="/dashboard/employees" label="Retour aux employés" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Import Gastrotime
          </h1>
          <p className="text-muted-foreground">
            Importez les données horaires depuis votre système Gastrotime
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Template Excel
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire d'import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import de données
            </CardTitle>
            <CardDescription>
              Sélectionnez votre fichier d&apos;export Gastrotime
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

            {/* Sélection du fichier */}
            <div className="space-y-2">
              <Label htmlFor="file">
                Fichier Gastrotime <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
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
                  {selectedFile ? "Changer de fichier" : "Sélectionner fichier"}
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
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2 pt-4">
              {isUploading ? (
                <Button
                  onClick={handleImport}
                  disabled={true}
                  className="flex-1"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Import en cours...
                </Button>
              ) : !selectedFile || !selectedMandateId ? (
                <Button
                  onClick={handleImport}
                  disabled={true}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Lancer l&apos;import
                </Button>
              ) : (
                <Button onClick={handleImport} className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Lancer l&apos;import
                </Button>
              )}

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

            {/* Barre de progression */}
            {isUploading && progress > 0 && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {progress}% - Traitement des données...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions et aide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Exportez depuis Gastrotime</h4>
                  <p className="text-sm text-muted-foreground">
                    Utilisez la fonction d&apos;export de votre système
                    Gastrotime pour obtenir un fichier Excel ou CSV.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Vérifiez les colonnes</h4>
                  <p className="text-sm text-muted-foreground">
                    Assurez-vous que votre fichier contient : ID employé, Nom,
                    Prénom, Date, Heure entrée, Heure sortie.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">
                    Sélectionnez l&apos;établissement
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Choisissez l&apos;établissement correspondant aux données du
                    fichier.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-2">
                Colonnes supportées :
              </h4>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>
                  • <span className="font-medium">Employee ID / ID</span> -
                  Identifiant unique
                </div>
                <div>
                  • <span className="font-medium">First Name / Prénom</span> -
                  Prénom de l&apos;employé
                </div>
                <div>
                  • <span className="font-medium">Last Name / Nom</span> - Nom
                  de famille
                </div>
                <div>
                  • <span className="font-medium">Date</span> - Date de travail
                </div>
                <div>
                  • <span className="font-medium">Clock In / Entrée</span> -
                  Heure d&apos;arrivée
                </div>
                <div>
                  • <span className="font-medium">Clock Out / Sortie</span> -
                  Heure de départ
                </div>
                <div>
                  • <span className="font-medium">Break Minutes / Pause</span> -
                  Pause en minutes
                </div>
                <div>
                  • <span className="font-medium">Position / Poste</span> -
                  Poste occupé (optionnel)
                </div>
                <div>
                  • <span className="font-medium">Hourly Rate / Taux</span> -
                  Taux horaire (optionnel)
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger template exemple
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résultats de l'import */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Résultats de l&apos;import
            </CardTitle>
          </CardHeader>
          <CardContent>
            {importResult.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.stats.totalRecords}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Enregistrements traités
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.stats.employeesCreated}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Employés créés
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {importResult.stats.timeEntriesCreated}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Entrées temps créées
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.stats.errors.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Erreurs</div>
                </div>
              </div>
            )}

            {/* Affichage des erreurs */}
            {importResult.stats?.errors &&
              importResult.stats.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">
                    Erreurs rencontrées :
                  </h4>
                  <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3">
                    {importResult.stats.errors
                      .slice(0, 10)
                      .map((error, index) => (
                        <div key={index} className="text-sm text-red-700">
                          • {error}
                        </div>
                      ))}
                    {importResult.stats.errors.length > 10 && (
                      <div className="text-sm text-red-600 font-medium mt-2">
                        ... et {importResult.stats.errors.length - 10} autres
                        erreurs
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Actions après import */}
            <div className="flex gap-2 pt-4">
              <Button onClick={() => router.push("/dashboard/employees")}>
                <Users className="mr-2 h-4 w-4" />
                Voir les employés
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/payroll/calculate")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Calculer la paie
              </Button>

              <Button variant="outline" onClick={handleReset}>
                Nouvel import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des imports récents */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers imports</CardTitle>
          <CardDescription>
            Historique des imports Gastrotime récents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentImportsTable />
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour l'historique des imports
function RecentImportsTable() {
  const [imports, setImports] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentImports();
  }, []);

  const fetchRecentImports = async () => {
    try {
      const response = await fetch("/api/payroll/import/history?limit=5");
      if (response.ok) {
        const data = await response.json();
        setImports(data.data || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (imports.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Aucun import récent
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {imports.slice(0, 3).map((importItem: ImportHistoryItem) => (
        <div
          key={importItem.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div>
            <div className="font-medium">{importItem.filename}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(importItem.importDate).toLocaleDateString("fr-CH")} -
              {importItem.processedRecords} enregistrements
            </div>
          </div>
          <Badge
            variant={
              importItem.status === "COMPLETED"
                ? "default"
                : importItem.status === "PARTIAL"
                  ? "secondary"
                  : importItem.status === "FAILED"
                    ? "destructive"
                    : "outline"
            }
          >
            {importItem.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
