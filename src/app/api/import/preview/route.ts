// src/app/api/import/route.ts - Version optimisée
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

    // Augmenter la limite de taille pour les gros fichiers
    const maxSize = 50 * 1024 * 1024; // 50MB au lieu de 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 50MB)" },
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
      return NextResponse.json(
        {
          error:
            "Fichier Excel invalide. Les feuilles 'Mandants' et 'DayValues' sont requises.",
        },
        { status: 400 }
      );
    }

    // Traitement des données avec optimisations
    const result = await processExcelDataOptimized(workbook);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de l'import:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du traitement du fichier",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function processExcelDataOptimized(
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
    // 1. Traiter les mandants d'abord (plus rapide)
    const mandantsSheet = workbook.Sheets["Mandants"];
    const mandantsData: ExcelMandant[] = XLSX.utils.sheet_to_json(
      mandantsSheet,
      { raw: false }
    );

    console.log(`📋 Traitement de ${mandantsData.length} mandants...`);

    const mandateMapping = new Map<string, string>(); // MandantId -> mandateId en DB

    // Traiter tous les mandants en une seule transaction
    await prisma.$transaction(async (tx) => {
      for (const mandantRow of mandantsData) {
        try {
          // Validation des données
          if (!mandantRow.Id || !mandantRow.Nom || !mandantRow.Catégorie) {
            stats.errors.push(
              `Mandant invalide: ${JSON.stringify(mandantRow)}`
            );
            continue;
          }

          // Mapper la catégorie
          let group: "HEBERGEMENT" | "RESTAURATION";
          if (
            mandantRow.Catégorie.toLowerCase().includes("hébergement") ||
            mandantRow.Catégorie.toLowerCase().includes("hebergement")
          ) {
            group = "HEBERGEMENT";
          } else if (
            mandantRow.Catégorie.toLowerCase().includes("restauration")
          ) {
            group = "RESTAURATION";
          } else {
            stats.errors.push(
              `Catégorie inconnue pour ${mandantRow.Nom}: ${mandantRow.Catégorie}`
            );
            continue;
          }

          // Utiliser upsert pour éviter les doublons
          const mandate = await tx.mandate.upsert({
            where: { name: mandantRow.Nom },
            update: {
              group,
              active: true,
            },
            create: {
              name: mandantRow.Nom,
              group,
              active: true,
            },
          });

          mandateMapping.set(mandantRow.Id, mandate.id);

          if (mandate) {
            // Vérifier si c'était une création ou une mise à jour
            const existing = await tx.mandate.findFirst({
              where: { name: mandantRow.Nom, id: { not: mandate.id } },
            });
            if (existing) {
              stats.mandatesUpdated++;
            } else {
              stats.mandatesCreated++;
            }
          }
        } catch (error) {
          stats.errors.push(
            `Erreur lors du traitement du mandant ${mandantRow.Nom}: ${error}`
          );
        }
      }
    });

    // 2. Traiter les valeurs journalières avec optimisations massives
    const dayValuesSheet = workbook.Sheets["DayValues"];
    const dayValuesData: ExcelDayValue[] = XLSX.utils.sheet_to_json(
      dayValuesSheet,
      { raw: false }
    );

    console.log(
      `📊 Traitement de ${dayValuesData.length} valeurs journalières...`
    );

    // Optimisation: traiter par beaucoup plus gros lots
    const batchSize = 500; // Augmenté de 100 à 500
    const maxBatches = 20; // Limite le nombre de lots pour éviter les timeouts

    // Si trop de données, proposer un import en plusieurs fois
    if (dayValuesData.length > batchSize * maxBatches) {
      return {
        success: false,
        message: `Fichier trop volumineux: ${dayValuesData.length} valeurs. Maximum supporté: ${batchSize * maxBatches}. Veuillez diviser votre fichier en plusieurs parties.`,
        stats,
      };
    }

    for (let i = 0; i < dayValuesData.length; i += batchSize) {
      const batch = dayValuesData.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(dayValuesData.length / batchSize);

      console.log(
        `📊 Traitement lot ${batchNumber}/${totalBatches} (${batch.length} valeurs)`
      );

      // Traitement optimisé par transaction
      await processBatchOptimized(batch, mandateMapping, stats);

      // Log de progression
      console.log(
        `📊 Traité ${Math.min(i + batchSize, dayValuesData.length)}/${dayValuesData.length} valeurs`
      );
    }

    // 3. Mise à jour des statistiques en lot
    console.log("🔄 Mise à jour des statistiques des mandats...");
    await updateMandateStatsInBatch(Array.from(mandateMapping.values()));

    return {
      success: true,
      message: "Import terminé avec succès",
      stats,
    };
  } catch (error) {
    console.error("Erreur lors du traitement des données:", error);
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

async function processBatchOptimized(
  batch: ExcelDayValue[],
  mandateMapping: Map<string, string>,
  stats: ImportResult["stats"]
) {
  // Préparer les données pour l'insertion en lot
  const validValues: Array<{
    date: Date;
    value: number;
    mandateId: string;
  }> = [];

  // Validation et préparation des données
  for (const valueRow of batch) {
    try {
      // Validation des données
      if (!valueRow.Date || !valueRow.Valeur || !valueRow.MandantId) {
        stats.errors.push(`Valeur invalide: ${JSON.stringify(valueRow)}`);
        continue;
      }

      // Récupérer l'ID du mandat
      const mandateId = mandateMapping.get(valueRow.MandantId);
      if (!mandateId) {
        stats.errors.push(
          `Mandat non trouvé pour MandantId: ${valueRow.MandantId}`
        );
        continue;
      }

      // Parser la date
      let date: Date;
      try {
        if (valueRow.Date.includes("/")) {
          const parts = valueRow.Date.split("/");
          if (parts.length === 3) {
            let year = parseInt(parts[2]);
            if (year < 100) {
              year += year < 50 ? 2000 : 1900;
            }
            date = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
          } else {
            throw new Error("Format de date invalide");
          }
        } else {
          date = new Date(valueRow.Date);
        }

        if (isNaN(date.getTime())) {
          throw new Error("Date invalide");
        }
      } catch {
        stats.errors.push(
          `Date invalide pour ${valueRow.Mandant}: ${valueRow.Date}`
        );
        continue;
      }

      // Parser la valeur
      const value = parseFloat(valueRow.Valeur);
      if (isNaN(value) || value < 0) {
        stats.errors.push(
          `Valeur invalide pour ${valueRow.Mandant}: ${valueRow.Valeur}`
        );
        continue;
      }

      validValues.push({ date, value, mandateId });
    } catch (error) {
      stats.errors.push(
        `Erreur lors du traitement de la valeur ${valueRow.Mandant} ${valueRow.Date}: ${error}`
      );
    }
  }

  // Insertion en lot avec upsert
  if (validValues.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const validValue of validValues) {
        try {
          await tx.dayValue.upsert({
            where: {
              date_mandateId: {
                date: validValue.date,
                mandateId: validValue.mandateId,
              },
            },
            update: {
              value: validValue.value,
            },
            create: {
              date: validValue.date,
              value: validValue.value,
              mandateId: validValue.mandateId,
            },
          });
          stats.valuesCreated++;
        } catch {
          // Si erreur d'upsert, c'est probablement une valeur existante
          stats.valuesSkipped++;
        }
      }
    });
  }
}

async function updateMandateStatsInBatch(mandateIds: string[]) {
  // Traiter les mises à jour de stats par petits lots
  const batchSize = 10;

  for (let i = 0; i < mandateIds.length; i += batchSize) {
    const batch = mandateIds.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (mandateId) => {
        try {
          const stats = await prisma.dayValue.aggregate({
            where: { mandateId },
            _sum: { value: true },
            _max: { date: true },
          });

          await prisma.mandate.update({
            where: { id: mandateId },
            data: {
              totalRevenue: stats._sum.value || 0,
              lastEntry: stats._max.date,
            },
          });
        } catch (error) {
          console.error(
            `Erreur lors de la mise à jour des stats pour ${mandateId}:`,
            error
          );
        }
      })
    );
  }
}
