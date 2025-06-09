import { getUser } from "./auth-session";
import { getPlanDetails } from "./stripe";

export type FeatureAccess =
  | "payroll"
  | "advanced_reports"
  | "bulk_import"
  | "api_access"
  | "multiple_mandates"
  | "team_management";

/**
 * Vérifie si l'utilisateur a accès à une fonctionnalité
 */
export async function hasFeatureAccess(
  userId: string,
  feature: FeatureAccess
): Promise<boolean> {
  try {
    const user = await getUser();
    if (!user) return false;

    // Super admin a tout
    if (user.planType === "SUPER_ADMIN") return true;

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: user.organizationId! },
      include: { plan: true },
    });

    if (!subscription) return false;

    const planDetails = getPlanDetails(subscription.plan.name);

    switch (feature) {
      case "payroll":
        return planDetails.allowPayrollAccess ?? false;
      case "advanced_reports":
        return planDetails.allowAdvancedReports ?? false;
      case "bulk_import":
        return planDetails.allowBulkImport ?? false;
      case "api_access":
        return planDetails.allowAPIAccess ?? false;
      case "multiple_mandates":
        return (planDetails.maxObjects ?? 0) > 1;
      case "team_management":
        return (planDetails.maxUsers ?? 0) > 1;
      default:
        return false;
    }
  } catch (error) {
    console.error("Erreur vérification accès:", error);
    return false;
  }
}

/**
 * Middleware pour protéger les routes selon le plan
 */
export async function requireFeatureAccess(feature: FeatureAccess) {
  const user = await getUser();
  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  const hasAccess = await hasFeatureAccess(user.id, feature);
  if (!hasAccess) {
    throw new Error(
      `Accès refusé: fonctionnalité ${feature} non disponible dans votre plan`
    );
  }

  return true;
}
