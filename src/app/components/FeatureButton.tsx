import { Button } from "@/app/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FeatureAccess } from "@/lib/access-control";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

interface FeatureButtonProps {
  feature: FeatureAccess;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function FeatureButton({
  feature,
  onClick,
  children,
  variant = "outline",
  size = "default",
  className = "",
}: FeatureButtonProps) {
  const { hasAccess, loading } = useFeatureAccess(feature);

  const handleClick = () => {
    if (!hasAccess) {
      toast.error("Cette fonctionnalité nécessite un plan Premium", {
        description:
          "Mettez à niveau votre plan pour accéder à cette fonctionnalité",
        action: {
          label: "Voir les plans",
          onClick: () => window.open("/pricing", "_blank"),
        },
      });
      return;
    }
    onClick();
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {children}
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            className={`${className} ${!hasAccess ? "opacity-75" : ""}`}
          >
            {!hasAccess && <Lock className="mr-2 h-4 w-4 text-amber-600" />}
            {children}
          </Button>
        </TooltipTrigger>
        {!hasAccess && (
          <TooltipContent>
            <p>Fonctionnalité Premium requise</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
