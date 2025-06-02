"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  href: string;
  label?: string;
  loadingMessage?: string;
  className?: string;
}
export function BackButton({
  href,
  label = "Retour",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Feedback haptique si disponible
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

    // Navigation avec loader
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className={`group inline-flex items-center text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--primary)] mb-6 transition-all duration-300 ${className}`}
    >
      <ArrowLeft
        size={16}
        className="mr-1 transition-transform group-hover:-translate-x-1"
      />
      {label}
    </button>
  );
}
