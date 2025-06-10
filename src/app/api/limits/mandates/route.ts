import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import {
  checkOrganizationLimits,
  canCreateMandate,
} from "@/lib/subscription-limits";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (!userWithOrg?.Organization) {
      return NextResponse.json(
        { error: "Aucune organisation trouvée" },
        { status: 404 }
      );
    }

    // Vérifier les limites de mandats
    const limits = await checkOrganizationLimits(
      userWithOrg.Organization.id,
      "mandates"
    );

    // Vérifier si on peut créer un nouveau mandat
    const canCreate = await canCreateMandate(userWithOrg.Organization.id);

    return NextResponse.json({
      ...limits,
      canCreate: canCreate.allowed,
      reason: canCreate.reason,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des limites de mandats:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des limites de mandats" },
      { status: 500 }
    );
  }
}
