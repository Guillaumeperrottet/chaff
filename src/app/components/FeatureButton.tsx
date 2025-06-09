// src/app/components/FeatureButton.tsx - Version améliorée
import { Button } from "@/app/components/ui/button";
import { Lock, Loader2, Crown } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FeatureAccess } from "@/lib/access-control";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface FeatureButtonProps {
  feature: FeatureAccess;
  onClick?: () => void;
  href?: string; // Nouvelle prop pour navigation directe
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg";
  className?: string;
  showUpgradeToast?: boolean; // Contrôler l'affichage du toast
  customUpgradeMessage?: string; // Message personnalisé
}

// Messages contextuels selon la fonctionnalité
const FEATURE_MESSAGES = {
  payroll: {
    title: "Masse Salariale Premium",
    description:
      "Gestion complète de la masse salariale avec imports Gastrotime et calculs automatiques",
    upgradeUrl: "/pricing?feature=payroll&reason=button_click",
  },
  advanced_reports: {
    title: "Analytics Avancés Premium",
    description: "Rapports détaillés, comparaisons et analytics en temps réel",
    upgradeUrl: "/pricing?feature=advanced_reports&reason=button_click",
  },
  bulk_import: {
    title: "Import en Lot Premium",
    description: "Importez vos données en masse avec validation automatique",
    upgradeUrl: "/pricing?feature=bulk_import&reason=button_click",
  },
  api_access: {
    title: "Accès API Premium",
    description: "Connectez vos systèmes via notre API REST complète",
    upgradeUrl: "/pricing?feature=api_access&reason=button_click",
  },
  team_management: {
    title: "Gestion d'Équipe Premium",
    description: "Invitez jusqu'à 10 utilisateurs avec gestion des rôles",
    upgradeUrl: "/pricing?feature=team_management&reason=button_click",
  },
};

// Hook personnalisé pour vérifier l'accès avant une action
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

    // Exécuter le callback si fourni
    if (callback) {
      callback();
    }

    return true;
  };

  return {
    hasAccess,
    loading,
    checkAccess,
    requireAccess: checkAccess, // Alias plus explicite
  };
}

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
}: FeatureButtonProps) {
  const { hasAccess, loading } = useFeatureAccess(feature);
  const router = useRouter();

  const featureInfo = FEATURE_MESSAGES[feature];

  const handleClick = () => {
    if (loading) return;

    if (!hasAccess) {
      // Afficher un toast d'information si demandé
      if (showUpgradeToast) {
        const message =
          customUpgradeMessage ||
          featureInfo?.description ||
          "Cette fonctionnalité nécessite un plan Premium";

        toast.error("Fonctionnalité Premium requise", {
          description: message,
          action: {
            label: "Voir les plans",
            onClick: () => {
              const upgradeUrl = featureInfo?.upgradeUrl || "/pricing";
              if (href) {
                // Ajouter l'URL de retour si c'est une navigation
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

  // État de chargement
  if (loading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={`${className} cursor-wait`}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {children}
      </Button>
    );
  }

  // Utilisateur n'a pas accès
  if (!hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleClick}
              className={`${className} relative border-orange-200 hover:border-orange-300 hover:bg-orange-50`}
            >
              <Lock className="mr-2 h-4 w-4 text-orange-600" />
              <span className="opacity-75">{children}</span>
              <Crown className="ml-2 h-3 w-3 text-orange-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-center">
              <p className="font-medium">
                {featureInfo?.title || "Fonctionnalité Premium"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {featureInfo?.description || "Nécessite un abonnement Premium"}
              </p>
              <p className="text-xs font-medium text-orange-600 mt-2">
                Cliquez pour voir les plans
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Utilisateur a accès - bouton normal
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Button>
  );
}
