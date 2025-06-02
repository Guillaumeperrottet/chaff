// src/app/api/import/template/route.ts - Version corrigée
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new();

    // Données d'exemple pour la feuille Mandants (format corrigé)
    const mandantsData = [
      {
        Id: "1",
        Nom: "Campus de la Vallée",
        Monnaie: "CHF",
        Catégorie: "Hébergement", // ✅ Format exact attendu
      },
      {
        Id: "2",
        Nom: "Restaurant du Lac",
        Monnaie: "CHF",
        Catégorie: "Restauration", // ✅ Format exact attendu
      },
      {
        Id: "3",
        Nom: "Camping des Sapins",
        Monnaie: "CHF",
        Catégorie: "Hébergement",
      },
      {
        Id: "4",
        Nom: "Café Central",
        Monnaie: "CHF",
        Catégorie: "Restauration",
      },
    ];

    // Données d'exemple pour la feuille DayValues (format corrigé)
    const dayValuesData = [
      // Format DD/MM/YYYY et valeurs européennes
      {
        Date: "01/01/2025", // ✅ Format DD/MM/YYYY
        Valeur: "1250,50", // ✅ Virgule décimale européenne
        MandantId: "1",
        Mandant: "Campus de la Vallée",
      },
      {
        Date: "02/01/2025",
        Valeur: "1380,75",
        MandantId: "1",
        Mandant: "Campus de la Vallée",
      },
      {
        Date: "01/01/2025",
        Valeur: "850,25",
        MandantId: "2",
        Mandant: "Restaurant du Lac",
      },
      {
        Date: "02/01/2025",
        Valeur: "920,00",
        MandantId: "2",
        Mandant: "Restaurant du Lac",
      },
      {
        Date: "15/01/2025", // Test avec jour > 12 pour vérifier DD/MM
        Valeur: "2.500,75", // Test format européen complet
        MandantId: "3",
        Mandant: "Camping des Sapins",
      },
      {
        Date: "31/12/2024", // Test limite d'année
        Valeur: "1.750,25",
        MandantId: "4",
        Mandant: "Café Central",
      },
    ];

    // Créer la feuille Mandants avec formatage
    const mandantsWorksheet = XLSX.utils.json_to_sheet(mandantsData);

    // Ajouter des largeurs de colonnes
    mandantsWorksheet["!cols"] = [
      { wpx: 50 }, // Id
      { wpx: 200 }, // Nom
      { wpx: 80 }, // Monnaie
      { wpx: 120 }, // Catégorie
    ];

    // Créer la feuille DayValues avec formatage
    const dayValuesWorksheet = XLSX.utils.json_to_sheet(dayValuesData);

    // Ajouter des largeurs de colonnes
    dayValuesWorksheet["!cols"] = [
      { wpx: 100 }, // Date
      { wpx: 100 }, // Valeur
      { wpx: 100 }, // MandantId
      { wpx: 200 }, // Mandant
    ];

    // Ajouter les feuilles au workbook
    XLSX.utils.book_append_sheet(workbook, mandantsWorksheet, "Mandants");
    XLSX.utils.book_append_sheet(workbook, dayValuesWorksheet, "DayValues");

    // Ajouter une feuille d'instructions
    const instructionsData = [
      {
        Champ: "FEUILLE MANDANTS",
        Description: "",
        Format: "",
        Exemple: "",
      },
      {
        Champ: "Id",
        Description: "Identifiant unique du mandat",
        Format: "Texte ou nombre",
        Exemple: "1, 2, 3...",
      },
      {
        Champ: "Nom",
        Description: "Nom de l'établissement",
        Format: "Texte",
        Exemple: "Campus de la Vallée",
      },
      {
        Champ: "Catégorie",
        Description: "Type d'établissement",
        Format: "Hébergement ou Restauration",
        Exemple: "Hébergement",
      },
      {
        Champ: "",
        Description: "",
        Format: "",
        Exemple: "",
      },
      {
        Champ: "FEUILLE DAYVALUES",
        Description: "",
        Format: "",
        Exemple: "",
      },
      {
        Champ: "Date",
        Description: "Date de la saisie",
        Format: "DD/MM/YYYY ou DD/MM/YY",
        Exemple: "01/01/2025 ou 31/12/24",
      },
      {
        Champ: "Valeur",
        Description: "Montant en CHF",
        Format: "Nombre avec virgule décimale",
        Exemple: "1250,50 ou 2.500,75",
      },
      {
        Champ: "MandantId",
        Description: "Référence au mandat (Id de la feuille Mandants)",
        Format: "Même valeur que Id des Mandants",
        Exemple: "1, 2, 3...",
      },
      {
        Champ: "Mandant",
        Description: "Nom du mandat (optionnel, pour lisibilité)",
        Format: "Texte",
        Exemple: "Campus de la Vallée",
      },
    ];

    const instructionsWorksheet = XLSX.utils.json_to_sheet(instructionsData);

    // Largeurs pour les instructions
    instructionsWorksheet["!cols"] = [
      { wpx: 150 }, // Champ
      { wpx: 250 }, // Description
      { wpx: 200 }, // Format
      { wpx: 200 }, // Exemple
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      instructionsWorksheet,
      "Instructions"
    );

    // Générer le fichier Excel en buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Générer le nom du fichier avec timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `template_import_chaff_corrige_${timestamp}.xlsx`;

    // Retourner le fichier avec les headers appropriés
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération du template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
