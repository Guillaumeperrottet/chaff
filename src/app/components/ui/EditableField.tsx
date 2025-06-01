"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface EditableFieldProps {
  initialValue: string;
  fieldName: string;
  label: string;
  objectId: string;
  onSave?: (newValue: string) => void;
}

export default function EditableField({
  initialValue,
  fieldName,
  label,
  objectId,
  onSave,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus sur l'input quand le mode édition est activé
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    if (!value.trim()) {
      toast.error(`Le champ ${label} ne peut pas être vide`);
      setValue(initialValue);
      setIsEditing(false);
      return;
    }

    try {
      setIsLoading(true);

      // Notification de chargement
      const toastId = toast.loading(`Mise à jour du champ ${label}...`);

      const response = await fetch(`/api/objet/${objectId}/update-field`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ field: fieldName, value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || `Erreur lors de la mise à jour du champ ${label}`
        );
      }

      // Notification de succès
      toast.success(`Le champ ${label} a été mis à jour avec succès !`, {
        id: toastId,
      });

      // Mise à jour réussie, quitter le mode édition
      setIsEditing(false);

      // Callback après sauvegarde si fourni
      if (onSave) {
        onSave(value);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Impossible de mettre à jour le champ ${label}. Veuillez réessayer.`,
        {
          duration: 4000,
        }
      );
      setValue(initialValue); // Réinitialiser la valeur en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setValue(initialValue);
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
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleClickOutside}
          disabled={isLoading}
          className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder={`Entrez ${label}`}
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
      className="w-full border rounded px-3 py-2 bg-gray-100 hover:bg-gray-200 cursor-pointer flex items-center"
    >
      <span>{value}</span>
    </div>
  );
}
