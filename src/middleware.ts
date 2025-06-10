import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_MODE === "true";

  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // 🚫 IGNORER les routes système et statiques AVANT tout traitement
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/webhooks/") ||
    pathname.includes(".") || // fichiers statiques
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Get the authentication status from cookies
  const isAuthenticated = request.cookies.has("session");

  // If user is on the landing page (root) but is authenticated, redirect to dashboard
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 🔍 Check if it's a protected route that requires authentication
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isApiRoute =
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/webhooks/");

  if (isDashboardRoute || isApiRoute) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        console.log(
          `❌ Accès refusé - utilisateur non authentifié: ${pathname}`
        );

        if (isApiRoute) {
          return NextResponse.json(
            {
              error: "Non autorisé",
              message: "Authentification requise",
              code: "AUTH_REQUIRED",
            },
            { status: 401 }
          );
        }

        return NextResponse.redirect(new URL("/signin", request.url));
      }

      console.log(
        `✅ Accès autorisé: ${pathname} pour utilisateur ${session.user.id}`
      );
    } catch (error) {
      console.error("❌ Erreur middleware:", error);

      if (isApiRoute) {
        return NextResponse.json(
          {
            error: "Erreur interne",
            message: "Erreur lors de la vérification de l'authentification",
            code: "INTERNAL_ERROR",
          },
          { status: 500 }
        );
      }

      // En cas d'erreur, rediriger vers signin par sécurité
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  // Gestion CORS optimisée
  return handleCorsAndNext(request, isDev);
}

function handleCorsAndNext(request: NextRequest, isDev: boolean) {
  const origin = isDev
    ? "http://localhost:3000"
    : request.headers.get("Origin") || "*";

  // Pour les requêtes OPTIONS (preflight)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
          "GET, POST, OPTIONS, PUT, DELETE, PATCH",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Configuration CORS pour toutes les autres requêtes
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
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
    // Matcher général pour les redirections et CORS
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)",
  ],
};
