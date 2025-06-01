import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

// Explicitement définir les méthodes pour s'assurer qu'elles sont bien exportées
const handler = toNextJsHandler(auth);

export const GET = handler.GET;
export const POST = handler.POST;

// Correction améliorée pour la gestion CORS - s'assurer que les headers sont configurés correctement
// et que la réponse est renvoyée sans redirection
export const OPTIONS = (req: Request) => {
  // Debug en développement
  if (process.env.NODE_ENV === "development") {
    console.log("OPTIONS request received in auth route");
  }

  // Obtenir l'origine de la requête
  const origin = req.headers.get("Origin") || "*";

  // Renvoyer une réponse avec les headers CORS appropriés
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
      // Important pour les navigateurs modernes
      Vary: "Origin",
    },
  });
};
