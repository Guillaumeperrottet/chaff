"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface EditNameProps {
  initialName: string;
}

export default function EditName({ initialName }: EditNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lorsque l'édition est activée, focus sur l'input
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (name === initialName) {
      setIsEditing(false);
      return;
    }

    try {
      setIsLoading(true);

      // Notification de chargement
      const toastId = toast.loading("Mise à jour de votre nom...");

      const response = await fetch("/api/profile/update-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du nom");
      }

      // Mise à jour réussie, quitter le mode édition
      setIsEditing(false);

      // Notification de succès
      toast.success("Votre nom a été mis à jour avec succès !", {
        id: toastId,
      });

      // Rafraîchir la page pour que les changements soient visibles partout
      // Petit délai pour que l'utilisateur voie la notification de succès
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Erreur:", error);

      // Notification d'erreur
      toast.error(
        "Impossible de mettre à jour votre nom. Veuillez réessayer.",
        {
          duration: 4000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setName(initialName);
      setIsEditing(false);
    }
  };

  const handleClickOutside = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <div className="w-full relative">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleClickOutside}
          disabled={isLoading}
          className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[color:var(--background)] text-[color:var(--foreground)]"
          placeholder="Entrez votre nom"
        />
        {isLoading && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="animate-spin h-4 w-4 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleStartEditing}
      className="w-full border rounded px-3 py-2 bg-[color:var(--muted)] hover:bg-[color:var(--muted)]/80 cursor-pointer flex items-center text-[color:var(--foreground)]"
    >
      <span>{name}</span>
    </div>
  );
}
