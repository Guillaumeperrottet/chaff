// src/app/api/access-control/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import {
  checkObjectAccess,
  checkSectorAccess,
  checkArticleAccess,
  checkTaskAccess,
} from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ hasAccess: false }, { status: 401 });
    }

    const { entityType, entityId, requiredLevel } = await req.json();

    let hasAccess = false;

    switch (entityType) {
      case "object":
        hasAccess = await checkObjectAccess(user.id, entityId, requiredLevel);
        break;
      case "sector":
        hasAccess = await checkSectorAccess(user.id, entityId, requiredLevel);
        break;
      case "article":
        hasAccess = await checkArticleAccess(user.id, entityId, requiredLevel);
        break;
      case "task":
        hasAccess = await checkTaskAccess(user.id, entityId, requiredLevel);
        break;
      default:
        return NextResponse.json(
          { error: "Type d'entité non valide" },
          { status: 400 }
        );
    }

    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error("Erreur lors de la vérification des accès:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification des accès" },
      { status: 500 }
    );
  }
}
