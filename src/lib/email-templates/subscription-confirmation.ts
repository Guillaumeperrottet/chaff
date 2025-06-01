export function getSubscriptionConfirmationTemplate(
  userName: string,
  organizationName: string,
  planName: string,
  monthlyPrice: number | string,
  features: string[],
  currentPeriodEnd: Date,
  dashboardUrl: string
): string {
  // Formatter la date de fin de période
  const formattedEndDate = new Date(currentPeriodEnd).toLocaleDateString(
    "fr-FR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Formater le prix
  const formattedPrice =
    typeof monthlyPrice === "number"
      ? monthlyPrice === 0
        ? "Gratuit"
        : `${monthlyPrice.toFixed(2)}€/mois`
      : monthlyPrice;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation d'abonnement - PlanniKeeper</title>
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
          background-color: #d9840d;
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
        .section {
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }
        .info-box {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #555;
        }
        .info-value {
          color: #333;
          font-weight: 500;
        }
        .feature-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        .feature-item {
          padding: 8px 0;
          position: relative;
          padding-left: 28px;
          margin-bottom: 4px;
        }
        .feature-item:before {
          content: "";
          position: absolute;
          left: 0;
          top: 11px;
          width: 16px;
          height: 16px;
          background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="%23d9840d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>');
          background-repeat: no-repeat;
        }
        .cta-button {
          display: inline-block;
          background-color: #d9840d;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: 600;
          margin-top: 16px;
          text-align: center;
        }
        .next-steps {
          background-color: #e6f7ff;
          border: 1px solid #91d5ff;
          border-radius: 6px;
          padding: 16px;
          margin-top: 24px;
        }
        .next-steps ul {
          margin: 8px 0 0 0;
          padding-left: 24px;
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
        /* Pour les clients de messagerie qui ne supportent pas certains styles */
        @media screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo">PlanniKeeper</div>
          <div>Confirmation d'abonnement</div>
        </div>
        
        <div class="email-body">
          <div class="section">
            <h2>Bonjour ${userName},</h2>
            <p>Nous sommes ravis de vous confirmer que votre abonnement à PlanniKeeper a été activé avec succès. Voici un récapitulatif de votre abonnement :</p>
          </div>
          
          <div class="section">
            <div class="section-title">Détails de l'abonnement</div>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Organisation :</span>
                <span class="info-value">${organizationName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Plan :</span>
                <span class="info-value">${planName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tarif :</span>
                <span class="info-value">${formattedPrice}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Prochain renouvellement :</span>
                <span class="info-value">${formattedEndDate}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Fonctionnalités incluses dans votre plan</div>
            <ul class="feature-list">
              ${features.map((feature) => `<li class="feature-item">${feature}</li>`).join("")}
            </ul>
          </div>
          
          <div class="section">
            <a href="${dashboardUrl}" class="cta-button">Accéder à votre tableau de bord</a>
          </div>
          
          <div class="next-steps">
            <strong>Prochaines étapes recommandées :</strong>
            <ul>
              <li>Invitez les membres de votre équipe à rejoindre votre espace</li>
              <li>Configurez votre premier objet et créez vos secteurs</li>
              <li>Explorez toutes les fonctionnalités disponibles dans votre plan</li>
            </ul>
          </div>
        </div>
        
        <div class="email-footer">
          <p>Merci d'avoir choisi PlanniKeeper pour la gestion de vos projets immobiliers.</p>
          <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe de support à <a href="mailto:support@plannikeeper.ch">support@plannikeeper.ch</a>.</p>
          
          <div class="social-links">
            <a href="#" class="social-link">Twitter</a> |
            <a href="#" class="social-link">LinkedIn</a> |
            <a href="#" class="social-link">Facebook</a>
          </div>
          
          <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
