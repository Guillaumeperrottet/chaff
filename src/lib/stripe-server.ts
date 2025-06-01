// src/lib/stripe-server.ts - Version serveur uniquement
import Stripe from "stripe";

// Vérification robuste des variables d'environnement
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isProduction = process.env.NODE_ENV === "production";

// Validation de la clé Stripe
if (!stripeSecretKey) {
  const errorMsg = `❌ STRIPE_SECRET_KEY manquante en ${isProduction ? "production" : "développement"}`;
  console.error(errorMsg);

  // En production, c'est critique
  if (isProduction) {
    throw new Error("STRIPE_SECRET_KEY est requise en production");
  }
  console.warn("⚠️ Fonctionnalités Stripe désactivées en développement");
}

// Initialisation Stripe conditionnelle
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-04-30.basil",
      appInfo: {
        name: "PlanniKeeper",
        version: "1.0.0",
        url: isProduction ? "https://plannikeeper.ch" : "http://localhost:3000",
      },
      typescript: true,
      timeout: isProduction ? 30000 : 10000,
    })
  : null;

export function isStripeAvailable(): boolean {
  return stripe !== null;
}
