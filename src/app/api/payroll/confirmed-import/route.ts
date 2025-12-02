// src/app/api/payroll/confirmed-import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const ConfirmedImportSchema = z.object({
  mandateId: z.string().cuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  employees: z.array(
    z.object({
      employeeId: z.string().optional(),
      firstName: z.string(),
      lastName: z.string(),
      totalHours: z.number().min(0),
      hourlyRate: z.number().min(0),
      matchedEmployeeId: z.string().optional(),
    })
  ),
  metadata: z.object({
    filename: z.string(),
    defaultHourlyRate: z.number(),
    socialChargesRate: z.number().optional().default(22), // ✅ NOUVEAU
    validationStats: z.object({
      totalEmployees: z.number(),
      exactMatches: z.number(),
      partialMatches: z.number(),
      noMatches: z.number(),
      needsReview: z.number(),
      totalHours: z.number(),
      estimatedTotalCost: z.number(),
      estimatedSocialCharges: z.number().optional(), // ✅ NOUVEAU
      estimatedTotalWithCharges: z.number().optional(), // ✅ NOUVEAU
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ConfirmedImportSchema.parse(body);

    const { mandateId, period, employees, metadata } = validatedData;
    const [year, month] = period.split("-");
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id: mandateId },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Calculer les totaux
    let totalGrossAmount = 0;
    let totalHours = 0;
    const processedEmployees: Array<{
      employeeId: string;
      name: string;
      hours: number;
      rate: number;
      amount: number;
    }> = [];

    const result = await prisma.$transaction(async (tx) => {
      // Traiter chaque employé
      for (const empData of employees) {
        const grossAmount = empData.totalHours * empData.hourlyRate;
        totalGrossAmount += grossAmount;
        totalHours += empData.totalHours;

        // Si l'employé a été matché, on peut mettre à jour ses infos si nécessaire
        if (empData.matchedEmployeeId) {
          const existingEmployee = await tx.employee.findUnique({
            where: { id: empData.matchedEmployeeId },
          });

          // Optionnel: Mettre à jour le taux horaire de l'employé s'il a changé
          if (
            existingEmployee &&
            existingEmployee.hourlyRate !== empData.hourlyRate
          ) {
            await tx.employee.update({
              where: { id: empData.matchedEmployeeId },
              data: { hourlyRate: empData.hourlyRate },
            });
          }
        } else {
          // Créer un nouvel employé s'il n'a pas été trouvé
          const newEmployee = await tx.employee.create({
            data: {
              employeeId:
                empData.employeeId ||
                `AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              firstName: empData.firstName,
              lastName: empData.lastName,
              mandateId: mandateId,
              hourlyRate: empData.hourlyRate,
              isActive: true,
              position: "Import Gastrotime", // Position par défaut
            },
          });
          empData.matchedEmployeeId = newEmployee.id;
        }

        processedEmployees.push({
          employeeId: empData.matchedEmployeeId,
          name: `${empData.firstName} ${empData.lastName}`,
          hours: empData.totalHours,
          rate: empData.hourlyRate,
          amount: grossAmount,
        });
      }

      // Calculer les charges sociales avec le taux personnalisé
      const socialChargesRate = metadata.socialChargesRate || 22;
      const socialCharges = totalGrossAmount * (socialChargesRate / 100);
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
          employeeCount: employees.length,
          notes: `Import validé Gastrotime - ${metadata.filename} (charges sociales: ${socialChargesRate}%)`,
          updatedAt: new Date(),
        },
        create: {
          mandateId: mandateId,
          year: yearNum,
          month: monthNum,
          grossAmount: totalGrossAmount,
          socialCharges: socialCharges,
          totalCost: totalCost,
          employeeCount: employees.length,
          notes: `Import validé Gastrotime - ${metadata.filename} (charges sociales: ${socialChargesRate}%)`,
          createdBy: session.user.id,
        },
      });

      // Créer l'entrée dans l'historique
      const importHistory = await tx.payrollImportHistory.create({
        data: {
          mandateId: mandateId,
          filename: metadata.filename,
          period: period,
          importType: "GASTROTIME",
          totalEmployees: employees.length,
          totalHours: totalHours,
          totalGrossAmount: totalGrossAmount,
          socialCharges: socialCharges,
          totalCost: totalCost,
          defaultHourlyRate: metadata.defaultHourlyRate,
          status: "COMPLETED",
          notes: `Import validé - ${metadata.validationStats.exactMatches} correspondances exactes, ${metadata.validationStats.partialMatches} partielles, ${metadata.validationStats.noMatches} nouvelles`,
          createdBy: session.user.id,
        },
      });

      // Créer les entrées détaillées pour chaque employé
      const employeeEntries = await Promise.all(
        employees.map((emp) =>
          tx.payrollImportEmployee.create({
            data: {
              importHistoryId: importHistory.id,
              employeeId: emp.employeeId,
              firstName: emp.firstName,
              lastName: emp.lastName,
              totalHours: emp.totalHours,
              hourlyRate: emp.hourlyRate,
              grossAmount: emp.totalHours * emp.hourlyRate,
              rateSource: emp.matchedEmployeeId ? "database" : "default",
              employeeFound: !!emp.matchedEmployeeId,
            },
          })
        )
      );

      return {
        payrollEntry,
        importHistory,
        employeeEntries,
        processedEmployees,
        totalGrossAmount,
        socialCharges,
        totalCost,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Import confirmé avec succès pour ${employees.length} employés`,
      data: {
        importId: result.importHistory.id,
        period: `${monthNum}/${yearNum}`,
        totalEmployees: employees.length,
        totalHours: totalHours,
        totalGrossAmount: result.totalGrossAmount,
        socialCharges: result.socialCharges,
        totalCost: result.totalCost,
        processedEmployees: result.processedEmployees,
        validationStats: metadata.validationStats,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de l'import confirmé:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'import",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
