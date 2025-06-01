"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Trash, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";

export default function NewSectorForm({ objetId }: { objetId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = (file: File | null) => {
    setImage(file);

    if (file) {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    } else {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom du secteur est requis");
      return;
    }

    if (!image) {
      toast.error("L'image du secteur est requise");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    // Simuler une progression d'upload pour une meilleure UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const increment = Math.random() * 10;
        return Math.min(prev + increment, 95);
      });
    }, 300);

    const toastId = toast.loading("Création du secteur en cours...");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("image", image);
      formData.append("objectId", objetId);

      const response = await fetch("/api/secteur/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            "Une erreur est survenue lors de la création du secteur"
        );
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Secteur créé avec succès !", { id: toastId });
      router.push(`/dashboard/objet/${objetId}/edit`);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);

      console.error("Erreur:", error);
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`,
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-[color:var(--background)] rounded-lg border border-[color:var(--border)] p-6"
    >
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-[color:var(--foreground)] mb-1"
        >
          Nom du secteur *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Cuisine, Salle de bain..."
          className="w-full px-4 py-2 border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--background)] text-[color:var(--foreground)]"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
          Image du secteur *
        </label>
        <div className="mt-2 flex items-start space-x-4">
          <div className="flex-shrink-0">
            {imagePreview ? (
              <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Aperçu de l'image"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleImageChange(null)}
                  className="absolute top-2 right-2 p-1 bg-[color:var(--destructive)] text-[color:var(--destructive-foreground)] rounded-full hover:bg-[color:var(--destructive)]/90 transition-colors"
                  disabled={isSubmitting}
                >
                  <Trash size={16} />
                </button>
              </div>
            ) : (
              <label
                htmlFor="image-upload"
                className={`flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-[color:var(--border)] rounded-lg cursor-pointer bg-[color:var(--muted)] hover:bg-[color:var(--muted)]/80 transition-colors ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-[color:var(--muted-foreground)]" />
                  <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                    Cliquez pour sélectionner une image
                  </p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleImageChange(file);
                  }}
                  required
                  disabled={isSubmitting}
                />
              </label>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              L&apos;image doit être au format JPG, PNG ou GIF et ne pas
              dépasser 5 Mo. Choisissez une image qui représente bien le secteur
              pour faciliter son identification.
            </p>

            {isSubmitting && (
              <div className="mt-4">
                <p className="text-sm text-[color:var(--muted-foreground)] mb-1">
                  Téléchargement en cours...
                </p>
                <div className="w-full bg-[color:var(--muted)] rounded-full h-2">
                  <div
                    className="bg-[color:var(--primary)] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-[color:var(--border)]">
        <Link
          href={`/dashboard/objet/${objetId}/edit`}
          className="px-4 py-2 border border-[color:var(--border)] rounded-md hover:bg-[color:var(--muted)] transition-colors disabled:opacity-50"
          aria-disabled={isSubmitting}
          tabIndex={isSubmitting ? -1 : undefined}
          onClick={(e) => isSubmitting && e.preventDefault()}
        >
          Annuler
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            "Créer le secteur"
          )}
        </Button>
      </div>
    </form>
  );
}
