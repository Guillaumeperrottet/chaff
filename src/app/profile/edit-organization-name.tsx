"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface EditOrganizationNameProps {
  initialName: string;
  organizationId: string;
  isAdmin: boolean;
}

export default function EditOrganizationName({
  initialName,
  organizationId,
  isAdmin,
}: EditOrganizationNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
    if (!isAdmin) {
      toast.error(
        "Seuls les administrateurs peuvent modifier le nom de l'organisation"
      );
      return;
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (name === initialName) {
      setIsEditing(false);
      setShowConfirmation(false);
      return;
    }

    // Vérifier que le nom n'est pas vide
    if (!name || name.trim().length < 2) {
      toast.error(
        "Le nom de l'organisation doit contenir au moins 2 caractères"
      );
      return;
    }

    // Si la confirmation n'a pas encore été montrée, l'afficher
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      setIsLoading(true);

      // Notification de chargement
      const toastId = toast.loading("Mise à jour du nom de l'organisation...");

      const response = await fetch("/api/organization/update-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la mise à jour du nom de l'organisation"
        );
      }

      // Mise à jour réussie, réinitialiser les états
      setIsEditing(false);
      setShowConfirmation(false);

      // Notification de succès
      toast.success("Le nom de l'organisation a été mis à jour avec succès !", {
        id: toastId,
      });

      // Rafraîchir la page pour que les changements soient visibles partout
      // Petit délai pour que l'utilisateur voie la notification de succès
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: unknown) {
      console.error("Erreur:", error);

      // Notification d'erreur
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour le nom de l'organisation. Veuillez réessayer.",
        {
          duration: 4000,
        }
      );

      // Réinitialiser l'état de confirmation
      setShowConfirmation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(initialName);
    setIsEditing(false);
    setShowConfirmation(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!showConfirmation) {
        setShowConfirmation(true);
      } else {
        handleSave();
      }
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Afficher la boîte de confirmation
  if (showConfirmation) {
    return (
      <div className="w-full border rounded p-4 bg-[color:var(--warning-background)]">
        <p className="mb-3 text-[color:var(--warning-foreground)]">
          Êtes-vous sûr de vouloir renommer l&apos;organisation de &quot;
          {initialName}&quot; à &quot;{name}&quot; ?
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Enregistrement..." : "Confirmer"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-3 py-1 bg-[color:var(--muted)] text-[color:var(--foreground)] rounded hover:bg-[color:var(--muted)]/80 disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  // Afficher le champ d'édition
  if (isEditing) {
    return (
      <div className="w-full relative">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[color:var(--background)] text-[color:var(--foreground)]"
          placeholder="Nom de l'organisation"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Enregistrer
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-[color:var(--muted)] text-[color:var(--foreground)] rounded hover:bg-[color:var(--muted)]/80"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  // Afficher le nom avec la possibilité de cliquer (pour les admins)
  return (
    <div
      onClick={handleStartEditing}
      className={`w-full border rounded px-3 py-2 ${
        isAdmin
          ? "bg-[color:var(--muted)] hover:bg-[color:var(--muted)]/80 cursor-pointer"
          : "bg-[color:var(--muted)]"
      } flex items-center text-[color:var(--foreground)]`}
    >
      <span>{name}</span>
    </div>
  );
}
