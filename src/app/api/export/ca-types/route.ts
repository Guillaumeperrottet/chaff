import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Types pour la structure des données
interface TypeBreakdown {
  typeId: string;
  typeName: string;
  ca: number;
  payroll: number;
  mandateCount: number;
  mandates: Array<{
    id: string;
    name: string;
    ca: number;
    payroll: number;
  }>;
}

interface MonthlyData {
  month: string;
  typeData: TypeBreakdown[];
  totalCA: number;
  totalPayroll: number;
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Extraire les paramètres de requête
    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const startMonth = parseInt(searchParams.get("startMonth") || "1");
    const endMonth = parseInt(searchParams.get("endMonth") || "12");
    const period = searchParams.get("period") || "6months";

    console.log("🔍 Export CA Types - Paramètres:", {
      year,
      startMonth,
      endMonth,
      period,
    });

    // Simulation des types d'établissement avec mandats
    const typeGroups = {
      Hébergement: [
        { id: "HTL001", name: "Hôtel des Alpes" },
        { id: "HTL002", name: "Auberge du Lac" },
        { id: "HTL003", name: "Resort Montagne" },
      ],
      Restauration: [
        { id: "RST001", name: "Restaurant Le Gourmet" },
        { id: "RST002", name: "Brasserie Central" },
        { id: "RST003", name: "Café de la Gare" },
        { id: "RST004", name: "Pizza Corner" },
      ],
      Commerce: [
        { id: "COM001", name: "Boutique Mode" },
        { id: "COM002", name: "Librairie du Centre" },
      ],
      Services: [
        { id: "SRV001", name: "Cabinet Conseil" },
        { id: "SRV002", name: "Agence Immobilière" },
        { id: "SRV003", name: "Salon de Coiffure" },
      ],
    };

    // Fonction pour formater les montants en CHF
    const formatCurrency = (amount: number): string => {
      return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    };

    // Générer des données de test pour l'export
    const testData: MonthlyData[] = [];

    for (let month = startMonth; month <= endMonth; month++) {
      const monthLabel = new Date(year, month - 1).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });

      const typeData: TypeBreakdown[] = Object.entries(typeGroups).map(
        ([typeId, mandates]) => {
          const ca = Math.random() * 50000 + 25000;
          const payroll = ca * (0.25 + Math.random() * 0.15); // 25-40% du CA

          return {
            typeId,
            typeName: typeId,
            ca,
            payroll,
            mandateCount: mandates.length,
            mandates: mandates.map((mandate) => ({
              id: mandate.id,
              name: mandate.name,
              ca: ca / mandates.length + (Math.random() - 0.5) * 10000,
              payroll: payroll / mandates.length + (Math.random() - 0.5) * 3000,
            })),
          };
        }
      );

      const totalCA = typeData.reduce((sum, type) => sum + type.ca, 0);
      const totalPayroll = typeData.reduce(
        (sum, type) => sum + type.payroll,
        0
      );

      testData.push({
        month: monthLabel,
        typeData,
        totalCA,
        totalPayroll,
      });
    }

    // Générer le CSV
    const csvLines: string[] = [];

    // En-tête du fichier
    csvLines.push(`"EXPORT CA PAR TYPES - Organisation Test"`);
    csvLines.push(
      `"Période: ${period === "6months" ? "Semestrielle" : "Annuelle"}"`
    );
    csvLines.push(`"Année: ${year}"`);
    csvLines.push(`"Mois: ${startMonth} à ${endMonth}"`);
    csvLines.push(`"Généré le: ${new Date().toLocaleString("fr-CH")}"`);
    csvLines.push("");

    // En-tête des colonnes pour les données détaillées
    csvLines.push("DONNÉES DÉTAILLÉES PAR MOIS ET TYPE");
    csvLines.push(
      "Mois,Type,Mandats,CA (CHF),Payroll (CHF),Ratio Payroll/CA (%)"
    );

    // Données mensuelles par type
    testData.forEach((monthData) => {
      monthData.typeData.forEach((type) => {
        const ratio =
          type.ca > 0 ? ((type.payroll / type.ca) * 100).toFixed(1) : "0.0";
        const csvRow = [
          `"${monthData.month}"`,
          `"${type.typeName}"`,
          type.mandateCount.toString(),
          formatCurrency(type.ca),
          formatCurrency(type.payroll),
          ratio,
        ].join(",");

        csvLines.push(csvRow);
      });

      // Ligne de total mensuel
      const allMandatesCount = Object.values(typeGroups).reduce(
        (sum, mandates) => sum + mandates.length,
        0
      );
      const monthlyRatio =
        monthData.totalCA > 0
          ? ((monthData.totalPayroll / monthData.totalCA) * 100).toFixed(1)
          : "0.0";
      const totalRow = [
        `"${monthData.month}"`,
        `"TOTAL MENSUEL"`,
        allMandatesCount.toString(),
        formatCurrency(monthData.totalCA),
        formatCurrency(monthData.totalPayroll),
        monthlyRatio,
      ].join(",");

      csvLines.push(totalRow);
      csvLines.push(""); // Ligne vide entre les mois
    });

    // Calculs de synthèse
    const grandTotalCA = testData.reduce(
      (sum, month) => sum + month.totalCA,
      0
    );
    const grandTotalPayroll = testData.reduce(
      (sum, month) => sum + month.totalPayroll,
      0
    );
    const globalRatio =
      grandTotalCA > 0
        ? ((grandTotalPayroll / grandTotalCA) * 100).toFixed(1)
        : "0.0";

    csvLines.push("SYNTHÈSE GLOBALE");
    csvLines.push(`CA Total (CHF),${formatCurrency(grandTotalCA)}`);
    csvLines.push(`Payroll Total (CHF),${formatCurrency(grandTotalPayroll)}`);
    csvLines.push(`Ratio global Payroll/CA,${globalRatio}%`);
    csvLines.push(`Nombre de types,${Object.keys(typeGroups).length}`);
    csvLines.push(
      `Nombre de mandats,${Object.values(typeGroups).reduce((sum, mandates) => sum + mandates.length, 0)}`
    );

    // Totaux par type (sur toute la période)
    csvLines.push("");
    csvLines.push("TOTAUX PAR TYPE (PÉRIODE COMPLÈTE)");
    csvLines.push(
      "Type,Mandats,CA Total (CHF),Payroll Total (CHF),Contribution CA (%),Ratio Payroll/CA (%)"
    );

    const typeTotals = Object.entries(typeGroups).map(
      ([typeId, typeMandates]) => {
        const totalCA = testData.reduce((sum, month) => {
          const typeEntry = month.typeData.find(
            (t: TypeBreakdown) => t.typeId === typeId
          );
          return sum + (typeEntry?.ca || 0);
        }, 0);

        const totalPayroll = testData.reduce((sum, month) => {
          const typeEntry = month.typeData.find(
            (t: TypeBreakdown) => t.typeId === typeId
          );
          return sum + (typeEntry?.payroll || 0);
        }, 0);

        const contribution =
          grandTotalCA > 0
            ? ((totalCA / grandTotalCA) * 100).toFixed(1)
            : "0.0";
        const ratio =
          totalCA > 0 ? ((totalPayroll / totalCA) * 100).toFixed(1) : "0.0";

        const csvLine1 = [
          `"${typeId}"`,
          typeMandates.length.toString(),
          formatCurrency(totalCA),
          formatCurrency(totalPayroll),
          `${contribution}%`,
          `${ratio}%`,
        ].join(",");

        csvLines.push(csvLine1);

        return { typeId, typeMandates, totalCA, totalPayroll };
      }
    );

    // Détail par mandat par type
    csvLines.push("");
    csvLines.push("DÉTAIL PAR MANDAT ET TYPE");
    csvLines.push(
      "Type,Mandat,CA Total (CHF),Payroll Total (CHF),Ratio Payroll/CA (%)"
    );

    typeTotals.forEach(({ typeId, typeMandates }) => {
      typeMandates.forEach((mandate: { id: string; name: string }) => {
        const mandateCA = testData.reduce((sum, month) => {
          const typeEntry = month.typeData.find(
            (t: TypeBreakdown) => t.typeId === typeId
          );
          const mandateEntry = typeEntry?.mandates.find(
            (m: { id: string; name: string; ca: number; payroll: number }) =>
              m.id === mandate.id
          );
          return sum + (mandateEntry?.ca || 0);
        }, 0);

        const mandatePayroll = testData.reduce((sum, month) => {
          const typeEntry = month.typeData.find(
            (t: TypeBreakdown) => t.typeId === typeId
          );
          const mandateEntry = typeEntry?.mandates.find(
            (m: { id: string; name: string; ca: number; payroll: number }) =>
              m.id === mandate.id
          );
          return sum + (mandateEntry?.payroll || 0);
        }, 0);

        const ratio =
          mandateCA > 0
            ? ((mandatePayroll / mandateCA) * 100).toFixed(1)
            : "0.0";

        const csvLine = [
          `"${typeId}"`,
          `"${mandate.name}"`,
          formatCurrency(mandateCA),
          formatCurrency(mandatePayroll),
          `${ratio}%`,
        ].join(",");

        csvLines.push(csvLine);
      });
    });

    const csvContent = csvLines.join("\n");
    const bom = "\uFEFF"; // BOM pour Excel
    const finalContent = bom + csvContent;

    console.log("✅ Export CA Types généré avec succès");

    // Nom de fichier avec période
    const semesterName = startMonth === 1 ? "S1" : "S2";
    const filename = `ca_types_${year}_${semesterName}.csv`;

    // Retourner le fichier CSV
    return new NextResponse(finalContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'export CA par types:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}
