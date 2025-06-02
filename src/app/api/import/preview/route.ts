// src/app/api/import/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as XLSX from "xlsx";

interface ExcelMandateRow {
  Id?: string;
  Nom?: string;
  Catégorie?: string;
  Monnaie?: string;
}

interface ExcelDayValueRow {
  Date?: string;
  Valeur?: string | number;
  Mandant?: string;
}

interface PreviewResult {
  success: boolean;
  message: string;
  data: {
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
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer le fichier depuis FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Lire le fichier Excel
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, {
      cellDates: true,
      cellNF: true,
      cellFormula: false,
    });

    // Vérifier que les feuilles requises existent
    if (
      !workbook.SheetNames.includes("Mandants") ||
      !workbook.SheetNames.includes("DayValues")
    ) {
      return NextResponse.json({
        success: false,
        message:
          "Fichier Excel invalide. Les feuilles 'Mandants' et 'DayValues' sont requises.",
        data: {
          mandates: [],
          dayValues: {
            total: 0,
            preview: [],
            dateRange: { start: "", end: "" },
          },
          errors: ["Feuilles 'Mandants' et 'DayValues' manquantes"],
          warnings: [],
        },
      });
    }

    const result = await generatePreview(workbook);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la prévisualisation:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du traitement du fichier",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function generatePreview(
  workbook: XLSX.WorkBook
): Promise<PreviewResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Analyser les mandants
    const mandantsSheet = workbook.Sheets["Mandants"];
    const mandantsData = XLSX.utils.sheet_to_json(mandantsSheet, {
      raw: false,
    }) as ExcelMandateRow[];

    const mandatesPreview = mandantsData.map((row: ExcelMandateRow, index) => {
      const rowData = row;
      const mandate = {
        id: rowData.Id || `ligne-${index + 2}`,
        name: rowData.Nom || "",
        category: rowData.Catégorie || "",
        currency: rowData.Monnaie || "CHF",
        status: "new" as "new" | "existing" | "error",
        error: undefined as string | undefined,
      };

      // Validation
      if (!mandate.name) {
        mandate.status = "error";
        mandate.error = "Nom manquant";
      } else if (!mandate.category) {
        mandate.status = "error";
        mandate.error = "Catégorie manquante";
      } else if (
        !["Hébergement", "Restauration", "hébergement", "restauration"].some(
          (cat) => mandate.category.toLowerCase().includes(cat.toLowerCase())
        )
      ) {
        mandate.status = "error";
        mandate.error =
          "Catégorie invalide (doit être Hébergement ou Restauration)";
      }

      return mandate;
    });

    // 2. Analyser les valeurs journalières
    const dayValuesSheet = workbook.Sheets["DayValues"];
    const dayValuesData = XLSX.utils.sheet_to_json(dayValuesSheet, {
      raw: false,
    }) as ExcelDayValueRow[];

    const validDates: Date[] = [];
    const dayValuesPreview = dayValuesData.slice(0, 10).map((row) => {
      const value = {
        date: row.Date || "",
        value: parseFloat(row.Valeur as string) || 0,
        mandateName: row.Mandant || "",
        status: "new" as "new" | "existing" | "error",
        error: undefined as string | undefined,
      };

      // Validation de la date
      let parsedDate: Date | null = null;
      try {
        if (value.date.includes("/")) {
          const parts = value.date.split("/");
          if (parts.length === 3) {
            let year = parseInt(parts[2]);
            if (year < 100) {
              year += year < 50 ? 2000 : 1900;
            }
            parsedDate = new Date(
              year,
              parseInt(parts[0]) - 1,
              parseInt(parts[1])
            );
          }
        } else {
          parsedDate = new Date(value.date);
        }

        if (!parsedDate || isNaN(parsedDate.getTime())) {
          throw new Error("Date invalide");
        }

        validDates.push(parsedDate);
        value.date = parsedDate.toISOString().split("T")[0];
      } catch {
        value.status = "error";
        value.error = "Format de date invalide";
      }

      // Validation de la valeur
      if (isNaN(value.value) || value.value < 0) {
        value.status = "error";
        value.error = value.error
          ? value.error + ", valeur invalide"
          : "Valeur invalide";
      }

      // Validation du mandat
      if (!value.mandateName) {
        value.status = "error";
        value.error = value.error
          ? value.error + ", mandat manquant"
          : "Mandat manquant";
      }

      return value;
    });

    // Calculer la plage de dates
    let dateRange = { start: "", end: "" };
    if (validDates.length > 0) {
      const minDate = new Date(Math.min(...validDates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...validDates.map((d) => d.getTime())));
      dateRange = {
        start: minDate.toISOString().split("T")[0],
        end: maxDate.toISOString().split("T")[0],
      };
    }

    // Générer des avertissements
    const mandateErrors = mandatesPreview.filter(
      (m) => m.status === "error"
    ).length;
    const valueErrors = dayValuesPreview.filter(
      (v) => v.status === "error"
    ).length;

    if (mandateErrors > 0) {
      warnings.push(`${mandateErrors} mandat(s) contiennent des erreurs`);
    }

    if (valueErrors > 0) {
      warnings.push(
        `${valueErrors} valeur(s) sur les 10 premières contiennent des erreurs`
      );
    }

    if (dayValuesData.length > 1000) {
      warnings.push(
        `Fichier volumineux: ${dayValuesData.length} valeurs à importer`
      );
    }

    return {
      success: true,
      message: "Prévisualisation générée avec succès",
      data: {
        mandates: mandatesPreview,
        dayValues: {
          total: dayValuesData.length,
          preview: dayValuesPreview,
          dateRange,
        },
        errors,
        warnings,
      },
    };
  } catch (error) {
    console.error(
      "Erreur lors de la génération de la prévisualisation:",
      error
    );
    return {
      success: false,
      message: "Erreur lors de l'analyse du fichier",
      data: {
        mandates: [],
        dayValues: { total: 0, preview: [], dateRange: { start: "", end: "" } },
        errors: [`Erreur d'analyse: ${error}`],
        warnings,
      },
    };
  }
}
