import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(
      "🚀 Organisation recovery demandée pour l'utilisateur:",
      user.id
    );

    // Vérifier si l'utilisateur a déjà une organisation
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    // Si l'utilisateur a déjà une organisation, rien à faire
    if (dbUser?.Organization) {
      console.log(
        "✅ L'utilisateur a déjà une organisation:",
        dbUser.Organization.id
      );
      return NextResponse.json({
        success: true,
        message: "L'utilisateur a déjà une organisation",
        organizationId: dbUser.Organization.id,
      });
    }

    console.log(
      "⚠️ Organisation manquante pour l'utilisateur:",
      user.id,
      "- Récupération en cours"
    );

    // Créer une nouvelle organisation
    const organization = await prisma.organization.create({
      data: {
        name: `${user.name || user.email?.split("@")[0] || "Utilisateur"}'s Organization`,
      },
    });

    // Associer l'utilisateur à l'organisation
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });

    // Vérifier si l'association OrganizationUser existe déjà
    const existingOrgUser = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        organizationId: organization.id,
      },
    });

    // Créer l'association OrganizationUser avec le rôle admin si elle n'existe pas
    if (!existingOrgUser) {
      await prisma.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "admin",
        },
      });
    }

    // Récupérer le plan gratuit
    const freePlan = await prisma.plan.findFirst({
      where: { name: "FREE" },
    });

    if (freePlan) {
      // Vérifier si un abonnement existe déjà
      const existingSub = await prisma.subscription.findFirst({
        where: { organizationId: organization.id },
      });

      if (!existingSub) {
        // Créer l'abonnement seulement s'il n'existe pas
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
    }

    console.log(
      "✅ Organisation créée avec succès (récupération):",
      organization.id
    );

    // 🆕 AJOUTER : Envoi de l'email de bienvenue
    try {
      // Récupérer l'utilisateur complet depuis la DB pour l'email
      const userForEmail = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (userForEmail) {
        await EmailService.sendWelcomeEmail(userForEmail, organization.name);
        console.log(
          "📧 Email de bienvenue envoyé pour récupération d'organisation"
        );
      }
    } catch (emailError) {
      console.error("❌ Erreur envoi email bienvenue:", emailError);
      // Ne pas faire échouer la route si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: "Organisation créée avec succès",
      organizationId: organization.id,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération d'organisation:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'organisation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
