// src/app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    console.log("📧 Demande de renvoi d'email de vérification pour:", email);

    // Utiliser l'API Better Auth pour renvoyer l'email de vérification
    const response = await auth.api.sendVerificationEmail({
      body: {
        email,
        callbackURL: "/auth/verification-success",
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    console.log("✅ Email de vérification renvoyé avec succès via Better Auth");

    return NextResponse.json({
      success: true,
      message: "Email de vérification envoyé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors du renvoi d'email:", error);

    // Gestion spécifique des erreurs Better Auth
    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = (error as { message: string }).message;

      if (errorMessage.includes("User not found")) {
        // Pour des raisons de sécurité, ne pas révéler si l'email existe
        return NextResponse.json({
          success: true,
          message:
            "Si un compte existe avec cette adresse, un email de vérification a été envoyé.",
        });
      }
    }

    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 }
    );
  }
}
