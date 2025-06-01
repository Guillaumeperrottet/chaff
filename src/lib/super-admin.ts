// src/lib/super-admin.ts
import { prisma } from "./prisma";

// Liste des emails des super-administrateurs
const SUPER_ADMIN_EMAILS = ["perrottet.guillaume.97@gmail.com"];

export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Vérifier si l'email est dans la liste des super-admins
    return user !== null && SUPER_ADMIN_EMAILS.includes(user.email);
  } catch (error) {
    console.error("Erreur lors de la vérification du super-admin:", error);
    return false;
  }
}

// Middleware pour protéger les routes d'administration
export async function superAdminGuard(
  userId: string | undefined
): Promise<boolean> {
  if (!userId) return false;
  return isSuperAdmin(userId);
}
