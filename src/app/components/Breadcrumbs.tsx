"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Type des objets à afficher dans le breadcrumb
type BreadcrumbItem = {
  label: string;
  href: string;
  current: boolean;
};

// Cache pour stocker les noms des objets/secteurs/articles déjà récupérés
const nameCache: Record<string, string> = {};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour récupérer le nom d'un élément avec mise en cache
  const fetchEntityName = useCallback(
    async (type: string, id: string): Promise<string> => {
      // Clé de cache unique basée sur le type et l'ID
      const cacheKey = `${type}-${id}`;

      // Si le nom est déjà en cache, le retourner directement
      if (nameCache[cacheKey]) {
        return nameCache[cacheKey];
      }

      // Sinon, faire une requête API et mettre en cache le résultat
      try {
        const endpoint =
          type === "objet"
            ? `/api/breadcrumb/objet/${id}`
            : type === "secteur"
              ? `/api/breadcrumb/sector/${id}`
              : `/api/breadcrumb/article/${id}`;

        const response = await fetch(endpoint);

        if (response.ok) {
          const data = await response.json();
          // Extraire le nom en fonction du type d'entité
          const name =
            type === "objet"
              ? data.nom
              : type === "secteur"
                ? data.name
                : data.title;

          // Mettre en cache le nom récupéré
          if (name) {
            nameCache[cacheKey] = name;
            return name;
          }
        }

        // Fallback en cas d'erreur
        return type.charAt(0).toUpperCase() + type.slice(1);
      } catch (error) {
        console.error(`Erreur lors de la récupération du ${type}:`, error);
        return type.charAt(0).toUpperCase() + type.slice(1);
      }
    },
    []
  );

  // Génération des breadcrumbs quand le chemin change
  useEffect(() => {
    if (!pathname) return;

    const generateBreadcrumbs = async () => {
      setIsLoading(true);
      const linkPath = pathname.split("/");
      linkPath.shift(); // Supprime le premier élément vide

      const pathArray = linkPath.map((path, i) => {
        return {
          breadcrumb: path,
          href: "/" + linkPath.slice(0, i + 1).join("/"),
        };
      });

      // Tableau pour stocker les breadcrumbs avec les noms réels
      const breadcrumbsWithLabels: BreadcrumbItem[] = [];

      // Ajouter le Dashboard comme première entrée
      if (pathArray.length > 0 && pathArray[0].breadcrumb === "dashboard") {
        breadcrumbsWithLabels.push({
          label: "Dashboard",
          href: "/dashboard",
          current: pathname === "/dashboard",
        });
      }

      // Traiter chaque segment du chemin
      for (let i = 1; i < pathArray.length; i++) {
        const segment = pathArray[i];

        // Traitement par type de segment
        if (segment.breadcrumb === "objet" && i + 1 < pathArray.length) {
          const objetId = pathArray[i + 1].breadcrumb;

          if (objetId && objetId !== "new") {
            // Récupérer le nom de l'objet
            const objetName = await fetchEntityName("objet", objetId);
            breadcrumbsWithLabels.push({
              label: objetName,
              href: `/dashboard/objet/${objetId}/view`,
              current:
                i + 2 >= pathArray.length &&
                !["edit", "view", "secteur", "task"].includes(
                  pathArray[i + 2]?.breadcrumb
                ),
            });

            // Sauter l'ID d'objet
            i++;
          } else if (objetId === "new") {
            // Cas spécial pour la création d'un nouvel objet
            breadcrumbsWithLabels.push({
              label: "Nouvel objet",
              href: pathname,
              current: true,
            });
            i++;
          }
        } else if (
          segment.breadcrumb === "secteur" &&
          i + 1 < pathArray.length
        ) {
          const sectorId = pathArray[i + 1].breadcrumb;

          if (sectorId && sectorId !== "new") {
            // Récupérer le nom du secteur
            const sectorName = await fetchEntityName("secteur", sectorId);
            const objetId = pathArray[i - 1].breadcrumb;

            breadcrumbsWithLabels.push({
              label: sectorName,
              href: `/dashboard/objet/${objetId}/view`,
              current:
                i + 2 >= pathArray.length &&
                !["edit", "article"].includes(pathArray[i + 2]?.breadcrumb),
            });

            // Sauter l'ID du secteur
            i++;
          } else if (sectorId === "new") {
            // Cas spécial pour la création d'un nouveau secteur
            breadcrumbsWithLabels.push({
              label: "Nouveau secteur",
              href: pathname,
              current: true,
            });
            i++;
          }
        } else if (
          segment.breadcrumb === "article" &&
          i + 1 < pathArray.length
        ) {
          const articleId = pathArray[i + 1].breadcrumb;

          if (articleId && articleId !== "new") {
            // Récupérer le nom de l'article
            const articleName = await fetchEntityName("article", articleId);
            const sectorId = pathArray[i - 2].breadcrumb;
            const objetId = pathArray[i - 4].breadcrumb;

            breadcrumbsWithLabels.push({
              label: articleName,
              href: `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}`,
              current:
                i + 2 >= pathArray.length &&
                !["task"].includes(pathArray[i + 2]?.breadcrumb),
            });

            // Sauter l'ID de l'article
            i++;
          } else if (articleId === "new") {
            // Cas spécial pour la création d'un nouvel article
            breadcrumbsWithLabels.push({
              label: "Nouvel article",
              href: pathname,
              current: true,
            });
            i++;
          }
        } else if (segment.breadcrumb === "task" && i + 1 < pathArray.length) {
          const taskId = pathArray[i + 1].breadcrumb;

          if (taskId) {
            breadcrumbsWithLabels.push({
              label: "Tâche",
              href: pathname,
              current: true,
            });
            i++;
          }
        } else if (segment.breadcrumb === "view") {
          // Ignorer ce segment spécifique mais marquer le précédent comme courant
          if (breadcrumbsWithLabels.length > 0) {
            breadcrumbsWithLabels[breadcrumbsWithLabels.length - 1].current =
              true;
          }
          continue;
        } else if (segment.breadcrumb === "edit") {
          breadcrumbsWithLabels.push({
            label: "Modifier",
            href: pathname,
            current: true,
          });
        } else {
          // Pour les autres segments, utiliser le nom du segment tel quel avec première lettre en majuscule
          const isLast = i === pathArray.length - 1;

          // Traitement spécial pour certains segments communs
          let label = segment.breadcrumb;
          if (segment.breadcrumb === "profile") label = "Profil";
          else if (segment.breadcrumb === "settings") label = "Paramètres";
          else
            label =
              segment.breadcrumb.charAt(0).toUpperCase() +
              segment.breadcrumb.slice(1);

          breadcrumbsWithLabels.push({
            label: label,
            href: segment.href,
            current: isLast,
          });
        }
      }

      // Mettre à jour l'état avec les breadcrumbs générés
      setBreadcrumbs(breadcrumbsWithLabels);
      setIsLoading(false);
    };

    generateBreadcrumbs();
  }, [pathname, fetchEntityName]);

  // Affichage d'un squelette de chargement
  if (isLoading) {
    return (
      <div className="animate-pulse h-4 w-40 bg-[color:var(--muted)] rounded"></div>
    );
  }

  // Ne pas afficher si pas de chemin significatif
  if (breadcrumbs.length <= 1 || !pathname.includes("/dashboard")) {
    return null;
  }

  return (
    <nav className="flex" aria-label="Fil d'Ariane">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={`${breadcrumb.href}-${index}`} className="flex items-center">
            {index > 0 && (
              <ChevronRight
                className="mx-1 h-4 w-4 text-[color:var(--muted-foreground)]"
                aria-hidden="true"
              />
            )}
            <div
              className={index === breadcrumbs.length - 1 ? "font-medium" : ""}
            >
              {breadcrumb.current ? (
                <span className="text-[color:var(--muted-foreground)]">
                  {breadcrumb.label}
                </span>
              ) : (
                <Link
                  href={breadcrumb.href}
                  className="text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 transition-colors"
                >
                  {breadcrumb.label}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
