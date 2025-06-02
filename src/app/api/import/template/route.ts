import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new();

    // Données d'exemple pour la feuille Mandants
    const mandantsData = [
      {
        Id: "1",
        Nom: "Camping Exemple",
        Monnaie: "CHF",
        Catégorie: "Hébergement",
      },
      {
        Id: "2",
        Nom: "Restaurant Exemple",
        Monnaie: "CHF",
        Catégorie: "Restauration",
      },
    ];

    // Données d'exemple pour la feuille DayValues
    const dayValuesData = [
      {
        Date: "1/1/24",
        Valeur: "1250.50",
        MandantId: "1",
        Mandant: "Camping Exemple",
      },
      {
        Date: "1/2/24",
        Valeur: "1380.75",
        MandantId: "1",
        Mandant: "Camping Exemple",
      },
      {
        Date: "1/1/24",
        Valeur: "850.25",
        MandantId: "2",
        Mandant: "Restaurant Exemple",
      },
    ];

    // Créer la feuille Mandants
    const mandantsWorksheet = XLSX.utils.json_to_sheet(mandantsData);
    XLSX.utils.book_append_sheet(workbook, mandantsWorksheet, "Mandants");

    // Créer la feuille DayValues
    const dayValuesWorksheet = XLSX.utils.json_to_sheet(dayValuesData);
    XLSX.utils.book_append_sheet(workbook, dayValuesWorksheet, "DayValues");

    // Générer le fichier Excel en buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Générer le nom du fichier avec timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `template_import_chaff_${timestamp}.xlsx`;

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
