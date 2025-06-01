// src/lib/email-templates/feedback-email.ts

type FeedbackType = "feature" | "bug" | "improvement";

interface FeedbackEmailData {
  userName: string;
  userEmail: string | null;
  title: string;
  description: string;
  type: FeedbackType;
  appUrl: string;
}

export function getFeedbackEmailTemplate({
  userName,
  userEmail,
  title,
  description,
  type,
  appUrl,
}: FeedbackEmailData): string {
  // Traduire le type pour l'email
  const typeLabels: Record<FeedbackType, string> = {
    feature: "Nouvelle fonctionnalité",
    bug: "Signalement de bug",
    improvement: "Amélioration",
  };

  // Couleurs spécifiques pour chaque type de feedback
  const typeColors: Record<FeedbackType, string> = {
    feature: "#0ea5e9", // Bleu
    bug: "#ef4444", // Rouge
    improvement: "#f59e0b", // Orange/Amber
  };

  // Icônes pour chaque type (emoji Unicode)
  const typeIcons: Record<FeedbackType, string> = {
    feature: "💡", // Ampoule
    bug: "🐞", // Bug
    improvement: "⚡", // Éclair
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Nouveau feedback PlanniKeeper</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background-color: ${typeColors[type]};
            color: white;
            padding: 24px;
            text-align: center;
          }
          
          .header-icon {
            font-size: 36px;
            margin-bottom: 10px;
          }
          
          .header-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          
          .header-subtitle {
            font-size: 16px;
            margin: 5px 0 0 0;
            opacity: 0.9;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .section {
            margin-bottom: 28px;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
          }
          
          .info-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 20px;
          }
          
          .info-row {
            padding: 8px 0;
            display: flex;
            flex-direction: column;
          }
          
          .info-label {
            font-weight: 600;
            color: #555;
            margin-bottom: 4px;
          }
          
          .info-value {
            color: #333;
          }
          
          .description-box {
            background-color: #f8f9fa;
            border-left: 4px solid ${typeColors[type]};
            padding: 16px;
            border-radius: 4px;
            white-space: pre-line;
          }
          
          .user-profile {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
          }
          
          .user-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #d9840d;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
            margin-right: 12px;
          }
          
          .user-info {
            display: flex;
            flex-direction: column;
          }
          
          .user-name {
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .user-email {
            color: #666;
            font-size: 14px;
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 24px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
          }
          
          .cta-button {
            display: inline-block;
            background-color: ${typeColors[type]};
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: 600;
            margin-top: 16px;
            text-align: center;
          }
          
          @media screen and (max-width: 600px) {
            .email-container {
              width: 100%;
              border-radius: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header" style="background-color: ${typeColors[type]};">
            <div class="header-icon">${typeIcons[type]}</div>
            <h1 class="header-title">${typeLabels[type]}</h1>
            <p class="header-subtitle">Nouveau feedback PlanniKeeper</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="user-profile">
                <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                  <div class="user-name">${userName || "Utilisateur"}</div>
                  <div class="user-email">${userEmail || "Email non disponible"}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Détails du feedback</div>
              <div class="info-box">
                <div class="info-row">
                  <div class="info-label">Titre</div>
                  <div class="info-value">${title}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Type</div>
                  <div class="info-value">${typeLabels[type]}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Description</div>
              <div class="description-box">
                ${description.replace(/\n/g, "<br>")}
              </div>
            </div>
            
            <div class="section" style="text-align: center;">
              <a href="${appUrl}/dashboard" class="cta-button" style="background-color: ${typeColors[type]};">
                Accéder à l'application
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Ce message a été envoyé automatiquement depuis PlanniKeeper.</p>
            <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
