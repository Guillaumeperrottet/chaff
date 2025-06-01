// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { Resend } from "resend";
import { getFeedbackEmailTemplate } from "@/lib/email-templates/feedback-email";

// Types pour notre feedback
type FeedbackType = "feature" | "bug" | "improvement";

interface FeedbackData {
  title: string;
  description: string;
  type: FeedbackType;
}

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour soumettre un feedback" },
        { status: 401 }
      );
    }

    // Récupérer les données du feedback
    const { title, description, type }: FeedbackData = await req.json();

    // Validation des champs
    if (!title || !description || !type) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (!["feature", "bug", "improvement"].includes(type)) {
      return NextResponse.json(
        { error: "Type de feedback invalide" },
        { status: 400 }
      );
    }

    // Initialiser Resend pour l'envoi d'email
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Traduire le type pour l'email (pour le sujet)
    const typeLabels: Record<FeedbackType, string> = {
      feature: "Nouvelle fonctionnalité",
      bug: "Signalement de bug",
      improvement: "Amélioration",
    };

    // Générer le contenu de l'email avec notre template amélioré
    const htmlContent = getFeedbackEmailTemplate({
      userName: user.name || "Utilisateur",
      userEmail: user.email,
      title,
      description,
      type,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://plannikeeper.ch",
    });

    // Envoyer l'email
    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "PlanniKeeper <notifications@plannikeeper.ch>",
      to: ["perrottet.guillaume.97@gmail.com"], // Email du destinataire
      subject: `[PlanniKeeper Feedback] ${typeLabels[type]}: ${title}`,
      html: htmlContent,
      replyTo: user.email || undefined,
    });

    if (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    // Réponse réussie
    return NextResponse.json({
      success: true,
      message: "Feedback envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du traitement du feedback:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 }
    );
  }
}
