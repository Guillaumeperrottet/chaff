// src/app/api/cron/cleanup-unverified-users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Définir la limite de temps ( 24 heures)
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - 24);

    // Trouver les utilisateurs non vérifiés créés avant la limite
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        emailVerified: false,
        createdAt: { lt: timeLimit },
      },
      select: { id: true, email: true },
    });

    console.log(
      `🧹 Nettoyage de ${unverifiedUsers.length} utilisateurs non vérifiés`
    );

    // Supprimer ces utilisateurs
    for (const user of unverifiedUsers) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${unverifiedUsers.length} utilisateurs non vérifiés ont été supprimés`,
    });
  } catch (error) {
    console.error(
      "Erreur lors du nettoyage des utilisateurs non vérifiés:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors du nettoyage" },
      { status: 500 }
    );
  }
}
