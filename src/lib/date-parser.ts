// src/lib/date-parser.ts
// Utilitaire pour parser différents formats de date de manière robuste

export interface DateParseResult {
  success: boolean;
  date?: Date;
  error?: string;
  originalValue: string;
  detectedFormat: string;
}

export function parseExcelDate(
  dateValue: string | number | Date
): DateParseResult {
  const originalValue = String(dateValue);

  // Si c'est déjà une Date
  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      return {
        success: false,
        error: "Date invalide",
        originalValue,
        detectedFormat: "Date object",
      };
    }
    return {
      success: true,
      date: dateValue,
      originalValue,
      detectedFormat: "Date object",
    };
  }

  // Si c'est un nombre (timestamp Excel)
  if (typeof dateValue === "number") {
    try {
      // Excel date serial number (jours depuis 1900-01-01)
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(
        excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000
      );

      if (isNaN(date.getTime())) {
        throw new Error("Timestamp invalide");
      }

      return {
        success: true,
        date,
        originalValue,
        detectedFormat: "Excel serial number",
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur parsing timestamp: ${error}`,
        originalValue,
        detectedFormat: "Excel serial number",
      };
    }
  }

  const dateStr = String(dateValue).trim();

  // Format MM/DD/YYYY, DD/MM/YYYY, M/D/YY etc.
  if (dateStr.includes("/")) {
    return parseDateWithSlashes(dateStr, originalValue);
  }

  // Format YYYY-MM-DD, DD-MM-YYYY etc.
  if (dateStr.includes("-")) {
    return parseDateWithDashes(dateStr, originalValue);
  }

  // Format DD.MM.YYYY
  if (dateStr.includes(".")) {
    return parseDateWithDots(dateStr, originalValue);
  }

  // Format YYYYMMDD
  if (/^\d{8}$/.test(dateStr)) {
    return parseDateYYYYMMDD(dateStr, originalValue);
  }

  // Essayer le parsing direct
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error("Date invalide");
    }

    return {
      success: true,
      date,
      originalValue,
      detectedFormat: "Direct parsing",
    };
  } catch (error) {
    return {
      success: false,
      error: `Impossible de parser la date: "${dateStr}". ${error}`,
      originalValue,
      detectedFormat: "Unknown",
    };
  }
}

function parseDateWithSlashes(
  dateStr: string,
  originalValue: string
): DateParseResult {
  const parts = dateStr.split("/");

  if (parts.length !== 3) {
    return {
      success: false,
      error: "Format de date avec / invalide",
      originalValue,
      detectedFormat: "Slash format (invalid)",
    };
  }

  try {
    // 🔥 CORRECTION: Format européen DD/MM/YY UNIQUEMENT
    const day = parseInt(parts[0]); // ✅ Premier = jour
    const month = parseInt(parts[1]); // ✅ Deuxième = mois
    let year = parseInt(parts[2]); // ✅ Troisième = année

    // Correction de l'année sur 2 chiffres
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    // 🔒 Validation stricte format européen
    if (day < 1 || day > 31) {
      throw new Error(`Jour invalide: ${day} (doit être 1-31)`);
    }

    if (month < 1 || month > 12) {
      throw new Error(`Mois invalide: ${month} (doit être 1-12)`);
    }

    // 🔒 Validation date future (optionnel)
    const date = new Date(Date.UTC(year, month - 1, day));
    const maxValidDate = new Date("2025-06-01");

    if (date > maxValidDate) {
      throw new Error(
        `Date future détectée: ${dateStr} -> ${date.toISOString().split("T")[0]}`
      );
    }

    if (isNaN(date.getTime())) {
      throw new Error("Date invalide");
    }

    return {
      success: true,
      date,
      originalValue,
      detectedFormat: `DD/MM/YYYY (${day}/${month}/${year})`,
    };
  } catch (error) {
    return {
      success: false,
      error: `Erreur parsing date DD/MM/YY: ${error}`,
      originalValue,
      detectedFormat: "DD/MM/YY format (error)",
    };
  }
}

function parseDateWithDashes(
  dateStr: string,
  originalValue: string
): DateParseResult {
  const parts = dateStr.split("-");

  if (parts.length !== 3) {
    return {
      success: false,
      error: "Format de date avec - invalide",
      originalValue,
      detectedFormat: "Dash format (invalid)",
    };
  }

  try {
    let year: number, month: number, day: number;

    // Détecter le format
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      day = parseInt(parts[0]);
      month = parseInt(parts[1]);
      year = parseInt(parts[2]);
    } else {
      throw new Error("Format d'année invalide");
    }

    // Vérifications
    if (month < 1 || month > 12) {
      throw new Error("Mois invalide");
    }
    if (day < 1 || day > 31) {
      throw new Error("Jour invalide");
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (isNaN(date.getTime())) {
      throw new Error("Date invalide");
    }

    return {
      success: true,
      date,
      originalValue,
      detectedFormat: parts[0].length === 4 ? "YYYY-MM-DD" : "DD-MM-YYYY",
    };
  } catch (error) {
    return {
      success: false,
      error: `Erreur parsing date avec -: ${error}`,
      originalValue,
      detectedFormat: "Dash format (error)",
    };
  }
}

function parseDateWithDots(
  dateStr: string,
  originalValue: string
): DateParseResult {
  const parts = dateStr.split(".");

  if (parts.length !== 3) {
    return {
      success: false,
      error: "Format de date avec . invalide",
      originalValue,
      detectedFormat: "Dot format (invalid)",
    };
  }

  try {
    // Généralement DD.MM.YYYY en Europe
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    let year = parseInt(parts[2]);

    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    if (month < 1 || month > 12) {
      throw new Error("Mois invalide");
    }
    if (day < 1 || day > 31) {
      throw new Error("Jour invalide");
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (isNaN(date.getTime())) {
      throw new Error("Date invalide");
    }

    return {
      success: true,
      date,
      originalValue,
      detectedFormat: "DD.MM.YYYY",
    };
  } catch (error) {
    return {
      success: false,
      error: `Erreur parsing date avec .: ${error}`,
      originalValue,
      detectedFormat: "Dot format (error)",
    };
  }
}

function parseDateYYYYMMDD(
  dateStr: string,
  originalValue: string
): DateParseResult {
  try {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));

    if (month < 1 || month > 12) {
      throw new Error("Mois invalide");
    }
    if (day < 1 || day > 31) {
      throw new Error("Jour invalide");
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (isNaN(date.getTime())) {
      throw new Error("Date invalide");
    }

    return {
      success: true,
      date,
      originalValue,
      detectedFormat: "YYYYMMDD",
    };
  } catch (error) {
    return {
      success: false,
      error: `Erreur parsing YYYYMMDD: ${error}`,
      originalValue,
      detectedFormat: "YYYYMMDD (error)",
    };
  }
}

// Fonction pour valider et parser une valeur numérique
export function parseExcelValue(value: string | number): {
  success: boolean;
  value?: number;
  error?: string;
} {
  try {
    if (typeof value === "number") {
      if (isNaN(value) || value < 0) {
        return { success: false, error: "Valeur numérique invalide" };
      }
      return { success: true, value };
    }

    const valueStr = String(value).trim();

    // Remplacer les virgules par des points
    const normalizedValue = valueStr.replace(/,/g, ".");

    // Enlever les espaces et autres caractères non numériques (sauf point et signe)
    const cleanValue = normalizedValue.replace(/[^\d.-]/g, "");

    const parsedValue = parseFloat(cleanValue);

    if (isNaN(parsedValue) || parsedValue < 0) {
      return { success: false, error: `Valeur numérique invalide: "${value}"` };
    }

    return { success: true, value: parsedValue };
  } catch (error) {
    return { success: false, error: `Erreur parsing valeur: ${error}` };
  }
}

// Tests pour valider le parsing
export function testDateParser() {
  const testDates = [
    "01/01/2025",
    "1/1/25",
    "31/12/2024",
    "2025-01-01",
    "01-01-2025",
    "01.01.2025",
    "20250101",
    "invalid-date",
    45678, // Excel serial number
  ];

  console.log("🧪 Test du parser de dates:");

  testDates.forEach((testDate) => {
    const result = parseExcelDate(testDate);
    console.log(
      `"${testDate}" -> ${result.success ? `✅ ${result.date?.toISOString()} (${result.detectedFormat})` : `❌ ${result.error}`}`
    );
  });

  const testValues = ["1250.50", "1,380.75", "850,25", "abc", "-50"];

  console.log("\n🧪 Test du parser de valeurs:");

  testValues.forEach((testValue) => {
    const result = parseExcelValue(testValue);
    console.log(
      `"${testValue}" -> ${result.success ? `✅ ${result.value}` : `❌ ${result.error}`}`
    );
  });
}
