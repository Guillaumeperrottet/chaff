"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

type FeedbackType = "feature" | "bug" | "improvement";
export default function FeaturesForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<FeedbackType>("feature");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Une erreur est survenue");
      }

      setIsSubmitted(true);
      // Rediriger l'utilisateur vers le dashboard après 2 secondes
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'envoi"
      );
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-[color:var(--foreground)]">
          Merci pour votre feedback !
        </h3>
        <p className="text-[color:var(--muted-foreground)] mb-4">
          Votre suggestion a été envoyée avec succès. Nous l&apos;examinerons
          attentivement.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-md hover:bg-[color:var(--primary)]/90 transition-colors"
        >
          Retour au dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium mb-2 text-[color:var(--foreground)]"
        >
          Type de feedback
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as FeedbackType)}
          className="w-full p-2 border border-[color:var(--border)] rounded-md bg-[color:var(--background)] text-[color:var(--foreground)]"
          disabled={isSubmitting}
        >
          <option value="feature">Nouvelle fonctionnalité</option>
          <option value="improvement">Amélioration</option>
          <option value="bug">Signalement de bug</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium mb-2 text-[color:var(--foreground)]"
        >
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Ajouter un calendrier des tâches"
          className="w-full p-2 border border-[color:var(--border)] rounded-md bg-[color:var(--background)] text-[color:var(--foreground)]"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium mb-2 text-[color:var(--foreground)]"
        >
          Description détaillée <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre idée ou le problème rencontré en détail..."
          className="w-full p-2 border border-[color:var(--border)] rounded-md bg-[color:var(--background)] text-[color:var(--foreground)] min-h-[150px]"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-6 py-3 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-md hover:bg-[color:var(--primary)]/90 transition-colors flex items-center justify-center disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "Envoyer ma proposition"
          )}
        </button>
      </div>
    </form>
  );
}
