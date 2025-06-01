// src/app/api/articles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, checkArticleAccess } from "@/lib/auth-session";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // await params pour obtenir l'id
  const { id: articleId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { title, description, positionX, positionY, width, height } =
    await request.json();

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      sector: {
        include: { object: true },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
  }

  const hasWriteAccess = await checkArticleAccess(user.id, articleId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cet article" },
      { status: 403 }
    );
  }

  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
    data: {
      title,
      description,
      positionX,
      positionY,
      width,
      height,
    },
  });

  return NextResponse.json(updatedArticle);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: articleId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      sector: {
        include: { object: true },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
  }

  const hasWriteAccess = await checkArticleAccess(user.id, articleId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour supprimer cet article" },
      { status: 403 }
    );
  }

  await prisma.article.delete({
    where: { id: articleId },
  });

  // Plus idiomatique : 204 No Content
  return new NextResponse(null, { status: 204 });
}
