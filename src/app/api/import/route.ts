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

  // 🔥 FORMAT EUROPÉEN DD/MM/YY ou DD/MM/YYYY UNIQUEMENT
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0]); // Premier = jour
      const month = parseInt(parts[1]); // Deuxième = mois
      let year = parseInt(parts[2]); // Troisième = année

      // ✅ CORRECTION DE L'ANNÉE POUR VOS DONNÉES MODERNES
      if (year < 100) {
        year += 2000; // Force 20XX : 22 -> 2022, 25 -> 2025
        console.log(`  Année corrigée: ${parts[2]} -> ${year}`);
      }

      // 🎯 VALIDATION FORMAT EUROPÉEN DD/MM
      if (day < 1 || day > 31) {
        throw new Error(`Jour invalide: ${day} (doit être entre 1 et 31)`);
      }

      if (month < 1 || month > 12) {
        throw new Error(`Mois invalide: ${month} (doit être entre 1 et 12)`);
      }

      // 🔒 VALIDATION DATE FUTURE (optionnel)
      const maxValidDate = new Date("2025-06-01");
      const parsedDate = new Date(Date.UTC(year, month - 1, day));

      if (parsedDate > maxValidDate) {
        throw new Error(
          `Date future détectée: ${parsedDate.toISOString().split("T")[0]}. Vérifiez vos données.`
        );
      }

      console.log(
        `  ✅ Format DD/MM/YYYY: ${day}/${month}/${year} -> ${parsedDate.toISOString().split("T")[0]}`
      );
      return parsedDate;
    }
  }

  // 🔥 FORMAT ISO YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      console.log(`  ✅ Format ISO YYYY-MM-DD: ${dateStr}`);
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  // 🔥 FORMAT AVEC TIRETS DD-MM-YYYY
  if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      console.log(`  ✅ Format DD-MM-YYYY: ${day}-${month}-${year}`);
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  // ❌ AUCUN FORMAT RECONNU
  throw new Error(
    `Format de date non reconnu: "${dateStr}". Utilisez DD/MM/YY, DD/MM/YYYY ou YYYY-MM-DD`
  );
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
