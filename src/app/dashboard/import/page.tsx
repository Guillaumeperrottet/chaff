"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { Badge } from "@/app/components/ui/badge";
import { BackButton } from "@/app/components/ui/BackButton";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { ImportHelp } from "@/app/components/ImportHelp";

interface ImportStats {
  mandatesCreated: number;
  mandatesUpdated: number;
  valuesCreated: number;
  valuesSkipped: number;
  errors: string[];
}

interface ImportResult {
  success: boolean;
  message: string;
  stats: ImportStats;
}

interface PreviewData {
  mandates: Array<{
    id: string;
    name: string;
    category: string;
    currency?: string;
    status: "new" | "existing" | "error";
    error?: string;
  }>;
  dayValues: {
    total: number;
    preview: Array<{
      date: string;
      value: number;
      mandateName: string;
      status: "new" | "existing" | "error";
      error?: string;
    }>;
    dateRange: {
      start: string;
      end: string;
    };
  };
  errors: string[];
  warnings: string[];
}

interface PreviewResult {
  success: boolean;
  message: string;
  data: PreviewData;
}

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [progress, setProgress] = useState(0);

  // Gestion du drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Vérifier le type de fichier
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Format de fichier non supporté. Utilisez un fichier Excel (.xlsx ou .xls)"
      );
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 10MB)");
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    setPreviewData(null);

    // Générer automatiquement la prévisualisation
    await generatePreview(file);
  };

  const generatePreview = async (file: File) => {
    setIsGeneratingPreview(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import/preview", {
        method: "POST",
        body: formData,
      });

      const result: PreviewResult = await response.json();

      if (response.ok && result.success) {
        setPreviewData(result.data);
        if (result.data.warnings.length > 0) {
          result.data.warnings.forEach((warning) => {
            toast.warning(warning);
          });
        }
      } else {
        toast.error(result.message || "Erreur lors de l'analyse du fichier");
        setPreviewData(null);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la génération de la prévisualisation:",
        error
      );
      toast.error("Erreur lors de l'analyse du fichier");
      setPreviewData(null);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simuler le progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result: ImportResult = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de l'import");
      }

      setImportResult(result);

      if (result.success) {
        toast.success("Import terminé avec succès!");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'import"
      );
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue",
        stats: {
          mandatesCreated: 0,
          mandatesUpdated: 0,
          valuesCreated: 0,
          valuesSkipped: 0,
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
    setPreviewData(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/import/template");
      if (!response.ok) throw new Error("Erreur lors du téléchargement");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_import_chaff_${new Date().toISOString().split("T")[0]}.xlsx`;
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
      <BackButton href="/dashboard" label="Retour au dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Import de données
          </h1>
          <p className="text-muted-foreground">
            Importez vos mandats et valeurs journalières depuis un fichier Excel
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          {showHelp ? "Masquer l'aide" : "Afficher l'aide"}
        </Button>
      </div>

      {/* Aide contextuelle */}
      {showHelp && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Guide d&apos;utilisation
              </CardTitle>
              <CardDescription>
                Tout ce que vous devez savoir pour réussir votre import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportHelp />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Zone d'upload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Format requis
              </CardTitle>
              <CardDescription>
                Votre fichier Excel doit contenir deux feuilles spécifiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">
                    Feuille &quot;Mandants&quot;
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • <strong>Id</strong> : Identifiant unique
                    </li>
                    <li>
                      • <strong>Nom</strong> : Nom du mandat
                    </li>
                    <li>
                      • <strong>Catégorie</strong> : Hébergement ou Restauration
                    </li>
                    <li>
                      • <strong>Monnaie</strong> : CHF, EUR (optionnel)
                    </li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">
                    Feuille &quot;DayValues&quot;
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • <strong>Date</strong> : Format MM/DD/YY
                    </li>
                    <li>
                      • <strong>Valeur</strong> : Montant numérique
                    </li>
                    <li>
                      • <strong>MandantId</strong> : Référence au mandat
                    </li>
                    <li>
                      • <strong>Mandant</strong> : Nom du mandat
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger template
                </Button>
                <span className="text-sm text-muted-foreground">
                  Utilisez ce modèle pour structurer vos données
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Zone de upload */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner le fichier</CardTitle>
              <CardDescription>
                Glissez-déposez votre fichier Excel ou cliquez pour le
                sélectionner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="p-4 bg-green-100 rounded-full">
                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={handleImport}
                        disabled={
                          isUploading ||
                          isGeneratingPreview ||
                          !!(previewData && previewData.errors.length > 0)
                        }
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Import en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Lancer l&apos;import
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isUploading || isGeneratingPreview}
                      >
                        Changer de fichier
                      </Button>
                    </div>
                    {isGeneratingPreview && (
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyse du fichier en cours...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="p-4 bg-muted rounded-full">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        Glissez votre fichier Excel ici
                      </p>
                      <p className="text-muted-foreground">
                        ou cliquez pour le sélectionner
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Sélectionner un fichier
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Import en cours...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Résultats et Prévisualisation */}
        <div className="space-y-6">
          {/* Prévisualisation */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Prévisualisation
                </CardTitle>
                <CardDescription>
                  Aperçu des données qui seront importées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Résumé */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Mandats:</span>
                    <div className="text-muted-foreground">
                      {previewData.mandates.length} trouvés
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Valeurs:</span>
                    <div className="text-muted-foreground">
                      {previewData.dayValues.total} entrées
                    </div>
                  </div>
                </div>

                {/* Période */}
                {previewData.dayValues.dateRange.start && (
                  <div className="text-sm">
                    <span className="font-medium">Période:</span>
                    <div className="text-muted-foreground">
                      Du {previewData.dayValues.dateRange.start} au{" "}
                      {previewData.dayValues.dateRange.end}
                    </div>
                  </div>
                )}

                {/* Mandats avec erreurs */}
                {previewData.mandates.some((m) => m.status === "error") && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-red-600">
                      Mandats avec erreurs:
                    </h5>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {previewData.mandates
                        .filter((m) => m.status === "error")
                        .slice(0, 3)
                        .map((mandate, index) => (
                          <div
                            key={index}
                            className="text-xs p-2 bg-red-50 rounded border-l-2 border-red-200"
                          >
                            <div className="font-medium">
                              {mandate.name || `ID: ${mandate.id}`}
                            </div>
                            <div className="text-red-600">{mandate.error}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Erreurs générales */}
                {previewData.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-red-600">
                      Erreurs détectées:
                    </h5>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {previewData.errors.slice(0, 3).map((error, index) => (
                        <p
                          key={index}
                          className="text-xs text-red-600 p-2 bg-red-50 rounded"
                        >
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statut global */}
                <div className="pt-2 border-t">
                  {previewData.errors.length > 0 ? (
                    <Badge variant="destructive">
                      Import impossible - Corrigez les erreurs
                    </Badge>
                  ) : (
                    <Badge variant="default">Prêt pour l&apos;import</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Résultats d'import */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  Résultat de l&apos;import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mandats créés</span>
                    <Badge variant="default">
                      {importResult.stats.mandatesCreated}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mandats mis à jour</span>
                    <Badge variant="secondary">
                      {importResult.stats.mandatesUpdated}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valeurs créées</span>
                    <Badge variant="default">
                      {importResult.stats.valuesCreated}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valeurs existantes</span>
                    <Badge variant="outline">
                      {importResult.stats.valuesSkipped}
                    </Badge>
                  </div>
                </div>

                {importResult.stats.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-red-600">
                      Erreurs ({importResult.stats.errors.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.stats.errors
                        .slice(0, 5)
                        .map((error, index) => (
                          <p
                            key={index}
                            className="text-xs text-red-600 p-2 bg-red-50 rounded"
                          >
                            {error}
                          </p>
                        ))}
                      {importResult.stats.errors.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ... et {importResult.stats.errors.length - 5} autres
                          erreurs
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="w-full"
                  >
                    Retour au dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">💡 Conseils</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  • <strong>Sauvegarde :</strong> Exportez vos données actuelles
                  avant l&apos;import
                </p>
                <p>
                  • <strong>Doublons :</strong> Les valeurs existantes seront
                  mises à jour
                </p>
                <p>
                  • <strong>Formats :</strong> Utilisez le format de date
                  MM/DD/YY
                </p>
                <p>
                  • <strong>Erreurs :</strong> Vérifiez les logs en cas de
                  problème
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
