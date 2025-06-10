import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // ✅ OPTION SIMPLIFIÉE : Laisser Better Auth gérer l'authentification
  // au lieu de vérifier dans le middleware Edge

  // Juste gérer le CORS et laisser passer toutes les requêtes
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
