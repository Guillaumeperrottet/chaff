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
