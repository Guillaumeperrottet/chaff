// src/lib/email.ts
import { Resend } from "resend";
import { Task, Plan, Organization, User } from "@prisma/client";

// Définition du type TaskWithDetails harmonisée pour être compatible avec tous les templates
export type TaskWithDetails = Task & {
  article: {
    title: string;
    sector: {
      name: string;
      object: {
        nom: string;
      };
    };
  };
  assignedTo: {
    name: string;
    email: string;
  } | null;
  // Le champ period peut être string, null ou undefined
  period?: string | null;
};

// Import direct des templates
import { getSubscriptionConfirmationTemplate } from "./email-templates/subscription-confirmation";
import { getWelcomeEmailTemplate } from "./email-templates/welcome-email";
import { getTaskAssignmentEmailTemplate } from "./email-templates/task-assignement-email";
import { getTasksReminderEmailTemplate } from "./email-templates/tasks-reminder-mail";
import { getPlanChangeEmailTemplate } from "./email-templates/plan-change-email";
import {
  getDailySummaryEmailTemplate,
  type DailySummaryData,
} from "./email-templates/daily-summary-email";

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
    from = process.env.RESEND_FROM_EMAIL ||
      "PlanniKeeper <notifications@plannikeeper.ch>",
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
          process.env.RESEND_FROM_EMAIL ||
          "PlanniKeeper <notifications@plannikeeper.ch>",
        to: [user.email],
        subject: `Bienvenue sur PlanniKeeper !`,
        html: htmlContent,
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
        headers: {
          "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}>`,
          "X-Entity-Ref-ID": `welcome-${user.id}-${Date.now()}`, // Identifiant unique pour éviter les duplications
        },
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email de bienvenue:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Erreur dans le service d'email:", error);
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
        plan.features,
        currentPeriodEnd,
        dashboardUrl
      );

      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "PlanniKeeper <notifications@resend.dev>",
        to: [user.email],
        subject: `Confirmation d'abonnement - ${this.getPlanDisplayName(plan.name)} - PlanniKeeper`,
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
          process.env.RESEND_FROM_EMAIL ||
          "PlanniKeeper <notifications@plannikeeper.ch>",
        to: [user.email],
        subject: `Changement de plan - ${organizationName} - PlanniKeeper`,
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

  /**
   * Envoie un email pour les tâches assignées
   */
  async sendTaskAssignmentEmail(
    to: string,
    userName: string,
    tasks: TaskWithDetails[]
  ) {
    try {
      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "PlanniKeeper <notifications@resend.dev>",
        to: [to],
        subject: `Nouvelles tâches assignées - ${new Date().toLocaleDateString()}`,
        html: getTaskAssignmentEmailTemplate(userName, tasks),
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
      });

      if (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error in email service:", error);
      return { success: false, error };
    }
  },

  /**
   * Envoie un email de rappel pour les tâches récurrentes à échéance proche
   */
  async sendReminderEmail(
    to: string,
    userName: string,
    tasks: TaskWithDetails[],
    daysBeforeDue: number
  ) {
    try {
      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "PlanniKeeper <notifications@resend.dev>",
        to: [to],
        subject: `Rappel : Tâches récurrentes à échéance dans ${daysBeforeDue} jours`,
        html: getTasksReminderEmailTemplate(userName, tasks, daysBeforeDue),
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
      });

      if (error) {
        console.error("Error sending reminder email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error in email reminder service:", error);
      return { success: false, error };
    }
  },

  /**
   * Envoie un email de récapitulatif quotidien
   */
  async sendDailySummaryEmail(to: string, summaryData: DailySummaryData) {
    try {
      const subject =
        summaryData.totalTasksAdded + summaryData.totalTasksCompleted > 0
          ? `Récapitulatif quotidien - ${summaryData.totalTasksAdded + summaryData.totalTasksCompleted} activité${summaryData.totalTasksAdded + summaryData.totalTasksCompleted > 1 ? "s" : ""} - ${summaryData.date}`
          : `Récapitulatif quotidien - ${summaryData.date}`;

      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "PlanniKeeper <notifications@plannikeeper.ch>",
        to: [to],
        subject,
        html: getDailySummaryEmailTemplate(summaryData),
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
        headers: {
          "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL}/profile/notifications?unsubscribe=daily>`,
          "X-Entity-Ref-ID": `daily-summary-${summaryData.date}-${Date.now()}`,
        },
      });

      if (error) {
        console.error("Error sending daily summary email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error in daily summary email service:", error);
      return { success: false, error };
    }
  },
};
