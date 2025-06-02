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

    // Traitement des données avec toutes les corrections
    const result = await processExcelDataComplete(workbook);

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

// Fonction pour parser intelligemment les dates
function parseSmartDate(dateValue: string | number | Date): Date {
  if (dateValue instanceof Date) {
    return dateValue;
  }

  const dateStr = String(dateValue).trim();
  console.log(`📅 Parsing date: "${dateStr}"`);

  if (dateStr.includes("/")) {
    // Format DD/MM/YYYY ou MM/DD/YYYY
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);

      // Si l'année est sur 2 chiffres
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      // Détection intelligente du format
      if (day > 12) {
        // DD/MM/YYYY
        return new Date(Date.UTC(year, month - 1, day));
      } else if (month > 12) {
        // MM/DD/YYYY (inverser)
        [day, month] = [month, day];
        return new Date(Date.UTC(year, month - 1, day));
      } else {
        // Ambiguë - utiliser DD/MM/YYYY par défaut (format européen)
        return new Date(Date.UTC(year, month - 1, day));
      }
    }
  } else if (dateStr.includes("-")) {
    // Format YYYY-MM-DD ou DD-MM-YYYY
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
      } else {
        // DD-MM-YYYY
        return new Date(
          Date.UTC(
            parseInt(parts[2]),
            parseInt(parts[1]) - 1,
            parseInt(parts[0])
          )
        );
      }
    }
  }

  // Fallback: parsing direct
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

async function processExcelDataComplete(
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
    // 1. Traiter les mandats d'abord
    const mandantsSheet = workbook.Sheets["Mandants"];
    const mandantsData: ExcelMandant[] = XLSX.utils.sheet_to_json(
      mandantsSheet,
      { raw: false }
    );

    console.log(`📋 Traitement de ${mandantsData.length} mandants...`);

    const mandateMapping = new Map<string, string>(); // MandantId -> mandateId en DB

    for (const mandantRow of mandantsData) {
      try {
        console.log(`🏢 Traitement mandat: ${JSON.stringify(mandantRow)}`);

        // Validation des données
        if (!mandantRow.Id || !mandantRow.Nom || !mandantRow.Catégorie) {
          const error = `Mandant invalide - Id: "${mandantRow.Id}", Nom: "${mandantRow.Nom}", Catégorie: "${mandantRow.Catégorie}"`;
          stats.errors.push(error);
          console.log(`❌ ${error}`);
          continue;
        }

        // Mapper correctement la catégorie
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
          const error = `Catégorie inconnue pour ${mandantRow.Nom}: "${mandantRow.Catégorie}". Utilisez "Hébergement" ou "Restauration"`;
          stats.errors.push(error);
          console.log(`❌ ${error}`);
          continue;
        }

        // Vérifier si le mandat existe déjà par nom
        const existingMandate = await prisma.mandate.findFirst({
          where: { name: mandantRow.Nom.trim() },
        });

        if (existingMandate) {
          // Mettre à jour si nécessaire
          await prisma.mandate.update({
            where: { id: existingMandate.id },
            data: {
              group,
              active: true,
            },
          });
          mandateMapping.set(mandantRow.Id, existingMandate.id);
          stats.mandatesUpdated++;
          console.log(`🔄 Mandat mis à jour: ${mandantRow.Nom} -> ${group}`);
        } else {
          // Créer nouveau mandat
          const newMandate = await prisma.mandate.create({
            data: {
              name: mandantRow.Nom.trim(),
              group,
              active: true,
            },
          });
          mandateMapping.set(mandantRow.Id, newMandate.id);
          stats.mandatesCreated++;
          console.log(
            `🆕 Nouveau mandat créé: ${mandantRow.Nom} -> ${group} (ID: ${newMandate.id})`
          );
        }
      } catch (error) {
        const errorMsg = `Erreur lors du traitement du mandant ${mandantRow.Nom}: ${error}`;
        stats.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(
      `📊 Mandats traités: ${stats.mandatesCreated} créés, ${stats.mandatesUpdated} mis à jour`
    );

    // 2. Traiter les valeurs journalières
    const dayValuesSheet = workbook.Sheets["DayValues"];
    const dayValuesData: ExcelDayValue[] = XLSX.utils.sheet_to_json(
      dayValuesSheet,
      { raw: false }
    );

    console.log(
      `📊 Traitement de ${dayValuesData.length} valeurs journalières...`
    );

    // Traiter par lot pour éviter les timeouts
    const batchSize = 100;
    for (let i = 0; i < dayValuesData.length; i += batchSize) {
      const batch = dayValuesData.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (valueRow, batchIndex) => {
          const globalIndex = i + batchIndex;
          try {
            console.log(
              `📈 [${globalIndex + 1}/${dayValuesData.length}] Traitement: ${JSON.stringify(valueRow)}`
            );

            // Validation des données
            if (!valueRow.Date || !valueRow.Valeur || !valueRow.MandantId) {
              const error = `Valeur invalide [ligne ${globalIndex + 1}] - Date: "${valueRow.Date}", Valeur: "${valueRow.Valeur}", MandantId: "${valueRow.MandantId}"`;
              stats.errors.push(error);
              console.log(`❌ ${error}`);
              return;
            }

            // Récupérer l'ID du mandat
            const mandateId = mandateMapping.get(valueRow.MandantId);
            if (!mandateId) {
              const error = `Mandat non trouvé pour MandantId: ${valueRow.MandantId} (${valueRow.Mandant}) [ligne ${globalIndex + 1}]`;
              stats.errors.push(error);
              console.log(`❌ ${error}`);
              return;
            }

            // Parser la date avec la nouvelle fonction
            let date: Date;
            try {
              date = parseSmartDate(valueRow.Date);
              console.log(
                `📅 Date parsée: ${valueRow.Date} -> ${date.toISOString().split("T")[0]}`
              );
            } catch (dateError) {
              const error = `Date invalide [ligne ${globalIndex + 1}] pour ${valueRow.Mandant}: "${valueRow.Date}" - ${dateError}`;
              stats.errors.push(error);
              console.log(`❌ ${error}`);
              return;
            }

            // Parser la valeur avec la nouvelle fonction
            let value: number;
            try {
              value = parseSmartValue(valueRow.Valeur);
              console.log(`💰 Valeur parsée: ${valueRow.Valeur} -> ${value}`);
            } catch (valueError) {
              const error = `Valeur invalide [ligne ${globalIndex + 1}] pour ${valueRow.Mandant}: "${valueRow.Valeur}" - ${valueError}`;
              stats.errors.push(error);
              console.log(`❌ ${error}`);
              return;
            }

            // Vérifier si la valeur existe déjà
            const existingValue = await prisma.dayValue.findUnique({
              where: {
                date_mandateId: {
                  date: date,
                  mandateId: mandateId,
                },
              },
            });

            if (existingValue) {
              // Mettre à jour la valeur existante
              await prisma.dayValue.update({
                where: { id: existingValue.id },
                data: { value },
              });
              stats.valuesSkipped++;
              console.log(
                `🔄 Valeur mise à jour: ${valueRow.Mandant} - ${date.toISOString().split("T")[0]} = ${value}`
              );
            } else {
              // Créer nouvelle valeur
              await prisma.dayValue.create({
                data: {
                  date: date,
                  value: value,
                  mandateId: mandateId,
                },
              });
              stats.valuesCreated++;
              console.log(
                `✅ Nouvelle valeur: ${valueRow.Mandant} - ${date.toISOString().split("T")[0]} = ${value}`
              );
            }
          } catch (error) {
            const errorMsg = `Erreur lors du traitement de la valeur [ligne ${globalIndex + 1}] ${valueRow.Mandant} ${valueRow.Date}: ${error}`;
            stats.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        })
      );

      // Log de progression
      console.log(
        `📊 Progression: ${Math.min(i + batchSize, dayValuesData.length)}/${dayValuesData.length} valeurs traitées`
      );
    }

    // 3. Mettre à jour les statistiques des mandats
    console.log("🔄 Mise à jour des statistiques des mandats...");

    for (const [excelId, mandateId] of mandateMapping.entries()) {
      try {
        const mandateStats = await prisma.dayValue.aggregate({
          where: { mandateId },
          _sum: { value: true },
          _max: { date: true },
          _count: { _all: true },
        });

        await prisma.mandate.update({
          where: { id: mandateId },
          data: {
            totalRevenue: mandateStats._sum.value || 0,
            lastEntry: mandateStats._max.date,
          },
        });

        console.log(
          `📈 Stats mises à jour pour mandat ${mandateId}: ${mandateStats._count._all} valeurs, total: ${mandateStats._sum.value}`
        );
      } catch (error) {
        console.error(
          `❌ Erreur lors de la mise à jour des stats pour ${mandateId}:`,
          error
        );
        stats.errors.push(
          `Erreur mise à jour stats mandat ${excelId}: ${error}`
        );
      }
    }

    console.log("✅ Import terminé avec succès!");
    console.log(`📊 Résumé final:`, {
      mandatesCreated: stats.mandatesCreated,
      mandatesUpdated: stats.mandatesUpdated,
      valuesCreated: stats.valuesCreated,
      valuesSkipped: stats.valuesSkipped,
      errors: stats.errors.length,
    });

    return {
      success: true,
      message: `Import terminé avec succès! ${stats.valuesCreated} valeurs créées, ${stats.valuesSkipped} mises à jour.`,
      stats,
    };
  } catch (error) {
    console.error("❌ Erreur lors du traitement des données:", error);
    return {
      success: false,
      message: "Erreur lors du traitement des données",
      stats: {
        ...stats,
        errors: [...stats.errors, `Erreur générale: ${error}`],
      },
    };
  }
}
