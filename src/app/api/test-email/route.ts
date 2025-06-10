// src/app/api/test-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    console.log("🧪 Test d'envoi d'email vers:", email);

    // Vérifier les variables d'environnement
    const envVars = {
      RESEND_API_KEY: process.env.RESEND_API_KEY
        ? "✅ Définie"
        : "❌ Manquante",
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "❌ Manquante",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET
        ? "✅ Définie"
        : "❌ Manquante",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "❌ Manquante",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ Manquante",
    };

    console.log("🔧 Variables d'environnement:", envVars);

    const result = await EmailService.sendEmail({
      to: email,
      subject: "Test Chaff.ch - Configuration Email",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Test Email</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background-color: #3b82f6; color: white; padding: 24px; text-align: center; }
              .content { padding: 32px 24px; }
              .success { color: #16a34a; font-weight: bold; }
              .error { color: #dc2626; font-weight: bold; }
              .env-check { background-color: #f8f9fa; padding: 16px; border-radius: 4px; margin: 16px 0; }
              .env-item { margin: 4px 0; font-family: monospace; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 Chaff.ch</h1>
                <h2>Test de Configuration Email</h2>
              </div>
              
              <div class="content">
                <p class="success">✅ Félicitations !</p>
                <p>Si vous recevez cet email, cela signifie que :</p>
                <ul>
                  <li>Votre configuration Resend fonctionne</li>
                  <li>Le service EmailService est opérationnel</li>
                  <li>Les variables d'environnement sont correctes</li>
                </ul>
                
                <div class="env-check">
                  <h3>État de la configuration :</h3>
                  ${Object.entries(envVars)
                    .map(
                      ([key, value]) =>
                        `<div class="env-item">${key}: ${value}</div>`
                    )
                    .join("")}
                </div>
                
                <p>Vous pouvez maintenant tester l'inscription avec vérification d'email.</p>
                
                <p>Date du test: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (!result.success) {
      console.error("❌ Erreur lors de l'envoi:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          envVars,
        },
        { status: 500 }
      );
    }

    console.log("✅ Email de test envoyé avec succès");

    return NextResponse.json({
      success: true,
      message: "Email de test envoyé avec succès",
      emailId: result.data?.id,
      envVars,
    });
  } catch (error) {
    console.error("❌ Exception lors du test d'email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
