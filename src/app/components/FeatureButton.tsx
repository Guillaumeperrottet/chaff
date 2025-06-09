// src/app/components/FeatureButton.tsx - Version avec tooltip magnifique
import { Button } from "@/app/components/ui/button";
import { Lock, Loader2, Crown, Sparkles } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FeatureAccess } from "@/lib/access-control";
import { toast } from "sonner";
import {
  PremiumTooltip,
  SimpleTooltip,
} from "@/app/components/ui/improved-tooltip";
import { useRouter } from "next/navigation";

interface FeatureButtonProps {
  feature: FeatureAccess;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg";
  className?: string;
  showUpgradeToast?: boolean;
  customUpgradeMessage?: string;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}

// Messages contextuels améliorés selon la fonctionnalité
const FEATURE_MESSAGES = {
  payroll: {
    title: "Masse Salariale Premium",
    description:
      "Gérez complètement votre masse salariale avec imports automatiques, calculs de charges sociales et ratios de performance.",
    upgradeUrl: "/pricing?feature=payroll&reason=button_click",
    benefits: [
      "Import données Gastrotime",
      "Calcul automatique charges sociales",
      "Ratios masse salariale / CA",
      "Gestion complète employés",
    ],
  },
  advanced_reports: {
    title: "Analytics Avancés",
    description:
      "Accédez à des rapports détaillés, comparaisons temporelles et analytics en temps réel pour optimiser vos performances.",
    upgradeUrl: "/pricing?feature=analytics&reason=button_click",
    benefits: [
      "Rapports détaillés par période",
      "Comparaisons année précédente",
      "Analytics en temps réel",
      "Export PDF/Excel",
    ],
  },
  bulk_import: {
    title: "Import en Lot Premium",
    description:
      "Importez massivement vos données avec validation automatique et traitement en arrière-plan.",
    upgradeUrl: "/pricing?feature=bulk_import&reason=button_click",
    benefits: [
      "Import fichiers volumineux",
      "Validation automatique",
      "Traitement en arrière-plan",
      "Historique des imports",
    ],
  },
  api_access: {
    title: "Accès API Premium",
    description:
      "Connectez vos systèmes tiers via notre API REST complète avec authentification sécurisée.",
    upgradeUrl: "/pricing?feature=api_access&reason=button_click",
    benefits: [
      "API REST complète",
      "Authentification sécurisée",
      "Documentation complète",
      "Support technique",
    ],
  },
  team_management: {
    title: "Gestion d'Équipe Premium",
    description:
      "Invitez jusqu'à 10 utilisateurs avec gestion fine des rôles et permissions par fonctionnalité.",
    upgradeUrl: "/pricing?feature=team_management&reason=button_click",
    benefits: [
      "Jusqu'à 10 utilisateurs",
      "Gestion des rôles",
      "Permissions granulaires",
      "Audit des actions",
    ],
  },
};

export function FeatureButton({
  feature,
  onClick,
  href,
  children,
  variant = "outline",
  size = "default",
  className = "",
  showUpgradeToast = true,
  customUpgradeMessage,
  tooltipSide = "top",
}: FeatureButtonProps) {
  const { hasAccess, loading } = useFeatureAccess(feature);
  const router = useRouter();

  const featureInfo = FEATURE_MESSAGES[feature];

  const handleClick = () => {
    if (loading) return;

    if (!hasAccess) {
      // Afficher un toast d'information si demandé
      if (showUpgradeToast) {
        toast.error("🔒 Fonctionnalité Premium requise", {
          description:
            customUpgradeMessage ||
            featureInfo?.description ||
            "Cette fonctionnalité nécessite un plan Premium",
          action: {
            label: "✨ Voir les plans",
            onClick: () => {
              const upgradeUrl = featureInfo?.upgradeUrl || "/pricing";
              if (href) {
                const url = new URL(upgradeUrl, window.location.origin);
                url.searchParams.set("returnTo", href);
                router.push(url.toString());
              } else {
                router.push(upgradeUrl);
              }
            },
          },
          duration: 6000,
        });
      }

      // Navigation directe vers upgrade si pas de toast
      if (!showUpgradeToast) {
        const upgradeUrl = featureInfo?.upgradeUrl || "/pricing";
        if (href) {
          const url = new URL(upgradeUrl, window.location.origin);
          url.searchParams.set("returnTo", href);
          router.push(url.toString());
        } else {
          router.push(upgradeUrl);
        }
      }

      return;
    }

    // Utilisateur a accès - exécuter l'action
    if (href) {
      router.push(href);
    } else if (onClick) {
      onClick();
    }
  };

  const handleUpgradeClick = () => {
    const upgradeUrl = featureInfo?.upgradeUrl || "/pricing";
    if (href) {
      const url = new URL(upgradeUrl, window.location.origin);
      url.searchParams.set("returnTo", href);
      router.push(url.toString());
    } else {
      router.push(upgradeUrl);
    }
  };

  // État de chargement avec spinner élégant
  if (loading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={`${className} cursor-wait opacity-70`}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {children}
      </Button>
    );
  }

  // Utilisateur n'a pas accès - Version Premium avec tooltip magnifique
  if (!hasAccess) {
    return (
      <PremiumTooltip
        title={featureInfo?.title || "Fonctionnalité Premium"}
        description={
          featureInfo?.description ||
          "Nécessite un abonnement Premium pour débloquer cette fonctionnalité"
        }
        feature={`Fonctionnalité ${feature}`}
        onUpgradeClick={handleUpgradeClick}
        side={tooltipSide}
      >
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          className={`${className} relative group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-2 border-orange-200 hover:border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-orange-800 shadow-md`}
        >
          <div className="flex items-center">
            <div className="relative">
              <Lock className="mr-2 h-4 w-4 text-orange-600 group-hover:text-orange-700 transition-colors" />
              {/* Petit effet scintillant */}
              <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-medium">{children}</span>
            <Crown className="ml-2 h-3 w-3 text-orange-600 group-hover:text-orange-700 transition-colors" />
          </div>

          {/* Effet de brillance au survol */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
        </Button>
      </PremiumTooltip>
    );
  }

  // Utilisateur a accès - bouton normal avec tooltip simple
  return (
    <SimpleTooltip
      content="Fonctionnalité disponible avec votre plan actuel"
      side={tooltipSide}
    >
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`${className} hover:scale-[1.02] transition-transform duration-200`}
      >
        {children}
      </Button>
    </SimpleTooltip>
  );
}

// Version spécialisée pour les boutons de navigation avec icônes
export function FeatureNavButton({
  feature,
  href,
  icon: Icon,
  label,
  description,
  className = "",
}: {
  feature: FeatureAccess;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  className?: string;
}) {
  const { hasAccess } = useFeatureAccess(feature);
  const featureInfo = FEATURE_MESSAGES[feature];

  if (!hasAccess) {
    return (
      <PremiumTooltip
        title={featureInfo?.title || label}
        description={
          description || featureInfo?.description || "Fonctionnalité Premium"
        }
        feature={`Accès ${label}`}
        onUpgradeClick={() =>
          window.open(featureInfo?.upgradeUrl || "/pricing", "_blank")
        }
        side="bottom"
      >
        <div
          className={`group cursor-pointer p-3 rounded-lg border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${className}`}
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Icon className="h-5 w-5 text-orange-600" />
              <Crown className="absolute -top-1 -right-1 h-3 w-3 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-orange-800 text-sm">{label}</div>
              <div className="text-xs text-orange-600 opacity-75">
                Premium requis
              </div>
            </div>
            <Lock className="h-4 w-4 text-orange-500 group-hover:text-orange-600 transition-colors" />
          </div>
        </div>
      </PremiumTooltip>
    );
  }

  return (
    <a
      href={href}
      className={`block p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${className}`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="font-medium text-sm">{label}</div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
    </a>
  );
}

// Hook personnalisé pour vérifier l'accès avant une action (inchangé)
export function useFeatureGuard(feature: FeatureAccess) {
  const { hasAccess, loading } = useFeatureAccess(feature);
  const router = useRouter();

  const checkAccess = (callback?: () => void, redirectTo?: string) => {
    if (loading) return false;

    if (!hasAccess) {
      const featureInfo = FEATURE_MESSAGES[feature];
      const upgradeUrl = featureInfo?.upgradeUrl || "/pricing";

      if (redirectTo) {
        const url = new URL(upgradeUrl, window.location.origin);
        url.searchParams.set("returnTo", redirectTo);
        router.push(url.toString());
      } else {
        router.push(upgradeUrl);
      }

      return false;
    }

    if (callback) {
      callback();
    }

    return true;
  };

  return {
    hasAccess,
    loading,
    checkAccess,
    requireAccess: checkAccess,
  };
}
