import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasFeatureAccess, FeatureAccess } from "@/lib/access-control";

// Configuration des routes protégées avec gestion des routes dynamiques
const protectedRoutes = {
  "/dashboard/payroll": "payroll" as FeatureAccess,
  "/dashboard/analytics": "advanced_reports" as FeatureAccess,
} as const;

// Routes qui commencent par certains préfixes (pour les routes dynamiques)
const DYNAMIC_PROTECTED_ROUTES = [
  {
    prefix: "/dashboard/mandates/",
    suffix: "/payroll",
    feature: "payroll" as FeatureAccess,
    redirectTo: "/pricing?feature=payroll&reason=access_denied",
  },
  {
    prefix: "/api/mandats/",
    suffix: "/payroll",
    feature: "payroll" as FeatureAccess,
    isApi: true,
  },
  {
    prefix: "/api/payroll",
    feature: "payroll" as FeatureAccess,
    isApi: true,
  },
  {
    prefix: "/api/employees",
    feature: "payroll" as FeatureAccess,
    isApi: true,
  },
  {
    prefix: "/api/dashboard/payroll-ratios",
    feature: "payroll" as FeatureAccess,
    isApi: true,
  },
  {
    prefix: "/api/dashboard/analytics",
    feature: "advanced_reports" as FeatureAccess,
    isApi: true,
  },
];

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

  // 🔍 VÉRIFIER si c'est une route protégée (statique ou dynamique)
  let requiredFeature =
    protectedRoutes[pathname as keyof typeof protectedRoutes];
  let isApiRoute = false;
  let redirectTo = "/pricing";

  // Vérifier aussi les routes dynamiques si pas trouvé dans les routes statiques
  if (!requiredFeature) {
    const dynamicRoute = DYNAMIC_PROTECTED_ROUTES.find((route) => {
      if (route.prefix && route.suffix) {
        return (
          pathname.startsWith(route.prefix) && pathname.endsWith(route.suffix)
        );
      } else if (route.prefix) {
        return pathname.startsWith(route.prefix);
      }
      return false;
    });

    if (dynamicRoute) {
      requiredFeature = dynamicRoute.feature;
      isApiRoute = dynamicRoute.isApi || false;
      redirectTo = dynamicRoute.redirectTo || "/pricing";
    }
  }

  if (requiredFeature) {
    console.log(
      `🔍 Vérification accès pour route protégée: ${pathname} (feature: ${requiredFeature})`
    );

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

      // 🎯 VÉRIFIER LES PERMISSIONS avec votre système existant
      const hasAccess = await hasFeatureAccess(
        session.user.id,
        requiredFeature
      );

      if (!hasAccess) {
        console.log(`❌ Accès refusé - permissions insuffisantes:`, {
          userId: session.user.id,
          feature: requiredFeature,
          route: pathname,
        });

        if (isApiRoute) {
          return NextResponse.json(
            {
              error: "Accès refusé",
              message: `Cette fonctionnalité nécessite un plan supérieur.`,
              code: "PLAN_UPGRADE_REQUIRED",
              feature: requiredFeature,
              upgradeUrl: "/pricing",
            },
            { status: 403 }
          );
        }

        // Pour les pages, rediriger vers pricing avec contexte
        const upgradeUrl = new URL(redirectTo, request.url);
        if (!redirectTo.includes("feature=")) {
          upgradeUrl.searchParams.set("feature", requiredFeature);
        }
        upgradeUrl.searchParams.set("returnTo", pathname);

        return NextResponse.redirect(upgradeUrl);
      }

      console.log(
        `✅ Accès autorisé: ${pathname} pour fonctionnalité ${requiredFeature}`
      );
    } catch (error) {
      console.error("❌ Erreur middleware:", error);

      if (isApiRoute) {
        return NextResponse.json(
          {
            error: "Erreur interne",
            message: "Erreur lors de la vérification des permissions",
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
    // Pages dashboard - plus spécifique
    "/dashboard/payroll/:path*",
    "/dashboard/analytics/:path*",
    "/dashboard/mandates/:path*/payroll/:path*",

    // API routes protégées
    "/api/payroll/:path*",
    "/api/employees/:path*",
    "/api/mandats/:path*/payroll/:path*",
    "/api/dashboard/payroll-ratios/:path*",
    "/api/dashboard/analytics/:path*",

    // Matcher général pour les redirections et CORS
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)",
  ],
};
