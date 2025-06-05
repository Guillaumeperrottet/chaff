// src/app/api/payroll/simple-import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as Papa from "papaparse";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mandateId = formData.get("mandateId") as string;
    const period = formData.get("period") as string; // Format: "2025-06"
    const defaultHourlyRate = parseFloat(
      (formData.get("defaultHourlyRate") as string) || "25"
    );

    if (!file || !mandateId || !period) {
      return NextResponse.json(
        { error: "Fichier, mandat et période requis" },
        { status: 400 }
      );
    }

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id: mandateId },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Lire et parser le fichier CSV
    const csvText = await file.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      delimiter: ";",
      skipEmptyLines: true,
    });

    // Traiter les données
    const employees: Array<{
      firstName: string;
      lastName: string;
      totalHours: number;
      hourlyRate: number;
      employeeId?: string;
    }> = [];

    // Type pour les lignes CSV
    type CSVRow = {
      FirstName?: string;
      LastName?: string;
      EmplID?: string;
      [key: string]: string | undefined;
    };

    for (const row of parsed.data as CSVRow[]) {
      if (!row.FirstName || !row.LastName) continue;

      // Calculer le total des heures en sommant toutes les colonnes numériques
      const hourColumns = Object.keys(row).filter(
        (key) =>
          key.match(/^\d{4}$/) && row[key] && !isNaN(parseFloat(row[key]!))
      );

      const totalHours = hourColumns.reduce((sum, col) => {
        return sum + (parseFloat(row[col] || "0") || 0);
      }, 0);

      if (totalHours > 0) {
        employees.push({
          firstName: row.FirstName.trim(),
          lastName: row.LastName.trim(),
          totalHours: totalHours,
          hourlyRate: defaultHourlyRate,
          employeeId: row.EmplID || undefined,
        });
      }
    }

    if (employees.length === 0) {
      return NextResponse.json(
        { error: "Aucun employé avec des heures trouvé dans le fichier" },
        { status: 400 }
      );
    }

    // Calculer la masse salariale totale
    const [year, month] = period.split("-");
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    let totalGrossAmount = 0;
    const employeeCount = employees.length;
    const processedEmployees: Array<{
      name: string;
      hours: number;
      rate: number;
      amount: number;
      employeeFound: boolean;
    }> = [];

    // Traitement dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      for (const emp of employees) {
        // Essayer de trouver/créer l'employé
        let employee = await tx.employee.findFirst({
          where: {
            OR: [
              { employeeId: emp.employeeId },
              {
                AND: [
                  { firstName: emp.firstName },
                  { lastName: emp.lastName },
                  { mandateId: mandateId },
                ],
              },
            ],
          },
        });

        if (!employee && emp.employeeId) {
          // Créer l'employé s'il n'existe pas
          employee = await tx.employee.create({
            data: {
              employeeId: emp.employeeId,
              firstName: emp.firstName,
              lastName: emp.lastName,
              mandateId: mandateId,
              hourlyRate: emp.hourlyRate,
              isActive: true,
            },
          });
        }

        // Calculer le coût pour cet employé
        const grossAmount = emp.totalHours * emp.hourlyRate;
        totalGrossAmount += grossAmount;

        processedEmployees.push({
          name: `${emp.firstName} ${emp.lastName}`,
          hours: emp.totalHours,
          rate: emp.hourlyRate,
          amount: grossAmount,
          employeeFound: !!employee,
        });
      }

      // Calculer les charges sociales (22% par défaut)
      const socialCharges = totalGrossAmount * 0.22;
      const totalCost = totalGrossAmount + socialCharges;

      // Créer ou mettre à jour l'entrée de masse salariale
      const payrollEntry = await tx.manualPayrollEntry.upsert({
        where: {
          mandateId_year_month: {
            mandateId: mandateId,
            year: yearNum,
            month: monthNum,
          },
        },
        update: {
          grossAmount: totalGrossAmount,
          socialCharges: socialCharges,
          totalCost: totalCost,
          employeeCount: employeeCount,
          notes: `Import Gastrotime - ${employees.length} employés`,
          updatedAt: new Date(),
        },
        create: {
          mandateId: mandateId,
          year: yearNum,
          month: monthNum,
          grossAmount: totalGrossAmount,
          socialCharges: socialCharges,
          totalCost: totalCost,
          employeeCount: employeeCount,
          notes: `Import Gastrotime - ${employees.length} employés`,
          createdBy: session.user.id,
        },
      });

      return { payrollEntry, processedEmployees };
    });

    return NextResponse.json({
      success: true,
      message: `Import réalisé avec succès pour ${employees.length} employés`,
      data: {
        period: `${monthNum}/${yearNum}`,
        totalEmployees: employeeCount,
        totalHours: employees.reduce((sum, emp) => sum + emp.totalHours, 0),
        totalGrossAmount: totalGrossAmount,
        socialCharges: totalGrossAmount * 0.22,
        totalCost: totalGrossAmount * 1.22,
        processedEmployees: result.processedEmployees,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'import:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'import",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
