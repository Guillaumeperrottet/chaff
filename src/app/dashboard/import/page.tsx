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
  Info,
  Download,
  Loader2,
  HelpCircle,
  Zap,
  Clock,
} from "lucide-react";
import { ImportHelp } from "@/app/components/ImportHelp";
import * as XLSX from "xlsx";

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

interface ChunkedProgress {
  chunkIndex: number;
  totalChunks: number;
  processedRows: number;
  percentage: number;
}

interface ImportData {
  [key: string]: string | number | Date | null | undefined;
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
  const chunkedFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [progress, setProgress] = useState(0);

  // Nouveaux états pour l'import par chunks
  const [chunkedProgress, setChunkedProgress] =
    useState<ChunkedProgress | null>(null);
  const [chunkedStats, setChunkedStats] = useState<ImportStats | null>(null);

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
    setChunkedProgress(null);
    setChunkedStats(null);

    // Générer automatiquement la prévisualisation
    await generatePreview(file);
  };

  // NOUVELLE FONCTION: Import par chunks
  const handleChunkedImport = async (file: File) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Format de fichier non supporté");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB pour chunks
      toast.error("Fichier trop volumineux (max 100MB)");
      return;
    }

    setIsUploading(true);
    setChunkedProgress(null);
    setChunkedStats(null);

    try {
      // Lire le fichier Excel
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, {
        cellDates: true,
        cellNF: true,
        cellFormula: false,
      });

      // Vérifier les feuilles
      if (
        !workbook.SheetNames.includes("Mandants") ||
        !workbook.SheetNames.includes("DayValues")
      ) {
        throw new Error("Feuilles 'Mandants' et 'DayValues' requises");
      }

      // Extraire les données
      const mandantsData = XLSX.utils.sheet_to_json(
        workbook.Sheets["Mandants"],
        { raw: false }
      ) as ImportData[];
      const dayValuesData = XLSX.utils.sheet_to_json(
        workbook.Sheets["DayValues"],
        { raw: false }
      ) as ImportData[];

      console.log(
        `📊 Fichier analysé: ${mandantsData.length} mandats, ${dayValuesData.length} valeurs`
      );

      // Déterminer la taille de chunk optimale
      const CHUNK_SIZE = 1000;
      const totalData = mandantsData.length + dayValuesData.length;
      const chunks = Math.ceil(totalData / CHUNK_SIZE);

      console.log(`📦 Création de ${chunks} chunks de ${CHUNK_SIZE} éléments`);

      // Générer ID de session
      const sessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Diviser en chunks
      const dataChunks: Array<{
        mandates: ImportData[];
        dayValues: ImportData[];
      }> = [];

      // Premier chunk avec tous les mandats
      dataChunks.push({
        mandates: mandantsData,
        dayValues: dayValuesData.slice(
          0,
          Math.max(0, CHUNK_SIZE - mandantsData.length)
        ),
      });

      // Chunks suivants avec seulement des valeurs
      const remainingValues = dayValuesData.slice(
        Math.max(0, CHUNK_SIZE - mandantsData.length)
      );
      for (let i = 0; i < remainingValues.length; i += CHUNK_SIZE) {
        dataChunks.push({
          mandates: [],
          dayValues: remainingValues.slice(i, i + CHUNK_SIZE),
        });
      }

      // Traiter les chunks
      await processChunks(dataChunks, sessionId);
    } catch (error) {
      console.error("Erreur import par chunks:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'import"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const processChunks = async (
    chunks: Array<{ mandates: ImportData[]; dayValues: ImportData[] }>,
    sessionId: string
  ) => {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isFirstChunk = i === 0;
      const isLastChunk = i === chunks.length - 1;

      try {
        console.log(`📦 Envoi chunk ${i + 1}/${chunks.length}...`);

        const response = await fetch("/api/import/chunked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chunkIndex: i,
            totalChunks: chunks.length,
            sessionId,
            mandates: chunk.mandates,
            dayValues: chunk.dayValues,
            isFirstChunk,
            isLastChunk,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Erreur chunk ${i + 1}: ${error.error}`);
        }

        const result = await response.json();

        // Mettre à jour la progression
        setChunkedProgress({
          chunkIndex: result.progress.chunkIndex,
          totalChunks: result.progress.totalChunks,
          processedRows: result.progress.processedRows,
          percentage: result.progress.percentage,
        });

        // Mettre à jour les stats
        setChunkedStats(result.stats);

        // Afficher les erreurs importantes
        if (result.errors.length > 0) {
          result.errors.slice(0, 2).forEach((error: string) => {
            toast.warning(`Chunk ${i + 1}: ${error}`);
          });
        }

        // Si c'est le dernier chunk
        if (isLastChunk && result.finalStats) {
          setChunkedStats(result.finalStats);
          toast.success(
            `Import terminé! ${result.finalStats.valuesCreated} valeurs importées`
          );
        }

        // Pause entre chunks
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Erreur chunk ${i + 1}:`, error);
        toast.error(`Erreur chunk ${i + 1}: ${error}`);
        throw error;
      }
    }
  };

  const generatePreview = async (file: File) => {
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
      // Generate preview completed
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
    setChunkedProgress(null);
    setChunkedStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (chunkedFileInputRef.current) {
      chunkedFileInputRef.current.value = "";
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
                Choisissez la méthode d&apos;import adaptée à votre fichier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportHelp />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import classique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Import classique
            </CardTitle>
            <CardDescription>
              Pour les fichiers de taille normale (moins de 5,000 lignes)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✅ Rapide et simple</p>
              <p>✅ Prévisualisation incluse</p>
              <p>⚠️ Limite: 5,000 lignes</p>
              <p>⚠️ Timeout possible sur gros fichiers</p>
            </div>

            {!selectedFile ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Sélectionner fichier
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {selectedFile.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {previewData && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Aperçu:</span>
                      <span>
                        {previewData.dayValues?.total || 0} valeurs détectées
                      </span>
                    </div>

                    {previewData.errors?.length > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {previewData.errors.length} erreur(s) détectée(s)
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        Prêt pour l&apos;import
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={
                      isUploading ||
                      !!(
                        previewData?.errors?.length &&
                        previewData.errors.length > 0
                      )
                    }
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Import...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Importer
                      </>
                    )}
                  </Button>
                  <Button onClick={handleReset} variant="outline">
                    Reset
                  </Button>
                </div>

                {isUploading && progress > 0 && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {progress}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import par chunks - NOUVEAU */}
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Import par chunks
              <Badge variant="secondary" className="text-xs">
                Recommandé
              </Badge>
            </CardTitle>
            <CardDescription>
              Pour les gros fichiers (5,000+ lignes) - Évite les timeouts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>🚀 Supporte les gros fichiers</p>
              <p>📊 Progression en temps réel</p>
              <p>🔄 Récupération en cas d&apos;erreur</p>
              <p>⚡ Traitement optimisé</p>
            </div>

            {!chunkedProgress ? (
              <div>
                <input
                  ref={chunkedFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleChunkedImport(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <Button
                  onClick={() => chunkedFileInputRef.current?.click()}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Import par chunks
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Chunk {chunkedProgress.chunkIndex}/
                      {chunkedProgress.totalChunks}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {chunkedProgress.percentage}%
                    </span>
                  </div>
                  <Progress
                    value={chunkedProgress.percentage}
                    className="h-3"
                  />
                </div>

                {chunkedStats && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-green-600">
                        Créées:
                      </span>
                      <div>{chunkedStats.valuesCreated}</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">
                        Mises à jour:
                      </span>
                      <div>{chunkedStats.valuesSkipped}</div>
                    </div>
                    <div>
                      <span className="font-medium text-purple-600">
                        Mandats:
                      </span>
                      <div>
                        {chunkedStats.mandatesCreated +
                          chunkedStats.mandatesUpdated}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Erreurs:</span>
                      <div>{chunkedStats.errors.length}</div>
                    </div>
                  </div>
                )}

                {chunkedProgress.percentage === 100 && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Import terminé!</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Résultats */}
      {(importResult || chunkedStats) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Résultats de l&apos;import
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Affichage des résultats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult?.stats.valuesCreated ||
                    chunkedStats?.valuesCreated ||
                    0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Valeurs créées
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult?.stats.mandatesCreated ||
                    chunkedStats?.mandatesCreated ||
                    0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Mandats créés
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {importResult?.stats.mandatesUpdated ||
                    chunkedStats?.mandatesUpdated ||
                    0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Mandats mis à jour
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult?.stats.errors.length ||
                    chunkedStats?.errors.length ||
                    0}
                </div>
                <div className="text-sm text-muted-foreground">Erreurs</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button onClick={() => router.push("/dashboard")}>
                Retour au dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions existantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p>
              <strong>🔄 Import par chunks:</strong> Utilisez cette méthode pour
              votre fichier de 11,913 lignes
            </p>
            <p>
              <strong>📊 Progression:</strong> Suivez l&apos;avancement en temps
              réel
            </p>
            <p>
              <strong>🔒 Fiabilité:</strong> En cas d&apos;erreur, les données
              déjà traitées sont conservées
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
