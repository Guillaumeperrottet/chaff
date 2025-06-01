import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Générer un code aléatoire (lettres et chiffres)
export function generateInviteCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Caractères sans ambiguïté
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

// src/lib/task-utils.ts
/**
 * Calcule la date de rappel pour une tâche récurrente
 * @param realizationDate - Date d'échéance de la tâche
 * @param period - Période de récurrence (daily, weekly, monthly, quarterly, yearly)
 * @param daysBeforeReminder - Nombre de jours avant l'échéance pour envoyer le rappel (défaut: 10)
 * @returns Date de rappel, ou null si non applicable
 */
export function calculateReminderDate(
  realizationDate: Date | null,
  period: string | null,
  daysBeforeReminder: number = 10
): Date | null {
  // Si pas de date de réalisation ou pas de période, pas de rappel
  if (!realizationDate || !period) {
    return null;
  }

  // Uniquement pour les périodes trimestrielles ou annuelles
  if (period !== "quarterly" && period !== "yearly") {
    return null;
  }

  // Calculer la date de rappel (X jours avant l'échéance)
  const reminderDate = new Date(realizationDate);
  reminderDate.setDate(reminderDate.getDate() - daysBeforeReminder);

  return reminderDate;
}

/**
 * Calcule la prochaine date d'occurrence pour une tâche récurrente
 * @param currentDate - Date actuelle d'échéance
 * @param period - Période de récurrence (daily, weekly, monthly, quarterly, yearly)
 * @returns Prochaine date d'échéance
 */
export function calculateNextOccurrence(
  currentDate: Date,
  period: string
): Date {
  const nextDate = new Date(currentDate);

  switch (period) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Si période inconnue, par défaut mensuelle
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}

/**
 * Vérifie si une tâche récurrente a besoin d'être renouvelée
 * @param task - Tâche à vérifier
 * @returns true si la tâche doit être renouvelée, false sinon
 */
export function shouldRenewTask(task: {
  recurring: boolean;
  realizationDate: Date | null;
  endDate: Date | null;
}): boolean {
  // Si la tâche n'est pas récurrente ou n'a pas de date d'échéance
  if (!task.recurring || !task.realizationDate) {
    return false;
  }

  // Vérifier si la date d'échéance est passée, indépendamment du statut
  const now = new Date();
  const realizationDate = new Date(task.realizationDate);

  // Si la date d'échéance est passée
  if (realizationDate < now) {
    // Si une date de fin est définie, vérifier si elle est dépassée
    if (task.endDate) {
      const endDate = new Date(task.endDate);
      return now < endDate;
    }

    // Sans date de fin, continuer indéfiniment
    return true;
  }

  return false;
}
