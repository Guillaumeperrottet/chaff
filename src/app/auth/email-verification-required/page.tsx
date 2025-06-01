// src/app/auth/email-verification-required/page.tsx - Version corrigée
"use client";

import { useState } from "react";

export default function EmailVerificationRequiredPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      console.log("📧 Envoi de la demande de vérification pour:", email);

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

      setMessage(data.message || "Email de vérification envoyé avec succès !");
      console.log("✅ Email envoyé avec succès");
    } catch (error) {
      console.error("❌ Erreur:", error);
      setMessage("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Vérification requise
          </h2>
          <p className="mt-2 text-muted-foreground">
            Votre adresse email n&apos;a pas encore été vérifiée. Veuillez
            vérifier votre boîte de réception ou demander un nouvel email de
            vérification. Pensez à vérifier votre dossier spam.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <div className="text-sm text-center">
              <p
                className={
                  message.includes("erreur") || message.includes("Erreur")
                    ? "text-red-500"
                    : "text-green-500"
                }
              >
                {message}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSubmitting
                ? "Envoi en cours..."
                : "Envoyer un email de vérification"}
            </button>
          </div>
        </form>
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
