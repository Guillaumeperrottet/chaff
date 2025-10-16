import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const OVERTIME_THRESHOLD = 40; // Hours per week before overtime

interface PayrollCalculationRequest {
  mandateId?: string;
  periodStart: string;
  periodEnd: string;
  periodType: "WEEKLY" | "MONTHLY";
  recalculate?: boolean; // Force recalcul même si déjà calculé
}

interface TimeEntry {
  id: string;
  date: Date;
  workedHours: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  hourlyRate?: number | null;
  isActive: boolean;
  timeEntries: TimeEntry[];
}

interface Mandate {
  id: string;
  name: string;
  employees: Employee[];
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

    const body: PayrollCalculationRequest = await request.json();
    const { mandateId, periodStart, periodEnd, periodType, recalculate } = body;

    // Validation
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "La date de début doit être antérieure à la date de fin" },
        { status: 400 }
      );
    }

    // Filtres pour les mandats - TOUJOURS filtrer par organizationId
    const mandateFilter: { id?: string; organizationId: string } = {
      organizationId: user.organizationId,
    };

    if (mandateId) {
      mandateFilter.id = mandateId;
    }

    // Récupérer les mandats concernés
    const mandates = await prisma.mandate.findMany({
      where: mandateFilter,
      include: {
        employees: {
          where: { isActive: true },
          include: {
            timeEntries: {
              where: {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      },
    });

    const results = [];

    for (const mandate of mandates) {
      const mandateResults = await calculateMandatePayroll(
        mandate,
        startDate,
        endDate,
        periodType,
        recalculate || false
      );
      results.push(mandateResults);
    }

    // Calculer les totaux globaux
    const globalTotals = {
      totalEmployees: results.reduce((sum, r) => sum + r.employeeCount, 0),
      totalHours: results.reduce((sum, r) => sum + r.totalHours, 0),
      totalRegularHours: results.reduce(
        (sum, r) => sum + r.totalRegularHours,
        0
      ),
      totalOvertimeHours: results.reduce(
        (sum, r) => sum + r.totalOvertimeHours,
        0
      ),
      totalGrossPay: results.reduce((sum, r) => sum + r.totalGrossPay, 0),
      totalSocialCharges: results.reduce(
        (sum, r) => sum + r.totalSocialCharges,
        0
      ),
      totalCost: results.reduce((sum, r) => sum + r.totalCost, 0),
    };

    return NextResponse.json({
      success: true,
      period: {
        start: periodStart,
        end: periodEnd,
        type: periodType,
      },
      mandateResults: results,
      globalTotals,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors du calcul de la masse salariale:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

async function calculateMandatePayroll(
  mandate: Mandate,
  startDate: Date,
  endDate: Date,
  periodType: "WEEKLY" | "MONTHLY",
  recalculate: boolean
) {
  const periods = generatePeriods(startDate, endDate, periodType);
  const employeeResults = [];

  let totalHours = 0;
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;
  let totalGrossPay = 0;
  let totalSocialCharges = 0;
  let totalCost = 0;

  for (const employee of mandate.employees) {
    for (const period of periods) {
      const periodData = await calculateEmployeePeriod(
        employee,
        mandate.id,
        period.start,
        period.end,
        periodType,
        recalculate
      );

      if (periodData) {
        employeeResults.push(periodData);
        totalHours += periodData.totalHours;
        totalRegularHours += periodData.regularHours;
        totalOvertimeHours += periodData.overtimeHours;
        totalGrossPay += periodData.totalGross;
        totalSocialCharges += periodData.socialCharges;
        totalCost += periodData.totalCost;
      }
    }
  }

  // Mettre à jour le cache du mandat
  await prisma.mandate.update({
    where: { id: mandate.id },
    data: {
      totalPayrollCost: totalCost,
      lastPayrollCalculation: new Date(),
    },
  });

  return {
    mandateId: mandate.id,
    mandateName: mandate.name,
    employeeCount: mandate.employees.length,
    totalHours,
    totalRegularHours,
    totalOvertimeHours,
    totalGrossPay,
    totalSocialCharges,
    totalCost,
    employeeDetails: employeeResults,
  };
}

async function calculateEmployeePeriod(
  employee: Employee,
  mandateId: string,
  periodStart: Date,
  periodEnd: Date,
  periodType: "WEEKLY" | "MONTHLY",
  recalculate: boolean
) {
  // Vérifier si déjà calculé
  const existing = await prisma.payrollData.findUnique({
    where: {
      employeeId_mandateId_period_periodType: {
        employeeId: employee.id,
        mandateId: mandateId,
        period: periodStart,
        periodType: periodType,
      },
    },
  });

  if (existing && !recalculate && !existing.isLocked) {
    return {
      ...existing,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeId: employee.employeeId,
    };
  }

  // Récupérer les entrées de temps pour cette période
  const timeEntries = employee.timeEntries.filter((entry: TimeEntry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= periodStart && entryDate <= periodEnd;
  });

  if (timeEntries.length === 0) {
    return null; // Pas de temps travaillé
  }

  // Calculer les heures
  let regularHours = 0;
  let overtimeHours = 0;
  const totalWorkedHours = timeEntries.reduce(
    (sum: number, entry: TimeEntry) => sum + (entry.workedHours || 0),
    0
  );

  if (periodType === "WEEKLY") {
    if (totalWorkedHours > OVERTIME_THRESHOLD) {
      regularHours = OVERTIME_THRESHOLD;
      overtimeHours = totalWorkedHours - OVERTIME_THRESHOLD;
    } else {
      regularHours = totalWorkedHours;
    }
  } else {
    // Pour mensuel, diviser par semaines et calculer
    const weeks = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const weeklyThreshold = OVERTIME_THRESHOLD * weeks;

    if (totalWorkedHours > weeklyThreshold) {
      regularHours = weeklyThreshold;
      overtimeHours = totalWorkedHours - weeklyThreshold;
    } else {
      regularHours = totalWorkedHours;
    }
  }

  // Calculer les coûts
  const hourlyRate = employee.hourlyRate || 25; // Taux par défaut
  const overtimeMultiplier = 1.25; // 25% de plus pour heures sup

  const baseSalary = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
  const totalGross = baseSalary + overtimePay;

  // Charges sociales (estimation Suisse ~20-25%)
  const socialChargeRate = 0.22; // 22%
  const socialCharges = totalGross * socialChargeRate;
  const totalCost = totalGross + socialCharges;

  // Créer ou mettre à jour l'enregistrement
  const payrollData = await prisma.payrollData.upsert({
    where: {
      employeeId_mandateId_period_periodType: {
        employeeId: employee.id,
        mandateId: mandateId,
        period: periodStart,
        periodType: periodType,
      },
    },
    update: {
      regularHours,
      overtimeHours,
      totalHours: totalWorkedHours,
      baseSalary,
      overtimePay,
      totalGross,
      socialCharges,
      totalCost,
    },
    create: {
      employeeId: employee.id,
      mandateId: mandateId,
      period: periodStart,
      periodType: periodType,
      regularHours,
      overtimeHours,
      totalHours: totalWorkedHours,
      baseSalary,
      overtimePay,
      totalGross,
      socialCharges,
      totalCost,
    },
  });

  return {
    ...payrollData,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeId: employee.employeeId,
  };
}

function generatePeriods(
  startDate: Date,
  endDate: Date,
  periodType: "WEEKLY" | "MONTHLY"
): Array<{ start: Date; end: Date }> {
  const periods = [];
  let currentStart = new Date(startDate);

  while (currentStart < endDate) {
    let currentEnd: Date;

    if (periodType === "WEEKLY") {
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 6); // 7 jours
    } else {
      currentEnd = new Date(
        currentStart.getFullYear(),
        currentStart.getMonth() + 1,
        0
      );
    }

    // Ne pas dépasser la date de fin
    if (currentEnd > endDate) {
      currentEnd = new Date(endDate);
    }

    periods.push({
      start: new Date(currentStart),
      end: currentEnd,
    });

    // Passer à la période suivante
    if (periodType === "WEEKLY") {
      currentStart = new Date(currentStart);
      currentStart.setDate(currentStart.getDate() + 7);
    } else {
      currentStart = new Date(
        currentStart.getFullYear(),
        currentStart.getMonth() + 1,
        1
      );
    }
  }

  return periods;
}
