// src/lib/stripe-client.ts - Version client (sans variables serveur)

// Configuration centralisée des plans (sans Stripe server)
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
