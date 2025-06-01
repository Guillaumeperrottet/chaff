import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur complet avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        Organization: true,
        OrganizationUser: true,
      },
    });

    // Vérifier et créer l'organisation si manquante
    if (!dbUser?.Organization) {
      console.log("⚠️ Organisation manquante pour l'utilisateur:", user.id);

      // Tenter de créer une organisation pour l'utilisateur
      const organization = await prisma.organization.create({
        data: {
          name: `${user.name || user.email?.split("@")[0]}'s Organization`,
        },
      });

      // Associer l'utilisateur à l'organisation
      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
      });

      // Créer l'association OrganizationUser avec le rôle admin
      await prisma.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "admin",
        },
      });

      // Créer un abonnement Free
      const freePlan = await prisma.plan.findFirst({
        where: { name: "FREE" },
      });

      if (freePlan) {
        await prisma.subscription.create({
          data: {
            organizationId: organization.id,
            planId: freePlan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Organisation créée avec succès (récupération)",
        user: {
          id: user.id,
          organizationId: organization.id,
        },
      });
    }

    // Si l'organisation existe, retourner les infos
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        organizationId: dbUser.Organization?.id,
        organizationName: dbUser.Organization?.name,
        role: dbUser.OrganizationUser?.role,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'organisation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
