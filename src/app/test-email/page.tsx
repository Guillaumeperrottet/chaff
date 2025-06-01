// src/app/test-email/page.tsx - Page pour tester l'envoi d'emails
"use client";

import { useState } from "react";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const testEmailService = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setMessage("✅ Email de test envoyé avec succès !");
    } catch (error) {
      console.error("❌ Erreur:", error);
      setMessage(
        `❌ Erreur: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const testBetterAuth = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setMessage("✅ Email Better Auth envoyé avec succès !");
    } catch (error) {
      console.error("❌ Erreur:", error);
      setMessage(
        `❌ Erreur: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Test d&apos;emails
          </h2>
          <p className="mt-2 text-muted-foreground">
            Testez l&apos;envoi d&apos;emails pour déboguer la configuration
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="votre-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <div className="text-sm">
              <p
                className={
                  message.includes("❌") ? "text-red-500" : "text-green-500"
                }
              >
                {message}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={testEmailService}
              disabled={isSubmitting || !email}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Test en cours..." : "Tester EmailService"}
            </button>

            <button
              onClick={testBetterAuth}
              disabled={isSubmitting || !email}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSubmitting ? "Test en cours..." : "Tester Better Auth"}
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Variables d&apos;environnement à vérifier :
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• RESEND_API_KEY</li>
            <li>• RESEND_FROM_EMAIL</li>
            <li>• BETTER_AUTH_SECRET</li>
            <li>• NEXT_PUBLIC_APP_URL</li>
          </ul>
        </div>

        <div className="text-center mt-4">
          <a
            href="/signin"
            className="font-medium text-primary hover:text-primary/80"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
