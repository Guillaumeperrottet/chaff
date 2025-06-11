import { Plan } from "@prisma/client";

// Fonction helper pour obtenir les fonctionnalités d'un plan
function getPlanFeatures(planName: string): string[] {
  switch (planName) {
    case "FREE":
      return [
        "1 utilisateur",
        "1 projet d'analyse",
        "500 MB de stockage",
        "Rapports de base",
        "Support communautaire",
      ];
    case "PREMIUM":
      return [
        "5 utilisateurs",
        "Projets illimités",
        "10 GB de stockage",
        "Analytics avancés",
        "Tableaux de bord personnalisés",
        "Accès API",
        "Support prioritaire",
      ];
    case "ILLIMITE":
      return [
        "Utilisateurs illimités",
        "Mandats/entreprises illimités",
        "Stockage illimité",
        "Toutes les fonctionnalités",
        "Accès API illimité",
        "Support premium",
      ];
    case "SUPER_ADMIN":
      return [
        "Utilisateurs illimités",
        "Projets illimités",
        "Stockage illimité",
        "Analytics en temps réel",
        "Accès administrateur complet",
        "Toutes les fonctionnalités",
      ];
    default:
      return ["Fonctionnalités du plan personnalisé"];
  }
}

export function getPlanChangeEmailTemplate(
  userName: string,
  organizationName: string,
  oldPlanName: string,
  newPlanName: string,
  newPlan: Plan,
  dashboardUrl: string
): string {
  // Formater les noms de plans pour l'affichage
  const formatPlanName = (name: string): string => {
    const planNames: Record<string, string> = {
      FREE: "Gratuit",
      PERSONAL: "Particulier",
      PROFESSIONAL: "Professionnel",
      ENTERPRISE: "Entreprise",
      SUPER_ADMIN: "Super Administrateur",
      ILLIMITE: "Accès Illimité",
      CUSTOM: "Personnalisé",
    };
    return planNames[name] || name;
  };

  const oldPlanDisplay = formatPlanName(oldPlanName);
  const newPlanDisplay = formatPlanName(newPlanName);

  // Déterminer le type de changement
  const isUpgrade = getUpgradeStatus(oldPlanName, newPlanName);
  const headerColor = isUpgrade ? "#16a34a" : "#3b82f6"; // Vert pour upgrade, bleu Chaff.ch sinon

  // Formater le prix
  type PriceInput =
    | {
        toNumber: () => number;
      }
    | number
    | string;

  const formatPrice = (price: PriceInput): string => {
    const numPrice =
      typeof price === "object" && "toNumber" in price
        ? price.toNumber()
        : Number(price);

    return numPrice === 0 ? "Gratuit" : `${numPrice.toFixed(2)}€/mois`;
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Changement de plan - Chaff.ch</title>
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
          background-color: ${headerColor};
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
        .change-box {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .plan-change {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin: 16px 0;
        }
        .plan-badge {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 16px;
        }
        .old-plan {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        .new-plan {
          background-color: #dcfce7;
          color: #16a34a;
        }
        .arrow {
          font-size: 24px;
          color: #6b7280;
        }
        .features-section {
          margin: 28px 0;
        }
        .features-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .feature-list {
          list-style: none;
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
          background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="%2316a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>');
          background-repeat: no-repeat;
        }
        .info-box {
          background-color: ${isUpgrade ? "#dcfce7" : "#fff3cd"};
          border: 1px solid ${isUpgrade ? "#86efac" : "#ffeaa7"};
          color: ${isUpgrade ? "#166534" : "#856404"};
          padding: 16px;
          border-radius: 6px;
          margin: 20px 0;
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
        .email-footer {
          background-color: #f8f9fa;
          padding: 24px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .price-info {
          background-color: #e0f2fe;
          border: 1px solid #7dd3fc;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .price-value {
          font-size: 28px;
          font-weight: bold;
          color: #0284c7;
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header" style="background-color: ${headerColor};">
          <div class="logo">Chaff.ch</div>
          <div>Changement de plan</div>
        </div>
        
        <div class="email-body">
          <h2>Bonjour ${userName},</h2>
          
          <p>Nous vous confirmons que le plan de votre organisation <strong>${organizationName}</strong> a été modifié avec succès.</p>
          
          <div class="change-box">
            <h3>${isUpgrade ? "🎉 Félicitations pour votre upgrade !" : "Changement de plan effectué"}</h3>
            <div class="plan-change">
              <span class="plan-badge old-plan">${oldPlanDisplay}</span>
              <span class="arrow">→</span>
              <span class="plan-badge new-plan">${newPlanDisplay}</span>
            </div>
          </div>

          ${
            newPlan.price && Number(newPlan.price) > 0
              ? `
          <div class="price-info">
            <div>Nouveau tarif</div>
            <div class="price-value">${formatPrice(newPlan.price)}</div>
            <div>Facturation mensuelle</div>
          </div>
          `
              : ""
          }

          <div class="features-section">
            <div class="features-title">Fonctionnalités de votre plan ${newPlanDisplay}</div>
            <ul class="feature-list">
              ${getPlanFeatures(newPlan.name)
                .map(
                  (feature) => `
                <li class="feature-item">${feature}</li>
              `
                )
                .join("")}
            </ul>
          </div>

          ${getContextualMessage(oldPlanName, newPlanName)}

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="cta-button">Accéder à mon tableau de bord</a>
          </div>

          <div class="info-box" style="background-color: ${isUpgrade ? "#dcfce7" : "#fff3cd"}; border-color: ${isUpgrade ? "#86efac" : "#ffeaa7"}; color: ${isUpgrade ? "#166534" : "#856404"};">
            <strong>Important :</strong>
            ${getImportantNote(oldPlanName, newPlanName)}
          </div>
        </div>
        
        <div class="email-footer">
          <p>Merci de votre confiance.</p>
          <p>Pour toute question, contactez notre support à <a href="mailto:support@chaff.ch">support@chaff.ch</a></p>
          <p>© 2025 Chaff.ch. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getUpgradeStatus(oldPlan: string, newPlan: string): boolean {
  const planOrder = [
    "FREE",
    "PERSONAL",
    "PROFESSIONAL",
    "ENTERPRISE",
    "ILLIMITE",
    "SUPER_ADMIN",
  ];
  const oldIndex = planOrder.indexOf(oldPlan);
  const newIndex = planOrder.indexOf(newPlan);
  return newIndex > oldIndex;
}

function getContextualMessage(oldPlan: string, newPlan: string): string {
  if (oldPlan === "FREE" && newPlan !== "FREE") {
    return `
      <p>Bienvenue dans l'univers premium de Chaff.ch ! Vous avez maintenant accès à toutes les fonctionnalités avancées pour optimiser vos analyses business.</p>
    `;
  } else if (newPlan === "FREE") {
    return `
      <p>Votre organisation est maintenant sur le plan gratuit. Certaines fonctionnalités premium ne sont plus disponibles, mais vous pouvez toujours gérer vos analyses essentielles.</p>
    `;
  } else if (getUpgradeStatus(oldPlan, newPlan)) {
    return `
      <p>Votre upgrade est maintenant actif ! Découvrez toutes les nouvelles fonctionnalités disponibles dans votre tableau de bord.</p>
    `;
  }
  return `
    <p>Les modifications de votre plan sont maintenant effectives. Vos nouvelles limites et fonctionnalités sont immédiatement disponibles.</p>
  `;
}

function getImportantNote(oldPlan: string, newPlan: string): string {
  if (newPlan === "FREE") {
    return "Assurez-vous que votre utilisation respecte les limites du plan gratuit. Les fonctionnalités premium ne sont plus accessibles.";
  } else if (oldPlan === "FREE") {
    return "Votre facturation commence immédiatement. Vous recevrez une facture détaillée par email.";
  } else if (getUpgradeStatus(oldPlan, newPlan)) {
    return "La différence de prix sera calculée au prorata pour la période en cours. Votre prochaine facture reflétera le nouveau montant.";
  }
  return "Si vous aviez un abonnement payant, la différence sera créditée sur votre compte pour les prochaines factures.";
}
