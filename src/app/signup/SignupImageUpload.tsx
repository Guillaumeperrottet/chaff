"use client";

import { useState, useRef, memo, useEffect } from "react";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";

// Utilisez next/dynamic pour l'image
import dynamic from "next/dynamic";
const Image = dynamic(() => import("next/image"), {
  loading: () => (
    <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse"></div>
  ),
});

interface SignupImageUploadProps {
  onImageSelect: (file: File | null) => void;
}

function SignupImageUpload({ onImageSelect }: SignupImageUploadProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Déplacer la détection mobile dans useEffect pour éviter l'hydration mismatch
  useEffect(() => {
    setIsMobile(
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        (!!navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    );
  }, []);

  // Fonction optimisée pour ouvrir le sélecteur de fichier
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      if (isMobile) {
        fileInputRef.current.removeAttribute("capture");
      }
      fileInputRef.current.click();
    }
  };

  // Version optimisée pour la sélection de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Utiliser un seul if avec conditions combinées pour réduire le branching
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error(
        !file.type.startsWith("image/")
          ? "Veuillez sélectionner une image valide"
          : "L'image ne doit pas dépasser 5MB"
      );
      e.target.value = "";
      return;
    }

    // Créer une URL pour la prévisualisation
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setShowControls(true);
    onImageSelect(file);

    // Nettoyage
    e.target.value = "";
  };

  // Fonction optimisée pour annuler la sélection
  const handleCancel = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setShowControls(false);
    onImageSelect(null);
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="relative group">
        <div className="absolute -inset-1.5 bg-gradient-to-br from-[#d9840d]/20 to-[#e36002]/20 rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-all duration-300"></div>
        <button
          type="button"
          onClick={handleAvatarClick}
          className="w-24 h-24 rounded-full overflow-hidden bg-[#f5f3ef] flex items-center justify-center text-2xl text-[#62605d] font-bold border-2 border-[#beac93] group-hover:border-[#d9840d] cursor-pointer relative p-0 m-0 shadow-md transition-all duration-300"
          style={{ appearance: "none" }}
        >
          {previewImage ? (
            <Image
              src={previewImage}
              alt="Prévisualisation"
              fill
              className="object-cover"
            />
          ) : (
            <span>?</span>
          )}

          {!showControls && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-300">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                <Camera className="h-6 w-6 text-white mb-1" />
                <span className="text-white text-xs font-normal">Ajouter</span>
              </div>
            </div>
          )}
        </button>
      </div>

      {showControls ? (
        <div className="mt-3 flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1 border-[#beac93] hover:bg-[#e8ebe0] hover:text-[#d9840d] transition-colors rounded-full px-4"
            onClick={handleCancel}
            type="button"
          >
            <X size={14} />
            <span>Supprimer</span>
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#62605d]">
          Ajouter une photo de profil (optionnel)
        </p>
      )}
    </div>
  );
}

// Mémoriser le composant pour éviter les rendus inutiles
export default memo(SignupImageUpload);
