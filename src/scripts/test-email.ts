// src/scripts/test-email.ts - Script pour tester l'envoi d'emails
import { EmailService } from "@/lib/email";

async function testEmail() {
  console.log("🧪 Test d'envoi d'email...");

  // Test simple
  const result = await EmailService.sendEmail({
    to: "test@example.com", // Remplacez par votre email
    subject: "Test PlanniKeeper",
    html: `
      <h1>Test d'email</h1>
      <p>Ceci est un test d'envoi d'email depuis PlanniKeeper.</p>
      <p>Si vous recevez cet email, la configuration fonctionne !</p>
    `,
  });

  if (result.success) {
    console.log("✅ Email de test envoyé avec succès !");
    console.log("📧 ID:", result.data?.id);
  } else {
    console.error("❌ Échec de l'envoi du test :", result.error);
  }
}

// Exécuter le test
testEmail().catch(console.error);
