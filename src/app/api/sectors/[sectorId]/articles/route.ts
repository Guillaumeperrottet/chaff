import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkSectorAccess } from "@/lib/auth-session";

// Typage mis à jour : params est une Promise qui résout { sectorId: string }
type RouteParams = {
  params: Promise<{ sectorId: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { sectorId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que le secteur existe
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    include: { object: true },
  });
  if (!sector) {
    return NextResponse.json({ error: "Secteur non trouvé" }, { status: 404 });
  }

  // Vérifier que l'utilisateur a un accès en lecture à ce secteur
  const hasReadAccess = await checkSectorAccess(user.id, sectorId, "read");
  if (!hasReadAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour accéder à ce secteur" },
      { status: 403 }
    );
  }

  // Récupérer les articles du secteur
  const articles = await prisma.article.findMany({
    where: { sectorId },
  });

  return NextResponse.json(articles);
}
