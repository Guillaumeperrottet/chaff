// src/lib/stripe-client.ts - Version nettoyée

// Configuration centralisée des plans (sans restrictions d'accès)
export const PLAN_DETAILS = {
  FREE: {
    id: "FREE",
    name: "Gratuit",
    description: "Pour découvrir l'application",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxStorage: 100, // MB
    features: [
      "1 utilisateur",
      "Toutes les fonctionnalités",
      "100MB de stockage",
      "Support communauté",
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
    maxUsers: 10,
    maxStorage: 10240, // 10GB
    features: [
      "Jusqu'à 10 utilisateurs",
      "Toutes les fonctionnalités",
      "10GB de stockage",
      "Support prioritaire",
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
    maxUsers: null, // Illimité
    maxStorage: null, // Illimité
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
