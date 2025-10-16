import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/export/employees - Exporter la liste des employés en CSV
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const mandateId = searchParams.get("mandateId");

    // Construire les filtres - TOUJOURS filtrer par organizationId
    const where: {
      mandateId?: string;
      isActive?: boolean;
      mandate: { organizationId: string };
    } = {
      mandate: { organizationId: user.organizationId },
    };

    if (mandateId) {
      where.mandateId = mandateId;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    // Récupérer les employés
    const employees = await prisma.employee.findMany({
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
        _count: {
          select: {
            timeEntries: true,
            payrollData: true,
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    // Générer le CSV
    const csvHeaders = [
      "ID Employé",
      "Prénom",
      "Nom",
      "Email",
      "Téléphone",
      "Établissement",
      "Groupe/Type",
      "Poste",
      "Taux horaire (CHF/h)",
      "Date d'embauche",
      "Statut",
      "Entrées de temps",
      "Périodes de paie",
      "Date de création",
    ];

    const csvRows = employees.map((employee) => {
      // Déterminer le type d'établissement
      let groupName: string;
      if (employee.mandate.establishmentType) {
        // Type personnalisé
        groupName = employee.mandate.establishmentType.label;
      } else {
        // Type par défaut
        groupName =
          employee.mandate.group === "HEBERGEMENT"
            ? "Hébergement"
            : "Restauration";
      }

      return [
        employee.employeeId,
        employee.firstName,
        employee.lastName,
        employee.email || "",
        employee.phoneNumber || "",
        employee.mandate.name,
        groupName,
        employee.position || "",
        employee.hourlyRate?.toFixed(2) || "",
        employee.hiredAt ? formatDate(employee.hiredAt) : "",
        employee.isActive ? "Actif" : "Inactif",
        employee._count.timeEntries.toString(),
        employee._count.payrollData.toString(),
        formatDateTime(employee.createdAt),
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
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;

    let filename = `employees_${dateStr}.csv`;

    // Si filtré par mandat, inclure le nom dans le fichier
    if (mandateId && employees.length > 0) {
      const mandateName = employees[0].mandate.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      filename = `employees_${mandateName}_${dateStr}.csv`;
    }

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
    console.error("Erreur lors de l'export des employés:", error);
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
