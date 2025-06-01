// 3. Modifier src/app/api/users/update-role/route.ts pour ajouter la vérification côté serveur

import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const currentUser = await getUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est administrateur
  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId: currentUser.id, role: "admin" },
  });

  if (!userOrg) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Récupérer les données
  const { userId, role } = await req.json();

  // Vérifier que le rôle est valide
  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  try {
    // Vérifier que l'utilisateur à modifier appartient à la même organisation
    const targetUserOrg = await prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId: userOrg.organizationId,
      },
    });

    if (!targetUserOrg) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette organisation" },
        { status: 404 }
      );
    }

    // 🚨 VÉRIFICATION DE SÉCURITÉ CRITIQUE
    // Si l'utilisateur essaie de se retirer ses propres droits admin
    if (
      currentUser.id === userId &&
      targetUserOrg.role === "admin" &&
      role === "member"
    ) {
      // Compter le nombre d'admins dans l'organisation
      const adminCount = await prisma.organizationUser.count({
        where: {
          organizationId: userOrg.organizationId,
          role: "admin",
        },
      });

      // Si c'est le seul admin, interdire
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Vous ne pouvez pas vous retirer les droits d'administrateur car vous êtes le seul admin de l'organisation. Nommez d'abord un autre administrateur.",
          },
          { status: 403 }
        );
      }
    }

    // Mettre à jour le rôle
    await prisma.organizationUser.update({
      where: { id: targetUserOrg.id },
      data: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rôle:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rôle" },
      { status: 500 }
    );
  }
}
