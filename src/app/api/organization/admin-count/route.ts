// 2. Créer src/app/api/organization/admin-count/route.ts

import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const userOrg = await prisma.organizationUser.findFirst({
      where: { userId: user.id },
      select: { organizationId: true, role: true },
    });

    if (!userOrg) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Seuls les admins peuvent voir cette info (sécurité)
    if (userOrg.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Compter le nombre d'administrateurs dans l'organisation
    const adminCount = await prisma.organizationUser.count({
      where: {
        organizationId: userOrg.organizationId,
        role: "admin",
      },
    });

    return NextResponse.json({
      count: adminCount,
      organizationId: userOrg.organizationId,
    });
  } catch (error) {
    console.error("Erreur lors du comptage des admins:", error);
    return NextResponse.json(
      { error: "Erreur lors du comptage des admins" },
      { status: 500 }
    );
  }
}
