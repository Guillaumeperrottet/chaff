// src/lib/email-templates/tasks-reminder-email.ts
import { TaskWithDetails } from "../email";

/**
 * Génère le template HTML pour les emails de rappel
 */
export function getTasksReminderEmailTemplate(
  userName: string,
  tasks: TaskWithDetails[],
  daysBeforeDue: number
): string {
  const formattedDate = new Date().toLocaleDateString("fr-FR");
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Rappel de tâches récurrentes</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #d9840d;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #d9840d;
        }
        .content {
          padding: 20px 0;
        }
        .task-list {
          margin-top: 20px;
        }
        .task-item {
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 15px;
          background-color: #f9f9f9;
        }
        .task-title {
          font-weight: bold;
          font-size: 18px;
          color: #d9840d;
          margin-bottom: 5px;
        }
        .task-details {
          margin-bottom: 5px;
        }
        .task-location {
          color: #666;
          font-size: 14px;
        }
        .reminder-banner {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          color: #856404;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
          text-align: center;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #777;
          font-size: 12px;
        }
        .button {
          display: inline-block;
          background-color: #d9840d;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PlanniKeeper</div>
          <div>Rappel de tâches récurrentes</div>
          <div>${formattedDate}</div>
        </div>
        
        <div class="content">
          <p>Bonjour ${userName},</p>
          
          <div class="reminder-banner">
            Vous avez ${tasks.length} tâche(s) récurrente(s) qui arrivent à échéance dans ${daysBeforeDue} jours.
          </div>
          
          <p>Voici les tâches qui nécessitent votre attention prochainement :</p>
          
          <div class="task-list">
            ${tasks
              .map(
                (task) => `
              <div class="task-item">
                <div class="task-title">${task.name}</div>
                ${task.description ? `<div class="task-details">${task.description}</div>` : ""}
                <div class="task-location">
                  ${task.article.sector.object.nom} › ${task.article.sector.name} › ${task.article.title}
                </div>
                ${
                  task.realizationDate
                    ? `
                <div class="task-details">
                  <strong>Date d'échéance :</strong> ${new Date(task.realizationDate).toLocaleDateString("fr-FR")}
                </div>
                `
                    : ""
                }
                <div class="task-details">
                  <strong>Récurrence :</strong> ${getPeriodText(task.period)}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          
          <div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
              Voir dans l'application
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par PlanniKeeper.</p>
          <p>Vous pouvez modifier vos préférences de notification dans votre profil.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Convertit la période technique en texte lisible
 */
function getPeriodText(period: string | null | undefined): string {
  if (!period) return "Non définie";

  switch (period) {
    case "daily":
      return "Quotidienne";
    case "weekly":
      return "Hebdomadaire";
    case "monthly":
      return "Mensuelle";
    case "quarterly":
      return "Trimestrielle";
    case "yearly":
      return "Annuelle";
    default:
      return period;
  }
}
