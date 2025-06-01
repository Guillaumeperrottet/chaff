import { prisma } from "./prisma";

export class StorageService {
  /**
   * Calcule l'usage total du stockage pour une organisation
   */
  static async calculateOrganizationStorageUsage(
    organizationId: string
  ): Promise<number> {
    try {
      // Calculer la taille totale des documents
      const documentsSize = await prisma.document.aggregate({
        where: {
          task: {
            article: {
              sector: {
                object: {
                  organizationId,
                },
              },
            },
          },
        },
        _sum: {
          fileSize: true,
        },
      });

      // Calculer la taille des images de secteurs (si applicable)
      const sectorsWithImages = await prisma.sector.findMany({
        where: {
          object: {
            organizationId,
          },
          image: {
            not: null,
          },
        },
        select: {
          image: true,
        },
      });

      // Estimation approximative des images (vous pourriez vouloir stocker la taille réelle)
      const estimatedImageSize = sectorsWithImages.length * 2 * 1024 * 1024; // 2MB par image

      // Calculer la taille des avatars utilisateurs (si stockés localement)
      const usersWithImages = await prisma.user.findMany({
        where: {
          organizationId,
          image: {
            not: null,
          },
        },
        select: {
          image: true,
        },
      });

      const estimatedAvatarSize = usersWithImages.length * 0.5 * 1024 * 1024; // 0.5MB par avatar

      const totalBytes =
        (documentsSize._sum.fileSize || 0) +
        estimatedImageSize +
        estimatedAvatarSize;

      return totalBytes;
    } catch (error) {
      console.error("Erreur lors du calcul de l'usage du stockage:", error);
      return 0;
    }
  }

  /**
   * Met à jour l'usage du stockage pour une organisation
   */
  static async updateStorageUsage(organizationId: string): Promise<void> {
    try {
      const totalUsedBytes =
        await this.calculateOrganizationStorageUsage(organizationId);

      await prisma.storageUsage.upsert({
        where: { organizationId },
        update: {
          totalUsedBytes: BigInt(totalUsedBytes),
          lastCalculatedAt: new Date(),
        },
        create: {
          organizationId,
          totalUsedBytes: BigInt(totalUsedBytes),
          lastCalculatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de l'usage du stockage:",
        error
      );
    }
  }

  /**
   * Vérifie si l'organisation peut télécharger un fichier de la taille donnée
   */
  static async canUploadFile(
    organizationId: string,
    fileSizeBytes: number
  ): Promise<{
    allowed: boolean;
    currentUsageBytes: number;
    limitBytes: number | null;
    unlimited: boolean;
  }> {
    try {
      // Récupérer l'abonnement et le plan
      const subscription = await prisma.subscription.findUnique({
        where: { organizationId },
        include: { plan: true },
      });

      // Récupérer l'usage actuel
      const storageUsage = await prisma.storageUsage.findUnique({
        where: { organizationId },
      });

      const currentUsageBytes = storageUsage
        ? Number(storageUsage.totalUsedBytes)
        : 0;

      // Déterminer la limite
      let limitBytes: number | null = null;
      let unlimited = false;

      if (subscription?.plan) {
        if (subscription.plan.maxStorage === null) {
          unlimited = true;
        } else {
          limitBytes = subscription.plan.maxStorage * 1024 * 1024; // Convertir MB en bytes
        }
      } else {
        // Plan gratuit par défaut : 1GB
        limitBytes = 1024 * 1024 * 1024;
      }

      const allowed =
        unlimited ||
        (limitBytes !== null &&
          currentUsageBytes + fileSizeBytes <= limitBytes);

      return {
        allowed,
        currentUsageBytes,
        limitBytes,
        unlimited,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la vérification des limites de stockage:",
        error
      );
      return {
        allowed: true, // En cas d'erreur, on autorise par défaut
        currentUsageBytes: 0,
        limitBytes: null,
        unlimited: false,
      };
    }
  }

  /**
   * Formate la taille en unités lisibles
   */
  static formatSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Recalcule l'usage du stockage pour toutes les organisations
   * (à utiliser dans un job CRON)
   */
  static async recalculateAllStorageUsage(): Promise<void> {
    try {
      const organizations = await prisma.organization.findMany({
        select: { id: true },
      });

      for (const org of organizations) {
        await this.updateStorageUsage(org.id);
      }

      console.log(
        `Usage du stockage recalculé pour ${organizations.length} organisations`
      );
    } catch (error) {
      console.error(
        "Erreur lors du recalcul global de l'usage du stockage:",
        error
      );
    }
  }
}
