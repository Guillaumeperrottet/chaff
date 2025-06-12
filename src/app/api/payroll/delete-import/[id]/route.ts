import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// DELETE /api/payroll/delete-import/[id] - Supprimer un import Gastrotime
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'import existe et appartient à l'organisation de l'utilisateur
    const importRecord = await prisma.payrollImportHistory.findUnique({
      where: { id },
      include: {
        mandate: {
          select: {
            organizationId: true,
            name: true,
          },
        },
      },
    });

    if (!importRecord) {
      return NextResponse.json(
        { error: "Import non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { Organization: true },
    });

    if (!userWithOrg?.Organization || 
        userWithOrg.Organization.id !== importRecord.mandate.organizationId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Supprimer l'import
    await prisma.payrollImportHistory.delete({
      where: { id },
    });

    console.log(`✅ Import Gastrotime supprimé: ${id} (${importRecord.mandate.name})`);

    return NextResponse.json({ 
      success: true,
      message: "Import supprimé avec succès",
      deletedImport: {
        id: importRecord.id,
        period: importRecord.period,
        mandateName: importRecord.mandate.name,
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'import:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
