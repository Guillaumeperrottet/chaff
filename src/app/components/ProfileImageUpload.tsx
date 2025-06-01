"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Camera, X, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface ProfileImageUploadProps {
  initialImageUrl: string | null;
  userName: string;
  onImageUpdate: (imageUrl: string) => Promise<void>;
}

export default function ProfileImageUpload({
  initialImageUrl,
  userName,
  onImageUpdate,
}: ProfileImageUploadProps) {
  const [image, setImage] = useState<string | null>(initialImageUrl);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si l'appareil est mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
          (!!navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fonction pour ouvrir le sélecteur de fichier adapté à l'appareil
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Empêcher tout comportement par défaut
    e.stopPropagation(); // Arrêter la propagation de l'événement

    console.log("Avatar clicked"); // Débogage

    // S'assurer que l'élément input existe
    if (fileInputRef.current) {
      // Sur mobile, s'assurer que l'attribut capture est désactivé pour avoir les deux options
      if (isMobile) {
        fileInputRef.current.removeAttribute("capture");
      }

      // Utiliser setTimeout pour s'assurer que le clic est traité
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 10);
    } else {
      console.error("File input reference not available");
    }
  };

  // Gestion de la sélection d'une image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image valide");
      return;
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    // Créer une URL pour la prévisualisation
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setShowControls(true);

    // Nettoyage de l'input pour permettre de sélectionner à nouveau le même fichier
    e.target.value = "";
  };

  // Fonction pour annuler l'upload et réinitialiser
  const handleCancel = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
    setShowControls(false);
  };

  // Fonction pour uploader l'image
  const handleUpload = async () => {
    if (!previewImage) return;

    // Convertir l'URL de prévisualisation en Blob
    try {
      setUploading(true);

      const response = await fetch(previewImage);
      const blob = await response.blob();

      // Créer un FormData pour l'upload
      const formData = new FormData();
      formData.append("file", blob, "profile-image.jpg");

      // Appel à votre API d'upload d'image de profil
      const uploadResponse = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Erreur lors de l'upload de l'image");
      }

      const data = await uploadResponse.json();

      // Mettre à jour l'image dans le state
      setImage(data.imageUrl);

      // Appeler la fonction de callback pour mettre à jour l'image au niveau du parent
      await onImageUpdate(data.imageUrl);

      // Nettoyer la prévisualisation
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
      setShowControls(false);

      toast.success("Photo de profil mise à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      toast.error("Erreur lors de la mise à jour de la photo de profil");
    } finally {
      setUploading(false);
    }
  };

  // Détermine les initiales de l'utilisateur pour l'avatar par défaut
  const getInitials = () => {
    return userName ? userName.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className="flex flex-col items-center">
      {/* Input file caché */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Avatar avec image ou initiales */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleAvatarClick}
          className="w-28 h-28 rounded-full overflow-hidden bg-[color:var(--muted)] flex items-center justify-center text-3xl text-[color:var(--muted-foreground)] font-bold border-2 border-[color:var(--border)] group-hover:border-[color:var(--primary)] cursor-pointer relative p-0 m-0"
          style={{ appearance: "none" }}
        >
          {previewImage ? (
            <Image
              src={previewImage}
              alt="Prévisualisation"
              fill
              className="object-cover"
            />
          ) : image ? (
            <Image
              src={image}
              alt={userName || "Profil"}
              fill
              className="object-cover"
            />
          ) : (
            <span>{getInitials()}</span>
          )}

          {/* Overlay intégré dans le bouton */}
          {!showControls && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-300">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Boutons de contrôle uniquement quand une image est sélectionnée */}
      {showControls && (
        <div className="mt-4 flex space-x-3">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleCancel}
            disabled={uploading}
          >
            <X size={16} />
            <span>Annuler</span>
          </Button>
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <CheckCheck size={16} />
                <span>Enregistrer</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
