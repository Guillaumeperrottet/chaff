// src/lib/stripe.ts - Version mise à jour (safe pour client/serveur)
import Stripe from "stripe";

// Vérifier si on est côté serveur
const isServer = typeof window === "undefined";

// Vérification robuste des variables d'environnement (uniquement côté serveur)
const stripeSecretKey = isServer ? process.env.STRIPE_SECRET_KEY : undefined;
const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";

// Logging pour debug (seulement en dev et côté serveur)
if (!isProduction && isServer) {
  console.log("🔧 Stripe Configuration:", {
    hasSecretKey: !!stripeSecretKey,
    keyPrefix: stripeSecretKey?.substring(0, 12) + "...",
    environment: isProduction ? "production" : "development",
    platform: isVercel ? "vercel" : "local",
  });
}

// Validation de la clé Stripe (uniquement côté serveur)
if (isServer && !stripeSecretKey) {
  const errorMsg = `❌ STRIPE_SECRET_KEY manquante en ${isProduction ? "production" : "développement"}`;
  console.error(errorMsg);

  // En production, c'est critique (mais ne pas throw côté client)
  if (isProduction) {
    console.error(
      "🚨 ERREUR CRITIQUE: STRIPE_SECRET_KEY manquante en production!"
    );
    console.error(
      "📝 Ajoutez la variable dans Vercel Dashboard > Settings > Environment Variables"
    );
  } else {
    console.warn("⚠️ Fonctionnalités Stripe désactivées en développement");
  }
}

// Initialisation Stripe conditionnelle (uniquement côté serveur)
export const stripe =
  isServer && stripeSecretKey
    ? new Stripe(stripeSecretKey, {
        apiVersion: "2025-05-28.basil",
        appInfo: {
          name: "PlanniKeeper",
          version: "1.0.0",
          url: isProduction
            ? "https://plannikeeper.ch"
            : "http://localhost:3000",
        },
        typescript: true,
        timeout: isProduction ? 30000 : 10000,
      })
    : null;
export const PLAN_DETAILS = {
  FREE: {
    id: "FREE",
    name: "Gratuit",
    description: "Pour découvrir l'application",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxObjects: 1,
    maxStorage: 500, // MB
    maxSectors: 1,
    maxArticles: 10,
    maxTasks: 50,
    features: [
      "1 utilisateur",
      "1 objet immobilier",
      "500MB de stockage",
      "Support communauté",
      "Fonctionnalités de base",
    ],
    popular: false,
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    description: "Pour une utilisation professionnelle",
    price: 29, // Ajustez selon vos besoins
    monthlyPrice: 29,
    yearlyPrice: 290, // 10 mois payés sur 12
    maxUsers: 10,
    maxObjects: null, // Illimité
    maxStorage: 10240, // 10GB
    maxSectors: null, // Illimité
    maxArticles: null, // Illimité
    maxTasks: null, // Illimité
    features: [
      "Jusqu'à 10 utilisateurs",
      "Objets immobiliers illimités",
      "10GB de stockage",
      "Support prioritaire",
      "Toutes les fonctionnalités",
      "Gestion avancée des accès",
      "Rapports et analytics",
    ],
    popular: true,
  },
  SUPER_ADMIN: {
    id: "SUPER_ADMIN",
    name: "Super Administrateur",
    description: "Accès complet au système",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: null,
    maxObjects: null,
    maxStorage: null,
    maxSectors: null,
    maxArticles: null,
    maxTasks: null,
    features: ["Accès administrateur complet"],
    popular: false,
  },
} as const;

export type PlanId = keyof typeof PLAN_DETAILS;

// Helpers utilitaires
export function getPlanDetails(planId: string) {
  return PLAN_DETAILS[planId as PlanId] || PLAN_DETAILS.FREE;
}

export function isValidPlanId(planId: string): planId is PlanId {
  return planId in PLAN_DETAILS;
}

// Helper pour obtenir les plans payants
export function getPayablePlans() {
  return Object.values(PLAN_DETAILS).filter((plan) => plan.price > 0);
}

export function isStripeAvailable(): boolean {
  return stripe !== null;
}

// Configuration centralisée des plans
