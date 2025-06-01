"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

interface SectorInput {
  name: string;
  image: File | null;
  imagePreview?: string;
  isCompressing?: boolean;
  compressProgress?: number;
}

export default function NewObjectForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [secteurPrincipal, setSecteurPrincipal] = useState("");
  const [sectors, setSectors] = useState<SectorInput[]>([
    { name: "", image: null },
  ]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAddSector = () => {
    setSectors([...sectors, { name: "", image: null }]);
  };

  const handleRemoveSector = (index: number) => {
    // Nettoyer les URL d'aperçu avant de supprimer
    if (sectors[index].imagePreview) {
      URL.revokeObjectURL(sectors[index].imagePreview);
    }

    const newSectors = [...sectors];
    newSectors.splice(index, 1);

    // Vérifier qu'il reste au moins un secteur
    if (newSectors.length === 0) {
      toast.error("Au moins un secteur est requis pour créer un objet");
      return;
    }

    setSectors(newSectors);
  };

  const handleSectorNameChange = (index: number, name: string) => {
    const newSectors = [...sectors];
    newSectors[index].name = name;
    setSectors(newSectors);
  };

  // Utiliser useCallback pour ne pas recréer cette fonction à chaque rendu
  const compressImage = useCallback(
    async (file: File, maxSizeMB = 1): Promise<File> => {
      // S'assurer que le fichier est une image
      if (!file.type.startsWith("image/")) {
        return file;
      }

      return new Promise((resolve) => {
        // Fonction pour compresser l'image en utilisant canvas
        const compressUsingCanvas = (
          file: File,
          quality: number = 0.7
        ): Promise<File> => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
              const img = new window.Image();
              img.src = event.target?.result as string;

              img.onload = () => {
                // Calculer les dimensions optimisées (max 1200px de large)
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width);
                  width = MAX_WIDTH;
                }

                if (height > MAX_HEIGHT) {
                  width = Math.round((width * MAX_HEIGHT) / height);
                  height = MAX_HEIGHT;
                }

                // Créer un canvas et dessiner l'image redimensionnée
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d")!;
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir en Blob puis en File
                canvas.toBlob(
                  (blob) => {
                    if (!blob) return resolve(file);

                    // Créer un nouveau fichier avec le blob compressé
                    const compressedFile = new File([blob], file.name, {
                      type: file.type,
                      lastModified: Date.now(),
                    });

                    resolve(compressedFile);
                  },
                  file.type,
                  quality
                );
              };
            };
          });
        };

        // Essayer d'abord avec une qualité moyenne
        compressUsingCanvas(file, 0.7).then((compressedFile) => {
          // Si le fichier est toujours trop gros, réessayer avec une qualité plus basse
          if (compressedFile.size > maxSizeMB * 1024 * 1024) {
            compressUsingCanvas(file, 0.5).then((result) => {
              resolve(result);
            });
          } else {
            resolve(compressedFile);
          }
        });
      });
    },
    []
  );

  const handleSectorImageChange = async (index: number, file: File | null) => {
    const newSectors = [...sectors];

    // Nettoyer l'aperçu précédent s'il existe
    if (newSectors[index].imagePreview) {
      URL.revokeObjectURL(newSectors[index].imagePreview);
      newSectors[index].imagePreview = undefined;
    }

    if (!file) {
      newSectors[index].image = null;
      setSectors(newSectors);
      return;
    }

    // Créer un aperçu de l'image originale
    newSectors[index].imagePreview = URL.createObjectURL(file);
    newSectors[index].isCompressing = true;
    newSectors[index].compressProgress = 0;
    setSectors([...newSectors]);

    try {
      // Simuler une progression pour feedback utilisateur
      const progressInterval = setInterval(() => {
        setSectors((current) => {
          const updated = [...current];
          if (updated[index].compressProgress !== undefined) {
            updated[index].compressProgress = Math.min(
              (updated[index].compressProgress || 0) + 10,
              90
            );
          }
          return updated;
        });
      }, 100);

      // Compresser l'image
      const compressedFile = await compressImage(file);
      clearInterval(progressInterval);

      // Mettre à jour avec l'image compressée
      newSectors[index].image = compressedFile;
      newSectors[index].isCompressing = false;
      newSectors[index].compressProgress = 100;

      console.log(
        `Image compressée: ${file.size} -> ${compressedFile.size} (${Math.round(
          (compressedFile.size / file.size) * 100
        )}%)`
      );

      setSectors([...newSectors]);

      // Afficher un toast si la compression a été significative
      if (compressedFile.size < file.size * 0.7) {
        const originalSize = (file.size / (1024 * 1024)).toFixed(2);
        const compressedSize = (compressedFile.size / (1024 * 1024)).toFixed(2);
        toast.success(
          `Image optimisée: ${originalSize}MB → ${compressedSize}MB (${Math.round(
            (compressedFile.size / file.size) * 100
          )}%)`
        );
      }
    } catch (error) {
      console.error("Erreur de compression:", error);
      // En cas d'erreur, utiliser l'image originale
      newSectors[index].image = file;
      newSectors[index].isCompressing = false;
      setSectors([...newSectors]);
    }
  };

  const validateForm = (): boolean => {
    // Vérifier les informations générales de l'objet
    if (!nom.trim()) {
      toast.error("Le nom de l'objet est requis");
      return false;
    }

    if (!adresse.trim()) {
      toast.error("L'adresse est requise");
      return false;
    }

    if (!secteurPrincipal.trim()) {
      toast.error("Le secteur principal est requis");
      return false;
    }

    // S'assurer qu'il y a au moins un secteur
    if (sectors.length === 0) {
      toast.error("Au moins un secteur est requis pour créer un objet");
      return false;
    }

    // Vérifier que tous les secteurs ont un nom et une image
    for (let i = 0; i < sectors.length; i++) {
      if (!sectors[i].name.trim()) {
        toast.error(`Le nom du secteur ${i + 1} est requis`);
        return false;
      }

      if (!sectors[i].image) {
        toast.error(`L'image du secteur ${i + 1} est requise`);
        return false;
      }

      // Vérifier si la compression est en cours
      if (sectors[i].isCompressing) {
        toast.error(
          `Veuillez attendre que l'image du secteur ${i + 1} soit optimisée`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    // Démarrer la simulation de progression
    const progressInterval = setInterval(() => {
      setUploadProgress((current) => Math.min(current + Math.random() * 5, 90));
    }, 300);

    const toastId = toast.loading("Création de l'objet en cours...");

    try {
      // Créer un formData pour pouvoir envoyer les fichiers
      const formData = new FormData();
      formData.append("nom", nom);
      formData.append("adresse", adresse);
      formData.append("secteur", secteurPrincipal);

      // Ajouter les informations des secteurs
      formData.append("sectorsCount", sectors.length.toString());

      sectors.forEach((sector, index) => {
        formData.append(`sector_${index}_name`, sector.name);
        if (sector.image) {
          formData.append(`sector_${index}_image`, sector.image);
        }
      });

      // Envoyer la requête
      const response = await fetch("/api/objet/new-with-sectors", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            "Une erreur est survenue lors de la création de l'objet"
        );
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      toast.success("Objet créé avec succès!", { id: toastId });
      router.push(`/dashboard/objet/${data.id}/edit`);
    } catch (error) {
      clearInterval(progressInterval);
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

  // Nettoyer les URLs d'aperçu lors du démontage du composant
  React.useEffect(() => {
    return () => {
      sectors.forEach((sector) => {
        if (sector.imagePreview) {
          URL.revokeObjectURL(sector.imagePreview);
        }
      });
    };
  }, [sectors]); // Add sectors dependency here

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Créer un nouvel objet</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6"
      >
        <div className="grid gap-6 mb-8">
          <h2 className="text-xl font-semibold border-b border-[color:var(--border)] pb-2 text-[color:var(--foreground)]">
            Informations générales
          </h2>

          <div>
            <label
              htmlFor="nom"
              className="block text-sm font-medium text-[color:var(--foreground)] mb-1"
            >
              Nom *
            </label>
            <Input
              type="text"
              id="nom"
              name="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de l'objet"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="adresse"
              className="block text-sm font-medium text-[color:var(--foreground)] mb-1"
            >
              Adresse *
            </label>
            <Input
              type="text"
              id="adresse"
              name="adresse"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Adresse complète"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="secteur"
              className="block text-sm font-medium text-[color:var(--foreground)] mb-1"
            >
              Activité *
            </label>
            <Input
              type="text"
              id="secteur"
              name="secteur"
              value={secteurPrincipal}
              onChange={(e) => setSecteurPrincipal(e.target.value)}
              placeholder="Ex: Camping, Immobilier..."
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold border-b pb-2">Secteurs</h2>
            <button
              type="button"
              onClick={handleAddSector}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              disabled={isSubmitting}
            >
              <Plus size={16} />
              <span>Ajouter un secteur</span>
            </button>
          </div>

          {sectors.map((sector, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Secteur {index + 1}</h3>
                {sectors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSector(index)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    disabled={isSubmitting}
                  >
                    <Trash size={16} />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`sector-${index}-name`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom du secteur *
                  </label>
                  <input
                    type="text"
                    id={`sector-${index}-name`}
                    value={sector.name}
                    onChange={(e) =>
                      handleSectorNameChange(index, e.target.value)
                    }
                    placeholder="Ex: Cuisine, Salle de bain..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`sector-${index}-image`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Image du secteur *
                  </label>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor={`sector-${index}-image`}
                      className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                        sector.image
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10"
                          : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                      } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {sector.imagePreview ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={sector.imagePreview}
                            alt={`Preview ${sector.name}`}
                            fill
                            className="object-cover rounded-lg"
                          />

                          {/* Indicateur de compression */}
                          {sector.isCompressing && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white rounded-lg">
                              <Loader2 className="animate-spin w-8 h-8 mb-2" />
                              <span className="text-xs">Optimisation...</span>
                              {sector.compressProgress !== undefined && (
                                <div className="w-20 h-1.5 bg-gray-300 rounded-full mt-2">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                      width: `${sector.compressProgress}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-500" />
                          <p className="text-xs text-gray-500 mt-2">
                            Cliquez pour uploader
                          </p>
                        </div>
                      )}
                      <input
                        id={`sector-${index}-image`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleSectorImageChange(index, file);
                        }}
                        required={!sector.image}
                        disabled={isSubmitting || sector.isCompressing}
                      />
                    </label>
                    {sector.image && !sector.isCompressing && (
                      <button
                        type="button"
                        onClick={() => handleSectorImageChange(index, null)}
                        className="text-red-600 hover:text-red-800"
                        disabled={isSubmitting}
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isSubmitting && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-1">Création en cours...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[color:var(--border)] mt-8">
          <Link href="/dashboard">
            <Button variant="outline" type="button" disabled={isSubmitting}>
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              sectors.some((s) => s.isCompressing) ||
              sectors.length === 0 ||
              sectors.some((s) => !s.name.trim() || !s.image) ||
              !nom.trim() ||
              !adresse.trim() ||
              !secteurPrincipal.trim()
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer l'objet"
            )}
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold border-b pb-2">Secteurs</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-orange-600">
              {sectors.length === 0 ||
              sectors.some((s) => !s.name.trim() || !s.image)
                ? "Au moins un secteur avec nom et image est requis"
                : ""}
            </span>
            <button
              type="button"
              onClick={handleAddSector}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              disabled={isSubmitting}
            >
              <Plus size={16} />
              <span>Ajouter un secteur</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
