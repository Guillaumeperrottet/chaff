// src/app/api/profile/daily-summary-preferences/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { dailySummaryEnabled } = await req.json();

    // Valider que c'est un booléen
    if (typeof dailySummaryEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Valeur invalide pour dailySummaryEnabled" },
        { status: 400 }
      );
    }

    // Mettre à jour les préférences de l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: { dailySummaryEnabled },
    });

    return NextResponse.json({
      success: true,
      dailySummaryEnabled,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des préférences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des préférences" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        dailySummaryEnabled: true,
        emailNotificationsEnabled: true,
        notificationsEnabled: true,
      },
    });

    return NextResponse.json({
      dailySummaryEnabled: userData?.dailySummaryEnabled ?? false,
      emailNotificationsEnabled: userData?.emailNotificationsEnabled ?? true,
      notificationsEnabled: userData?.notificationsEnabled ?? true,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des préférences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des préférences" },
      { status: 500 }
    );
  }
}
