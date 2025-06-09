// src/lib/stripe-client.ts - Version nettoyée

// Configuration centralisée des plans (sans variables serveur)
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
      "Accès dashboard de base",
      "100MB de stockage",
      "Support communauté",
      "Fonctionnalités limitées",
    ],
    popular: false,
    // Restrictions spécifiques
    allowPayrollAccess: false,
    allowAdvancedReports: false,
    allowBulkImport: false,
    allowAPIAccess: false,
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
      "Rapports avancés",
      "Accès API",
    ],
    popular: true,
    // Accès complet
    allowPayrollAccess: true,
    allowAdvancedReports: true,
    allowBulkImport: true,
    allowAPIAccess: true,
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
    // Accès total
    allowPayrollAccess: true,
    allowAdvancedReports: true,
    allowBulkImport: true,
    allowAPIAccess: true,
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

// Helper pour vérifier les limites
export function getPlanLimits(planId: string) {
  const plan = getPlanDetails(planId);
  return {
    maxUsers: plan.maxUsers,
    maxStorage: plan.maxStorage,
    allowPayrollAccess: plan.allowPayrollAccess,
    allowAdvancedReports: plan.allowAdvancedReports,
    allowBulkImport: plan.allowBulkImport,
    allowAPIAccess: plan.allowAPIAccess,
  };
}
