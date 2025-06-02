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
    // 1. Traiter les mandats d'abord
    if (mandates.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const mandateRow of mandates) {
          try {
            // Validation
            if (!mandateRow.Id || !mandateRow.Nom || !mandateRow.Catégorie) {
              result.errors.push(
                `Mandant invalide: ${JSON.stringify(mandateRow)}`
              );
              continue;
            }

            // 🔧 CORRECTION: Mapper correctement la catégorie
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
                `Catégorie inconnue pour ${mandateRow.Nom}: "${mandateRow.Catégorie}". Utilisez "Hébergement" ou "Restauration"`
              );
              continue;
            }

            // Vérifier si existe déjà
            const existing = await tx.mandate.findFirst({
              where: { name: mandateRow.Nom.trim() },
            });

            if (existing) {
              // Mettre à jour
              await tx.mandate.update({
                where: { id: existing.id },
                data: { group, active: true },
              });
              session.mandateMapping[mandateRow.Id] = existing.id;
              result.mandatesUpdated++;
            } else {
              // Créer nouveau
              const newMandate = await tx.mandate.create({
                data: {
                  name: mandateRow.Nom.trim(),
                  group,
                  active: true,
                },
              });
              session.mandateMapping[mandateRow.Id] = newMandate.id;
              result.mandatesCreated++;
            }

            result.processed++;
          } catch (error) {
            result.errors.push(`Erreur mandat ${mandateRow.Nom}: ${error}`);
          }
        }
      });
    }

    // 2. Traiter les valeurs journalières avec corrections
    if (dayValues.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const valueRow of dayValues) {
          try {
            // Validation
            if (!valueRow.Date || !valueRow.Valeur || !valueRow.MandantId) {
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

            // 🔧 CORRECTION MAJEURE: Parser correctement la date
            let date: Date;
            try {
              const dateStr = valueRow.Date.toString().trim();

              if (dateStr.includes("/")) {
                // Format MM/DD/YYYY ou DD/MM/YYYY ou M/D/YY
                const parts = dateStr.split("/");
                if (parts.length === 3) {
                  const month = parseInt(parts[0]);
                  const day = parseInt(parts[1]);
                  let year = parseInt(parts[2]);

                  // Si l'année est sur 2 chiffres, ajouter 2000
                  if (year < 100) {
                    year += year < 50 ? 2000 : 1900;
                  }

                  // Créer la date en UTC pour éviter les problèmes de timezone
                  date = new Date(Date.UTC(year, month - 1, day));
                } else {
                  throw new Error("Format de date invalide");
                }
              } else if (dateStr.includes("-")) {
                // Format YYYY-MM-DD ou DD-MM-YYYY
                const parts = dateStr.split("-");
                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    // YYYY-MM-DD
                    date = new Date(
                      Date.UTC(
                        parseInt(parts[0]),
                        parseInt(parts[1]) - 1,
                        parseInt(parts[2])
                      )
                    );
                  } else {
                    // DD-MM-YYYY
                    date = new Date(
                      Date.UTC(
                        parseInt(parts[2]),
                        parseInt(parts[1]) - 1,
                        parseInt(parts[0])
                      )
                    );
                  }
                } else {
                  throw new Error("Format de date invalide");
                }
              } else {
                date = new Date(dateStr);
              }

              if (isNaN(date.getTime())) {
                throw new Error("Date invalide");
              }
            } catch {
              result.errors.push(
                `Date invalide pour ${valueRow.Mandant}: "${valueRow.Date}"`
              );
              continue;
            }

            // 🔧 CORRECTION: Parser correctement la valeur
            let value: number;
            try {
              const valueStr = valueRow.Valeur.toString().trim();
              // Remplacer les virgules par des points pour le parsing
              const normalizedValue = valueStr.replace(",", ".");
              value = parseFloat(normalizedValue);

              if (isNaN(value) || value < 0) {
                throw new Error("Valeur numérique invalide");
              }
            } catch {
              result.errors.push(
                `Valeur invalide pour ${valueRow.Mandant}: "${valueRow.Valeur}"`
              );
              continue;
            }

            // Vérifier si existe déjà
            const existing = await tx.dayValue.findUnique({
              where: {
                date_mandateId: {
                  date: date,
                  mandateId: mandateId,
                },
              },
            });

            if (existing) {
              // Mettre à jour
              await tx.dayValue.update({
                where: { id: existing.id },
                data: { value },
              });
              result.valuesSkipped++;
            } else {
              // Créer nouveau
              await tx.dayValue.create({
                data: {
                  date: date,
                  value: value,
                  mandateId: mandateId,
                },
              });
              result.valuesCreated++;
            }

            result.processed++;
          } catch (error) {
            result.errors.push(
              `Erreur valeur ${valueRow.Mandant} ${valueRow.Date}: ${error}`
            );
          }
        }
      });
    }
  } catch (error) {
    result.errors.push(`Erreur transaction: ${error}`);
  }

  return result;
}

async function finalizeMandateStats(mandateIds: string[]) {
  console.log(`🔄 Mise à jour des stats pour ${mandateIds.length} mandats...`);

  // Traiter par petits lots pour éviter les timeouts
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
          console.error(`Erreur stats mandat ${mandateId}:`, error);
        }
      })
    );
  }
}
