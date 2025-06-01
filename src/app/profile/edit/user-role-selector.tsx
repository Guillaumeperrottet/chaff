"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Shield,
  User as UserIcon,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

export function UserRoleSelector({
  userId,
  currentRole,
  isCurrentUser = false,
}: {
  userId: string;
  currentRole: string;
  isCurrentUser?: boolean;
}) {
  const [role] = useState(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canChangeRole, setCanChangeRole] = useState(true);
  const [adminCount, setAdminCount] = useState(0);
  const router = useRouter();

  // Vérifier le nombre d'admins dans l'organisation
  useEffect(() => {
    const checkAdminCount = async () => {
      try {
        const response = await fetch(`/api/organization/admin-count`);
        if (response.ok) {
          const data = await response.json();
          setAdminCount(data.count);

          // RÈGLE DE SÉCURITÉ : Un admin ne peut pas se retirer les droits s'il est le seul admin
          if (isCurrentUser && role === "admin" && data.count <= 1) {
            setCanChangeRole(false);
          } else {
            setCanChangeRole(true);
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification du nombre d'admins:",
          error
        );
      }
    };

    checkAdminCount();
  }, [userId, role, isCurrentUser]);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === role) return;

    // Vérification de sécurité côté client
    if (
      isCurrentUser &&
      role === "admin" &&
      newRole === "member" &&
      adminCount <= 1
    ) {
      toast.error(
        "Vous ne pouvez pas vous retirer les droits d'administrateur car vous êtes le seul admin de l'organisation. Nommez d'abord un autre administrateur.",
        { duration: 6000 }
      );
      return;
    }

    // Message de confirmation adapté
    let confirmMessage = `Êtes-vous sûr de vouloir changer le rôle ${isCurrentUser ? "de votre compte" : "de cet utilisateur"} en "${
      newRole === "admin" ? "Administrateur" : "Membre"
    }" ?`;

    if (isCurrentUser && newRole === "member") {
      confirmMessage +=
        "\n\nAttention : Vous perdrez vos droits d'administration !";
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la mise à jour du rôle"
        );
      }

      // Si l'utilisateur change son propre rôle vers membre, rediriger vers le profil
      if (isCurrentUser && newRole === "member") {
        toast.info("Redirection vers votre profil...", { duration: 2000 });
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Avertissement si seul admin */}
      {isCurrentUser && role === "admin" && adminCount <= 1 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle
            size={20}
            className="text-amber-600 mt-0.5 flex-shrink-0"
          />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">
              Vous êtes le seul administrateur
            </p>
            <p className="text-amber-700">
              Pour des raisons de sécurité, vous ne pouvez pas vous retirer les
              droits d&apos;admin. Nommez d&apos;abord un autre membre comme
              administrateur.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant={role === "admin" ? "default" : "outline"}
          disabled={isSubmitting || role === "admin"}
          onClick={() => handleRoleChange("admin")}
          className="flex items-center justify-center gap-2 py-2 relative bg-[color:var(--primary)] text-[color:var(--primary-foreground)] border-[color:var(--border)]"
        >
          {isSubmitting && role !== "admin" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Shield size={16} />
          )}
          <span>Administrateur</span>
          {role === "admin" && (
            <Check
              size={16}
              className="absolute right-2 text-[color:var(--primary-foreground)]"
            />
          )}
        </Button>{" "}
        <Button
          variant={role === "member" ? "default" : "outline"}
          disabled={
            isSubmitting ||
            role === "member" ||
            (isCurrentUser && role === "admin" && !canChangeRole)
          }
          onClick={() => handleRoleChange("member")}
          className="flex items-center justify-center gap-2 py-2 relative border-[color:var(--border)] text-[color:var(--foreground)]"
        >
          {isSubmitting && role !== "member" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UserIcon size={16} />
          )}
          <span>Membre</span>
          {role === "member" && (
            <Check
              size={16}
              className="absolute right-2 text-[color:var(--primary-foreground)]"
            />
          )}
        </Button>
      </div>

      {/* Compteur d'admins (info) */}
      <p className="text-xs text-[color:var(--muted-foreground)]">
        {adminCount} administrateur{adminCount > 1 ? "s" : ""} dans
        l&apos;organisation
      </p>
    </div>
  );
}
