import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/export/valeurs - Exporter les valeurs journalières en CSV
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mandateId = searchParams.get("mandateId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const group = searchParams.get("group"); // ✅ NOUVEAU: Filtre par groupe (HEBERGEMENT/RESTAURATION)
    const establishmentTypeId = searchParams.get("establishmentTypeId"); // ✅ NOUVEAU: Filtre par type personnalisé

    // Construire les filtres
    const where: {
      mandateId?: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
      mandate?: {
        group?: string;
        establishmentTypeId?: string;
      };
    } = {};

    if (mandateId) {
      where.mandateId = mandateId;
    }

    // ✅ NOUVEAU: Filtrage par groupe ou type d'établissement
    if (group || establishmentTypeId) {
      where.mandate = {};
      if (group) {
        where.mandate.group = group;
      }
      if (establishmentTypeId) {
        where.mandate.establishmentTypeId = establishmentTypeId;
      }
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Récupérer les données
    const dayValues = await prisma.dayValue.findMany({
      where,
      include: {
        mandate: {
          select: {
            name: true,
            group: true,
            establishmentType: {
              select: {
                label: true,
              },
            },
          },
        },
      },
      orderBy: [{ mandate: { name: "asc" } }, { date: "asc" }],
    });

    // Générer le CSV
    const csvHeaders = [
      "Date",
      "Établissement",
      "Groupe",
      "Montant (CHF)",
      "Date de création",
    ];

    const csvRows = dayValues.map((value) => {
      // ✅ AMÉLIORER: Obtenir le nom du type d'établissement
      let groupName: string;
      if (value.mandate.establishmentType) {
        // Type personnalisé
        groupName = value.mandate.establishmentType.label;
      } else {
        // Type par défaut
        groupName =
          value.mandate.group === "HEBERGEMENT"
            ? "Hébergement"
            : "Restauration";
      }

      return [
        formatDate(value.date),
        value.mandate.name,
        groupName,
        value.value.toFixed(2),
        formatDateTime(value.createdAt),
      ];
    });

    // Construire le contenu CSV
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row
          .map((cell) =>
            // Échapper les guillemets et encapsuler les cellules contenant des virgules
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(",")
      ),
    ].join("\n");

    // Ajouter le BOM UTF-8 pour une meilleure compatibilité avec Excel
    const bom = "\uFEFF";
    const finalContent = bom + csvContent;

    // Générer le nom du fichier
    const now = new Date();
    const filename = `valeurs_journalieres_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}.csv`;

    // Retourner la réponse avec les headers appropriés
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
    console.error("Erreur lors de l'export des valeurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires pour le formatage
function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
