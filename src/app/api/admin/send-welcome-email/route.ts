// src/app/api/admin/send-welcome-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { superAdminGuard } from "@/lib/super-admin";
import { EmailService } from "@/lib/email";
import { User } from "@prisma/client";

interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  organizationName: string;
  temporaryPassword: string;
  planName: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const {
      userEmail,
      userName,
      organizationName,
      temporaryPassword,
    }: Omit<WelcomeEmailData, "planName"> & { planName?: string } =
      await req.json();

    // Validation des champs requis
    if (!userEmail || !userName || !organizationName || !temporaryPassword) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Créer un objet User temporaire pour la méthode sendWelcomeEmail
    const tempUser = {
      id: "temp",
      email: userEmail,
      name: userName,
    } as User;

    // Envoyer l'email via le service d'emails dédié
    const { error } = await EmailService.sendWelcomeEmail(
      tempUser,
      organizationName
    );

    if (error) {
      console.error("Erreur lors de l'envoi de l'email de bienvenue:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email de bienvenue envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du traitement de l'email de bienvenue:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 }
    );
  }
}
