// src/lib/stripe.ts - Version nettoyée (safe pour client/serveur)
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
          name: "Chaff",
          version: "1.0.0",
          url: isProduction ? "https://chaff.ch" : "http://localhost:3000",
        },
        typescript: true,
        timeout: isProduction ? 30000 : 10000,
      })
    : null;

// Configuration centralisée des plans (avec nouvelles limites)
export const PLAN_DETAILS = {
  FREE: {
    id: "FREE",
    name: "Gratuit",
    description: "Plan de découverte",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxMandates: 1, // ✨ NOUVEAU: Limite de 1 mandat
    maxStorage: 100, // 100MB
    features: [
      "1 utilisateur maximum",
      "1 mandat/entreprise", // ✨ NOUVEAU
      "Toutes les fonctionnalités",
      "100MB de stockage",
      "Support communauté/FAQ",
    ],
    popular: false,
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    description: "Plan professionnel complet",
    price: 29,
    monthlyPrice: 29,
    yearlyPrice: 290, // 10 mois payés sur 12
    maxUsers: 5, // ✨ MODIFIÉ: 5 utilisateurs au lieu de 10
    maxMandates: null, // ✨ NOUVEAU: Illimité
    maxStorage: 10240, // 10GB
    features: [
      "Jusqu'à 5 utilisateurs", // ✨ MODIFIÉ
      "Mandats/entreprises illimités", // ✨ NOUVEAU
      "Toutes les fonctionnalités",
      "10GB de stockage",
      "Support email prioritaire", // ✨ MODIFIÉ
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
    maxMandates: null, // ✨ NOUVEAU: Illimité
    maxStorage: null,
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

// ✨ NOUVEAU: Helper pour vérifier les limites
export function getPlanLimits(planId: string) {
  const plan = getPlanDetails(planId);
  return {
    maxUsers: plan.maxUsers,
    maxMandates: plan.maxMandates,
    maxStorage: plan.maxStorage,
  };
}

export function isStripeAvailable(): boolean {
  return stripe !== null;
}
