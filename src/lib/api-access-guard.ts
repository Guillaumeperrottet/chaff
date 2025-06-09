// src/lib/api-access-guard.ts - Guard pour protéger les API routes
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasFeatureAccess, FeatureAccess } from "@/lib/access-control";
import { headers } from "next/headers";

interface ApiAccessOptions {
  feature: FeatureAccess;
  requiredPlans?: string[];
  customMessage?: string;
  skipValidation?: boolean;
}

/**
 * Middleware pour protéger les routes API selon les fonctionnalités
 */
export async function validateApiAccess(
  request: NextRequest,
  options: ApiAccessOptions
): Promise<NextResponse | null> {
  if (options.skipValidation) {
    return null; // Continuer sans validation
  }

  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Non autorisé",
          message: "Authentification requise",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    // Vérifier l'accès à la fonctionnalité
    const hasAccess = await hasFeatureAccess(session.user.id, options.feature);

    if (!hasAccess) {
      const planType = session.user.planType || "FREE";

      return NextResponse.json(
        {
          error: "Accès refusé",
          message:
            options.customMessage ||
            `Cette fonctionnalité nécessite un plan Premium. Plan actuel: ${planType}`,
          code: "FEATURE_ACCESS_DENIED",
          details: {
            currentPlan: planType,
            requiredFeature: options.feature,
            requiredPlans: options.requiredPlans || ["PREMIUM", "SUPER_ADMIN"],
            upgradeUrl: "/pricing",
          },
        },
        { status: 403 }
      );
    }

    return null; // Accès autorisé, continuer
  } catch (error) {
    console.error("Erreur validation API:", error);
    return NextResponse.json(
      {
        error: "Erreur interne",
        message: "Erreur lors de la vérification des permissions",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * HOC pour protéger facilement une route API
 */
export function withFeatureAccess(
  handler: (req: NextRequest, context?: unknown) => Promise<NextResponse>,
  options: ApiAccessOptions
) {
  return async (req: NextRequest, context?: unknown) => {
    // Valider l'accès
    const accessResponse = await validateApiAccess(req, options);
    if (accessResponse) {
      return accessResponse; // Retourner l'erreur d'accès
    }

    // Continuer avec le handler original
    return handler(req, context);
  };
}

/**
 * Exemple d'utilisation dans une route API:
 *
 * // src/app/api/payroll/route.ts
 * import { withFeatureAccess } from "@/lib/api-access-guard";
 *
 * async function GET(req: NextRequest) {
 *   // Logique de la route...
 *   return NextResponse.json({ data: "success" });
 * }
 *
 * export const handler = withFeatureAccess(GET, {
 *   feature: "payroll",
 *   customMessage: "L'accès à la masse salariale nécessite un plan Premium"
 * });
 *
 * export { handler as GET };
 */

/**
 * Version simplifiée pour vérification rapide dans les composants serveur
 */
export async function requireFeatureAccessServer(feature: FeatureAccess) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Utilisateur non authentifié");
    }

    const hasAccess = await hasFeatureAccess(session.user.id, feature);

    if (!hasAccess) {
      throw new Error(
        `Accès refusé: fonctionnalité ${feature} non disponible dans votre plan`
      );
    }

    return true;
  } catch (error) {
    console.error("Erreur vérification accès serveur:", error);
    throw error;
  }
}
