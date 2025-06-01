// src/app/api/invitations/generate/route.ts (mise à jour)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { generateInviteCode } from "@/lib/utils";
import { checkOrganizationLimits } from "@/lib/subscription-limits";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifiez si l'utilisateur est admin
  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId: user.id, role: "admin" },
  });

  if (!userOrg) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Vérifier les limites d'utilisateurs
  const limitsCheck = await checkOrganizationLimits(
    userOrg.organizationId,
    "users"
  );

  if (!limitsCheck.allowed && !limitsCheck.unlimited) {
    return NextResponse.json(
      {
        error: `Limite d'utilisateurs atteinte (${limitsCheck.current}/${limitsCheck.limit}). Veuillez passer à un forfait supérieur pour inviter plus d'utilisateurs.`,
        limits: limitsCheck,
      },
      { status: 403 }
    );
  }

  const { role } = await req.json();

  // Générez un code aléatoire de 8 caractères
  const code = generateInviteCode();

  // Définissez la date d'expiration (7 jours)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Créez le code d'invitation
  const invitation = await prisma.invitationCode.create({
    data: {
      code,
      role,
      organizationId: userOrg.organizationId,
      createdBy: user.id,
      expiresAt,
    },
  });

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      code: invitation.code,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    },
    limits: limitsCheck,
  });
}
