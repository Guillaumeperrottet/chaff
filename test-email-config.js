// Test de configuration email simple
require("dotenv").config({ path: ".env.local" });

const { Resend } = require("resend");

async function testEmailConfig() {
  console.log("🔧 Test de la configuration email...");

  // Vérifier les variables d'environnement
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  console.log("Variables d'environnement:");
  console.log(
    "- RESEND_API_KEY:",
    apiKey ? `✅ Présente (${apiKey.length} chars)` : "❌ Manquante"
  );
  console.log("- RESEND_FROM_EMAIL:", fromEmail || "❌ Manquante");
  console.log("- NEXT_PUBLIC_APP_URL:", appUrl || "❌ Manquante");

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY manquante");
    return;
  }

  try {
    const resend = new Resend(apiKey);

    // Test simple d'envoi d'email
    const result = await resend.emails.send({
      from: fromEmail || "Chaff.ch <notifications@chaff.ch>",
      to: ["guillaume@example.com"], // Remplacez par votre email de test
      subject: "Test de configuration Chaff.ch",
      html: `
        <h1>Test réussi !</h1>
        <p>La configuration email fonctionne correctement.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

    if (result.error) {
      console.error("❌ Erreur lors de l'envoi:", result.error);
    } else {
      console.log("✅ Email envoyé avec succès!");
      console.log("ID de l'email:", result.data.id);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

testEmailConfig();
