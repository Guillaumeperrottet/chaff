// src/lib/email-templates/daily-summary-email.ts

export interface DailySummaryData {
  userName: string;
  date: string;
  objectSummaries: ObjectSummary[];
  totalTasksAdded: number;
  totalTasksCompleted: number;
  totalTasksPending: number;
}

export interface ObjectSummary {
  objectId: string;
  objectName: string;
  objectAddress: string;
  tasksAdded: TaskSummary[];
  tasksCompleted: TaskSummary[];
  tasksPending: TaskSummary[];
}

export interface TaskSummary {
  id: string;
  name: string;
  description?: string;
  sectorName: string;
  articleTitle: string;
  assignedToName?: string;
  createdAt?: string;
  completedAt?: string;
  taskType?: string;
}

export function getDailySummaryEmailTemplate({
  userName,
  date,
  objectSummaries,
  totalTasksAdded,
  totalTasksCompleted,
  totalTasksPending,
}: DailySummaryData): string {
  const hasActivity =
    totalTasksAdded > 0 || totalTasksCompleted > 0 || totalTasksPending > 0;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Récapitulatif quotidien - PlanniKeeper</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 700px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          background: linear-gradient(135deg, #d9840d 0%, #b8720b 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .date-badge {
          background-color: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
          margin-top: 8px;
        }
        .email-body {
          padding: 32px 24px;
        }
        .summary-stats {
          width: 100%;
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .summary-stats table {
          width: 100%;
          border-collapse: collapse;
        }
        .stat-item {
          text-align: center;
          vertical-align: top;
        }
        .stat-number {
          font-size: 28px;
          font-weight: bold;
          color: #d9840d;
          display: block;
        }
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }
        .object-section {
          margin-bottom: 32px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
        }
        .object-header {
          background-color: #f8f9fa;
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
        }
        .object-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }
        .object-address {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        .tasks-container {
          padding: 20px;
        }
        .task-category {
          margin-bottom: 24px;
        }
        .task-category:last-child {
          margin-bottom: 0;
        }
        .category-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e9ecef;
        }
        .category-added {
          color: #16a34a;
          border-bottom-color: #16a34a;
        }
        .category-completed {
          color: #0284c7;
          border-bottom-color: #0284c7;
        }
        .category-pending {
          color: #d97706;
          border-bottom-color: #d97706;
        }
        .task-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .task-item {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
          position: relative;
        }
        .task-item:last-child {
          margin-bottom: 0;
        }
        .task-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 8px;
          color: #333;
        }
        .task-description {
          color: #666;
          font-size: 14px;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .task-meta {
          font-size: 13px;
          color: #666;
          margin-top: 8px;
        }
        .task-meta-item {
          display: inline-block;
          margin-right: 12px;
          margin-bottom: 4px;
        }
        .task-badge {
          background-color: #e9ecef;
          color: #495057;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .task-badge-added {
          background-color: #dcfce7;
          color: #166534;
        }
        .task-badge-completed {
          background-color: #e0f2fe;
          color: #0c4a6e;
        }
        .task-badge-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        .no-activity {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        .no-activity-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .cta-section {
          text-align: center;
          padding: 24px;
          background-color: #f8f9fa;
          border-radius: 8px;
          margin-top: 24px;
        }
        .cta-button {
          display: inline-block;
          background-color: #d9840d;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 12px;
        }
        .email-footer {
          background-color: #f8f9fa;
          padding: 24px;
          text-align: center;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e9ecef;
        }
        .unsubscribe-link {
          color: #666;
          text-decoration: underline;
          font-size: 12px;
          margin-top: 12px;
          display: block;
        }
        
        /* Outlook-specific fixes */
        @media screen and (max-width: 600px) {
          .summary-stats table {
            width: 100% !important;
          }
          .stat-item {
            display: block !important;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .stat-item:last-child {
            border-bottom: none;
          }
          .task-meta-item {
            display: block !important;
            margin-bottom: 8px;
          }
        }
        
        @media screen and (min-width: 601px) and (max-width: 768px) {
          .summary-stats table {
            width: 100% !important;
          }
          .stat-item {
            width: 33.33% !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo">🏠 PlanniKeeper</div>
          <div>Récapitulatif quotidien</div>
          <div class="date-badge">${date}</div>
        </div>
        
        <div class="email-body">
          <h2>Bonjour ${userName},</h2>
          
          ${
            hasActivity
              ? `
            <p>Voici le récapitulatif de l'activité d'hier sur vos objets et vos tâches en cours :</p>
            
            <div class="summary-stats">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="stat-item">
                    <span class="stat-number">${totalTasksAdded}</span>
                    <span class="stat-label">Tâche${totalTasksAdded > 1 ? "s" : ""} ajoutée${totalTasksAdded > 1 ? "s" : ""}</span>
                  </td>
                  <td class="stat-item">
                    <span class="stat-number">${totalTasksCompleted}</span>
                    <span class="stat-label">Tâche${totalTasksCompleted > 1 ? "s" : ""} terminée${totalTasksCompleted > 1 ? "s" : ""}</span>
                  </td>
                  <td class="stat-item">
                    <span class="stat-number">${totalTasksPending}</span>
                    <span class="stat-label">Tâche${totalTasksPending > 1 ? "s" : ""} qui ${totalTasksPending > 1 ? "vous sont" : "vous est"} assignée${totalTasksPending > 1 ? "s" : ""}</span>
                  </td>
                </tr>
              </table>
            </div>
            
            ${objectSummaries
              .map(
                (objectSummary) => `
              <div class="object-section">
                <div class="object-header">
                  <h3 class="object-title">${objectSummary.objectName}</h3>
                  <p class="object-address">${objectSummary.objectAddress}</p>
                </div>
                
                <div class="tasks-container">
                  ${
                    objectSummary.tasksPending.length > 0
                      ? `
                    <div class="task-category">
                      <h4 class="category-title category-pending">
                        📋 Vos tâches en cours (${objectSummary.tasksPending.length})
                      </h4>
                      <ul class="task-list">
                        ${objectSummary.tasksPending
                          .map(
                            (task) => `
                          <li class="task-item">
                            <div class="task-name">${task.name}</div>
                            ${task.description ? `<div class="task-description">${task.description}</div>` : ""}
                            <div class="task-meta">
                              <div class="task-meta-item">
                                📍 ${task.sectorName} › ${task.articleTitle}
                              </div>
                              ${
                                task.assignedToName
                                  ? `
                                <div class="task-meta-item">
                                  👤 ${task.assignedToName}
                                </div>
                              `
                                  : ""
                              }
                              ${
                                task.taskType
                                  ? `
                                <span class="task-badge task-badge-pending">${task.taskType}</span>
                              `
                                  : ""
                              }
                            </div>
                          </li>
                        `
                          )
                          .join("")}
                      </ul>
                    </div>
                  `
                      : ""
                  }
                  
                  ${
                    objectSummary.tasksAdded.length > 0
                      ? `
                    <div class="task-category">
                      <h4 class="category-title category-added">
                        ✅ Tâches ajoutées (${objectSummary.tasksAdded.length})
                      </h4>
                      <ul class="task-list">
                        ${objectSummary.tasksAdded
                          .map(
                            (task) => `
                          <li class="task-item">
                            <div class="task-name">${task.name}</div>
                            ${task.description ? `<div class="task-description">${task.description}</div>` : ""}
                            <div class="task-meta">
                              <div class="task-meta-item">
                                📍 ${task.sectorName} › ${task.articleTitle}
                              </div>
                              ${
                                task.assignedToName
                                  ? `
                                <div class="task-meta-item">
                                  👤 ${task.assignedToName}
                                </div>
                              `
                                  : ""
                              }
                              ${
                                task.taskType
                                  ? `
                                <span class="task-badge task-badge-added">${task.taskType}</span>
                              `
                                  : ""
                              }
                            </div>
                          </li>
                        `
                          )
                          .join("")}
                      </ul>
                    </div>
                  `
                      : ""
                  }
                  
                  ${
                    objectSummary.tasksCompleted.length > 0
                      ? `
                    <div class="task-category">
                      <h4 class="category-title category-completed">
                        🎉 Tâches terminées (${objectSummary.tasksCompleted.length})
                      </h4>
                      <ul class="task-list">
                        ${objectSummary.tasksCompleted
                          .map(
                            (task) => `
                          <li class="task-item">
                            <div class="task-name">${task.name}</div>
                            ${task.description ? `<div class="task-description">${task.description}</div>` : ""}
                            <div class="task-meta">
                              <div class="task-meta-item">
                                📍 ${task.sectorName} › ${task.articleTitle}
                              </div>
                              ${
                                task.assignedToName
                                  ? `
                                <div class="task-meta-item">
                                  👤 ${task.assignedToName}
                                </div>
                              `
                                  : ""
                              }
                              ${
                                task.taskType
                                  ? `
                                <span class="task-badge task-badge-completed">${task.taskType}</span>
                              `
                                  : ""
                              }
                            </div>
                          </li>
                        `
                          )
                          .join("")}
                      </ul>
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
            `
              )
              .join("")}
          `
              : `
            <div class="no-activity">
              <div class="no-activity-icon">😴</div>
              <h3>Aucune activité hier</h3>
              <p>Aucune tâche n'a été ajoutée ou terminée sur vos objets hier.</p>
            </div>
          `
          }
          
          <div class="cta-section">
            <p>Consultez le détail de vos projets dans votre tableau de bord</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">
              Accéder au tableau de bord
            </a>
          </div>
        </div>
        
        <div class="email-footer">
          <p>Vous recevez cet email car vous êtes abonné aux récapitulatifs quotidiens.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/notifications" class="unsubscribe-link">
            Modifier mes préférences de notification
          </a>
          <p style="margin-top: 16px;">© 2025 PlanniKeeper. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
