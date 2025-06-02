// src/app/api/import/route.ts
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

    // Traitement des données
    const result = await processExcelData(workbook);

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

async function processExcelData(
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
    // 1. Traiter les mandants d'abord
    const mandantsSheet = workbook.Sheets["Mandants"];
    const mandantsData: ExcelMandant[] = XLSX.utils.sheet_to_json(
      mandantsSheet,
      { raw: false }
    );

    console.log(`📋 Traitement de ${mandantsData.length} mandants...`);

    const mandateMapping = new Map<string, string>(); // MandantId -> mandateId en DB

    for (const mandantRow of mandantsData) {
      try {
        // Validation des données
        if (!mandantRow.Id || !mandantRow.Nom || !mandantRow.Catégorie) {
          stats.errors.push(`Mandant invalide: ${JSON.stringify(mandantRow)}`);
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

        // Vérifier si le mandat existe déjà
        const existingMandate = await prisma.mandate.findFirst({
          where: { name: mandantRow.Nom },
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
        } else {
          // Créer nouveau mandat
          const newMandate = await prisma.mandate.create({
            data: {
              name: mandantRow.Nom,
              group,
              active: true,
            },
          });
          mandateMapping.set(mandantRow.Id, newMandate.id);
          stats.mandatesCreated++;
        }
      } catch (error) {
        stats.errors.push(
          `Erreur lors du traitement du mandant ${mandantRow.Nom}: ${error}`
        );
      }
    }

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
        batch.map(async (valueRow) => {
          try {
            // Validation des données
            if (!valueRow.Date || !valueRow.Valeur || !valueRow.MandantId) {
              stats.errors.push(`Valeur invalide: ${JSON.stringify(valueRow)}`);
              return;
            }

            // Récupérer l'ID du mandat
            const mandateId = mandateMapping.get(valueRow.MandantId);
            if (!mandateId) {
              stats.errors.push(
                `Mandat non trouvé pour MandantId: ${valueRow.MandantId}`
              );
              return;
            }

            // Parser la date
            let date: Date;
            try {
              // Essayer plusieurs formats de date
              if (valueRow.Date.includes("/")) {
                // Format MM/DD/YY ou M/D/YY
                const parts = valueRow.Date.split("/");
                if (parts.length === 3) {
                  let year = parseInt(parts[2]);
                  // Si l'année est sur 2 chiffres, ajouter 2000
                  if (year < 100) {
                    year += year < 50 ? 2000 : 1900;
                  }
                  date = new Date(
                    year,
                    parseInt(parts[0]) - 1,
                    parseInt(parts[1])
                  );
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
              return;
            }

            // Parser la valeur
            const value = parseFloat(valueRow.Valeur);
            if (isNaN(value) || value < 0) {
              stats.errors.push(
                `Valeur invalide pour ${valueRow.Mandant}: ${valueRow.Valeur}`
              );
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
            }
          } catch (error) {
            stats.errors.push(
              `Erreur lors du traitement de la valeur ${valueRow.Mandant} ${valueRow.Date}: ${error}`
            );
          }
        })
      );

      // Log de progression
      console.log(
        `📊 Traité ${Math.min(i + batchSize, dayValuesData.length)}/${dayValuesData.length} valeurs`
      );
    }

    // 3. Mettre à jour les statistiques des mandats
    console.log("🔄 Mise à jour des statistiques des mandats...");

    for (const mandateId of mandateMapping.values()) {
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
    }

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
