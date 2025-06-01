"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface SelectionBadgeProps {
  isSelected: boolean;
  isCurrentPlan?: boolean;
}

export const SelectionBadge = ({
  isSelected,
  isCurrentPlan = false,
}: SelectionBadgeProps) => {
  if (!isSelected && !isCurrentPlan) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-10`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: 0,
          transition: {
            type: "spring",
            stiffness: 200,
            damping: 10,
          },
        }}
        className={`${
          isCurrentPlan ? "bg-blue-600" : "bg-[color:var(--primary)]"
        } text-white py-2 px-6 rounded-full flex items-center gap-2 shadow-lg`}
      >
        <CheckCircle className="h-5 w-5" />
        <span className="font-semibold">
          {isCurrentPlan ? "Plan actuel" : "Sélectionné"}
        </span>
      </motion.div>
    </motion.div>
  );
};
