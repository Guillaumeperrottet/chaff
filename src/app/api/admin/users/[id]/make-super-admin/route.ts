// src/app/api/admin/users/[id]/make-super-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";
import fs from "fs";
import path from "path";

// Fonction pour mettre à jour la liste des super-admins
async function updateSuperAdminList(email: string): Promise<boolean> {
  try {
    // Chemin vers le fichier super-admin.ts
    const filePath = path.join(process.cwd(), "src", "lib", "super-admin.ts");

    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, "utf8");

    // Trouver la ligne contenant SUPER_ADMIN_EMAILS
    const regex = /const SUPER_ADMIN_EMAILS = \[([\s\S]*?)\];/;
    const match = content.match(regex);

    if (!match) {
      throw new Error(
        "La définition de SUPER_ADMIN_EMAILS n'a pas été trouvée"
      );
    }

    // Extraire la liste actuelle des emails
    const currentEmailsString = match[1];
    const currentEmails = currentEmailsString
      .split(",")
      .map((e) => e.trim().replace(/['"]/g, ""))
      .filter(Boolean);

    // Si déjà présent, rien à faire
    if (currentEmails.includes(email)) {
      return false;
    }

    // Ajouter le nouvel email
    currentEmails.push(email);

    // Recomposer la ligne
    const newEmailsString = currentEmails.map((e) => `"${e}"`).join(", ");
    const newContent = content.replace(
      regex,
      `const SUPER_ADMIN_EMAILS = [${newEmailsString}];`
    );

    // Écrire le fichier mis à jour
    fs.writeFileSync(filePath, newContent, "utf8");

    return true;
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la liste des super-admins:",
      error
    );
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser || !(await superAdminGuard(currentUser.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Récupérer l'utilisateur cible
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }
    if (!targetUser.email) {
      return NextResponse.json(
        { error: "L'utilisateur n'a pas d'email valide" },
        { status: 400 }
      );
    }

    // Mettre à jour la liste des super-admins
    try {
      const added = await updateSuperAdminList(targetUser.email);
      if (!added) {
        return NextResponse.json({
          success: false,
          message: "Cet utilisateur est déjà super-administrateur",
        });
      }
      return NextResponse.json({
        success: true,
        message: `${targetUser.name || targetUser.email} est maintenant super-administrateur`,
        user: targetUser,
      });
    } catch (e) {
      console.error(
        "Erreur lors de la mise à jour de la liste des super-admins:",
        e
      );
      // En prod, le système de fichiers est lecture seule
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({
          success: false,
          message:
            "En production, veuillez mettre à jour manuellement la liste des super-admins dans le code source",
          user: targetUser,
        });
      }
      throw e;
    }
  } catch (error) {
    console.error("Erreur lors de la promotion en super-admin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
