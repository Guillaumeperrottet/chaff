// src/app/api/invitations/accept/route.ts - Version corrigée
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { EmailService } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { inviteCode, email, password, name } = await req.json();

    console.log("🎯 Acceptation invitation:", { inviteCode, email, name });

    // Validation des données
    if (!inviteCode || !email || !password || !name) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // 1. Valider l'invitation
    const invitation = await prisma.invitationCode.findFirst({
      where: {
        code: inviteCode,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { organization: true },
    });

    if (!invitation) {
      console.log("❌ Invitation invalide:", { inviteCode });
      return NextResponse.json(
        { error: "Code d'invitation invalide ou expiré" },
        { status: 400 }
      );
    }

    // 2. Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      console.log("❌ Email déjà utilisé:", email);
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // 3. ✅ Créer l'utilisateur via Better Auth avec métadonnées d'invitation
    console.log("🔧 Création utilisateur avec invitation via Better Auth...");

    const signupResult = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase().trim(),
        password: password,
        name: name.trim(),
      },
    });

    if (!signupResult.user) {
      console.error("❌ Erreur création utilisateur Better Auth");
      return NextResponse.json(
        { error: "Erreur lors de la création du compte" },
        { status: 500 }
      );
    }

    const user = signupResult.user;
    console.log("✅ Utilisateur créé via Better Auth:", user.id);

    // 4. ✅ Configuration spécifique invitation dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'utilisateur avec les métadonnées d'invitation
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true, // Force vérification pour invitations
          organizationId: invitation.organizationId,
          metadata: {
            inviteCode,
            invitedBy: invitation.createdBy,
            invitedAt: new Date().toISOString(),
            acceptedAt: new Date().toISOString(),
            signupType: "invitation", // 🔧 Marquer comme invitation
          },
        },
      });

      // Créer l'association OrganizationUser
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });

      console.log("✅ Association OrganizationUser créée:", invitation.role);

      // Marquer l'invitation comme utilisée
      await tx.invitationCode.update({
        where: { id: invitation.id },
        data: { isUsed: true },
      });

      console.log("✅ Invitation marquée comme utilisée");

      return updatedUser;
    });

    // 5. ✅ Connexion automatique
    console.log("🔧 Connexion automatique après invitation...");

    const signInResult = await auth.api.signInEmail({
      body: {
        email: email.toLowerCase().trim(),
        password: password,
      },
    });

    if (!signInResult.user) {
      console.error("❌ Erreur connexion automatique après invitation");
      return NextResponse.json({
        success: true,
        message:
          "Compte créé avec succès. Veuillez vous connecter manuellement.",
        user: {
          id: result.id,
          name: result.name,
          email: result.email,
          organizationName: invitation.organization.name,
          role: invitation.role,
        },
        redirect: "/signin?message=account_created",
      });
    }

    console.log("✅ Connexion automatique réussie après invitation");

    // 6. Email de bienvenue pour invitation
    try {
      await EmailService.sendWelcomeEmail(result, invitation.organization.name);
      console.log("📧 Email de bienvenue envoyé pour invitation acceptée");
    } catch (emailError) {
      console.error("❌ Erreur envoi email bienvenue:", emailError);
    }

    // 7. Réponse de succès avec session créée
    const response = NextResponse.json({
      success: true,
      message: "Invitation acceptée et compte connecté avec succès",
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        organizationName: invitation.organization.name,
        role: invitation.role,
      },
      redirect: "/dashboard",
      timestamp: new Date().toISOString(),
    });

    console.log("🎉 Invitation acceptée avec succès pour:", result.email);
    return response;
  } catch (error) {
    console.error("❌ Erreur acceptation invitation:", error);

    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la création du compte",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Erreur inconnue"
            : undefined,
      },
      { status: 500 }
    );
  }
}
