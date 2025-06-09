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
          name: "Chaff",
          version: "1.0.0",
          url: isProduction ? "https://chaff.ch" : "http://localhost:3000",
        },
        typescript: true,
        timeout: isProduction ? 30000 : 10000,
      })
    : null;
export const PLAN_DETAILS = {
  FREE: {
    id: "FREE",
    name: "Gratuit",
    description: "Plan de découverte limité",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    // 🚫 LIMITATIONS STRICTES
    maxUsers: 1, // 1 seul utilisateur
    maxObjects: 1, // 1 seul mandat
    maxStorage: 100, // 100MB seulement (réduit)
    maxSectors: 0, // Pas de secteurs
    maxArticles: 0, // Pas d'articles
    maxTasks: 5, // Maximum 5 tâches
    // 🚫 RESTRICTIONS D'ACCÈS
    allowPayrollAccess: false, // 🚫 PAS d'accès masse salariale
    allowAdvancedReports: false, // 🚫 PAS de rapports avancés
    allowBulkImport: false, // 🚫 PAS d'import en lot
    allowAPIAccess: false, // 🚫 PAS d'accès API
    features: [
      "1 utilisateur maximum",
      "1 mandat de découverte",
      "100MB de stockage",
      "5 tâches maximum",
      "Dashboard de base uniquement",
      "Support communauté",
      "❌ Pas d'accès masse salariale",
      "❌ Pas de rapports avancés",
    ],
    popular: false,
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    description: "Plan complet pour professionnels",
    price: 29,
    monthlyPrice: 29,
    yearlyPrice: 290, // 10 mois payés sur 12
    // ✅ ACCÈS COMPLET
    maxUsers: 10,
    maxObjects: null, // Illimité
    maxStorage: 10240, // 10GB
    maxSectors: null, // Illimité
    maxArticles: null, // Illimité
    maxTasks: null, // Illimité
    // ✅ TOUS LES ACCÈS
    allowPayrollAccess: true, // ✅ Accès masse salariale
    allowAdvancedReports: true, // ✅ Rapports avancés
    allowBulkImport: true, // ✅ Import en lot
    allowAPIAccess: true, // ✅ Accès API
    features: [
      "Jusqu'à 10 utilisateurs",
      "Mandats illimités",
      "10GB de stockage",
      "Tâches illimitées",
      "✅ Accès complet masse salariale",
      "✅ Rapports et analytics avancés",
      "✅ Import/export en lot",
      "Support prioritaire",
      "Formation incluse",
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
    allowPayrollAccess: true,
    allowAdvancedReports: true,
    allowBulkImport: true,
    allowAPIAccess: true,
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
