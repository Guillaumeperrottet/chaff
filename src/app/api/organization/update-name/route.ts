import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, organizationId } = await req.json();

  // Vérifier si le nom est valide
  if (!name || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Le nom de l'organisation doit contenir au moins 2 caractères" },
      { status: 400 }
    );
  }

  // Vérifier si l'utilisateur est administrateur de l'organisation
  const orgUser = await prisma.organizationUser.findFirst({
    where: {
      userId: user.id,
      organizationId: organizationId,
      role: "admin",
    },
  });

  if (!orgUser) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cette organisation" },
      { status: 403 }
    );
  }

  // Mettre à jour le nom de l'organisation
  await prisma.organization.update({
    where: { id: organizationId },
    data: { name },
  });

  return NextResponse.json({ success: true });
}
