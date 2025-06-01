"use client";

import { useState } from "react";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeleteObjectButton({
  objetId,
  objetName,
}: {
  objetId: string;
  objetName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading("Suppression en cours...");

    try {
      const response = await fetch(`/api/objet/${objetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Une erreur est survenue");
      }

      toast.success("Objet supprimé avec succès", { id: toastId });
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`,
        { id: toastId }
      );
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isOpen) {
    return (
      <div className="border rounded-md p-4 bg-red-50">
        <p className="mb-4 font-medium">
          Êtes-vous sûr de vouloir supprimer l&apos;objet &quot;{objetName}
          &quot; ? Cette action est irréversible et supprimera tous les secteurs
          associés.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Suppression..." : "Confirmer la suppression"}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50"
    >
      <Trash size={16} />
      <span>Supprimer cet objet</span>
    </button>
  );
}
