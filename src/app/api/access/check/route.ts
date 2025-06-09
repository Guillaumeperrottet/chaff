import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { hasFeatureAccess, FeatureAccess } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ hasAccess: false }, { status: 401 });
    }

    const feature = req.nextUrl.searchParams.get("feature") as FeatureAccess;
    if (!feature) {
      return NextResponse.json({ error: "Feature required" }, { status: 400 });
    }

    const hasAccess = await hasFeatureAccess(user.id, feature);

    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error("Erreur vérification accès:", error);
    return NextResponse.json({ hasAccess: false }, { status: 500 });
  }
}
