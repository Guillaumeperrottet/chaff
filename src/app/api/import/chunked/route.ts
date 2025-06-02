import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface MandateRow {
  Id: string;
  Nom: string;
  Catégorie: string;
  Monnaie?: string;
}

interface DayValueRow {
  Date: string;
  Valeur: string;
  MandantId: string;
  Mandant?: string;
}

interface ChunkedImportRequest {
  chunkIndex: number;
  totalChunks: number;
  sessionId: string;
  mandates: MandateRow[];
  dayValues: DayValueRow[];
  isFirstChunk: boolean;
  isLastChunk: boolean;
}

interface ImportSession {
  id: string;
  userId: string;
  totalRows: number;
  processedRows: number;
  mandatesCreated: number;
  mandatesUpdated: number;
  valuesCreated: number;
  valuesSkipped: number;
  errors: string[];
  mandateMapping: Record<string, string>;
  status: "pending" | "processing" | "completed" | "error";
  createdAt: Date;
}

// Stockage temporaire des sessions (en production, utiliser Redis ou DB)
const importSessions = new Map<string, ImportSession>();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Vérification auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body: ChunkedImportRequest = await request.json();
    const {
      chunkIndex,
      totalChunks,
      sessionId,
      mandates,
      dayValues,
      isFirstChunk,
      isLastChunk,
    } = body;

    console.log(
      `📦 Traitement chunk ${chunkIndex + 1}/${totalChunks} (${mandates.length} mandats, ${dayValues.length} valeurs)`
    );

    // Récupérer ou créer la session d'import
    let importSession = importSessions.get(sessionId);

    if (!importSession && isFirstChunk) {
      importSession = {
        id: sessionId,
        userId: session.user.id,
        totalRows: 0,
        processedRows: 0,
        mandatesCreated: 0,
        mandatesUpdated: 0,
        valuesCreated: 0,
        valuesSkipped: 0,
        errors: [],
        mandateMapping: {},
        status: "pending",
        createdAt: new Date(),
      };
      importSessions.set(sessionId, importSession);
    }

    if (!importSession) {
      return NextResponse.json(
        { error: "Session d'import non trouvée" },
        { status: 404 }
      );
    }

    importSession.status = "processing";

    // Traiter le chunk actuel avec les corrections
    const result = await processChunkDataFixed(
      mandates,
      dayValues,
      importSession
    );

    // Mettre à jour la progression
    importSession.processedRows += result.processed;
    importSession.mandatesCreated += result.mandatesCreated;
    importSession.mandatesUpdated += result.mandatesUpdated;
    importSession.valuesCreated += result.valuesCreated;
    importSession.valuesSkipped += result.valuesSkipped;
    importSession.errors.push(...result.errors);

    // Si c'est le dernier chunk, finaliser
    if (isLastChunk) {
      await finalizeMandateStats(Object.values(importSession.mandateMapping));
      importSession.status = "completed";

      console.log(`✅ Import terminé - Stats finales:`, {
        mandatesCreated: importSession.mandatesCreated,
        mandatesUpdated: importSession.mandatesUpdated,
        valuesCreated: importSession.valuesCreated,
        valuesSkipped: importSession.valuesSkipped,
        errors: importSession.errors.length,
      });

      // Nettoyer après 5 minutes
      setTimeout(() => {
        importSessions.delete(sessionId);
      }, 300000);
    }

    return NextResponse.json({
      success: true,
      progress: {
        chunkIndex: chunkIndex + 1,
        totalChunks,
        processedRows: importSession.processedRows,
        percentage:
          totalChunks > 0
            ? Math.round(((chunkIndex + 1) / totalChunks) * 100)
            : 0,
      },
      stats: {
        mandatesCreated: importSession.mandatesCreated,
        mandatesUpdated: importSession.mandatesUpdated,
        valuesCreated: importSession.valuesCreated,
        valuesSkipped: importSession.valuesSkipped,
      },
      errors: result.errors,
      isComplete: isLastChunk,
      finalStats: isLastChunk
        ? {
            mandatesCreated: importSession.mandatesCreated,
            mandatesUpdated: importSession.mandatesUpdated,
            valuesCreated: importSession.valuesCreated,
            valuesSkipped: importSession.valuesSkipped,
            errors: importSession.errors,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ Erreur lors du traitement du chunk:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du traitement",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function processChunkDataFixed(
  mandates: MandateRow[],
  dayValues: DayValueRow[],
  session: ImportSession
): Promise<{
  processed: number;
  mandatesCreated: number;
  mandatesUpdated: number;
  valuesCreated: number;
  valuesSkipped: number;
  errors: string[];
}> {
  const result = {
    processed: 0,
    mandatesCreated: 0,
    mandatesUpdated: 0,
    valuesCreated: 0,
    valuesSkipped: 0,
    errors: [] as string[],
  };

  try {
    // 🔧 CORRECTION 1: Traiter les mandats SANS transaction globale
    if (mandates.length > 0) {
      console.log(
        `📋 Traitement de ${mandates.length} mandats sans transaction globale`
      );

      for (const mandateRow of mandates) {
        try {
          // Validation
          if (!mandateRow.Id || !mandateRow.Nom || !mandateRow.Catégorie) {
            result.errors.push(
              `Mandant invalide: ${JSON.stringify(mandateRow)}`
            );
            continue;
          }

          // Mapper la catégorie
          let group: "HEBERGEMENT" | "RESTAURATION";
          const category = mandateRow.Catégorie.toLowerCase().trim();

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
            result.errors.push(
              `Catégorie inconnue pour ${mandateRow.Nom}: "${mandateRow.Catégorie}"`
            );
            continue;
          }

          // 🔧 UTILISER UPSERT au lieu de findFirst + update/create
          const mandate = await prisma.mandate.upsert({
            where: { name: mandateRow.Nom.trim() },
            update: {
              group,
              active: true,
            },
            create: {
              name: mandateRow.Nom.trim(),
              group,
              active: true,
            },
          });

          session.mandateMapping[mandateRow.Id] = mandate.id;

          // Compter si c'était une création ou mise à jour
          const wasExisting = await prisma.mandate.count({
            where: {
              name: mandateRow.Nom.trim(),
              createdAt: { lt: mandate.updatedAt },
            },
          });

          if (wasExisting > 0) {
            result.mandatesUpdated++;
          } else {
            result.mandatesCreated++;
          }

          result.processed++;
          console.log(`✅ Mandat traité: ${mandateRow.Nom} -> ${mandate.id}`);
        } catch (error) {
          const errorMsg = `Erreur mandat ${mandateRow.Nom}: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }

    // 🔧 CORRECTION 2: Traiter les valeurs par petits lots avec transactions courtes
    if (dayValues.length > 0) {
      console.log(
        `📊 Traitement de ${dayValues.length} valeurs par petits lots`
      );

      const BATCH_SIZE = 50; // Réduire la taille des lots pour éviter les timeouts

      for (let i = 0; i < dayValues.length; i += BATCH_SIZE) {
        const batch = dayValues.slice(i, i + BATCH_SIZE);
        console.log(
          `📦 Lot ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} valeurs`
        );

        // Transaction courte pour chaque petit lot
        try {
          await prisma.$transaction(
            async (tx) => {
              for (const valueRow of batch) {
                try {
                  // Validation
                  if (
                    !valueRow.Date ||
                    !valueRow.Valeur ||
                    !valueRow.MandantId
                  ) {
                    result.errors.push(
                      `Valeur invalide: ${JSON.stringify(valueRow)}`
                    );
                    continue;
                  }

                  // Récupérer l'ID du mandat
                  const mandateId = session.mandateMapping[valueRow.MandantId];
                  if (!mandateId) {
                    result.errors.push(
                      `Mandat non trouvé pour MandantId: ${valueRow.MandantId}`
                    );
                    continue;
                  }

                  // Parser la date avec gestion d'erreur
                  let date: Date;
                  try {
                    date = parseSmartDate(valueRow.Date);
                  } catch (dateError) {
                    result.errors.push(
                      `Date invalide pour ${valueRow.Mandant}: "${valueRow.Date}" - ${dateError}`
                    );
                    continue;
                  }

                  // Parser la valeur avec gestion d'erreur
                  let value: number;
                  try {
                    value = parseSmartValue(valueRow.Valeur);
                  } catch (valueError) {
                    result.errors.push(
                      `Valeur invalide pour ${valueRow.Mandant}: "${valueRow.Valeur}" - ${valueError}`
                    );
                    continue;
                  }

                  // 🔧 UTILISER UPSERT pour éviter les conflits
                  await tx.dayValue.upsert({
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

                  result.valuesCreated++;
                  result.processed++;

                  console.log(
                    `✅ Valeur: ${valueRow.Mandant} - ${date.toISOString().split("T")[0]} = ${value}`
                  );
                } catch (error) {
                  const errorMsg = `Erreur valeur ${valueRow.Mandant} ${valueRow.Date}: ${error}`;
                  result.errors.push(errorMsg);
                  console.error(`❌ ${errorMsg}`);
                }
              }
            },
            {
              // 🔧 CONFIGURATION TRANSACTION: Timeout plus court
              maxWait: 10000, // 10 secondes max d'attente
              timeout: 30000, // 30 secondes max d'exécution
            }
          );

          console.log(
            `✅ Lot ${Math.floor(i / BATCH_SIZE) + 1} traité avec succès`
          );
        } catch (transactionError) {
          console.error(
            `❌ Erreur transaction lot ${Math.floor(i / BATCH_SIZE) + 1}:`,
            transactionError
          );

          // 🔧 FALLBACK: Traiter individuellement si la transaction échoue
          console.log(
            `🔄 Fallback: traitement individuel pour le lot ${Math.floor(i / BATCH_SIZE) + 1}`
          );

          for (const valueRow of batch) {
            try {
              await processSingleValue(valueRow, session, result);
            } catch (individualError) {
              result.errors.push(
                `Erreur individuelle ${valueRow.Mandant}: ${individualError}`
              );
            }
          }
        }

        // 🔧 PAUSE entre les lots pour éviter la surcharge
        if (i + BATCH_SIZE < dayValues.length) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms pause
        }
      }
    }
  } catch (error) {
    const errorMsg = `Erreur générale processChunk: ${error}`;
    result.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }

  return result;
}

// 🔧 NOUVELLE FONCTION: Traitement individuel en fallback
async function processSingleValue(
  valueRow: DayValueRow,
  session: ImportSession,
  result: {
    processed: number;
    mandatesCreated: number;
    mandatesUpdated: number;
    valuesCreated: number;
    valuesSkipped: number;
    errors: string[];
  }
) {
  // Validation
  if (!valueRow.Date || !valueRow.Valeur || !valueRow.MandantId) {
    result.errors.push(`Valeur invalide: ${JSON.stringify(valueRow)}`);
    return;
  }

  const mandateId = session.mandateMapping[valueRow.MandantId];
  if (!mandateId) {
    result.errors.push(
      `Mandat non trouvé pour MandantId: ${valueRow.MandantId}`
    );
    return;
  }

  // Parser date et valeur
  const date = parseSmartDate(valueRow.Date);
  const value = parseSmartValue(valueRow.Valeur);

  // Insertion individuelle
  await prisma.dayValue.upsert({
    where: {
      date_mandateId: {
        date: date,
        mandateId: mandateId,
      },
    },
    update: { value },
    create: {
      date: date,
      value: value,
      mandateId: mandateId,
    },
  });

  result.valuesCreated++;
  result.processed++;
}

// 🔧 FONCTIONS DE PARSING (mêmes que précédemment)
function parseSmartDate(dateValue: string | Date): Date {
  if (dateValue instanceof Date) return dateValue;

  const dateStr = String(dateValue).trim();

  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);

      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      // Détection format DD/MM vs MM/DD
      if (day > 12) {
        return new Date(Date.UTC(year, month - 1, day));
      } else if (month > 12) {
        [day, month] = [month, day];
        return new Date(Date.UTC(year, month - 1, day));
      } else {
        // Format européen par défaut
        return new Date(Date.UTC(year, month - 1, day));
      }
    }
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Format de date non reconnu: "${dateStr}"`);
  }
  return date;
}

function parseSmartValue(valueStr: string | number): number {
  const valueString = String(valueStr).trim();

  const hasCommaAndDot = valueString.includes(",") && valueString.includes(".");
  const lastCommaPos = valueString.lastIndexOf(",");
  const lastDotPos = valueString.lastIndexOf(".");

  let normalizedValue: string;

  if (hasCommaAndDot) {
    if (lastCommaPos > lastDotPos) {
      // "2.500,75" - virgule = décimal
      normalizedValue = valueString.replace(/\./g, "").replace(",", ".");
    } else {
      // "1,250.75" - point = décimal
      normalizedValue = valueString.replace(/,/g, "");
    }
  } else if (valueString.includes(",")) {
    const commaPos = valueString.lastIndexOf(",");
    const afterComma = valueString.substring(commaPos + 1);

    if (
      afterComma.length <= 2 &&
      !/\d{4,}/.test(valueString.substring(0, commaPos))
    ) {
      // Décimal
      normalizedValue = valueString.replace(",", ".");
    } else {
      // Milliers
      normalizedValue = valueString.replace(/,/g, "");
    }
  } else {
    normalizedValue = valueString;
  }

  const cleanValue = normalizedValue.replace(/[^\d.-]/g, "");
  const parsedValue = parseFloat(cleanValue);

  if (isNaN(parsedValue) || parsedValue < 0) {
    throw new Error(`Valeur numérique invalide: "${valueString}"`);
  }

  return parsedValue;
}

async function finalizeMandateStats(mandateIds: string[]) {
  console.log(`🔄 Mise à jour des stats pour ${mandateIds.length} mandats...`);

  const batchSize = 5; // Réduire encore plus pour éviter les problèmes

  for (let i = 0; i < mandateIds.length; i += batchSize) {
    const batch = mandateIds.slice(i, i + batchSize);

    // Traitement séquentiel pour éviter les conflits
    for (const mandateId of batch) {
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

        console.log(
          `📈 Stats mises à jour pour ${mandateId}: ${stats._sum.value}`
        );
      } catch (error) {
        console.error(`❌ Erreur stats mandat ${mandateId}:`, error);
        // Continuer même en cas d'erreur sur un mandat
      }
    }

    // Pause entre les lots
    if (i + batchSize < mandateIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}
