"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  // Optional icons to customize appearance
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  checkedIcon = <Moon className="h-4 w-4 text-blue-800" />,
  uncheckedIcon = <Sun className="h-4 w-4 text-yellow-500" />,
}) => {
  return (
    <label className="switch relative inline-flex cursor-pointer select-none items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => !disabled && onCheckedChange(!checked)}
        disabled={disabled}
        className="sr-only"
        aria-label={checked ? "Enabled" : "Disabled"}
      />

      <div
        className={`
          flex h-[32px] w-[60px] items-center rounded-full p-1 px-[3px] duration-300
          ${checked ? "bg-blue-800" : "bg-blue-400"}
        `}
      >
        <span
          className={`
            flex h-[26px] w-[26px] items-center justify-center rounded-full 
            bg-white shadow-switch transform duration-300
            ${checked ? "translate-x-[28px]" : "translate-x-0"}
          `}
        >
          {checked ? checkedIcon : uncheckedIcon}
        </span>
      </div>
    </label>
  );
};

export default Switch;
