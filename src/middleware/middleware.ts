import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasFeatureAccess } from "@/lib/access-control";

const protectedRoutes = {
  "/dashboard/payroll": "payroll",
  "/dashboard/analytics": "advanced_reports",
} as const;

export async function middleware(request: NextRequest) {
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_MODE === "true";
  const origin = isDev
    ? "http://localhost:3000"
    : request.headers.get("Origin") || "*";

  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // Get the authentication status from cookies
  const isAuthenticated = request.cookies.has("session");

  // If user is on the landing page (root) but is authenticated, redirect to dashboard
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Vérifier si c'est une route protégée par fonctionnalité
  const requiredFeature =
    protectedRoutes[pathname as keyof typeof protectedRoutes];

  if (requiredFeature) {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    const hasAccess = await hasFeatureAccess(session.user.id, requiredFeature);

    if (!hasAccess) {
      // Rediriger vers une page d'upgrade
      const upgradeUrl = new URL("/pricing", request.url);
      upgradeUrl.searchParams.set("feature", requiredFeature);
      upgradeUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(upgradeUrl);
    }
  }

  // IMPORTANT: Ignorer les routes de webhook Stripe
  if (request.nextUrl.pathname.startsWith("/api/webhooks/stripe")) {
    return NextResponse.next();
  }

  // Pour les requêtes OPTIONS (preflight)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Configuration de base pour toutes les requêtes
  const response = NextResponse.next();

  // Définir les en-têtes CORS appropriés
  response.headers.set(
    "Access-Control-Allow-Origin",
    isDev ? "http://localhost:3000" : request.headers.get("Origin") || "*"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE, PATCH"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Cookie"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/api/:path*",
    "/dashboard/payroll/:path*",
    "/dashboard/analytics/:path*",
  ],
};
