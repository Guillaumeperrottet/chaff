"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumBurgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
  variant?: "light" | "dark" | "primary";
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
      button: "bg-white hover:bg-[#f5f3ef]",
      border: "border-[#beac93]",
      lines: "bg-[#141313]",
      shadow: "shadow-md",
    },
    dark: {
      button: "bg-[#19140d] hover:bg-[#211b12]",
      border: "border-[#6c5a41]",
      lines: "bg-white",
      shadow: "shadow-lg",
    },
    primary: {
      button: "bg-[#d9840d] hover:bg-[#c6780c]",
      border: "border-[#e36002]",
      lines: "bg-white",
      shadow: "shadow-lg",
    },
  };

  const colors = colorConfig[variant];

  return (
    <motion.button
      onClick={onClick}
      className={`relative flex items-center justify-center w-12 h-12 ${colors.button} rounded-full ${colors.border} border ${colors.shadow} transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
    >
      <div className="w-7 h-7 relative flex items-center justify-center">
        <AnimatePresence>
          {!isOpen ? (
            <>
              {/* Lignes du burger */}
              <motion.span
                key="top"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: -6, width: hover ? 16 : 20 }}
                exit={{ opacity: 0, x: -10 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                key="middle"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1, width: 20 }}
                exit={{ opacity: 0, scaleX: 0 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                key="bottom"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 6, width: hover ? 14 : 16 }}
                exit={{ opacity: 0, x: -10 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.2 }}
              />
            </>
          ) : (
            <>
              {/* Icône X quand menu ouvert */}
              <motion.span
                key="top-x"
                initial={{ rotate: 0, y: -6 }}
                animate={{ rotate: 45, y: 0, width: 20 }}
                exit={{ rotate: 0, y: -6 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                key="bottom-x"
                initial={{ rotate: 0, y: 6 }}
                animate={{ rotate: -45, y: 0, width: 20 }}
                exit={{ rotate: 0, y: 6 }}
                className={`absolute h-0.5 ${colors.lines} rounded-full`}
                transition={{ duration: 0.2 }}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Point de notification dynamique */}
      {!isOpen && (
        <motion.div
          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#e36002] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5, delay: 1 }}
        />
      )}
    </motion.button>
  );
};

export default PremiumBurgerButton;
