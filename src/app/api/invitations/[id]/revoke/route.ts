// src/app/api/invitations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID d'invitation depuis la promesse
  const { id: invitationId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifiez si l'utilisateur est admin dans son organisation
  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId: user.id, role: "admin" },
  });

  if (!userOrg) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Vérifiez que l'invitation appartient à l'organisation de l'utilisateur
  const invitation = await prisma.invitationCode.findFirst({
    where: {
      id: invitationId,
      organizationId: userOrg.organizationId,
    },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Invitation non trouvée" },
      { status: 404 }
    );
  }

  // Supprimez l'invitation
  await prisma.invitationCode.delete({
    where: { id: invitationId },
  });

  // Renvoi d'une confirmation de succès
  return NextResponse.json({ success: true });
}
