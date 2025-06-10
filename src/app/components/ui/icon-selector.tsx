// src/app/components/ui/icon-selector.tsx
"use client";

import { useState } from "react";
import { Button } from "./button";
import { Label } from "./label";
import {
  ICON_OPTIONS,
  EstablishmentIconType,
  getIconById,
} from "@/lib/establishment-icons";

interface IconSelectorProps {
  selectedIcon: EstablishmentIconType;
  onIconSelect: (
    iconId: EstablishmentIconType,
    iconColor: string,
    bgColor: string
  ) => void;
  className?: string;
}

export function IconSelector({
  selectedIcon,
  onIconSelect,
  className = "",
}: IconSelectorProps) {
  const [hoveredIcon, setHoveredIcon] = useState<EstablishmentIconType | null>(
    null
  );

  const handleIconClick = (iconOption: (typeof ICON_OPTIONS)[0]) => {
    onIconSelect(
      iconOption.id,
      iconOption.defaultColor,
      iconOption.defaultBgColor
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">Icône</Label>

      {/* Aperçu de l'icône sélectionnée */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        {(() => {
          const selectedIconOption = getIconById(selectedIcon);
          const IconComponent = selectedIconOption.component;
          return (
            <>
              <div
                className={`w-10 h-10 ${selectedIconOption.defaultBgColor} rounded-lg flex items-center justify-center`}
              >
                <IconComponent
                  className={`h-5 w-5 ${selectedIconOption.defaultColor}`}
                />
              </div>
              <div>
                <div className="font-medium text-slate-900">
                  {selectedIconOption.label}
                </div>
                <div className="text-sm text-slate-500">
                  {selectedIconOption.description}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Grille de sélection d'icônes */}
      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
        {ICON_OPTIONS.map((iconOption) => {
          const IconComponent = iconOption.component;
          const isSelected = selectedIcon === iconOption.id;
          const isHovered = hoveredIcon === iconOption.id;

          return (
            <Button
              key={iconOption.id}
              type="button"
              variant="outline"
              size="sm"
              className={`p-3 h-auto flex flex-col items-center gap-2 transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "hover:border-slate-400 hover:bg-slate-50"
              }`}
              onClick={() => handleIconClick(iconOption)}
              onMouseEnter={() => setHoveredIcon(iconOption.id)}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <div
                className={`w-8 h-8 ${
                  isSelected || isHovered
                    ? iconOption.defaultBgColor
                    : "bg-slate-100"
                } rounded-md flex items-center justify-center transition-colors`}
              >
                <IconComponent
                  className={`h-4 w-4 ${
                    isSelected || isHovered
                      ? iconOption.defaultColor
                      : "text-slate-600"
                  }`}
                />
              </div>
              <span className="text-xs font-medium leading-tight text-center">
                {iconOption.label}
              </span>
            </Button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mt-2">
        Cliquez sur une icône pour la sélectionner
      </p>
    </div>
  );
}
