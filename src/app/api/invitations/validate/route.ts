// src/app/api/invitations/validate/route.ts - Version améliorée
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        valid: false,
        error: "Code d'invitation manquant",
      },
      { status: 400 }
    );
  }

  try {
    // Vérifier si le code est valide
    const invitation = await prisma.invitationCode.findFirst({
      where: {
        code,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        organization: true,
        // Inclure les informations sur le créateur de l'invitation
        // en supposant que createdBy est un ID utilisateur
      },
    });

    if (!invitation) {
      // Vérifier si le code existe mais est expiré ou déjà utilisé
      const expiredOrUsedInvitation = await prisma.invitationCode.findFirst({
        where: {
          code,
          OR: [{ isUsed: true }, { expiresAt: { lte: new Date() } }],
        },
        include: { organization: true },
      });

      if (expiredOrUsedInvitation) {
        // Le code existe mais n'est plus valide
        return NextResponse.json({
          valid: false,
          error: expiredOrUsedInvitation.isUsed
            ? "Ce code d'invitation a déjà été utilisé"
            : "Ce code d'invitation a expiré",
          organizationName: expiredOrUsedInvitation.organization.name,
        });
      }

      // Le code n'existe pas du tout
      return NextResponse.json({
        valid: false,
        error: "Code d'invitation invalide ou inexistant",
      });
    }

    // Récupérer des informations supplémentaires sur l'organisation
    const orgDetails = await prisma.organization.findUnique({
      where: { id: invitation.organizationId },
      include: {
        users: {
          select: { id: true },
        },
        subscription: {
          include: {
            plan: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Si possible, récupérer des informations sur le créateur de l'invitation
    let createdByInfo = null;
    if (invitation.createdBy) {
      const creator = await prisma.user.findUnique({
        where: { id: invitation.createdBy },
        select: { name: true, email: true },
      });

      if (creator) {
        createdByInfo = {
          name: creator.name,
          email: creator.email,
        };
      }
    }

    // Formater le type de plan pour l'affichage
    const getPlanDisplayName = (planType: string) => {
      const planNames: Record<string, string> = {
        FREE: "Gratuit",
        PERSONAL: "Particulier",
        PROFESSIONAL: "Professionnel",
        ENTERPRISE: "Entreprise",
        SUPER_ADMIN: "Super Admin",
        ILLIMITE: "Illimité",
        CUSTOM: "Personnalisé",
      };
      return planNames[planType] || planType;
    };

    const planName = orgDetails?.subscription?.plan?.name || "FREE";
    const planDisplayName = getPlanDisplayName(planName);

    return NextResponse.json({
      valid: true,
      organizationName: invitation.organization.name,
      role: invitation.role,
      organizationId: invitation.organizationId,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      createdBy: createdByInfo,
      organizationInfo: {
        memberCount: orgDetails?.users.length || 0,
        planName: planDisplayName,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la validation de l'invitation:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Erreur lors de la validation",
      },
      { status: 500 }
    );
  }
}
