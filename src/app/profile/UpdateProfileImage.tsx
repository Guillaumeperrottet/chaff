"use client";

import { useState } from "react";
import { toast } from "sonner";
import ProfileImageUpload from "@/app/components/ProfileImageUpload";

interface UpdateProfileImageProps {
  initialImage: string | null;
  userName: string;
}

export default function UpdateProfileImage({
  initialImage,
  userName,
}: UpdateProfileImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);

  const handleImageUpdate = async (newImageUrl: string) => {
    try {
      // L'image est déjà mise à jour dans l'API par le composant ProfileImageUpload
      // Nous mettons simplement à jour l'état local
      setImageUrl(newImageUrl);

      // Force reload pour mettre à jour le header et autres composants
      setTimeout(() => {
        // Optionnel: recharger la page pour mettre à jour l'image dans le header
        // Si vous préférez une approche sans rechargement,
        // vous devrez implémenter un state global ou un contexte
        // window.location.reload();
      }, 1000);

      return Promise.resolve();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'image:", error);
      toast.error("Impossible de mettre à jour l'image de profil");
      return Promise.reject(error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <ProfileImageUpload
        initialImageUrl={imageUrl}
        userName={userName}
        onImageUpdate={handleImageUpdate}
      />
    </div>
  );
}
