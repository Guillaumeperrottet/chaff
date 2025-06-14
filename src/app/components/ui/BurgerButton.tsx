"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumBurgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
  variant?: "light" | "dark" | "primary" | "subtle";
}

const PremiumBurgerButton: React.FC<PremiumBurgerButtonProps> = ({
  isOpen,
  onClick,
  className = "",
  variant = "light",
}) => {
  const [hover, setHover] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Attendre le montage côté client pour éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Configuration des couleurs selon la variante
  const colorConfig = {
    light: {
      button: "bg-white hover:bg-slate-50",
      border: "border-slate-200",
      lines: "bg-slate-600",
      shadow: "shadow-sm",
    },
    dark: {
      button: "bg-slate-800 hover:bg-slate-700",
      border: "border-slate-600",
      lines: "bg-white",
      shadow: "shadow-md",
    },
    primary: {
      button: "bg-slate-100 hover:bg-slate-200",
      border: "border-slate-300",
      lines: "bg-slate-700",
      shadow: "shadow-sm",
    },
    subtle: {
      button: "bg-transparent hover:bg-slate-100",
      border: "border-slate-200",
      lines: "bg-slate-600",
      shadow: "",
    },
  };

  const colors = colorConfig[variant];

  return (
    <motion.button
      onClick={onClick}
      className={`relative flex items-center justify-center w-8 h-8 ${colors.button} rounded-md ${colors.border} border ${colors.shadow} transition-all duration-200 ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
    >
      <div className="w-4 h-4 relative flex items-center justify-center">
        <AnimatePresence>
          {!isOpen ? (
            <>
              {/* Lignes du burger */}
              <motion.span
                key="top"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: -3, width: hover ? 10 : 12 }}
                exit={{ opacity: 0, x: -5 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.15 }}
              />
              <motion.span
                key="middle"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1, width: 12 }}
                exit={{ opacity: 0, scaleX: 0 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.15 }}
              />
              <motion.span
                key="bottom"
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 3, width: hover ? 8 : 10 }}
                exit={{ opacity: 0, x: -5 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.15 }}
              />
            </>
          ) : (
            <>
              {/* Icône X quand menu ouvert */}
              <motion.span
                key="top-x"
                initial={{ rotate: 0, y: -3 }}
                animate={{ rotate: 45, y: 0, width: 12 }}
                exit={{ rotate: 0, y: -3 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.15 }}
              />
              <motion.span
                key="bottom-x"
                initial={{ rotate: 0, y: 3 }}
                animate={{ rotate: -45, y: 0, width: 12 }}
                exit={{ rotate: 0, y: 3 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.15 }}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Suppression du point de notification pour plus de discrétion */}
    </motion.button>
  );
};

export default PremiumBurgerButton;
