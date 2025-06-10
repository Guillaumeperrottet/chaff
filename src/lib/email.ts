import { Resend } from "resend";
import { Plan, Organization, User } from "@prisma/client";

// Import direct des templates
import { getSubscriptionConfirmationTemplate } from "./email-templates/subscription-confirmation";
import { getWelcomeEmailTemplate } from "./email-templates/welcome-email";
import { getPlanChangeEmailTemplate } from "./email-templates/plan-change-email";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    console.log(`🔑 Resend API Key disponible: ${!!apiKey}`);
    console.log(`🔑 Longueur de la clé: ${apiKey?.length || 0}`);

    if (!apiKey) {
      console.error("❌ RESEND_API_KEY manquante");
      throw new Error("RESEND_API_KEY is not defined");
    }

    resend = new Resend(apiKey);
    console.log(`✅ Instance Resend créée`);
  }
  return resend;
}
export const EmailService = {
  // Méthode générique pour envoyer des emails
  async sendEmail({
    to,
    subject,
    html,
    from = process.env.RESEND_FROM_EMAIL || "Chaff.ch <notifications@chaff.ch>",
    replyTo = process.env.RESEND_REPLY_TO_EMAIL,
  }: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
  }) {
    try {
      const { data, error } = await getResend().emails.send({
        from,
        to: [to],
        subject,
        html,
        replyTo,
        headers: {
          "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(to)}>`,
        },
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Erreur dans le service d'email:", error);
      return { success: false, error };
    }
  },

  async sendWelcomeEmail(user: User, organizationName: string) {
    try {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

      const htmlContent = getWelcomeEmailTemplate(
        user.name || "utilisateur",
        organizationName,
        dashboardUrl
      );

      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL || "Chaff.ch <notifications@chaff.ch>",
        to: [user.email],
        subject: `Bienvenue sur Chaff.ch !`,
        html: htmlContent,
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
        headers: {
          "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}>`,
          "X-Entity-Ref-ID": `welcome-${user.id}-${Date.now()}`, // Identifiant unique pour éviter les duplications
        },
      });

      if (error) {
        console.error(
          "❌ Erreur lors de l'envoi de l'email de bienvenue:",
          error
        );

        // Gestion spéciale pour les domaines de test bloqués par Resend
        if (
          error.message?.includes("Invalid `to` field") &&
          error.message?.includes("testing email address")
        ) {
          console.warn(
            "⚠️ Email de bienvenue non envoyé : adresse de test bloquée par Resend"
          );
          return { success: false, error: { ...error, isTestDomain: true } };
        }

        return { success: false, error };
      }

      console.log("✅ Email de bienvenue envoyé avec succès à:", user.email);
      return { success: true, data };
    } catch (error) {
      console.error("❌ Exception dans sendWelcomeEmail:", error);
      return { success: false, error };
    }
  },

  async sendSubscriptionConfirmationEmail(
    user: User,
    organization: Organization,
    plan: Plan,
    currentPeriodEnd: Date
  ) {
    try {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

      const htmlContent = getSubscriptionConfirmationTemplate(
        user.name || "utilisateur",
        organization.name,
        this.getPlanDisplayName(plan.name),
        typeof plan.monthlyPrice === "object" && "toNumber" in plan.monthlyPrice
          ? plan.monthlyPrice.toNumber()
          : Number(plan.monthlyPrice),
        this.getPlanFeatures(plan),
        currentPeriodEnd,
        dashboardUrl
      );

      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL || "Chaff.ch <notifications@chaff.ch>",
        to: [user.email],
        subject: `Confirmation d'abonnement - ${this.getPlanDisplayName(plan.name)} - Chaff.ch`,
        html: htmlContent,
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
      });

      if (error) {
        console.error(
          "Erreur lors de l'envoi de l'email de confirmation d'abonnement:",
          error
        );
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Erreur dans le service d'email:", error);
      return { success: false, error };
    }
  },

  async sendPlanChangeEmail(
    user: User,
    organizationName: string,
    oldPlanName: string,
    newPlanName: string,
    newPlan: Plan
  ) {
    try {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

      const htmlContent = getPlanChangeEmailTemplate(
        user.name || "utilisateur",
        organizationName,
        oldPlanName,
        newPlanName,
        newPlan,
        dashboardUrl
      );

      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL || "Chaff.ch <notifications@chaff.ch>",
        to: [user.email],
        subject: `Changement de plan - ${organizationName} - Chaff.ch`,
        html: htmlContent,
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
        headers: {
          "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}>`,
          "X-Entity-Ref-ID": `plan-change-${user.id}-${Date.now()}`,
        },
      });

      if (error) {
        console.error(
          "Erreur lors de l'envoi de l'email de changement de plan:",
          error
        );
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Erreur dans le service d'email:", error);
      return { success: false, error };
    }
  },

  // Fonction utilitaire pour obtenir le nom d'affichage du plan
  getPlanDisplayName(planType: string): string {
    switch (planType) {
      case "FREE":
        return "Gratuit";
      case "PERSONAL":
        return "Particulier";
      case "PROFESSIONAL":
        return "Indépendant";
      case "ENTERPRISE":
        return "Entreprise";
      default:
        return planType;
    }
  },

  // Fonction utilitaire pour obtenir les fonctionnalités du plan
  getPlanFeatures(plan: Plan): string[] {
    const features: string[] = [];

    if (plan.maxUsers) {
      features.push(`${plan.maxUsers} utilisateurs`);
    } else {
      features.push("Utilisateurs illimités");
    }

    if (plan.maxMandates) {
      features.push(`${plan.maxMandates} mandats`);
    } else {
      features.push("Mandats illimités");
    }

    if (plan.hasAdvancedReports) {
      features.push("Rapports avancés");
    }

    if (plan.hasApiAccess) {
      features.push("Accès API");
    }

    if (plan.hasCustomBranding) {
      features.push("Personnalisation");
    }

    return features;
  },
};
