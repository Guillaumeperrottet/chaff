import { v2 as cloudinary } from "cloudinary";

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Types de ressources pouvant être uploadées
 */
export type UploadResourceType = "image" | "raw" | "video" | "auto";

/**
 * Options pour l'upload
 */
export interface UploadOptions {
  /** Type de ressource (image, raw, video, auto) */
  resourceType?: UploadResourceType;
  /** Dossier de destination dans Cloudinary */
  folder?: string;
  /** Tags à associer au fichier */
  tags?: string[];
  /** Transformation à appliquer (peut être une chaîne ou un objet) */
  transformation?: Record<string, unknown> | string;
  /** Public ID personnalisé (nom du fichier) */
  publicId?: string;
}

/**
 * Résultat d'un upload Cloudinary
 */
export interface CloudinaryUploadResult {
  /** URL publique du fichier */
  secureUrl: string;
  /** Public ID du fichier dans Cloudinary */
  publicId: string;
  /** Format du fichier */
  format: string;
  /** Largeur de l'image (pour les images) */
  width?: number;
  /** Hauteur de l'image (pour les images) */
  height?: number;
  /** Taille du fichier en octets */
  bytes: number;
  /** Type de ressource */
  resourceType: string;
  /** Type MIME */
  type?: string;
  /** URL de l'image avec la transformation 'thumbnail' */
  thumbnailUrl?: string;
  /** Tags associés */
  tags?: string[];
  /** Date de création */
  createdAt: Date;
}

/**
 * Classe pour gérer les opérations Cloudinary
 */
export class CloudinaryService {
  /**
   * Upload un fichier vers Cloudinary
   * @param buffer - Buffer du fichier à uploader
   * @param fileName - Nom d'origine du fichier
   * @param options - Options d'upload
   * @returns Résultat de l'upload
   */
  static async uploadFile(
    buffer: Buffer,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    // Options par défaut
    const defaultOptions: UploadOptions = {
      resourceType: "auto",
      folder: "chaff",
      tags: ["chaff"],
    };

    // Fusion des options
    const mergedOptions = { ...defaultOptions, ...options };

    // Obtenir l'extension du fichier
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";

    // Générer un nom de fichier unique si publicId n'est pas fourni
    const uniquePublicId =
      mergedOptions.publicId ||
      `${mergedOptions.folder}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}`;

    try {
      // Convertir le buffer en base64 pour l'upload
      const base64Data = buffer.toString("base64");
      const dataURI = `data:${this.getMimeType(fileExt)};base64,${base64Data}`;

      // Upload du fichier
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: mergedOptions.resourceType,
        folder: mergedOptions.folder,
        tags: mergedOptions.tags,
        public_id: uniquePublicId,
        transformation: mergedOptions.transformation,
      });

      // Formater le résultat
      return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resourceType: result.resource_type,
        type: result.type,
        // Générer une URL pour la miniature si c'est une image
        thumbnailUrl:
          result.resource_type === "image"
            ? cloudinary.url(result.public_id, {
                width: 200,
                height: 200,
                crop: "fill",
                quality: "auto",
                fetch_format: "auto",
              })
            : undefined,
        tags: result.tags,
        createdAt: new Date(result.created_at),
      };
    } catch (error) {
      console.error("Erreur lors de l'upload vers Cloudinary :", error);
      throw new Error(
        `Échec de l'upload vers Cloudinary: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Supprime un fichier de Cloudinary
   * @param publicId - ID public du fichier à supprimer
   * @param resourceType - Type de ressource (image, raw, etc.)
   * @returns Résultat de la suppression
   */
  static async deleteFile(
    publicId: string,
    resourceType: UploadResourceType = "image"
  ): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result.result === "ok";
    } catch (error) {
      console.error("Erreur lors de la suppression de Cloudinary:", error);
      throw new Error(
        `Échec de la suppression de Cloudinary: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Obtient l'URL d'une image avec des transformations
   * @param publicId - ID public de l'image
   * @param options - Options de transformation
   * @returns URL de l'image transformée
   */
  static getImageUrl(publicId: string, options = {}): string {
    return cloudinary.url(publicId, options);
  }

  /**
   * Génère un MIME type basé sur l'extension du fichier
   * @param extension - Extension du fichier
   * @returns MIME type correspondant
   */
  private static getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
    };

    return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
  }

  /**
   * Détermine le type de ressource Cloudinary en fonction du MIME type
   * @param mimeType - Type MIME du fichier
   * @returns Type de ressource Cloudinary
   */
  static getResourceTypeFromMime(mimeType: string): UploadResourceType {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    return "raw";
  }

  /**
   * Extraire le publicId d'une URL Cloudinary
   * @param url - URL Cloudinary
   * @returns Public ID extrait
   */
  static extractPublicIdFromUrl(url: string): string | null {
    // Format typique: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/name.ext
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Ignorer la partie /cloud_name/image/upload/v1234567890/
      const parts = pathname.split("/");
      // Trouver l'index après "upload"
      const uploadIndex = parts.findIndex((part) => part === "upload");

      // S'assurer qu'on a trouvé "upload" et qu'il y a des éléments après
      if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) return null;

      // Ignorer la partie vXXXXXXX si présente
      const startIndex =
        parts[uploadIndex + 1].startsWith("v") &&
        /^v\d+$/.test(parts[uploadIndex + 1])
          ? uploadIndex + 2
          : uploadIndex + 1;

      // Joindre le reste pour former le public_id
      return parts.slice(startIndex).join("/");
    } catch (error) {
      console.error("Erreur lors de l'extraction du publicId:", error);
      return null;
    }
  }
}
