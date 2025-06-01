// src/lib/limits-middleware.ts - Version finale à créer
import { NextResponse } from "next/server";
import { canPerformAction, LimitType } from "./subscription-limits";

interface LimitValidationOptions {
  organizationId: string;
  action: LimitType;
  count?: number;
  skipValidation?: boolean;
}

export async function validateLimits(options: LimitValidationOptions) {
  const { organizationId, action, count = 1, skipValidation = false } = options;

  if (skipValidation) {
    return { allowed: true };
  }

  try {
    const validation = await canPerformAction(organizationId, action, count);

    if (!validation.allowed) {
      return {
        allowed: false,
        error: validation.reason || `Limite ${action} atteinte`,
        response: NextResponse.json(
          {
            error: validation.reason || `Limite ${action} atteinte`,
            limits: {
              current: validation.current,
              limit: validation.limit,
              type: action,
            },
          },
          { status: 403 }
        ),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Erreur lors de la validation des limites:", error);
    return { allowed: true }; // En cas d'erreur, on autorise
  }
}
