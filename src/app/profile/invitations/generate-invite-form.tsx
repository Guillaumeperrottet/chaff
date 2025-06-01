"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateInviteForm({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const [role, setRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invitations/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          role,
          createdBy: userId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      router.refresh(); // Pour rafraîchir la liste des codes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-[color:var(--card)] border-[color:var(--border)]">
      <h3 className="font-medium mb-3 text-[color:var(--foreground)]">
        Générer un nouveau code d&apos;invitation
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-[color:var(--destructive-background)] text-[color:var(--destructive)] rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label
            htmlFor="role"
            className="block mb-1 text-sm text-[color:var(--foreground)]"
          >
            Rôle
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)]"
          >
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div className="self-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded hover:bg-[color:var(--primary)]/90 disabled:opacity-50"
          >
            {isLoading ? "Génération..." : "Générer un code"}
          </button>
        </div>
      </form>
    </div>
  );
}
