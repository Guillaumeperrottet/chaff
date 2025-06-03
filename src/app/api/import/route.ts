import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as XLSX from "xlsx";

interface ExcelMandant {
  Id: string;
  Nom: string;
  Monnaie?: string;
  Catégorie: string;
}

interface ExcelDayValue {
  Date: string;
  Valeur: string;
  MandantId: string;
  Mandant: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  stats: {
    mandatesCreated: number;
    mandatesUpdated: number;
    valuesCreated: number;
    valuesSkipped: number;
    errors: string[];
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("🚀 Début de l'import Excel");

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

    console.log(
      `📁 Fichier reçu: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    );

    // Vérifier le type de fichier
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format de fichier non supporté. Utilisez .xlsx ou .xls" },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 50MB)" },
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

    console.log(`📋 Feuilles trouvées: ${workbook.SheetNames.join(", ")}`);

    // Vérifier que les feuilles requises existent
    if (
      !workbook.SheetNames.includes("Mandants") ||
      !workbook.SheetNames.includes("DayValues")
    ) {
      return NextResponse.json(
        {
          error:
            "Fichier Excel invalide. Les feuilles 'Mandants' et 'DayValues' sont requises.",
          foundSheets: workbook.SheetNames,
        },
        { status: 400 }
      );
    }

    // Traitement des données avec la méthode robuste
    const result = await processExcelDataRobust(workbook);

    console.log("✅ Import terminé avec succès");
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Erreur lors de l'import:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du traitement du fichier",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function parseSmartDate(dateValue: string | number | Date): Date {
  if (dateValue instanceof Date) {
    return dateValue;
  }

  const dateStr = String(dateValue).trim();
  console.log(`📅 Parsing date: "${dateStr}"`);

  // 🔥 CORRECTION SPÉCIFIQUE pour le format M/D/YY (format américain)
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const first = parseInt(parts[0]);
      const second = parseInt(parts[1]);
      let year = parseInt(parts[2]);

      // Corriger l'année sur 2 chiffres
      if (year < 100) {
        year += year >= 22 ? 1900 : 2000; // 22-99 = 1922-1999, 00-21 = 2000-2021
      }

      // 🎯 NOUVELLE LOGIQUE DE DÉTECTION
      if (first > 12 && second <= 12) {
        // Format DD/MM/YYYY (jour > 12, mois <= 12)
        console.log(`  Format DD/MM/YYYY détecté: ${first}/${second}/${year}`);
        return new Date(Date.UTC(year, second - 1, first));
      } else if (second > 12 && first <= 12) {
        // Format MM/DD/YYYY (mois > 12, jour <= 12) - INVERSION
        console.log(
          `  Format MM/DD/YYYY détecté: ${first}/${second}/${year} -> ${second}/${first}/${year}`
        );
        return new Date(Date.UTC(year, first - 1, second));
      } else if (first <= 12 && second <= 12) {
        // 🔥 CAS AMBIGU: Détection intelligente basée sur le contexte

        // Règle 1: Si c'est clairement un fichier américain (détecté par d'autres indices)
        // Pour vos données, on peut assumer format américain MM/DD/YY
        console.log(
          `  Format ambigu ${first}/${second}/${year} - ASSUME FORMAT AMÉRICAIN MM/DD/YY`
        );

        // Vérification de cohérence : éviter les dates futures impossibles
        const usDate = new Date(Date.UTC(year, first - 1, second)); // MM/DD
        const euDate = new Date(Date.UTC(year, second - 1, first)); // DD/MM
        const maxValidDate = new Date("2025-06-01"); // Votre limite

        if (usDate <= maxValidDate && euDate > maxValidDate) {
          console.log(
            `  Choix format US car date EU serait future: ${usDate.toISOString().split("T")[0]} vs ${euDate.toISOString().split("T")[0]}`
          );
          return usDate;
        } else if (euDate <= maxValidDate && usDate > maxValidDate) {
          console.log(
            `  Choix format EU car date US serait future: ${euDate.toISOString().split("T")[0]} vs ${usDate.toISOString().split("T")[0]}`
          );
          return euDate;
        } else {
          // Par défaut, format américain pour vos données
          console.log(
            `  Défaut format américain MM/DD/YY: ${usDate.toISOString().split("T")[0]}`
          );
          return usDate;
        }
      }
    }
  }

  // Autres formats existants...
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return new Date(
          Date.UTC(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2])
          )
        );
      }
    }
  }

  // Fallback
  const directParse = new Date(dateStr);
  if (!isNaN(directParse.getTime())) {
    return directParse;
  }

  throw new Error(`Format de date non reconnu: "${dateStr}"`);
}
// Fonction pour parser intelligemment les valeurs numériques
function parseSmartValue(valueStr: string | number): number {
  const valueString = String(valueStr).trim();
  console.log(`💰 Parsing value: "${valueString}"`);

  // Détecter le format du nombre
  const hasCommaAndDot = valueString.includes(",") && valueString.includes(".");
  const lastCommaPos = valueString.lastIndexOf(",");
  const lastDotPos = valueString.lastIndexOf(".");

  let normalizedValue: string;

  if (hasCommaAndDot) {
    // Format avec virgule ET point - déterminer lequel est le séparateur décimal
    if (lastCommaPos > lastDotPos) {
      // "2.500,75" - virgule = décimal, point = milliers
      normalizedValue = valueString.replace(/\./g, "").replace(",", ".");
    } else {
      // "1,250.75" - point = décimal, virgule = milliers
      normalizedValue = valueString.replace(/,/g, "");
    }
  } else if (valueString.includes(",")) {
    // Seulement virgule - peut être milliers ou décimal
    const commaPos = valueString.lastIndexOf(",");
    const afterComma = valueString.substring(commaPos + 1);

    if (
      afterComma.length <= 2 &&
      !/\d{4,}/.test(valueString.substring(0, commaPos))
    ) {
      // Probablement décimal (ex: "850,25")
      normalizedValue = valueString.replace(",", ".");
    } else {
      // Probablement milliers (ex: "1,250")
      normalizedValue = valueString.replace(/,/g, "");
    }
  } else {
    // Seulement point ou pas de séparateur
    normalizedValue = valueString;
  }

  // Enlever les espaces et autres caractères non numériques
  const cleanValue = normalizedValue.replace(/[^\d.-]/g, "");
  const parsedValue = parseFloat(cleanValue);

  if (isNaN(parsedValue) || parsedValue < 0) {
    throw new Error(`Valeur numérique invalide: "${valueString}"`);
  }

  return parsedValue;
}

// Nouvelle fonction robuste pour le traitement des données Excel
async function processExcelDataRobust(
  workbook: XLSX.WorkBook
): Promise<ImportResult> {
  const stats = {
    mandatesCreated: 0,
    mandatesUpdated: 0,
    valuesCreated: 0,
    valuesSkipped: 0,
    errors: [] as string[],
  };

  try {
    // 1. Traiter les mandats avec UPSERT (plus robuste)
    const mandantsSheet = workbook.Sheets["Mandants"];
    const mandantsData: ExcelMandant[] = XLSX.utils.sheet_to_json(
      mandantsSheet,
      { raw: false }
    );

    console.log(
      `📋 Traitement de ${mandantsData.length} mandants avec UPSERT...`
    );

    const mandateMapping = new Map<string, string>();

    // 🔧 TRAITEMENT SÉQUENTIEL des mandats (pas de transaction globale)
    for (const mandantRow of mandantsData) {
      try {
        if (!mandantRow.Id || !mandantRow.Nom || !mandantRow.Catégorie) {
          stats.errors.push(`Mandant invalide: ${JSON.stringify(mandantRow)}`);
          continue;
        }

        // Mapper la catégorie
        let group: "HEBERGEMENT" | "RESTAURATION";
        const category = mandantRow.Catégorie.toLowerCase().trim();

        if (
          category.includes("hébergement") ||
          category.includes("hebergement") ||
          category === "hébergement"
        ) {
          group = "HEBERGEMENT";
        } else if (
          category.includes("restauration") ||
          category === "restauration"
        ) {
          group = "RESTAURATION";
        } else {
          stats.errors.push(
            `Catégorie inconnue pour ${mandantRow.Nom}: "${mandantRow.Catégorie}"`
          );
          continue;
        }

        // 🔧 UPSERT au lieu de find + create/update
        const existingCount = await prisma.mandate.count({
          where: { name: mandantRow.Nom.trim() },
        });

        const mandate = await prisma.mandate.upsert({
          where: { name: mandantRow.Nom.trim() },
          update: {
            group,
            active: true,
          },
          create: {
            name: mandantRow.Nom.trim(),
            group,
            active: true,
          },
        });

        mandateMapping.set(mandantRow.Id, mandate.id);

        if (existingCount > 0) {
          stats.mandatesUpdated++;
          console.log(`🔄 Mandat mis à jour: ${mandantRow.Nom}`);
        } else {
          stats.mandatesCreated++;
          console.log(`🆕 Nouveau mandat: ${mandantRow.Nom}`);
        }
      } catch (error) {
        const errorMsg = `Erreur mandat ${mandantRow.Nom}: ${error}`;
        stats.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // 2. Traiter les valeurs par TRÈS petits lots
    const dayValuesSheet = workbook.Sheets["DayValues"];
    const dayValuesData: ExcelDayValue[] = XLSX.utils.sheet_to_json(
      dayValuesSheet,
      { raw: false }
    );

    console.log(
      `📊 Traitement de ${dayValuesData.length} valeurs par petits lots...`
    );

    const SMALL_BATCH_SIZE = 25; // Très petit pour éviter les timeouts

    for (let i = 0; i < dayValuesData.length; i += SMALL_BATCH_SIZE) {
      const batch = dayValuesData.slice(i, i + SMALL_BATCH_SIZE);
      const batchNumber = Math.floor(i / SMALL_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(dayValuesData.length / SMALL_BATCH_SIZE);

      console.log(
        `📦 Lot ${batchNumber}/${totalBatches}: ${batch.length} valeurs`
      );

      // 🔧 Sans transaction (plus robuste)
      for (const valueRow of batch) {
        try {
          await processSingleValueRobust(
            valueRow,
            mandateMapping,
            stats,
            i + batch.indexOf(valueRow)
          );
        } catch (error) {
          const errorMsg = `Erreur valeur individuelle: ${error}`;
          stats.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Pause entre les lots
      if (i + SMALL_BATCH_SIZE < dayValuesData.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Log de progression
      if (batchNumber % 10 === 0 || batchNumber === totalBatches) {
        console.log(
          `📊 Progression: ${Math.min(i + SMALL_BATCH_SIZE, dayValuesData.length)}/${dayValuesData.length} valeurs (${Math.round(((i + SMALL_BATCH_SIZE) / dayValuesData.length) * 100)}%)`
        );
      }
    }

    // 3. Mettre à jour les statistiques (séquentiellement)
    console.log("🔄 Mise à jour des statistiques des mandats...");

    for (const [excelId, mandateId] of mandateMapping.entries()) {
      try {
        const mandateStats = await prisma.dayValue.aggregate({
          where: { mandateId },
          _sum: { value: true },
          _max: { date: true },
        });

        await prisma.mandate.update({
          where: { id: mandateId },
          data: {
            totalRevenue: mandateStats._sum.value || 0,
            lastEntry: mandateStats._max.date,
          },
        });

        console.log(`📈 Stats ${mandateId}: ${mandateStats._sum.value}`);
      } catch (error) {
        console.error(`❌ Erreur stats ${excelId}:`, error);
        stats.errors.push(`Erreur stats ${excelId}: ${error}`);
      }

      // Petite pause entre chaque mise à jour
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log("✅ Import robuste terminé!");
    return {
      success: true,
      message: `Import terminé: ${stats.valuesCreated} valeurs créées, ${stats.valuesSkipped} mises à jour`,
      stats,
    };
  } catch (error) {
    console.error("❌ Erreur générale:", error);
    return {
      success: false,
      message: "Erreur lors du traitement",
      stats: {
        ...stats,
        errors: [...stats.errors, `Erreur générale: ${error}`],
      },
    };
  }
}

// Fonction auxiliaire pour le traitement individuel robuste des valeurs
async function processSingleValueRobust(
  valueRow: ExcelDayValue,
  mandateMapping: Map<string, string>,
  stats: ImportResult["stats"],
  index: number
) {
  // Validation
  if (!valueRow.Date || !valueRow.Valeur || !valueRow.MandantId) {
    const error = `Valeur invalide [ligne ${index + 1}]: ${JSON.stringify(valueRow)}`;
    stats.errors.push(error);
    return;
  }

  // Récupérer mandat
  const mandateId = mandateMapping.get(valueRow.MandantId);
  if (!mandateId) {
    const error = `Mandat non trouvé [ligne ${index + 1}] pour MandantId: ${valueRow.MandantId}`;
    stats.errors.push(error);
    return;
  }

  // Parser date et valeur
  let date: Date, value: number;

  try {
    date = parseSmartDate(valueRow.Date);
  } catch (dateError) {
    const error = `Date invalide [ligne ${index + 1}]: "${valueRow.Date}" - ${dateError}`;
    stats.errors.push(error);
    return;
  }

  try {
    value = parseSmartValue(valueRow.Valeur);
  } catch (valueError) {
    const error = `Valeur invalide [ligne ${index + 1}]: "${valueRow.Valeur}" - ${valueError}`;
    stats.errors.push(error);
    return;
  }

  // UPSERT individuel (très robuste)
  try {
    const result = await prisma.dayValue.upsert({
      where: {
        date_mandateId: {
          date: date,
          mandateId: mandateId,
        },
      },
      update: {
        value: value,
      },
      create: {
        date: date,
        value: value,
        mandateId: mandateId,
      },
    });

    // Déterminer si c'est une création ou une mise à jour
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      stats.valuesCreated++;
    } else {
      stats.valuesSkipped++;
    }

    if (index % 100 === 0) {
      console.log(
        `✅ [${index + 1}] ${valueRow.Mandant}: ${date.toISOString().split("T")[0]} = ${value}`
      );
    }
  } catch (upsertError) {
    const error = `Erreur UPSERT [ligne ${index + 1}]: ${upsertError}`;
    stats.errors.push(error);
    console.error(`❌ ${error}`);
  }
}
