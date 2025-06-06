// src/app/api/user/organization-recovery/route.ts - Version améliorée
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

    console.log("🚀 Récupération d'organisation pour:", user.id);

    // Vérifier l'état complet de l'utilisateur
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        Organization: true,
        OrganizationUser: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé en base" },
        { status: 404 }
      );
    }

    // ✅ CAS 1: L'utilisateur a déjà tout configuré
    if (dbUser.Organization && dbUser.OrganizationUser) {
      console.log("✅ L'utilisateur a déjà une organisation complète");
      return NextResponse.json({
        success: true,
        message: "Organisation déjà configurée",
        organizationId: dbUser.Organization.id,
        organizationName: dbUser.Organization.name,
        status: "already_configured",
      });
    }

    // ✅ CAS 2: Utilisateur a une organisation mais pas la relation
    if (dbUser.Organization && !dbUser.OrganizationUser) {
      console.log("🔗 Création de la relation OrganizationUser manquante");

      await prisma.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: dbUser.Organization.id,
          role: "admin",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Relation d'organisation restaurée",
        organizationId: dbUser.Organization.id,
        organizationName: dbUser.Organization.name,
        status: "relation_restored",
      });
    }

    // ✅ CAS 3: Aucune organisation - Création complète
    console.log("🏗️ Création complète d'organisation manquante");

    const result = await prisma.$transaction(async (tx) => {
      // Créer l'organisation
      const organization = await tx.organization.create({
        data: {
          name: `${user.name || user.email?.split("@")[0] || "Utilisateur"}'s Organization`,
        },
      });

      // Lier l'utilisateur à l'organisation
      await tx.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
      });

      // Créer la relation OrganizationUser
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "admin",
        },
      });

      // Récupérer ou créer le plan FREE
      let freePlan = await tx.plan.findFirst({
        where: { name: "FREE" },
      });

      if (!freePlan) {
        freePlan = await tx.plan.create({
          data: {
            name: "FREE",
            price: 0,
            monthlyPrice: 0,
            yearlyPrice: 0,
            maxUsers: 1,
            maxStorage: 500,
            features: [
              "1 utilisateur",
              "1 objet immobilier",
              "500MB de stockage",
              "Support communauté",
            ],
            description: "Plan gratuit pour découvrir l'application",
            isActive: true,
          },
        });
      }

      // Créer l'abonnement FREE
      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      // Initialiser le stockage
      await tx.storageUsage.create({
        data: {
          organizationId: organization.id,
          totalUsedBytes: 0,
        },
      });

      return organization;
    });

    console.log("✅ Organisation créée avec succès:", result.id);

    // Envoi de l'email de bienvenue
    try {
      await EmailService.sendWelcomeEmail(dbUser, result.name);
      console.log("📧 Email de bienvenue envoyé");
    } catch (emailError) {
      console.error("❌ Erreur envoi email bienvenue:", emailError);
      // Ne pas faire échouer la création pour autant
    }

    return NextResponse.json({
      success: true,
      message: "Organisation créée avec succès",
      organizationId: result.id,
      organizationName: result.name,
      status: "created",
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
