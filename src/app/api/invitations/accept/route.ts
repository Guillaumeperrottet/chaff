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

    // 3. CORRECTIF PRINCIPAL : Utiliser Better Auth pour créer l'utilisateur
    console.log("🔧 Création de l'utilisateur via Better Auth...");

    // Utiliser Better Auth API pour créer l'utilisateur avec vérification email automatique
    const signupResult = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase().trim(),
        password: password,
        name: name.trim(),
      },
    });

    if (!signupResult.user) {
      console.error("❌ Erreur création utilisateur Better Auth:");
      return NextResponse.json(
        { error: "Erreur lors de la création du compte" },
        { status: 500 }
      );
    }

    const user = signupResult.user;
    console.log("✅ Utilisateur créé via Better Auth:", user.id);

    // 4. Finaliser avec la logique d'invitation dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'utilisateur avec les métadonnées d'invitation
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true, // S'assurer que c'est vérifié
          organizationId: invitation.organizationId,
          metadata: {
            inviteCode,
            invitedBy: invitation.createdBy,
            invitedAt: new Date().toISOString(),
            acceptedAt: new Date().toISOString(),
            directVerification: true,
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

      // Créer les accès par défaut aux objets existants
      const objects = await tx.objet.findMany({
        where: { organizationId: invitation.organizationId },
        select: { id: true, nom: true },
      });

      if (objects.length > 0) {
        const accessLevel = invitation.role === "admin" ? "admin" : "read";

        const accessPromises = objects.map((object) =>
          tx.objectAccess.create({
            data: {
              userId: user.id,
              objectId: object.id,
              accessLevel,
            },
          })
        );

        await Promise.all(accessPromises);
        console.log(
          `✅ Accès ${accessLevel} créés pour ${objects.length} objets`
        );
      }

      // Marquer l'invitation comme utilisée
      await tx.invitationCode.update({
        where: { id: invitation.id },
        data: { isUsed: true },
      });

      console.log("✅ Invitation marquée comme utilisée");

      return updatedUser;
    });

    // 5. CORRECTIF : Créer une session automatiquement
    console.log("🔧 Connexion automatique de l'utilisateur...");

    const signInResult = await auth.api.signInEmail({
      body: {
        email: email.toLowerCase().trim(),
        password: password,
      },
    });

    if (!signInResult.user) {
      console.error("❌ Erreur connexion automatique:");
      // Malgré l'erreur de connexion, le compte est créé
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
    console.log("✅ Connexion automatique réussie");

    // 6. Envoi de l'email de bienvenue
    try {
      await EmailService.sendWelcomeEmail(result, invitation.organization.name);
      console.log("📧 Email de bienvenue envoyé pour invitation acceptée");
    } catch (emailError) {
      console.error("❌ Erreur envoi email bienvenue:", emailError);
      // Ne pas faire échouer la création pour autant
    }

    // 7. Réponse de succès avec session créée
    const response = NextResponse.json({
      success: true,
      message: "Compte créé et connecté avec succès",
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

    // Log détaillé pour debug
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
