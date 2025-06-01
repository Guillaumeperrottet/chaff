// src/app/api/admin/send-welcome-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { superAdminGuard } from "@/lib/super-admin";
import { EmailService } from "@/lib/email";

interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  organizationName: string;
  temporaryPassword: string;
  planName: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const {
      userEmail,
      userName,
      organizationName,
      temporaryPassword,
      planName,
    }: WelcomeEmailData = await req.json();

    // Validation des champs requis
    if (!userEmail || !userName || !organizationName || !temporaryPassword) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Créer le template d'email de bienvenue
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue sur PlanniKeeper</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: #d9840d; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
            .credentials { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { 
              display: inline-block; 
              background-color: #d9840d; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0; 
            }
            .warning { 
              background-color: #fff3cd; 
              border: 1px solid #ffeaa7; 
              color: #856404; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 20px 0; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 PlanniKeeper</h1>
              <h2>Bienvenue dans votre espace de gestion immobilière !</h2>
            </div>
            
            <div class="content">
              <h3>Bonjour ${userName},</h3>
              
              <p>Félicitations ! Votre compte PlanniKeeper a été créé avec succès. Vous pouvez maintenant commencer à organiser et gérer vos projets immobiliers en toute simplicité.</p>
              
              <div class="credentials">
                <h4>📋 Vos informations de connexion :</h4>
                <p><strong>Organisation :</strong> ${organizationName}</p>
                <p><strong>Plan d'abonnement :</strong> ${planName}</p>
                <p><strong>Email :</strong> ${userEmail}</p>
                <p><strong>Mot de passe temporaire :</strong> <code>${temporaryPassword}</code></p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important :</strong> Pour votre sécurité, vous devrez changer ce mot de passe lors de votre première connexion.
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/signin" class="button">
                  🚀 Accéder à PlanniKeeper
                </a>
              </div>
              
              <h4>🎯 Prochaines étapes :</h4>
              <ol>
                <li>Connectez-vous avec vos identifiants</li>
                <li>Changez votre mot de passe</li>
                <li>Créez votre premier objet immobilier</li>
                <li>Organisez vos secteurs et articles</li>
                <li>Commencez à planifier vos tâches</li>
              </ol>
              
              <h4>💡 Besoin d'aide ?</h4>
              <p>Notre équipe est là pour vous accompagner :</p>
              <ul>
                <li>📧 Support par email : <a href="mailto:support@plannikeeper.ch">support@plannikeeper.ch</a></li>
                <li>📖 Documentation en ligne (bientôt disponible)</li>
                <li>💬 Chat en direct dans l'application</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} PlanniKeeper. Tous droits réservés.</p>
              <p>Simplifiez votre gestion immobilière avec PlanniKeeper</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Envoyer l'email via le service d'emails
    const { error } = await EmailService.sendEmail({
      to: userEmail,
      subject: `🏠 Bienvenue sur PlanniKeeper - Votre compte est prêt !`,
      html: htmlContent,
    });

    if (error) {
      console.error("Erreur lors de l'envoi de l'email de bienvenue:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email de bienvenue envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du traitement de l'email de bienvenue:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 }
    );
  }
}
