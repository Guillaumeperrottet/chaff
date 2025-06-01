// src/lib/dev-auth.ts
import { getUser as originalGetUser } from "./auth-session";

// Version de développement de getUser qui simule un utilisateur connecté
export async function getUser() {
  if (process.env.NODE_ENV !== "development") {
    return originalGetUser();
  }

  // Utilisateur fictif pour le développement
  return {
    id: "dev-user-id",
    name: "Développeur",
    email: "dev@example.com",
    emailVerified: true,
    image: null,
  };
}

// Versions simplifiées des fonctions de vérification d'accès
export async function checkOrganizationMembership() {
  return process.env.NODE_ENV === "development" ? true : false;
}

export async function isOrganizationAdmin() {
  return process.env.NODE_ENV === "development" ? true : false;
}

export async function checkObjectAccess() {
  return process.env.NODE_ENV === "development" ? true : false;
}

export async function checkSectorAccess() {
  return process.env.NODE_ENV === "development" ? true : false;
}

export async function checkArticleAccess() {
  return process.env.NODE_ENV === "development" ? true : false;
}

export async function checkTaskAccess() {
  return process.env.NODE_ENV === "development" ? true : false;
}

export async function getAccessibleObjects() {
  return process.env.NODE_ENV === "development" ? [] : [];
}
