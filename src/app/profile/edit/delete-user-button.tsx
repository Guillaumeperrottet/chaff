"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { AlertTriangle, Trash2, UserMinus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";

export function DeleteUserButton({
  userId,
  userName,
  isCurrentUser,
}: {
  userId: string;
  userName: string;
  isCurrentUser: boolean;
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/users/${userId}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Une erreur est survenue lors de la suppression"
        );
      }

      toast.success(
        isCurrentUser
          ? "Vous avez été retiré de l'organisation avec succès."
          : `L'utilisateur ${userName} a été supprimé avec succès.`
      );

      // Si l'utilisateur se supprime lui-même, redirigez vers la déconnexion
      if (isCurrentUser) {
        router.push("/signout");
      } else {
        router.push("/profile/edit");
      }
    } catch (error) {
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
      setShowConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowConfirmation(true)}
        className="w-full sm:w-auto flex items-center gap-2"
      >
        <UserMinus size={16} />
        {isCurrentUser ? "Quitter l'organisation" : "Supprimer l'utilisateur"}
      </Button>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center p-2">
            <div className="w-12 h-12 rounded-full bg-[color:var(--destructive-background)] flex items-center justify-center mb-4">
              <AlertTriangle
                size={24}
                className="text-[color:var(--destructive)]"
              />
            </div>
          </div>

          <DialogTitle className="text-center">
            {isCurrentUser
              ? "Confirmer votre départ de l'organisation"
              : `Confirmer la suppression de ${userName}`}
          </DialogTitle>

          <DialogDescription className="text-center">
            {isCurrentUser
              ? "Vous êtes sur le point de quitter cette organisation. Cette action est irréversible et vous perdrez tous vos accès."
              : "Cette action est irréversible et supprimera tous les accès de cet utilisateur à l'organisation."}
          </DialogDescription>

          <div className="my-4">
            <label className="text-sm font-medium block mb-2">
              Tapez <span className="font-bold">confirmer</span> pour continuer
            </label>
            <input
              type="text"
              className="w-full border border-[color:var(--border)] rounded-md p-2 bg-[color:var(--muted)]"
              placeholder="confirmer"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isDeleting}
              className="gap-2"
            >
              <X size={16} />
              Annuler
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || confirmText.toLowerCase() !== "confirmer"}
              className="gap-2"
            >
              <Trash2 size={16} />
              {isDeleting ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
