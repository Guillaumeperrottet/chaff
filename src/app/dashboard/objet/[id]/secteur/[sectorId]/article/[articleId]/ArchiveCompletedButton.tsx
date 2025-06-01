"use client";

import { useState } from "react";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ArchiveCompletedButtonProps {
  completedTasks: { id: string }[];
  onArchiveCompleted: () => void;
}

export default function ArchiveCompletedButton({
  completedTasks,
  onArchiveCompleted,
}: ArchiveCompletedButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleArchiveCompleted = async () => {
    // Vérifier s'il y a des tâches à archiver
    if (completedTasks.length === 0) {
      toast.info("Aucune tâche terminée à archiver");
      return;
    }

    // Demander confirmation
    if (
      !confirm(
        `Archiver ${completedTasks.length} tâche(s) terminée(s) ? Ces tâches seront déplacées vers les archives.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Archiver toutes les tâches terminées en parallèle
      const promises = completedTasks.map((task) =>
        fetch(`/api/tasks/${task.id}/archive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archive: true }),
        })
      );

      // Attendre que toutes les requêtes soient terminées
      const results = await Promise.allSettled(promises);

      // Compter les succès et les échecs
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        toast.warning(`${succeeded} tâche(s) archivée(s), ${failed} échec(s)`);
      } else {
        toast.success(`${succeeded} tâche(s) archivée(s) avec succès`);
      }

      // Rafraîchir la liste des tâches
      onArchiveCompleted();
    } catch (error) {
      console.error("Erreur lors de l'archivage des tâches:", error);
      toast.error("Erreur lors de l'archivage des tâches");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleArchiveCompleted}
      className="ml-1 p-1 rounded-full hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-foreground)] text-[color:var(--primary)] transition-colors"
      title="Archiver toutes les tâches terminées"
      disabled={loading || completedTasks.length === 0}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Archive className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
