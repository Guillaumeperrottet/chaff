import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as Papa from "papaparse";

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

function parseCSV(csvText: string): CsvEmployeeData[] {
  const parsed = Papa.parse(csvText, {
    header: true,
    delimiter: ";", // Essayer ; puis , si échec
    skipEmptyLines: true,
    dynamicTyping: false, // Important pour garder les strings
  });

  console.log("Headers trouvés:", parsed.meta.fields);
  console.log("Première ligne de données:", parsed.data[0]);

  if (parsed.errors && parsed.errors.length > 0) {
    console.error("Erreurs parsing CSV:", parsed.errors);
  }

  const employees: CsvEmployeeData[] = [];

  for (let index = 0; index < parsed.data.length; index++) {
    const row = parsed.data[index] as Record<string, string>;

    // Debug: afficher la ligne
    console.log(`Ligne ${index}:`, row);

    // Extraction avec vos noms de colonnes exacts
    const firstName = row["FirstName"]?.trim();
    const lastName = row["LastName"]?.trim();
    const employeeId = row["EmplID"]?.trim(); // Votre colonne exacte

    if (!firstName || !lastName) {
      console.log(`Ligne ${index} ignorée: nom/prénom manquant`);
      continue;
    }

    // Calcul des heures avec pattern plus flexible
    const hourColumns = Object.keys(row).filter((key) => {
      // Accepter tous les nombres, pas seulement 4 chiffres
      const isNumericKey = /^\d+$/.test(key);
      const hasValue = row[key] && row[key].trim() !== "";
      const isValidNumber = !isNaN(parseFloat(row[key] || "0"));

      console.log(
        `Colonne ${key}: isNumeric=${isNumericKey}, hasValue=${hasValue}, isValidNumber=${isValidNumber}, value="${row[key]}"`
      );

      return isNumericKey && hasValue && isValidNumber;
    });

    console.log(
      `Colonnes d'heures trouvées pour ${firstName} ${lastName}:`,
      hourColumns
    );

    const totalHours = hourColumns.reduce((sum, col) => {
      const value = parseFloat(row[col] || "0");
      console.log(`  ${col}: ${row[col]} -> ${value}`);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    console.log(`Total heures pour ${firstName} ${lastName}: ${totalHours}`);

    if (totalHours > 0) {
      employees.push({
        csvIndex: index,
        employeeId: employeeId,
        firstName: firstName,
        lastName: lastName,
        totalHours: totalHours,
      });
    } else {
      console.log(`Employé ${firstName} ${lastName} ignoré: 0 heures`);
    }
  }

  console.log(`Total employés extraits: ${employees.length}`);
  return employees;
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

    console.log("=== DÉBUT VALIDATION IMPORT ===");
    console.log(`Fichier: ${file.name}, Taille: ${file.size} bytes`);
    console.log(`Mandat: ${mandateId}, Taux défaut: ${defaultHourlyRate}`);

    // Vérifier que le mandat existe
    const mandate = await prisma.mandate.findUnique({
      where: { id: mandateId },
      select: { id: true, name: true },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandat non trouvé" }, { status: 404 });
    }

    // Parser le CSV avec debugging
    const csvText = await file.text();
    console.log("Première ligne CSV:", csvText.split("\n")[0]);
    console.log("Nombre de lignes CSV:", csvText.split("\n").length);

    const csvEmployees = parseCSV(csvText);

    if (csvEmployees.length === 0) {
      console.error("ERREUR: Aucun employé extrait du CSV");
      return NextResponse.json(
        {
          error:
            "Aucun employé trouvé dans le fichier CSV. Vérifiez le format.",
        },
        { status: 400 }
      );
    }

    console.log(`${csvEmployees.length} employés extraits du CSV`);

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

    // Analyser chaque employé du CSV
    for (const csvEmployee of csvEmployees) {
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

      if (csvEmployee.totalHours > 200) {
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
        estimatedCost: csvEmployee.totalHours * proposedRate * 1.22, // +22% charges
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

// Fonction de matching améliorée
function findEmployeeMatch(
  csvEmployee: CsvEmployeeData,
  existingEmployees: ExistingEmployee[]
) {
  let bestMatch = null;
  let bestScore = 0;
  let matchType: "exact" | "partial" | "none" = "none";

  console.log(
    `Recherche de correspondance pour: ${csvEmployee.firstName} ${csvEmployee.lastName} (ID: ${csvEmployee.employeeId})`
  );

  for (const employee of existingEmployees) {
    let score = 0;

    // Match exact par ID employé (priorité maximale)
    if (
      csvEmployee.employeeId &&
      employee.employeeId === csvEmployee.employeeId
    ) {
      console.log(`  Match exact par ID: ${employee.employeeId}`);
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
      console.log(
        `  Match nom/prénom complet: ${employee.firstName} ${employee.lastName} (score: ${score})`
      );
    } else if (firstNameMatch || lastNameMatch) {
      score = 50;
      console.log(
        `  Match partiel nom/prénom: ${employee.firstName} ${employee.lastName} (score: ${score})`
      );
    } else {
      // Match partiel sur les noms (contient)
      if (
        containsName(csvEmployee.firstName, employee.firstName) ||
        containsName(csvEmployee.lastName, employee.lastName)
      ) {
        score = 30;
        console.log(
          `  Match partiel contient: ${employee.firstName} ${employee.lastName} (score: ${score})`
        );
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

  console.log(
    `  Meilleur match: ${bestMatch ? `${bestMatch.firstName} ${bestMatch.lastName}` : "aucun"} (score: ${bestScore}, type: ${matchType})`
  );

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
