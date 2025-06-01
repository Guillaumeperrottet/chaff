// src/lib/auth-client-utils.ts
import { authClient } from "./auth-client";

/**
 * Récupère l'utilisateur connecté côté client
 */
export async function getClientUser() {
  try {
    const session = await authClient.getSession();
    return session && "data" in session && session.data?.user
      ? session.data.user
      : null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est connecté côté client
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getClientUser();
    return !!user;
  } catch (error) {
    console.error("Erreur lors de la vérification d'authentification:", error);
    return false;
  }
}

/**
 * Vérifie si l'email de l'utilisateur est vérifié
 */
export async function isEmailVerified(): Promise<boolean> {
  try {
    const user = await getClientUser();
    return user?.emailVerified || false;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    return false;
  }
}
