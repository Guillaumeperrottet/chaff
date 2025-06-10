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

function parseCSV(csvText: string) {
  console.log("=== DÉBUT PARSING CSV ===");
  console.log("Taille du fichier:", csvText.length, "caractères");
  console.log("Premières lignes:", csvText.substring(0, 200));

  // Détecter automatiquement le délimiteur
  const delimiters = ["\t", ",", ";", "|"];
  let bestResult = null;
  let maxColumns = 0;

  for (const delimiter of delimiters) {
    console.log(`Test avec délimiteur: "${delimiter}"`);

    const testResult = Papa.parse(csvText, {
      header: true,
      delimiter: delimiter,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    console.log(
      `  Headers trouvés (${testResult.meta.fields?.length || 0}):`,
      testResult.meta.fields
    );

    if (testResult.meta.fields && testResult.meta.fields.length > maxColumns) {
      maxColumns = testResult.meta.fields.length;
      bestResult = testResult;
      console.log(
        `  ✓ Meilleur résultat jusqu'ici avec ${maxColumns} colonnes`
      );
    }
  }

  if (!bestResult || !bestResult.meta.fields) {
    console.error("ERREUR: Impossible de parser le CSV avec aucun délimiteur");
    throw new Error("Format CSV non reconnu");
  }

  console.log("Délimiteur choisi, headers finaux:", bestResult.meta.fields);
  console.log("Nombre de lignes de données:", bestResult.data.length);
  console.log("Première ligne de données:", bestResult.data[0]);

  const employees = [];

  for (let index = 0; index < bestResult.data.length; index++) {
    const row = bestResult.data[index] as Record<string, string>;

    console.log(`\n--- Traitement ligne ${index + 1} ---`);
    console.log("Données brutes:", row);

    // Extraction flexible des noms de colonnes
    const firstName = findColumnValue(row, [
      "FirstName",
      "First Name",
      "Prénom",
      "Prenom",
    ]);
    const lastName = findColumnValue(row, ["LastName", "Last Name", "Nom"]);
    const employeeId = findColumnValue(row, [
      "EmplID",
      "EmployeeId",
      "Employee ID",
      "ID",
      "EmpID",
    ]);

    console.log(
      `Employé extrait: ${firstName} ${lastName} (ID: ${employeeId})`
    );

    if (!firstName || !lastName) {
      console.log("❌ Ligne ignorée: nom/prénom manquant");
      continue;
    }

    // Calcul des heures - recherche TOUS les champs numériques
    const allKeys = Object.keys(row);
    console.log("Toutes les clés disponibles:", allKeys);

    const hourColumns = allKeys.filter((key) => {
      // Ignorer les colonnes de métadonnées
      const isMetadata = [
        "FirstName",
        "LastName",
        "EmplID",
        "EmployeeId",
        "Employee ID",
        "ID",
        "EmpID",
        "Prénom",
        "Prenom",
        "Nom",
      ].includes(key);
      if (isMetadata) return false;

      const value = row[key];
      if (!value || value.trim() === "") return false;

      // Accepter tout ce qui ressemble à un nombre
      const numValue = parseFloat(value);
      const isValidNumber = !isNaN(numValue) && numValue > 0;

      console.log(
        `  Colonne "${key}": "${value}" -> ${numValue} (valide: ${isValidNumber})`
      );

      return isValidNumber;
    });

    console.log("Colonnes d'heures retenues:", hourColumns);

    const totalHours = hourColumns.reduce((sum, col) => {
      const value = parseFloat(row[col] || "0");
      console.log(`    ${col}: ${row[col]} -> +${value}`);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    console.log(`✓ Total heures calculé: ${totalHours}`);

    if (totalHours > 0) {
      employees.push({
        csvIndex: index,
        employeeId: employeeId || undefined,
        firstName: firstName,
        lastName: lastName,
        totalHours: totalHours,
      });
      console.log(
        `✅ Employé ajouté: ${firstName} ${lastName} - ${totalHours}h`
      );
    } else {
      console.log(`❌ Employé ignoré: ${firstName} ${lastName} - 0 heures`);
    }
  }

  console.log(`\n=== RÉSULTAT FINAL ===`);
  console.log(`Employés extraits: ${employees.length}`);
  employees.forEach((emp, i) => {
    console.log(
      `${i + 1}. ${emp.firstName} ${emp.lastName} (${emp.employeeId || "Pas d'ID"}) - ${emp.totalHours}h`
    );
  });

  return employees;
}

// Fonction helper pour trouver une valeur dans différentes colonnes possibles
function findColumnValue(
  row: Record<string, string>,
  possibleKeys: string[]
): string | undefined {
  for (const key of possibleKeys) {
    if (row[key] && row[key].trim()) {
      return row[key].trim();
    }
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 DÉBUT VALIDATION IMPORT");

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

    console.log("Paramètres reçus:", {
      fileName: file?.name,
      fileSize: file?.size,
      mandateId,
      defaultHourlyRate,
    });

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

    console.log("Mandat trouvé:", mandate);

    // Lire le fichier
    const csvText = await file.text();
    console.log("Fichier lu, début du parsing...");

    // Parser avec la nouvelle fonction robuste
    const csvEmployees = parseCSV(csvText);

    if (csvEmployees.length === 0) {
      console.error("❌ AUCUN EMPLOYÉ EXTRAIT");
      console.log("Contenu du fichier (premiers 500 caractères):");
      console.log(csvText.substring(0, 500));

      return NextResponse.json(
        {
          error:
            "Aucun employé avec des heures trouvé. Vérifiez que le fichier contient des données d'heures valides.",
          debug: {
            fileContent: csvText.substring(0, 200),
            fileSize: csvText.length,
          },
        },
        { status: 400 }
      );
    }

    console.log(`✅ ${csvEmployees.length} employés extraits avec succès`);

    // Récupérer les employés existants pour le matching
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

    console.log(`Employés existants en base: ${existingEmployees.length}`);

    // Continuer avec la validation...
    const validationResults: ValidationEmployee[] = [];

    for (const csvEmp of csvEmployees) {
      const matchResult = findEmployeeMatch(csvEmp, existingEmployees);

      // Déterminer le taux horaire proposé
      let proposedRate = defaultHourlyRate;
      let rateSource: "employee" | "default" | "manual" = "default";

      if (matchResult.matchedEmployee?.hourlyRate) {
        proposedRate = matchResult.matchedEmployee.hourlyRate;
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

      if (csvEmp.totalHours > 200) {
        issues.push("Nombre d'heures élevé (>200h)");
        needsReview = true;
      }

      if (!csvEmp.employeeId) {
        issues.push("Pas d'ID employé dans le CSV");
      }

      validationResults.push({
        ...csvEmp,
        matchedEmployee: matchResult.matchedEmployee || undefined,
        matchType: matchResult.matchType,
        matchConfidence: matchResult.confidence,
        proposedHourlyRate: proposedRate,
        rateSource: rateSource,
        estimatedCost: csvEmp.totalHours * proposedRate * 1.22, // +22% charges
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

    console.log("Statistiques finales:", stats);

    return NextResponse.json({
      filename: file.name,
      defaultHourlyRate: defaultHourlyRate,
      validationResults: validationResults,
      statistics: stats,
      canProceed: stats.needsReview === 0,
    });
  } catch (error) {
    console.error("❌ ERREUR VALIDATION:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la validation",
        details: error instanceof Error ? error.message : String(error),
      },
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
