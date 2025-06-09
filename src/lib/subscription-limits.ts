// src/lib/subscription-limits.ts - Version nettoyée
import { prisma } from "./prisma";
import { getPlanDetails } from "@/lib/stripe-client";

// Types simplifiés - suppression des objets et tâches
export type LimitType = "users" | "storage";

interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  unlimited: boolean;
  percentage?: number;
  remaining?: number;
}

/**
 * Vérifie une limite spécifique
 */
export async function checkOrganizationLimits(
  organizationId: string,
  checkType: LimitType
): Promise<LimitCheckResult> {
  const subscription = await getOrganizationSubscription(organizationId);
  const planDetails = getPlanDetails(subscription.planName);

  const current = await getCurrentCount(organizationId, checkType);
  let limit: number | null = null;

  switch (checkType) {
    case "users":
      limit = planDetails.maxUsers;
      break;
    case "storage":
      // Convertir MB en bytes pour la comparaison
      limit = planDetails.maxStorage
        ? planDetails.maxStorage * 1024 * 1024
        : null;
      break;
  }

  return buildLimitResult(current, limit);
}

/**
 * Construit le résultat de vérification de limite
 */
function buildLimitResult(
  current: number,
  limit: number | null
): LimitCheckResult {
  if (limit === null) {
    return {
      allowed: true,
      current,
      limit: null,
      unlimited: true,
    };
  }

  const percentage = Math.round((current / limit) * 100);
  const remaining = Math.max(0, limit - current);

  return {
    allowed: current < limit,
    current,
    limit,
    unlimited: false,
    percentage,
    remaining,
  };
}

/**
 * Récupère l'abonnement d'une organisation avec fallback
 */
async function getOrganizationSubscription(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  // Si pas d'abonnement ou abonnement inactif, utiliser le plan gratuit
  if (!subscription || !isSubscriptionActive(subscription)) {
    return {
      planName: "FREE",
      planId: "FREE",
      isActive: false,
    };
  }

  return {
    planName: subscription.plan.name,
    planId: subscription.plan.id,
    isActive: true,
  };
}

/**
 * Vérifie si un abonnement est actif
 */
function isSubscriptionActive(subscription: { status: string }): boolean {
  return ["ACTIVE", "TRIALING"].includes(subscription.status);
}

/**
 * Récupère le nombre actuel pour un type de limite
 */
async function getCurrentCount(
  organizationId: string,
  limitType: LimitType
): Promise<number> {
  switch (limitType) {
    case "users":
      return await prisma.organizationUser.count({
        where: { organizationId },
      });

    case "storage":
      const storageUsage = await prisma.storageUsage.findUnique({
        where: { organizationId },
      });
      return Number(storageUsage?.totalUsedBytes || 0);

    default:
      return 0;
  }
}

/**
 * Met à jour les limites personnalisées d'une organisation
 */
export async function updateCustomLimits(
  organizationId: string,
  customLimits: {
    maxUsers?: number | null;
    maxStorage?: number | null;
  }
): Promise<void> {
  // Vérifier si l'organisation a un abonnement
  let subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  // Si pas d'abonnement, créer un plan personnalisé
  if (!subscription) {
    // Créer ou récupérer le plan CUSTOM
    let customPlan = await prisma.plan.findFirst({
      where: { name: "CUSTOM" },
    });

    if (!customPlan) {
      customPlan = await prisma.plan.create({
        data: {
          name: "CUSTOM",
          price: 0,
          monthlyPrice: 0,
          maxUsers: customLimits.maxUsers,
          maxStorage: customLimits.maxStorage,
          hasCustomPricing: true,
          features: ["Limites personnalisées"],
        },
      });
    }

    // Créer l'abonnement
    subscription = await prisma.subscription.create({
      data: {
        organizationId,
        planId: customPlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  // Mettre à jour le plan avec les nouvelles limites
  await prisma.plan.update({
    where: { id: subscription.planId },
    data: {
      maxUsers: customLimits.maxUsers,
      maxStorage: customLimits.maxStorage,
    },
  });
}

/**
 * Vérifie si une action peut être effectuée (avant création)
 */
export async function canPerformAction(
  organizationId: string,
  action: LimitType,
  additionalCount: number = 1
): Promise<{
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number | null;
}> {
  const limitCheck = await checkOrganizationLimits(organizationId, action);

  if (limitCheck.unlimited) {
    return {
      allowed: true,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  if (
    limitCheck.limit &&
    limitCheck.current + additionalCount > limitCheck.limit
  ) {
    return {
      allowed: false,
      reason: `Limite ${action} atteinte (${limitCheck.current}/${limitCheck.limit})`,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  return {
    allowed: true,
    current: limitCheck.current,
    limit: limitCheck.limit,
  };
}
