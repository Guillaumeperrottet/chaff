export function getWelcomeEmailTemplate(
  userName: string,
  organizationName: string,
  dashboardUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Chaff.ch</title>
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
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          background-color: #3b82f6;
          color: white;
          padding: 24px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .email-body {
          padding: 32px 24px;
        }
        .welcome-message {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .section {
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }
        .step-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        .step-item {
          padding: 12px 0;
          position: relative;
          padding-left: 36px;
          margin-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        .step-item:last-child {
          border-bottom: none;
        }
        .step-number {
          position: absolute;
          left: 0;
          top: 10px;
          width: 26px;
          height: 26px;
          background-color: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .cta-button {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: 600;
          margin-top: 16px;
          text-align: center;
        }
        .tips-section {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 16px;
          margin-top: 24px;
        }
        .email-footer {
          background-color: #f8f9fa;
          padding: 24px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .social-links {
          margin-top: 16px;
        }
        .social-link {
          display: inline-block;
          margin: 0 8px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo">Chaff.ch</div>
          <div>Votre solution d'analytics business</div>
        </div>
        
        <div class="email-body">
          <div class="welcome-message">Bienvenue sur Chaff.ch, ${userName} !</div>
          
          <div class="section">
            <p>Nous sommes ravis de vous accueillir sur Chaff.ch. Votre organisation <strong>${organizationName}</strong> est maintenant configurée et prête à être utilisée.</p>
            <p>Chaff.ch va vous aider à analyser vos données business de façon simple et efficace.</p>
          </div>
          
          <div class="section">
            <div class="section-title">Commencez en quelques étapes simples</div>
            <ul class="step-list">
              <li class="step-item">
                <div class="step-number">1</div>
                <strong>Personnalisez votre organisation</strong><br>
                Ajoutez les détails de votre organisation pour faciliter la gestion.
              </li>
              <li class="step-item">
                <div class="step-number">2</div>
                <strong>Créez votre premier projet d'analyse</strong><br>
                Ajoutez un projet avec toutes ses données.
              </li>
              <li class="step-item">
                <div class="step-number">3</div>
                <strong>Invitez des membres</strong><br>
                Collaborez avec votre équipe en les invitant sur la plateforme.
              </li>
            </ul>
          </div>
          
          <div class="section" style="text-align: center;">
            <a href="${dashboardUrl}" class="cta-button">Accéder à mon tableau de bord</a>
          </div>
          
          <div class="tips-section">
            <div class="section-title">Conseils pour démarrer</div>
            <p>Voici quelques conseils qui vous aideront à tirer le meilleur parti de Chaff.ch :</p>
            <ul>
              <li>Configurez vos préférences de notification pour rester informé</li>
              <li>Structurez vos projets logiquement pour faciliter l'analyse</li>
              <li>Utilisez les tableaux de bord pour visualiser vos données</li>
            </ul>
          </div>
        </div>
        
        <div class="email-footer">
          <p>Besoin d'aide ? Notre équipe de support est disponible pour vous aider.</p>
          <p>Contactez-nous à <a href="mailto:support@chaff.ch">support@chaff.ch</a></p>
          
          <div class="social-links">
            <a href="#" class="social-link">Twitter</a> |
            <a href="#" class="social-link">LinkedIn</a> |
            <a href="#" class="social-link">Facebook</a>
          </div>
          
          <p>© 2025 Chaff.ch. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
