"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Move,
  X,
  Edit,
  Trash,
  ArrowLeft,
  Check,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null; // Stocké en pourcentage
  positionY: number | null; // Stocké en pourcentage
  width: number | null; // Stocké en pourcentage
  height: number | null; // Stocké en pourcentage
};

// Coordonnées en pixels pour utilisation interne
type AbsolutePosition = {
  x: number; // Position X en pixels
  y: number; // Position Y en pixels
  width: number; // Largeur en pixels
  height: number; // Hauteur en pixels
};

type ResizeType =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | null;

type ImageInfo = {
  displayWidth: number; // Largeur d'affichage effective en pixels
  displayHeight: number; // Hauteur d'affichage effective en pixels
  originalWidth: number; // Largeur originale de l'image
  originalHeight: number; // Hauteur originale de l'image
  scaleX: number; // Facteur d'échelle en X
  scaleY: number; // Facteur d'échelle en Y
  aspectRatio: number; // Rapport hauteur/largeur original
  offsetX: number; // Décalage X pour centrer l'image
  offsetY: number; // Décalage Y pour centrer l'image
};

// Modes d'édition disponibles
enum EditorMode {
  VIEW = "view",
  ADD = "add",
  MOVE = "move",
  RESIZE = "resize",
}

export default function ArticleEditor({
  sectorId,
  initialArticles = [],
  imageWidth = null,
  imageHeight = null,
  imageSrc,
  imageAlt,
}: {
  sectorId: string;
  initialArticles?: Article[];
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageSrc: string;
  imageAlt: string;
}) {
  // États principaux
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null
  );
  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.VIEW);
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<ResizeType>(null);

  // États d'interaction
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<AbsolutePosition>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [newArticleStart, setNewArticleStart] = useState({ x: 0, y: 0 });
  const [newArticleSize, setNewArticleSize] = useState({ width: 0, height: 0 });

  // États d'UI
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [lastSavedPosition, setLastSavedPosition] = useState<{
    [key: string]: AbsolutePosition;
  }>({});

  // États modaux
  const [showModal, setShowModal] = useState(false);
  const [modalArticle, setModalArticle] = useState<{
    id?: string;
    title: string;
    description: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
  }>({
    title: "",
    description: "",
    positionX: 0,
    positionY: 0,
    width: 10,
    height: 10,
  });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // État de l'image
  const [imageInfo, setImageInfo] = useState<ImageInfo>({
    displayWidth: 0,
    displayHeight: 0,
    originalWidth: imageWidth || 1200, // Valeur par défaut si null
    originalHeight: imageHeight || 900, // Valeur par défaut si null
    scaleX: 1,
    scaleY: 1,
    aspectRatio: (imageWidth || 1200) / (imageHeight || 900),
    offsetX: 0,
    offsetY: 0,
  });

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Fonction pour fournir un retour haptique sur mobile
  const triggerHapticFeedback = (
    intensity: "light" | "medium" | "strong" = "light"
  ) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      switch (intensity) {
        case "light":
          navigator.vibrate(5);
          break;
        case "medium":
          navigator.vibrate(10);
          break;
        case "strong":
          navigator.vibrate([10, 30, 10]);
          break;
      }
    }
  };

  // Fonction pour mettre à jour les dimensions de l'image
  const updateImageDimensions = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const image = imageRef.current;

    // S'assurer que l'image est chargée
    if (!image.complete) return;

    // Dimensions réelles du conteneur
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Dimensions réelles de l'image affichée
    const imageRect = image.getBoundingClientRect();
    const displayWidth = imageRect.width;
    const displayHeight = imageRect.height;

    // Dimensions originales de l'image
    const originalWidth = imageWidth || image.naturalWidth;
    const originalHeight = imageHeight || image.naturalHeight;
    const originalAspectRatio = originalWidth / originalHeight;

    // Déterminer comment l'image est contrainte (par largeur ou hauteur)
    let effectiveWidth, effectiveHeight;

    if (displayWidth / displayHeight > originalAspectRatio) {
      // Contrainte par la hauteur
      effectiveHeight = displayHeight;
      effectiveWidth = effectiveHeight * originalAspectRatio;
    } else {
      // Contrainte par la largeur
      effectiveWidth = displayWidth;
      effectiveHeight = effectiveWidth / originalAspectRatio;
    }

    // Calcul des facteurs d'échelle
    const scaleX = originalWidth / effectiveWidth;
    const scaleY = originalHeight / effectiveHeight;

    // Calcul des offsets pour centrer l'image
    const offsetX = (containerWidth - effectiveWidth) / 2;
    const offsetY = (containerHeight - effectiveHeight) / 2;

    setImageInfo({
      displayWidth: effectiveWidth,
      displayHeight: effectiveHeight,
      originalWidth,
      originalHeight,
      scaleX,
      scaleY,
      aspectRatio: originalAspectRatio,
      offsetX,
      offsetY,
    });
  }, [imageWidth, imageHeight]);

  // Configuration du ResizeObserver
  useEffect(() => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        updateImageDimensions();
      });
    });

    if (containerRef.current) {
      resizeObserverRef.current.observe(containerRef.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [updateImageDimensions]);

  // Gestion du chargement de l'image
  useEffect(() => {
    const handleImageLoad = () => {
      // Mise à jour immédiate
      updateImageDimensions();

      // Mises à jour différées pour garantir un rendu complet
      setTimeout(updateImageDimensions, 50);
      setTimeout(updateImageDimensions, 200);
      setTimeout(updateImageDimensions, 500);
    };

    // Store current image ref to use in cleanup
    const currentImageRef = imageRef.current;

    if (currentImageRef) {
      currentImageRef.addEventListener("load", handleImageLoad);

      if (currentImageRef.complete) {
        handleImageLoad(); // Utiliser la même logique avec délais
      }
    }

    // Enregistrer le gestionnaire pour les redimensionnements de fenêtre
    const handleResize = () => {
      updateImageDimensions();
      // Ajouter un délai pour s'assurer que le navigateur a terminé le redimensionnement
      setTimeout(updateImageDimensions, 100);
    };
    window.addEventListener("resize", handleResize);

    // Force une mise à jour après un court délai au montage du composant
    const initialTimer = setTimeout(updateImageDimensions, 100);

    return () => {
      if (currentImageRef) {
        currentImageRef.removeEventListener("load", handleImageLoad);
      }
      window.removeEventListener("resize", handleResize);
      clearTimeout(initialTimer);
    };
  }, [updateImageDimensions]);

  // Mettre à jour quand imageSrc change
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      updateImageDimensions();
    }
  }, [imageSrc, updateImageDimensions]);

  // Charger les articles du serveur quand initialArticles est vide
  const fetchArticles = useCallback(async () => {
    try {
      const response = await fetch(`/api/sectors/${sectorId}/articles`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        toast.error("Erreur lors du chargement des articles");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des articles");
    }
  }, [sectorId]);

  useEffect(() => {
    if (initialArticles.length === 0) {
      fetchArticles();
    }
  }, [initialArticles, fetchArticles]);

  // Réinitialiser le mode d'édition quand l'article sélectionné change
  useEffect(() => {
    if (!selectedArticleId) {
      setEditorMode(EditorMode.VIEW);
    }
  }, [selectedArticleId]);

  // Fonction pour gérer les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showModal) return; // Ne pas réagir aux raccourcis si un modal est ouvert

      switch (e.key) {
        case "Escape":
          setSelectedArticleId(null);
          setEditorMode(EditorMode.VIEW);
          break;
        case "Delete":
        case "Backspace":
          if (selectedArticleId) {
            const article = articles.find((a) => a.id === selectedArticleId);
            if (article) handleDeleteArticle(article);
          }
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            // Annuler (Ctrl+Z ou Cmd+Z)
            undoLastChange();
          }
          break;
        case "0":
          if (e.ctrlKey || e.metaKey) {
            // Réinitialiser le zoom (Ctrl+0 ou Cmd+0)
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
          }
          break;
        case "+":
        case "=":
          if (e.ctrlKey || e.metaKey) {
            // Zoom avant (Ctrl++ ou Cmd++)
            setZoomLevel((prev) => Math.min(prev + 0.1, 3));
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            // Zoom arrière (Ctrl+- ou Cmd+-)
            setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [articles, selectedArticleId, showModal]);

  // Convertir les coordonnées pourcentage en pixels absolus (avec décalages)
  const percentToPixels = useCallback(
    (article: Article): AbsolutePosition => {
      if (!imageInfo.displayWidth || !imageInfo.displayHeight) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      const xPercent = article.positionX || 0;
      const yPercent = article.positionY || 0;
      const widthPercent = article.width || 20;
      const heightPercent = article.height || 20;

      // Conversion en tenant compte du décalage pour centrer l'image
      return {
        x: (xPercent / 100) * imageInfo.displayWidth + imageInfo.offsetX,
        y: (yPercent / 100) * imageInfo.displayHeight + imageInfo.offsetY,
        width: (widthPercent / 100) * imageInfo.displayWidth,
        height: (heightPercent / 100) * imageInfo.displayHeight,
      };
    },
    [imageInfo]
  );

  // Convertir les coordonnées de pixels en pourcentage (avec compensation de décalage)
  const pixelsToPercent = useCallback(
    (position: AbsolutePosition): Article => {
      if (!imageInfo.displayWidth || !imageInfo.displayHeight) {
        return {
          id: "",
          title: "",
          description: "",
          positionX: 0,
          positionY: 0,
          width: 20,
          height: 20,
        };
      }

      // Convertir en pourcentages en compensant le décalage
      return {
        id: "",
        title: "",
        description: "",
        positionX:
          ((position.x - imageInfo.offsetX) / imageInfo.displayWidth) * 100,
        positionY:
          ((position.y - imageInfo.offsetY) / imageInfo.displayHeight) * 100,
        width: (position.width / imageInfo.displayWidth) * 100,
        height: (position.height / imageInfo.displayHeight) * 100,
      };
    },
    [imageInfo]
  );

  // Obtenir les coordonnées de la souris relatives à l'image
  const getMouseCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
      if (!containerRef.current) {
        return { x: 0, y: 0 };
      }

      const containerRect = containerRef.current.getBoundingClientRect();

      // Obtenir les coordonnées client selon le type d'événement
      let clientX, clientY;

      if ("clientX" in e) {
        // MouseEvent
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        // TouchEvent
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      }

      // Position relative au conteneur, ajustée pour le zoom et le pan
      const x = (clientX - containerRect.left - panOffset.x) / zoomLevel;
      const y = (clientY - containerRect.top - panOffset.y) / zoomLevel;

      return { x, y };
    },
    [panOffset, zoomLevel]
  );

  // Vérifier si les coordonnées sont dans les limites de l'image
  const isInImageBounds = useCallback(
    (x: number, y: number): boolean => {
      if (!imageInfo.displayWidth || !imageInfo.displayHeight) return false;

      // Vérifier si le point (x, y) est à l'intérieur de l'image (en tenant compte du décalage)
      const imageLeft = imageInfo.offsetX;
      const imageRight = imageInfo.offsetX + imageInfo.displayWidth;
      const imageTop = imageInfo.offsetY;
      const imageBottom = imageInfo.offsetY + imageInfo.displayHeight;

      return (
        x >= imageLeft && x <= imageRight && y >= imageTop && y <= imageBottom
      );
    },
    [imageInfo]
  );

  // Sauvegarde des changements d'article sur le serveur
  const saveArticle = async (article: Article) => {
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: article.id,
          title: article.title,
          description: article.description,
          positionX: article.positionX,
          positionY: article.positionY,
          width: article.width,
          height: article.height,
          sectorId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde de l'article");
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving article:", error);
      throw error;
    }
  };

  // Fonction pour annuler le dernier changement
  const undoLastChange = () => {
    if (selectedArticleId && lastSavedPosition[selectedArticleId]) {
      const article = articles.find((a) => a.id === selectedArticleId);
      if (article) {
        // Convertir la position sauvegardée en pourcentage
        const positionInPercent = pixelsToPercent(
          lastSavedPosition[selectedArticleId]
        );

        // Mettre à jour l'article
        setArticles(
          articles.map((a) =>
            a.id === selectedArticleId
              ? {
                  ...a,
                  positionX: positionInPercent.positionX,
                  positionY: positionInPercent.positionY,
                  width: positionInPercent.width,
                  height: positionInPercent.height,
                }
              : a
          )
        );

        // Supprimer la position sauvegardée
        const newSavedPositions = { ...lastSavedPosition };
        delete newSavedPositions[selectedArticleId];
        setLastSavedPosition(newSavedPositions);

        toast.info("Modification annulée");
      }
    }
  };

  // Gestionnaires d'événements pour la sélection d'article
  const handleContainerClick = () => {
    if (editorMode === EditorMode.ADD && !isDraggingNew) {
      return;
    }
    setSelectedArticleId(null);
  };

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Si on est en mode ajout et qu'on n'est pas déjà en train de dessiner
    if (
      editorMode === EditorMode.ADD &&
      !isDraggingNew &&
      containerRef.current
    ) {
      const { x, y } = getMouseCoordinates(e);

      // Vérifier si le clic est dans les limites de l'image
      if (!isInImageBounds(x, y)) return;

      setNewArticleStart({ x, y });
      setNewArticleSize({ width: 0, height: 0 });
      setIsDraggingNew(true);
      e.preventDefault(); // Empêcher la sélection de texte
    }
    // Mode panoramique (déplacement de la vue)
    else if (editorMode === EditorMode.VIEW && e.button === 1) {
      // Bouton du milieu
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    }
  };

  // Gérer le début du panoramique sur touch
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (editorMode === EditorMode.VIEW && e.touches.length === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y,
      });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingNew) {
      const { x, y } = getMouseCoordinates(e);
      const width = Math.abs(x - newArticleStart.x);
      const height = Math.abs(y - newArticleStart.y);
      setNewArticleSize({ width, height });
    } else if (isDragging || isResizing) {
      handleMouseMove(e);
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  // Gérer le déplacement pendant le panoramique sur touch
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isPanning && e.touches.length === 2) {
      e.preventDefault();
      setPanOffset({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y,
      });
    }
  };

  const handleContainerMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingNew) {
      finalizeNewArticle(e);
    } else if (isDragging || isResizing) {
      stopDraggingOrResizing();
    } else if (isPanning) {
      setIsPanning(false);
    }
  };

  // Gérer la fin du panoramique sur touch
  const handleTouchEnd = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Finaliser la création d'un nouvel article
  const finalizeNewArticle = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getMouseCoordinates(e);
    const minX = Math.min(newArticleStart.x, x);
    const minY = Math.min(newArticleStart.y, y);
    const width = Math.abs(x - newArticleStart.x);
    const height = Math.abs(y - newArticleStart.y);

    // Ne créer l'article que s'il a une taille minimale
    if (width < 10 || height < 10) {
      setIsDraggingNew(false);
      setEditorMode(EditorMode.VIEW);
      return;
    }

    // Créer l'article en pixels puis convertir en pourcentages
    const articleInPixels: AbsolutePosition = {
      x: minX + width / 2, // Centre X
      y: minY + height / 2, // Centre Y
      width: Math.max(width, 20), // Minimum 20px de large
      height: Math.max(height, 20), // Minimum 20px de haut
    };

    // Convertir en pourcentages (en compensant pour le décalage)
    const articleInPercent = pixelsToPercent(articleInPixels);

    setModalArticle({
      title: "",
      description: "",
      positionX: articleInPercent.positionX || 0,
      positionY: articleInPercent.positionY || 0,
      width: articleInPercent.width || 10,
      height: articleInPercent.height || 10,
    });

    setIsDraggingNew(false);
    setEditorMode(EditorMode.VIEW);
    triggerHapticFeedback("medium");
    setShowModal(true);
  };

  // Démarrer le déplacement d'un article
  const startDragging = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();

    // Sauvegarder la position actuelle pour l'annulation
    if (!lastSavedPosition[article.id]) {
      setLastSavedPosition({
        ...lastSavedPosition,
        [article.id]: percentToPixels(article),
      });
    }

    setSelectedArticleId(article.id);
    setIsDragging(true);
    setEditorMode(EditorMode.MOVE);
    triggerHapticFeedback("light");

    if (containerRef.current) {
      // Convertir les coordonnées en pourcentage en pixels
      const articleInPixels = percentToPixels(article);

      // Calculer l'offset du drag
      const { x, y } = getMouseCoordinates(e);
      setDragOffset({
        x: x - articleInPixels.x,
        y: y - articleInPixels.y,
      });
    }
  };

  // Démarrer le redimensionnement d'un article
  const startResizing = (
    e: React.MouseEvent,
    article: Article,
    type: ResizeType
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // Sauvegarder la position actuelle pour l'annulation
    if (!lastSavedPosition[article.id]) {
      setLastSavedPosition({
        ...lastSavedPosition,
        [article.id]: percentToPixels(article),
      });
    }

    setSelectedArticleId(article.id);
    setIsResizing(true);
    setResizeType(type);
    setEditorMode(EditorMode.RESIZE);
    triggerHapticFeedback("light");

    // Convertir les coordonnées en pourcentage en pixels pour le début du resize
    setResizeStart(percentToPixels(article));
  };

  // Gérer le déplacement de la souris pendant le drag ou le resize
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedArticleId && containerRef.current) {
      const { x, y } = getMouseCoordinates(e);
      const article = articles.find((a) => a.id === selectedArticleId);

      if (!article) return;

      // Position absolue du nouvel emplacement (en pixels)
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      // Vérifier que l'article ne sort pas des limites de l'image
      const articleSize = percentToPixels(article);
      const halfWidth = articleSize.width / 2;
      const halfHeight = articleSize.height / 2;

      // Limites de l'image (en tenant compte du décalage)
      const minX = imageInfo.offsetX + halfWidth;
      const maxX = imageInfo.offsetX + imageInfo.displayWidth - halfWidth;
      const minY = imageInfo.offsetY + halfHeight;
      const maxY = imageInfo.offsetY + imageInfo.displayHeight - halfHeight;

      // Position contrainte
      const constrainedX = Math.max(minX, Math.min(newX, maxX));
      const constrainedY = Math.max(minY, Math.min(newY, maxY));

      // Convertir en pourcentages, en tenant compte du décalage
      const percentPosition = pixelsToPercent({
        x: constrainedX,
        y: constrainedY,
        width: articleSize.width,
        height: articleSize.height,
      });

      // Mettre à jour l'article
      setArticles(
        articles.map((a) =>
          a.id === selectedArticleId
            ? {
                ...a,
                positionX: percentPosition.positionX,
                positionY: percentPosition.positionY,
              }
            : a
        )
      );
    } else if (
      isResizing &&
      selectedArticleId &&
      resizeType &&
      containerRef.current
    ) {
      e.preventDefault();
      const { x: mouseX, y: mouseY } = getMouseCoordinates(e);
      const article = articles.find((a) => a.id === selectedArticleId);

      if (!article) return;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.x;
      let newY = resizeStart.y;

      const minPixelSize = 20; // Minimum size in pixels

      // Calculate edges based on center and dimensions from resizeStart
      const startLeft = resizeStart.x - resizeStart.width / 2;
      const startRight = resizeStart.x + resizeStart.width / 2;
      const startTop = resizeStart.y - resizeStart.height / 2;
      const startBottom = resizeStart.y + resizeStart.height / 2;

      let finalLeft = startLeft;
      let finalRight = startRight;
      let finalTop = startTop;
      let finalBottom = startBottom;

      // Adjust edges based on resize type and mouse position, ensuring minimum size
      if (resizeType.includes("left")) {
        finalLeft = Math.min(mouseX, startRight - minPixelSize);
      }
      if (resizeType.includes("right")) {
        finalRight = Math.max(mouseX, startLeft + minPixelSize);
      }
      if (resizeType.includes("top")) {
        finalTop = Math.min(mouseY, startBottom - minPixelSize);
      }
      if (resizeType.includes("bottom")) {
        finalBottom = Math.max(mouseY, startTop + minPixelSize);
      }

      // Calculate new dimensions and center position from final edges
      newWidth = finalRight - finalLeft;
      newHeight = finalBottom - finalTop;
      newX = finalLeft + newWidth / 2;
      newY = finalTop + newHeight / 2;

      // Contraintes pour que l'article reste dans l'image
      const halfNewWidth = newWidth / 2;
      const halfNewHeight = newHeight / 2;

      // Limites de l'image (en tenant compte du décalage)
      const minX = imageInfo.offsetX + halfNewWidth;
      const maxX = imageInfo.offsetX + imageInfo.displayWidth - halfNewWidth;
      const minY = imageInfo.offsetY + halfNewHeight;
      const maxY = imageInfo.offsetY + imageInfo.displayHeight - halfNewHeight;

      // Ajuster la position si nécessaire pour éviter de sortir des limites
      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      // Convertir en pourcentages, en tenant compte du décalage
      const percentPosition = pixelsToPercent({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });

      // Maximum 50% de l'image (en pourcentage)
      const maxWidthPercent = Math.min(percentPosition.width!, 50);
      const maxHeightPercent = Math.min(percentPosition.height!, 50);

      // Mettre à jour l'article
      setArticles(
        articles.map((a) =>
          a.id === selectedArticleId
            ? {
                ...a,
                positionX: percentPosition.positionX,
                positionY: percentPosition.positionY,
                width: maxWidthPercent,
                height: maxHeightPercent,
              }
            : a
        )
      );
    }
  };

  // Arrêter le déplacement ou le redimensionnement
  const stopDraggingOrResizing = async () => {
    if ((isDragging || isResizing) && selectedArticleId) {
      const article = articles.find((a) => a.id === selectedArticleId);
      if (article) {
        try {
          await saveArticle(article);
          toast.success(
            isDragging ? "Position mise à jour" : "Dimensions mises à jour"
          );
          triggerHapticFeedback("medium");
        } catch (error) {
          console.error("Error updating article:", error);
          toast.error("Erreur lors de la mise à jour de l'article");
        }
      }
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeType(null);
    setEditorMode(EditorMode.VIEW);
  };

  // Gérer la sauvegarde du modal d'édition
  const handleSaveModal = async () => {
    if (!modalArticle.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    try {
      const articleData = { ...modalArticle, sectorId };
      const savedArticle = await saveArticle(articleData as Article);
      if (modalArticle.id) {
        setArticles(
          articles.map((a) => (a.id === modalArticle.id ? savedArticle : a))
        );
      } else {
        setArticles([...articles, savedArticle]);
      }
      setShowModal(false);
      toast.success("Article sauvegardé avec succès");
      triggerHapticFeedback("strong");
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Erreur lors de la sauvegarde de l'article");
    }
  };

  // Gérer l'édition d'un article existant
  const handleEditArticle = (article: Article) => {
    setModalArticle({
      id: article.id,
      title: article.title,
      description: article.description || "",
      positionX: article.positionX || 0,
      positionY: article.positionY || 0,
      width: article.width || 20,
      height: article.height || 20,
    });
    setShowModal(true);
    triggerHapticFeedback("light");
  };

  // Supprimer un article
  const handleDeleteArticle = async (article: Article) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) return;

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: "DELETE",
      });

      if (!response.ok)
        throw new Error("Erreur lors de la suppression de l'article");

      setArticles(articles.filter((a) => a.id !== article.id));
      setSelectedArticleId(null);
      toast.success("Article supprimé avec succès");
      triggerHapticFeedback("strong");
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Erreur lors de la suppression de l'article");
    }
  };

  // Sélectionner un article
  const handleArticleClick = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();

    if (selectedArticleId === article.id) {
      // Si l'article est déjà sélectionné, ouvrir le modal d'édition
      handleEditArticle(article);
    } else {
      // Sinon, sélectionner l'article
      setSelectedArticleId(article.id);
      triggerHapticFeedback("light");
    }
  };

  // Afficher les poignées de redimensionnement pour un article sélectionné
  const renderResizeHandles = (article: Article) => {
    if (selectedArticleId !== article.id) return null;

    const handleStyle =
      "absolute w-3 h-3 bg-blue-500 border border-white rounded-full z-10";
    const edgeStyle = "absolute bg-transparent z-10";

    return (
      <>
        <div
          className={`${edgeStyle} top-0 left-0 right-0 h-3 cursor-ns-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "top");
          }}
        />
        <div
          className={`${edgeStyle} bottom-0 left-0 right-0 h-3 cursor-ns-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "bottom");
          }}
        />
        <div
          className={`${edgeStyle} left-0 top-3 bottom-3 w-3 cursor-ew-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "left");
          }}
        />
        <div
          className={`${edgeStyle} right-0 top-3 bottom-3 w-3 cursor-ew-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "right");
          }}
        />
        <div
          className={`${handleStyle} top-0 left-0 -mt-1.5 -ml-1.5 cursor-nwse-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "topLeft");
          }}
        />
        <div
          className={`${handleStyle} top-0 right-0 -mt-1.5 -mr-1.5 cursor-nesw-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "topRight");
          }}
        />
        <div
          className={`${handleStyle} bottom-0 left-0 -mb-1.5 -ml-1.5 cursor-nesw-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "bottomLeft");
          }}
        />
        <div
          className={`${handleStyle} bottom-0 right-0 -mb-1.5 -mr-1.5 cursor-nwse-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "bottomRight");
          }}
        />
      </>
    );
  };

  // Calculer le style pour afficher un article
  const calculateArticleStyle = useCallback(
    (article: Article) => {
      if (
        !article.positionX ||
        !article.positionY ||
        !imageInfo.displayWidth ||
        !imageInfo.displayHeight
      ) {
        return {};
      }

      // Convertir les pourcentages en pixels en tenant compte du décalage
      const xPos =
        (article.positionX / 100) * imageInfo.displayWidth + imageInfo.offsetX;
      const yPos =
        (article.positionY / 100) * imageInfo.displayHeight + imageInfo.offsetY;
      const width = ((article.width || 20) / 100) * imageInfo.displayWidth;
      const height = ((article.height || 20) / 100) * imageInfo.displayHeight;

      return {
        left: `${xPos}px`,
        top: `${yPos}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: "translate(-50%, -50%)",
      };
    },
    [imageInfo]
  );

  return (
    <div className="relative flex flex-col h-full">
      {/* Barre d'outils fixe */}
      <div className="sticky top-0 z-20 px-4 py-2 md:py-3 bg-background/95 backdrop-blur-sm border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            aria-label="Retour"
            className="text-muted-foreground"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-medium">Édition des articles</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="text-muted-foreground"
            aria-label="Aide"
          >
            <Info size={18} />
          </Button>
        </div>
      </div>

      {/* Aide contextuelle */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 text-blue-800 px-4 py-3 text-sm border-b border-blue-200"
          >
            <h3 className="font-medium mb-1">Guide d&apos;utilisation</h3>
            <ul className="space-y-1 list-disc pl-5">
              <li>Cliquez sur + pour ajouter un nouvel article</li>
              <li>Sélectionnez un article pour le modifier</li>
              <li>Utilisez les poignées pour redimensionner</li>
              <li>Double-cliquez sur un article pour éditer ses infos</li>
              <li>Sur mobile, touchez un article puis utilisez les boutons</li>
              <li>Utilisez le zoom pour plus de précision</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interface d'édition principale */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Panneau d'outils flottant */}
        <AnimatePresence>
          {showTools && (
            <motion.div
              initial={
                isMobile
                  ? { x: "-100%", opacity: 0 }
                  : { y: "-100%", opacity: 0 }
              }
              animate={isMobile ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
              exit={
                isMobile
                  ? { x: "-100%", opacity: 0 }
                  : { y: "-100%", opacity: 0 }
              }
              className={`${isMobile ? "fixed bottom-16 left-4 z-30 flex-col" : "absolute left-4 top-4 z-20"} flex bg-white rounded-lg shadow-lg p-1 border gap-1`}
            >
              <Button
                size="sm"
                variant={editorMode === EditorMode.ADD ? "default" : "outline"}
                onClick={() => {
                  setEditorMode(EditorMode.ADD);
                  setSelectedArticleId(null);
                  triggerHapticFeedback("light");
                }}
                className="flex gap-1 items-center"
                aria-label="Ajouter un article"
              >
                <Plus size={isMobile ? 18 : 16} />
                <span className="hidden md:inline">Ajouter</span>
              </Button>

              {selectedArticleId && (
                <>
                  <Button
                    size="sm"
                    variant={
                      editorMode === EditorMode.MOVE ? "default" : "outline"
                    }
                    onClick={() => {
                      setEditorMode(EditorMode.MOVE);
                      triggerHapticFeedback("light");
                    }}
                    className="flex gap-1 items-center"
                    aria-label="Déplacer l'article"
                  >
                    <Move size={isMobile ? 18 : 16} />
                    <span className="hidden md:inline">Déplacer</span>
                  </Button>

                  <Button
                    size="sm"
                    variant={
                      editorMode === EditorMode.RESIZE ? "default" : "outline"
                    }
                    onClick={() => {
                      setEditorMode(EditorMode.RESIZE);
                      triggerHapticFeedback("light");
                    }}
                    className="flex gap-1 items-center"
                    aria-label="Redimensionner l'article"
                  >
                    <Square size={isMobile ? 18 : 16} />
                    <span className="hidden md:inline">Redimensionner</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const article = articles.find(
                        (a) => a.id === selectedArticleId
                      );
                      if (article) handleEditArticle(article);
                    }}
                    className="flex gap-1 items-center"
                    aria-label="Éditer l'article"
                  >
                    <Edit size={isMobile ? 18 : 16} />
                    <span className="hidden md:inline">Éditer</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 flex gap-1 items-center"
                    onClick={() => {
                      const article = articles.find(
                        (a) => a.id === selectedArticleId
                      );
                      if (article) handleDeleteArticle(article);
                    }}
                    aria-label="Supprimer l'article"
                  >
                    <Trash size={isMobile ? 18 : 16} />
                    <span className="hidden md:inline">Supprimer</span>
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contrôles de zoom flottants */}
        <div className="absolute right-4 bottom-24 z-20 flex flex-col bg-white rounded-lg shadow-lg p-1 border gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoomLevel((prev) => Math.min(prev + 0.1, 3))}
            className="flex items-center justify-center"
            aria-label="Zoom avant"
          >
            <ZoomIn size={16} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoomLevel(1)}
            className="flex items-center justify-center text-xs"
            aria-label="Réinitialiser le zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5))}
            className="flex items-center justify-center"
            aria-label="Zoom arrière"
          >
            <ZoomOut size={16} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="flex items-center justify-center"
            aria-label="Ajuster"
          >
            <Maximize2 size={16} />
          </Button>
        </div>

        {/* Bouton pour afficher/masquer la barre d'outils sur mobile */}
        {isMobile && (
          <Button
            className="fixed bottom-4 right-4 z-30 rounded-full h-12 w-12 shadow-lg flex items-center justify-center"
            onClick={() => {
              setShowTools(!showTools);
              triggerHapticFeedback("light");
            }}
            aria-label={
              showTools ? "Masquer les outils" : "Afficher les outils"
            }
          >
            {showTools ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </Button>
        )}

        {/* Toasts pour indiquer le mode actuel */}
        {editorMode !== EditorMode.VIEW && (
          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-4 z-20 bg-black/70 text-white py-2 px-4 rounded-full text-sm">
            {editorMode === EditorMode.ADD &&
              "Mode ajout : dessinez pour ajouter un article"}
            {editorMode === EditorMode.MOVE &&
              "Mode déplacement : glissez pour déplacer l'article"}
            {editorMode === EditorMode.RESIZE &&
              "Mode redimensionnement : utilisez les poignées ou glissez les bords"}
          </div>
        )}

        {/* Zone de travail principale avec zoom */}
        <div
          ref={zoomContainerRef}
          className={`w-full h-full relative overflow-auto ${
            editorMode === EditorMode.ADD
              ? "cursor-crosshair"
              : isPanning
                ? "cursor-grabbing"
                : "cursor-default"
          }`}
        >
          {/* Conteneur pour le zoom et le pan */}
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out",
              margin: "2rem auto",
              width: "fit-content",
              height: "fit-content",
              position: "relative",
              top: panOffset.y,
              left: panOffset.x,
            }}
          >
            {/* Conteneur de l'image et des articles */}
            <div
              ref={containerRef}
              className="relative overflow-visible bg-[#f0f0f0]"
              onClick={handleContainerClick}
              onMouseDown={handleContainerMouseDown}
              onMouseMove={handleContainerMouseMove}
              onMouseUp={handleContainerMouseUp}
              onMouseLeave={handleContainerMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Image */}
              <Image
                ref={imageRef}
                src={imageSrc}
                alt={imageAlt}
                className="block max-w-full h-auto"
                style={{ objectFit: "contain" }}
                width={imageWidth || 1200}
                height={imageHeight || 900}
                priority
                unoptimized={!imageSrc.startsWith("http")}
              />

              {/* Articles */}
              {articles.map((article) => {
                if (article.positionX == null || article.positionY == null)
                  return null;

                const articleStyle = calculateArticleStyle(article);
                const isSelected = selectedArticleId === article.id;
                const isHovered = hoveredArticleId === article.id;

                return (
                  <div
                    key={article.id}
                    className={`absolute ${
                      isSelected
                        ? "border-2 border-blue-500"
                        : isHovered
                          ? "border-2 border-blue-300"
                          : "border border-white"
                    } rounded-md shadow-md overflow-hidden pointer-events-auto transition-all duration-150`}
                    style={{
                      ...articleStyle,
                      zIndex: isSelected ? 10 : 5,
                      backgroundColor: isSelected
                        ? "rgba(59, 130, 246, 0.3)" // Bleu plus visible quand sélectionné
                        : isHovered
                          ? "rgba(59, 130, 246, 0.2)" // Bleu plus clair quand survolé
                          : "rgba(0, 0, 0, 0.15)", // Gris très transparent par défaut
                      cursor:
                        editorMode === EditorMode.MOVE ? "move" : "pointer",
                    }}
                    onClick={(e) => handleArticleClick(e, article)}
                    onMouseDown={(e) => {
                      if (editorMode === EditorMode.MOVE) {
                        startDragging(e, article);
                      }
                    }}
                    onMouseEnter={() => setHoveredArticleId(article.id)}
                    onMouseLeave={() => setHoveredArticleId(null)}
                  >
                    {/* Affiche le titre pour les petits articles lors du survol ou de la sélection */}
                    {(isSelected || isHovered) && (
                      <div
                        className="absolute top-0 left-0 right-0 bg-blue-500/80 text-white text-xs p-1 text-center truncate"
                        style={{ zIndex: 11 }}
                      >
                        {article.title}
                      </div>
                    )}

                    {/* Affiche les poignées de redimensionnement quand approprié */}
                    {isSelected &&
                      (editorMode === EditorMode.RESIZE ||
                        editorMode === EditorMode.VIEW) &&
                      renderResizeHandles(article)}

                    {/* Option de confirmation pour les actions */}
                    {isSelected &&
                      editorMode === EditorMode.MOVE &&
                      isDragging && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1"
                          title="Confirmer le déplacement"
                        >
                          <Check size={16} />
                        </motion.div>
                      )}
                  </div>
                );
              })}

              {/* Rectangle de sélection pour nouvel article */}
              {isDraggingNew && editorMode === EditorMode.ADD && (
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0.8 }}
                  className="absolute border-2 border-blue-500 bg-blue-100 rounded-md z-20"
                  style={{
                    left: `${Math.min(
                      newArticleStart.x,
                      newArticleStart.x + newArticleSize.width
                    )}px`,
                    top: `${Math.min(
                      newArticleStart.y,
                      newArticleStart.y + newArticleSize.height
                    )}px`,
                    width: `${Math.abs(newArticleSize.width)}px`,
                    height: `${Math.abs(newArticleSize.height)}px`,
                    transform: "none", // Pas de transformation ici car on utilise des coordonnées absolues
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour éditer/créer un article */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-background rounded-lg shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium">
                  {modalArticle.id ? "Modifier l'article" : "Nouvel article"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="rounded-full w-8 h-8 p-0"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={modalArticle.title}
                    onChange={(e) =>
                      setModalArticle({
                        ...modalArticle,
                        title: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre de l'article"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    value={modalArticle.description}
                    onChange={(e) =>
                      setModalArticle({
                        ...modalArticle,
                        description: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Description de l'article (optionnelle)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Largeur (%)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={modalArticle.width}
                      onChange={(e) =>
                        setModalArticle({
                          ...modalArticle,
                          width: parseFloat(e.target.value),
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Hauteur (%)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={modalArticle.height}
                      onChange={(e) =>
                        setModalArticle({
                          ...modalArticle,
                          height: parseFloat(e.target.value),
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>

                <Button onClick={handleSaveModal}>Enregistrer</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode d'aide complet (overlay) */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  Guide d&apos;édition des articles
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(false)}
                  className="rounded-full h-8 w-8 p-0"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-lg mb-2">
                    Navigation et vue
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <ZoomIn
                        className="text-blue-500 mt-0.5 flex-shrink-0"
                        size={18}
                      />
                      <span>
                        <strong>Zoom</strong> - Utilisez les boutons de zoom ou
                        Ctrl+Molette pour agrandir l&apos;image
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Maximize2
                        className="text-blue-500 mt-0.5 flex-shrink-0"
                        size={18}
                      />
                      <span>
                        <strong>Réinitialiser</strong> - Rétablit le zoom et le
                        cadrage par défaut
                      </span>
                    </li>
                    {!isMobile && (
                      <li className="flex items-start gap-2">
                        <Move
                          className="text-blue-500 mt-0.5 flex-shrink-0"
                          size={18}
                        />
                        <span>
                          <strong>Déplacement de la vue</strong> - Clic central
                          et glisser pour déplacer la vue
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-lg mb-2">
                    Édition d&apos;articles
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Plus
                        className="text-blue-500 mt-0.5 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <strong>Ajouter un article</strong> - Cliquez sur le
                        bouton puis dessinez un rectangle sur l&apos;image
                        <div className="text-muted-foreground mt-1">
                          L&apos;outil vous demandera ensuite de saisir un titre
                          et une description
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Square
                        className="text-blue-500 mt-0.5 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <strong>Redimensionner</strong> - Sélectionnez un
                        article puis utilisez ce mode pour modifier sa taille
                        <div className="text-muted-foreground mt-1">
                          Vous pouvez tirer sur les poignées aux coins et sur
                          les bords
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Move
                        className="text-blue-500 mt-0.5 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <strong>Déplacer</strong> - Positionnez précisément un
                        article sur l&apos;image
                        <div className="text-muted-foreground mt-1">
                          Les modifications sont enregistrées automatiquement
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Edit
                        className="text-blue-500 mt-0.5 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <strong>Éditer</strong> - Modifiez le titre et la
                        description d&apos;un article
                        <div className="text-muted-foreground mt-1">
                          Vous pouvez aussi double-cliquer sur un article pour
                          l&apos;éditer
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash
                        className="text-red-500 mt-0.5 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <strong>Supprimer</strong> - Enlève définitivement un
                        article
                        <div className="text-muted-foreground mt-1">
                          Une confirmation vous sera demandée
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-lg mb-2">
                    Raccourcis clavier
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Annuler</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                        Ctrl+Z
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Supprimer</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                        Delete
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Zoom +</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                        Ctrl++
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Zoom -</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                        Ctrl+-
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Zoom 100%</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                        Ctrl+0
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Annuler l&apos;action</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                        Escape
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-1">
                    Conseils pour mobile
                  </h4>
                  <p className="text-sm text-blue-600">
                    Sur mobile, utilisez le zoom pour plus de précision et les
                    boutons d&apos;outils pour changer de mode. Appuyez une fois
                    sur un article pour le sélectionner, puis utilisez les
                    boutons qui apparaissent pour le modifier.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="default" onClick={() => setShowHelp(false)}>
                  J&apos;ai compris
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
