// src/app/api/test-welcome-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email";
import { User } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { email, name, organizationName } = await req.json();

    if (!email || !name || !organizationName) {
      return NextResponse.json(
        {
          error: "Email, nom et nom d'organisation requis",
        },
        { status: 400 }
      );
    }

    console.log("🧪 Test d'envoi d'email de bienvenue vers:", email);

    // Créer un utilisateur temporaire pour le test
    const testUser = {
      id: "test-user",
      email: email,
      name: name,
    } as User;

    // Envoyer l'email de bienvenue
    const result = await EmailService.sendWelcomeEmail(
      testUser,
      organizationName
    );

    if (result.error) {
      console.error("❌ Erreur lors de l'envoi:", result.error);
      return NextResponse.json(
        {
          error: "Erreur lors de l'envoi de l'email",
          details: result.error,
        },
        { status: 500 }
      );
    }

    console.log("✅ Email de bienvenue envoyé avec succès!");

    return NextResponse.json({
      success: true,
      message: "Email de bienvenue envoyé avec succès",
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Erreur lors du test d'email de bienvenue:", error);
    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
