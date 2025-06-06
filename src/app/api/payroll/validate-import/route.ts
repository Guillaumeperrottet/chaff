import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as Papa from "papaparse";

interface CsvRow {
  EmplID?: string;
  FirstName: string;
  LastName: string;
  [key: string]: string | undefined; // For dynamic hour columns like "0101", "0102", etc.
}

interface ValidationEmployee {
  csvIndex: number;
  employeeId?: string;
  firstName: string;
  lastName: string;
  totalHours: number;

  // Données de matching
  matchedEmployee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    hourlyRate: number | null;
    position?: string | null;
  };
  matchType: "exact" | "partial" | "none";
  matchConfidence: number;

  // Données pour l'import
  proposedHourlyRate: number;
  rateSource: "employee" | "default" | "manual";
  estimatedCost: number;

  // Statut validation
  needsReview: boolean;
  issues: string[];
}

interface CsvEmployeeData {
  csvIndex: number;
  employeeId?: string;
  firstName: string;
  lastName: string;
  totalHours: number;
}

interface ExistingEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  hourlyRate: number | null;
  position: string | null;
  isActive: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mandateId = formData.get("mandateId") as string;
    const defaultHourlyRate = parseFloat(
      (formData.get("defaultHourlyRate") as string) || "25"
    );

    if (!file || !mandateId) {
      return NextResponse.json(
        { error: "Fichier et mandat requis" },
        { status: 400 }
      );
    }

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id: mandateId },
      select: { id: true, name: true },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Parser le CSV
    const csvText = await file.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      delimiter: ";",
      skipEmptyLines: true,
    });

    // Récupérer tous les employés du mandat
    const existingEmployees = await prisma.employee.findMany({
      where: { mandateId: mandateId },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        hourlyRate: true,
        position: true,
        isActive: true,
      },
    });

    const validationResults: ValidationEmployee[] = [];

    // Analyser chaque ligne du CSV
    for (let index = 0; index < parsed.data.length; index++) {
      const row = parsed.data[index] as CsvRow;

      if (!row.FirstName || !row.LastName) continue;

      // Calculer le total des heures
      const hourColumns = Object.keys(row).filter(
        (key) =>
          key.match(/^\d{4}$/) && row[key] && !isNaN(parseFloat(row[key]!))
      );

      const totalHours = hourColumns.reduce((sum, col) => {
        return sum + (parseFloat(row[col] || "0") || 0);
      }, 0);

      if (totalHours === 0) continue;

      const csvEmployee = {
        csvIndex: index,
        employeeId: row.EmplID?.trim(),
        firstName: row.FirstName.trim(),
        lastName: row.LastName.trim(),
        totalHours: totalHours,
      };

      // Tentative de matching avec les employés existants
      const matchResult = findEmployeeMatch(csvEmployee, existingEmployees);

      // Déterminer le taux horaire proposé
      let proposedRate = defaultHourlyRate;
      let rateSource: "employee" | "default" | "manual" = "default";

      if (matchResult.matchedEmployee) {
        proposedRate =
          matchResult.matchedEmployee.hourlyRate || defaultHourlyRate;
        rateSource = "employee";
      }

      // Identifier les problèmes potentiels
      const issues: string[] = [];
      let needsReview = false;

      if (matchResult.matchType === "none") {
        issues.push("Aucun employé correspondant trouvé");
        needsReview = true;
      } else if (matchResult.matchType === "partial") {
        issues.push("Correspondance partielle - vérifiez les données");
        needsReview = true;
      }

      if (!matchResult.matchedEmployee?.isActive) {
        issues.push("Employé inactif");
        needsReview = true;
      }

      if (totalHours > 200) {
        issues.push("Nombre d'heures élevé (>200h)");
        needsReview = true;
      }

      if (!csvEmployee.employeeId) {
        issues.push("Pas d'ID employé dans le CSV");
        needsReview = true;
      }

      validationResults.push({
        ...csvEmployee,
        matchedEmployee: matchResult.matchedEmployee || undefined,
        matchType: matchResult.matchType,
        matchConfidence: matchResult.confidence,
        proposedHourlyRate: proposedRate,
        rateSource: rateSource,
        estimatedCost: totalHours * proposedRate * 1.22, // +22% charges
        needsReview: needsReview,
        issues: issues,
      });
    }

    // Calculer les statistiques
    const stats = {
      totalEmployees: validationResults.length,
      exactMatches: validationResults.filter((r) => r.matchType === "exact")
        .length,
      partialMatches: validationResults.filter((r) => r.matchType === "partial")
        .length,
      noMatches: validationResults.filter((r) => r.matchType === "none").length,
      needsReview: validationResults.filter((r) => r.needsReview).length,
      totalHours: validationResults.reduce((sum, r) => sum + r.totalHours, 0),
      estimatedTotalCost: validationResults.reduce(
        (sum, r) => sum + r.estimatedCost,
        0
      ),
    };

    return NextResponse.json({
      filename: file.name,
      defaultHourlyRate: defaultHourlyRate,
      validationResults: validationResults,
      statistics: stats,
      canProceed: stats.needsReview === 0, // Peut procéder si aucun problème
    });
  } catch (error) {
    console.error("Erreur validation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la validation" },
      { status: 500 }
    );
  }
}

// Fonction de matching des employés
function findEmployeeMatch(
  csvEmployee: CsvEmployeeData,
  existingEmployees: ExistingEmployee[]
) {
  let bestMatch = null;
  let bestScore = 0;
  let matchType: "exact" | "partial" | "none" = "none";

  for (const employee of existingEmployees) {
    let score = 0;

    // Match exact par ID employé (priorité maximale)
    if (
      csvEmployee.employeeId &&
      employee.employeeId === csvEmployee.employeeId
    ) {
      return {
        matchedEmployee: employee,
        matchType: "exact" as const,
        confidence: 100,
      };
    }

    // Match par nom et prénom
    const firstNameMatch =
      normalizeString(csvEmployee.firstName) ===
      normalizeString(employee.firstName);
    const lastNameMatch =
      normalizeString(csvEmployee.lastName) ===
      normalizeString(employee.lastName);

    if (firstNameMatch && lastNameMatch) {
      score = 90;
    } else if (firstNameMatch || lastNameMatch) {
      score = 50;
    } else {
      // Match partiel sur les noms (Levenshtein ou contient)
      if (
        containsName(csvEmployee.firstName, employee.firstName) ||
        containsName(csvEmployee.lastName, employee.lastName)
      ) {
        score = 30;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = employee;
    }
  }

  if (bestScore >= 90) {
    matchType = "exact";
  } else if (bestScore >= 30) {
    matchType = "partial";
  }

  return {
    matchedEmployee: bestMatch,
    matchType: matchType,
    confidence: bestScore,
  };
}

// Fonctions utilitaires
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .trim();
}

function containsName(name1: string, name2: string): boolean {
  const n1 = normalizeString(name1);
  const n2 = normalizeString(name2);
  return n1.includes(n2) || n2.includes(n1);
}
