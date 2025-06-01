import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    // Validation des champs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error: "Le nouveau mot de passe doit contenir au moins 8 caractères",
        },
        { status: 400 }
      );
    }

    // Récupérer le compte utilisateur avec son mot de passe hashé
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "credential", // D'après la doc, c'est "credential" (au singulier) et non "credentials"
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!account || !account.password) {
      return NextResponse.json(
        {
          error:
            "Aucun compte avec authentification par mot de passe trouvé pour cet utilisateur",
        },
        { status: 404 }
      );
    }

    // Accéder au context pour utiliser les méthodes de vérification et hachage
    const ctx = await auth.$context;

    // Vérifier le mot de passe actuel
    const passwordValid = await ctx.password.verify({
      hash: account.password,
      password: currentPassword,
    });

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 403 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await ctx.password.hash(newPassword);

    // Mettre à jour le mot de passe
    // Option 1: Utiliser l'adapteur interne
    await ctx.internalAdapter.updatePassword(user.id, hashedNewPassword);

    // Option 2: Ou mettre à jour directement via Prisma
    // await prisma.account.update({
    //   where: { id: account.id },
    //   data: {
    //     password: hashedNewPassword,
    //   },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    );
  }
}
