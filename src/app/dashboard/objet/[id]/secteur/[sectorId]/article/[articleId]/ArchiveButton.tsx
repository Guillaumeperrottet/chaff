// src/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/ArchiveButton.tsx
"use client";

import { Archive, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ArchiveButtonProps {
  taskId: string;
  isArchived?: boolean;
  onArchiveToggle?: (archived: boolean) => void;
  className?: string;
  showText?: boolean;
}

export default function ArchiveButton({
  taskId,
  isArchived = false,
  onArchiveToggle,
  className = "",
  showText = false,
}: ArchiveButtonProps) {
  const [loading, setLoading] = useState(false);

  const toggleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archive: !isArchived }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'archivage de la tâche");
      }

      if (onArchiveToggle) {
        onArchiveToggle(!isArchived);
      }

      toast.success(
        isArchived ? "Tâche retirée des archives" : "Tâche archivée avec succès"
      );
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'archivage de la tâche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleArchive}
      className={`flex items-center gap-1 text-[color:var(--muted-foreground)] hover:text-[color:var(--primary)] ${className}`}
      title={isArchived ? "Désarchiver" : "Archiver"}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Archive className="h-3.5 w-3.5" />
      )}
      {showText && <span>{isArchived ? "Désarchiver" : "Archiver"}</span>}
    </button>
  );
}
