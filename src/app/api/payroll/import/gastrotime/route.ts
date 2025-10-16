import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as XLSX from "xlsx";

interface GastrotimeRecord {
  employeeId: string;
  firstName: string;
  lastName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: number;
  department: string; // Pour mapper vers mandateId
  position?: string;
  hourlyRate?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organizationId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "Utilisateur sans organisation" },
        { status: 403 }
      );
    }

    // Récupérer le fichier depuis FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mandateId = formData.get("mandateId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (!mandateId) {
      return NextResponse.json(
        { error: "ID du mandat requis" },
        { status: 400 }
      );
    }

    // Vérifier que le mandat existe ET appartient à l'organisation
    const mandate = await prisma.mandate.findFirst({
      where: {
        id: mandateId,
        organizationId: user.organizationId,
      },
    });

    if (!mandate) {
      return NextResponse.json(
        {
          error: "Mandat non trouvé ou non autorisé",
        },
        { status: 404 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format de fichier non supporté. Utilisez Excel ou CSV" },
        { status: 400 }
      );
    }

    // Lire le fichier
    const buffer = Buffer.from(await file.arrayBuffer());
    let data: GastrotimeRecord[];

    if (file.type.includes("csv")) {
      // Traitement CSV
      const csvText = buffer.toString("utf-8");
      data = parseCSV(csvText);
    } else {
      // Traitement Excel
      const workbook = XLSX.read(buffer, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    }

    console.log(`📊 Fichier analysé: ${data.length} enregistrements`);

    // Créer l'enregistrement d'import
    const importRecord = await prisma.gastrotimeImport.create({
      data: {
        filename: file.name,
        periodStart: getMinDate(data),
        periodEnd: getMaxDate(data),
        totalRecords: data.length,
        status: "PROCESSING",
        userId: session.user.id,
      },
    });

    // Traiter les données par lots
    const result = await processGastrotimeData(
      data,
      mandateId,
      importRecord.id
    );

    // Mettre à jour l'import
    await prisma.gastrotimeImport.update({
      where: { id: importRecord.id },
      data: {
        processedRecords: result.processed,
        errorRecords: result.errors.length,
        status: result.errors.length === 0 ? "COMPLETED" : "PARTIAL",
        errors: result.errors,
      },
    });

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      stats: {
        totalRecords: data.length,
        employeesCreated: result.employeesCreated,
        employeesUpdated: result.employeesUpdated,
        timeEntriesCreated: result.timeEntriesCreated,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'import Gastrotime:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du traitement du fichier",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function processGastrotimeData(
  data: GastrotimeRecord[],
  mandateId: string,
  importId: string
) {
  const result = {
    processed: 0,
    employeesCreated: 0,
    employeesUpdated: 0,
    timeEntriesCreated: 0,
    errors: [] as string[],
  };

  const BATCH_SIZE = 50;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);

    try {
      await prisma.$transaction(
        async (tx) => {
          for (const record of batch) {
            try {
              // Validation des données
              if (
                !record.employeeId ||
                !record.firstName ||
                !record.lastName ||
                !record.date
              ) {
                result.errors.push(
                  `Enregistrement invalide ligne ${i + batch.indexOf(record) + 1}`
                );
                continue;
              }

              // Créer ou mettre à jour l'employé
              const existingEmployee = await tx.employee.findUnique({
                where: { employeeId: record.employeeId },
              });

              let employee;
              if (existingEmployee) {
                // Mettre à jour si nécessaire
                employee = await tx.employee.update({
                  where: { employeeId: record.employeeId },
                  data: {
                    firstName: record.firstName,
                    lastName: record.lastName,
                    position: record.position || existingEmployee.position,
                    hourlyRate:
                      record.hourlyRate || existingEmployee.hourlyRate,
                  },
                });
                result.employeesUpdated++;
              } else {
                // Créer nouvel employé
                employee = await tx.employee.create({
                  data: {
                    employeeId: record.employeeId,
                    firstName: record.firstName,
                    lastName: record.lastName,
                    mandateId,
                    position: record.position,
                    hourlyRate: record.hourlyRate,
                  },
                });
                result.employeesCreated++;
              }

              // Parser les heures
              const date = new Date(record.date);
              const clockIn = record.clockIn
                ? parseTime(record.date, record.clockIn)
                : null;
              const clockOut = record.clockOut
                ? parseTime(record.date, record.clockOut)
                : null;

              let workedHours = 0;
              if (clockIn && clockOut) {
                const diffMs = clockOut.getTime() - clockIn.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                workedHours = Math.max(
                  0,
                  diffHours - (record.breakMinutes || 0) / 60
                );
              }

              // Créer ou mettre à jour l'entrée de temps
              await tx.timeEntry.upsert({
                where: {
                  employeeId_date_mandateId: {
                    employeeId: employee.id,
                    date: date,
                    mandateId: mandateId,
                  },
                },
                update: {
                  clockIn,
                  clockOut,
                  breakMinutes: record.breakMinutes || 0,
                  workedHours,
                  hourlyRate: record.hourlyRate || employee.hourlyRate,
                  importSource: "gastrotime",
                  importBatch: importId,
                },
                create: {
                  employeeId: employee.id,
                  mandateId,
                  date,
                  clockIn,
                  clockOut,
                  breakMinutes: record.breakMinutes || 0,
                  workedHours,
                  hourlyRate: record.hourlyRate || employee.hourlyRate,
                  importSource: "gastrotime",
                  importBatch: importId,
                },
              });

              result.timeEntriesCreated++;
              result.processed++;
            } catch (recordError) {
              result.errors.push(
                `Erreur ligne ${i + batch.indexOf(record) + 1}: ${recordError}`
              );
            }
          }
        },
        {
          timeout: 30000, // 30 secondes
        }
      );
    } catch (batchError) {
      console.error(
        `Erreur lot ${Math.floor(i / BATCH_SIZE) + 1}:`,
        batchError
      );
      result.errors.push(
        `Erreur lot ${Math.floor(i / BATCH_SIZE) + 1}: ${batchError}`
      );
    }

    // Pause entre les lots
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return result;
}

function parseCSV(csvText: string): GastrotimeRecord[] {
  const lines = csvText.split("\n");
  const headers = lines[0].split(";").map((h) => h.trim().replace(/"/g, ""));

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(";").map((v) => v.trim().replace(/"/g, ""));
      const record: Record<string, string> = {};

      headers.forEach((header, i) => {
        record[header] = values[i] || "";
      });

      return {
        employeeId:
          record["Employee ID"] || record["EmployeeId"] || record["ID"],
        firstName:
          record["First Name"] || record["Prénom"] || record["FirstName"],
        lastName: record["Last Name"] || record["Nom"] || record["LastName"],
        date: record["Date"] || record["Date de travail"],
        clockIn:
          record["Clock In"] || record["Entrée"] || record["Heure entrée"],
        clockOut:
          record["Clock Out"] || record["Sortie"] || record["Heure sortie"],
        breakMinutes: parseInt(
          record["Break Minutes"] || record["Pause"] || "0"
        ),
        department: record["Department"] || record["Département"] || "",
        position: record["Position"] || record["Poste"] || "",
        hourlyRate: parseFloat(
          record["Hourly Rate"] || record["Taux horaire"] || "0"
        ),
      };
    });
}

function parseTime(dateStr: string, timeStr: string): Date {
  const date = new Date(dateStr);
  const [hours, minutes] = timeStr.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getMinDate(data: GastrotimeRecord[]): Date {
  const dates = data
    .map((r) => new Date(r.date))
    .filter((d) => !isNaN(d.getTime()));
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

function getMaxDate(data: GastrotimeRecord[]): Date {
  const dates = data
    .map((r) => new Date(r.date))
    .filter((d) => !isNaN(d.getTime()));
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}
