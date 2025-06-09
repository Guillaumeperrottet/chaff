// src/app/components/ui/improved-tooltip.tsx - Tooltip custom amélioré
"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Crown, Sparkles } from "lucide-react";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

// Tooltip Content amélioré avec design premium
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    variant?: "default" | "premium";
  }
>(({ className, sideOffset = 4, variant = "default", ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      // Base styles
      "z-50 overflow-hidden rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      // Variants
      variant === "premium" && [
        "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-xl",
        "dark:from-orange-950/50 dark:to-amber-950/50 dark:border-orange-800",
      ],
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Composant Premium Tooltip spécialisé
interface PremiumTooltipProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  feature?: string;
  onUpgradeClick?: () => void;
  side?: "top" | "bottom" | "left" | "right";
}

export function PremiumTooltip({
  children,
  title,
  description,
  feature,
  onUpgradeClick,
  side = "top",
}: PremiumTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          variant="premium"
          className="max-w-80 p-0 border-0 shadow-2xl"
        >
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white via-orange-50/50 to-amber-50 border border-orange-200">
            {/* Header avec icône */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
              <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Crown className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{title}</h4>
                {feature && (
                  <p className="text-xs text-orange-100 opacity-90">
                    {feature}
                  </p>
                )}
              </div>
              <Sparkles className="h-4 w-4 text-orange-200" />
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {description && (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {description}
                </p>
              )}

              {/* Benefits list */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Fonctionnalités avancées</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Support prioritaire</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Accès complet aux données</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <button
                  onClick={onUpgradeClick}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-medium py-2 px-3 rounded-md transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Crown className="h-3 w-3" />
                  Passer au Premium
                  <span className="ml-1">→</span>
                </button>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-300/20 to-transparent rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-amber-300/20 to-transparent rounded-tr-full"></div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Version simple et élégante
export function SimpleTooltip({
  children,
  content,
  side = "top",
}: {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          className="bg-gray-900 text-white border-gray-700 shadow-xl max-w-xs"
        >
          <p className="text-xs leading-relaxed">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
