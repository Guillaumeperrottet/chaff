"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DropdownMenu from "@/app/components/ui/dropdownmenu";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Maximize2,
  Minimize2,
  ListFilter,
  X,
  ExternalLink,
  Search,
  ArrowUp,
  ArrowDown,
  XCircle,
} from "lucide-react";
import ImageWithArticles from "@/app/components/ImageWithArticles";
import AccessControl from "@/app/components/AccessControl";
import { motion, AnimatePresence } from "framer-motion";

// Types définis comme dans votre code original
type Sector = {
  id: string;
  name: string;
  image: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  objectId: string;
};

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
};

type SortDirection = "asc" | "desc";

interface SectorViewerProps {
  sectors: Sector[];
  objetId: string;
}

export default function SectorViewer({ sectors, objetId }: SectorViewerProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  const [selectedArticleId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Détection du mode mobile
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

  // Sélectionner le premier secteur au chargement si aucun n'est sélectionné
  useEffect(() => {
    if (sectors.length > 0 && !selectedSector) {
      setSelectedSector(sectors[0]);
      setSelectedIndex(0);
    }
  }, [sectors, selectedSector]);

  // Charger les articles lorsque le secteur sélectionné change
  useEffect(() => {
    if (selectedSector) {
      fetchArticles(selectedSector.id);
    }
  }, [selectedSector]);

  // Filtrer les articles en fonction du terme de recherche et du tri
  useEffect(() => {
    if (!articles.length) {
      setFilteredArticles([]);
      return;
    }

    // Filtrer les articles en fonction du terme de recherche
    let filtered = [...articles];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(lowerSearchTerm) ||
          (article.description &&
            article.description.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Trier les articles
    filtered.sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      if (sortDirection === "asc") {
        return titleA > titleB ? 1 : -1;
      } else {
        return titleA < titleB ? 1 : -1;
      }
    });

    setFilteredArticles(filtered);
  }, [articles, searchTerm, sortDirection]);

  // Mettre le focus sur l'input de recherche quand la sidebar s'ouvre
  useEffect(() => {
    if (sidebarOpen && searchInputRef.current && !isMobile) {
      // Petit délai pour laisser l'animation se terminer
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [sidebarOpen, isMobile]);

  //  bloquer le défilement lorsque la barre latérale est ouverte
  useEffect(() => {
    if (sidebarOpen && !isMobile) {
      // Sauvegarder la position actuelle de défilement
      const scrollY = window.scrollY;

      // Bloquer le défilement en fixant le body avec la position actuelle
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflowY = "scroll"; // Maintient la barre de défilement pour éviter le déplacement de la mise en page

      // Restaurer le défilement lorsque la barre latérale se ferme
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflowY = "";

        // Restaurer la position de défilement
        window.scrollTo(0, scrollY);
      };
    }
  }, [sidebarOpen, isMobile]);

  const fetchArticles = async (sectorId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sectors/${sectorId}/articles`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        console.error("Erreur lors du chargement des articles");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectorChange = (sector: Sector) => {
    const newIndex = sectors.findIndex((s) => s.id === sector.id);
    setSelectedSector(sector);
    setSelectedIndex(newIndex);
  };

  const navigateToPreviousSector = useCallback(() => {
    if (sectors.length <= 1) return;
    const newIndex = (selectedIndex - 1 + sectors.length) % sectors.length;
    setSelectedSector(sectors[newIndex]);
    setSelectedIndex(newIndex);
  }, [selectedIndex, sectors]);

  const navigateToNextSector = useCallback(() => {
    if (sectors.length <= 1) return;
    const newIndex = (selectedIndex + 1) % sectors.length;
    setSelectedSector(sectors[newIndex]);
    setSelectedIndex(newIndex);
  }, [selectedIndex, sectors]);

  const handleArticleClick = (articleId: string) => {
    if (selectedSector) {
      window.location.href = `/dashboard/objet/${objetId}/secteur/${selectedSector.id}/article/${articleId}`;
    }
  };

  const handleArticleHover = (articleId: string | null) => {
    setHoveredArticleId(articleId);
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);

    // En mode plein écran, nous voulons maximiser l'espace d'affichage
    if (!isFullscreen && viewerRef.current) {
      try {
        if (viewerRef.current.requestFullscreen) {
          viewerRef.current.requestFullscreen();
        }
      } catch {
        console.log("Fullscreen API not supported or enabled");
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [isFullscreen]);

  // Fonction pour basculer la barre latérale d'articles
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fonction pour basculer la direction du tri
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

    // Feedback haptique si disponible
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Fonction pour effacer le terme de recherche
  const clearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  // Gestion des touches clavier pour la navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        navigateToPreviousSector();
      } else if (event.key === "ArrowRight") {
        navigateToNextSector();
      } else if (event.key === "Escape") {
        // Si la barre latérale est ouverte, la fermer d'abord
        if (sidebarOpen) {
          setSidebarOpen(false);
        } else {
          setIsFullscreen(false);
        }
      } else if (event.key === "f" || event.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    navigateToNextSector,
    navigateToPreviousSector,
    isFullscreen,
    toggleFullscreen,
    sidebarOpen,
  ]);

  // Gestion de la sortie du mode plein écran via l'API Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Variables pour la navigation d'articles
  const articleListVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  // Animation pour la barre de recherche
  const searchBarVariants = {
    hidden: { height: 0, opacity: 0, overflow: "hidden" },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        height: {
          type: "spring",
          stiffness: 400,
          damping: 40,
        },
        opacity: {
          duration: 0.3,
          delay: 0.1,
        },
      },
    },
  };

  return (
    <div
      ref={viewerRef}
      className={`flex-1 flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 bg-transparent" : ""
      }`}
    >
      {/* Header avec contrôles - caché en plein écran */}
      {!isFullscreen && (
        <div className="p-2 md:p-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 bg-transparent">
          {/* Interface de sélection de secteur */}
          <div className="w-full sm:w-auto flex-1 flex items-center">
            <DropdownMenu
              items={sectors.map((s) => ({ id: s.id, label: s.name }))}
              selectedId={selectedSector?.id}
              onSelect={(id) => {
                const sector = sectors.find((s) => s.id === id);
                if (sector) handleSectorChange(sector);
              }}
              label={
                selectedSector ? selectedSector.name : "Sélectionner un secteur"
              }
            />

            {/* Bouton Articles pour desktop - en dehors du flux normal */}
            {selectedSector && !isMobile && (
              <Button
                onClick={toggleSidebar}
                variant="outline"
                className="ml-4 flex items-center gap-2"
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <X size={16} /> : <ListFilter size={16} />}
                Articles
              </Button>
            )}
          </div>

          {/* Bouton pour ajouter/modifier un article */}
          {selectedSector && (
            <div className="w-full sm:w-auto">
              <AccessControl
                entityType="sector"
                entityId={selectedSector.id}
                requiredLevel="write"
                fallback={
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto opacity-60"
                    onClick={() =>
                      toast.info(
                        "Vous n'avez pas les droits pour modifier ce secteur"
                      )
                    }
                  >
                    {isMobile
                      ? "Modifier/Créer un article"
                      : "Modifier ou créer un article"}
                  </Button>
                }
              >
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link
                    href={`/dashboard/objet/${objetId}/secteur/${selectedSector.id}/edit?addArticle=1`}
                  >
                    {isMobile
                      ? "Modifier/Créer un article"
                      : "Modifier ou créer un article"}
                  </Link>
                </Button>
              </AccessControl>
            </div>
          )}
        </div>
      )}

      {/* Conteneur principal avec l'image et la barre latérale */}
      <div className="flex-1 relative flex">
        {/* Container de l'image - s'ajuste automatiquement quand la sidebar est ouverte */}
        <div
          ref={mainContainerRef}
          className={`flex-1 flex items-center justify-center overflow-hidden transition-all duration-300 ${
            isFullscreen ? "bg-transparent" : "bg-transparent p-1"
          }`}
        >
          {selectedSector ? (
            <div className="relative w-full max-h-full flex items-center justify-center">
              {/* Boutons de navigation entre secteurs */}
              {sectors.length > 1 && (
                <>
                  <button
                    onClick={navigateToPreviousSector}
                    className="absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 p-1 md:p-2 bg-background bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 z-10"
                    aria-label="Secteur précédent"
                  >
                    <ChevronLeft size={isMobile ? 16 : 24} />
                  </button>
                  <button
                    onClick={navigateToNextSector}
                    className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 p-1 md:p-2 bg-background bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 z-10"
                    aria-label="Secteur suivant"
                  >
                    <ChevronRight size={isMobile ? 16 : 24} />
                  </button>
                </>
              )}

              {/* Indicateur de chargement */}
              {isLoading ? (
                <div className="flex items-center justify-center h-64 w-full">
                  <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-[#d9840d]"></div>
                </div>
              ) : (
                <div className="max-w-full">
                  <ImageWithArticles
                    imageSrc={selectedSector.image}
                    imageAlt={selectedSector.name}
                    originalWidth={selectedSector.imageWidth || 1200}
                    originalHeight={selectedSector.imageHeight || 900}
                    articles={articles}
                    onArticleClick={handleArticleClick}
                    onArticleHover={handleArticleHover}
                    hoveredArticleId={hoveredArticleId}
                    selectedArticleId={selectedArticleId}
                    className={`${
                      isFullscreen
                        ? "max-h-screen"
                        : "max-h-[calc(100vh-150px)]"
                    }`}
                  />
                </div>
              )}

              {/* Barre d'information en bas de l'image */}
              <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 bg-background bg-opacity-80 px-2 md:px-4 py-1 md:py-2 rounded-full shadow-md z-10 flex items-center gap-2 md:gap-4 text-xs md:text-sm">
                <div className="flex items-center gap-1 md:gap-2">
                  <Layers size={isMobile ? 12 : 16} />
                  <span className="truncate max-w-[150px] md:max-w-[250px]">
                    {selectedIndex + 1} / {sectors.length}:{" "}
                    {selectedSector.name}
                  </span>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-1 rounded hover:bg-gray-200"
                  title={
                    isFullscreen ? "Quitter le plein écran" : "Mode plein écran"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 size={isMobile ? 12 : 16} />
                  ) : (
                    <Maximize2 size={isMobile ? 12 : 16} />
                  )}
                </button>
              </div>

              {/* Liste des articles pour mobile uniquement - basée sur votre MobileArticleList existant */}
              {selectedSector && !isFullscreen && isMobile && (
                <div className="md:hidden">
                  {/* Bouton flottant pour ouvrir la liste */}
                  <button
                    onClick={toggleSidebar}
                    className="fixed bottom-20 left-4 z-[9] flex items-center gap-1 bg-primary text-primary-foreground rounded-full shadow-lg px-3 py-3"
                    style={{
                      position: "fixed",
                      bottom: "80px",
                      left: "16px",
                      zIndex: 9,
                      backgroundColor: "var(--primary)",
                      color: "white",
                      borderRadius: "9999px",
                      padding: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    }}
                  >
                    {sidebarOpen ? <X size={18} /> : <ListFilter size={18} />}
                    {!sidebarOpen && (
                      <span className="ml-1 text-sm font-medium">
                        {articles.length} Articles
                      </span>
                    )}
                  </button>

                  {/* Panel mobile pour articles - en bas de l'écran */}
                  <AnimatePresence>
                    {sidebarOpen && (
                      <>
                        {/* Overlay animé */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={toggleSidebar}
                          style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            zIndex: 9,
                          }}
                        />

                        {/* Panneau animé */}
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          exit={{ y: "100%" }}
                          transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                          }}
                          style={{
                            position: "fixed",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: "white",
                            borderTopLeftRadius: "16px",
                            borderTopRightRadius: "16px",
                            boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
                            zIndex: 995,
                            maxHeight: "80vh",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Indicateur de défilement (handle) */}
                          <div
                            style={{
                              width: "40px",
                              height: "4px",
                              backgroundColor: "#ccc",
                              borderRadius: "4px",
                              margin: "10px auto 5px",
                              opacity: 0.6,
                            }}
                          />

                          {/* En-tête du panneau avec barre de recherche */}
                          <div className="border-b border-gray-200">
                            <div className="flex justify-between items-center p-3">
                              <div className="flex items-center">
                                <h3 className="font-medium">
                                  Articles de &quot;{selectedSector.name}&quot;
                                </h3>
                                <button
                                  onClick={toggleSortDirection}
                                  className="ml-2 p-1 rounded hover:bg-gray-100"
                                  title={
                                    sortDirection === "asc"
                                      ? "Tri A-Z"
                                      : "Tri Z-A"
                                  }
                                >
                                  {sortDirection === "asc" ? (
                                    <ArrowUp
                                      size={16}
                                      className="text-gray-500"
                                    />
                                  ) : (
                                    <ArrowDown
                                      size={16}
                                      className="text-gray-500"
                                    />
                                  )}
                                </button>
                              </div>
                              <button
                                onClick={toggleSidebar}
                                className="p-2 rounded-full hover:bg-gray-100"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            {/* Barre de recherche */}
                            <div className="px-3 pb-3">
                              <div className="relative">
                                <Search
                                  size={16}
                                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                />
                                <input
                                  ref={searchInputRef}
                                  type="text"
                                  placeholder="Rechercher un article..."
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                  className="w-full py-2 pl-10 pr-8 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {searchTerm && (
                                  <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Liste d'articles filtrée */}
                          <div
                            style={{
                              overflowY: "auto",
                              maxHeight: "calc(80vh - 100px)",
                              WebkitOverflowScrolling: "touch",
                              paddingBottom:
                                "env(safe-area-inset-bottom, 16px)",
                            }}
                          >
                            {filteredArticles.length === 0 ? (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "40px 20px",
                                  color: "#666",
                                }}
                              >
                                {articles.length === 0
                                  ? "Aucun article disponible pour ce secteur"
                                  : "Aucun article ne correspond à votre recherche"}
                              </div>
                            ) : (
                              <div style={{ padding: "12px 16px" }}>
                                {filteredArticles.map((article) => (
                                  <div
                                    key={article.id}
                                    onClick={() =>
                                      handleArticleClick(article.id)
                                    }
                                    onMouseEnter={() =>
                                      handleArticleHover(article.id)
                                    }
                                    onMouseLeave={() =>
                                      handleArticleHover(null)
                                    }
                                    style={{
                                      padding: "16px",
                                      marginBottom: "12px",
                                      borderRadius: "12px",
                                      border: "1px solid #e0e0e0",
                                      backgroundColor:
                                        hoveredArticleId === article.id
                                          ? "rgba(217, 132, 13, 0.1)"
                                          : "white",
                                      cursor: "pointer",
                                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <h4
                                        style={{
                                          fontWeight: 500,
                                          marginBottom: "8px",
                                          fontSize: "16px",
                                        }}
                                      >
                                        {article.title}
                                      </h4>
                                      <ExternalLink
                                        size={14}
                                        style={{
                                          color: "var(--muted-foreground)",
                                          marginTop: "4px",
                                        }}
                                      />
                                    </div>

                                    {article.description && (
                                      <p
                                        style={{
                                          fontSize: "14px",
                                          color: "var(--muted-foreground)",
                                          lineHeight: 1.4,
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          margin: 0,
                                        }}
                                      >
                                        {article.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                                <div style={{ height: "20px" }}></div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 p-4">
              Sélectionnez un secteur pour afficher son image
            </div>
          )}
        </div>

        {/* Barre latérale d'articles pour desktop avec barre de recherche - position fixe à droite */}
        <AnimatePresence>
          {sidebarOpen && !isMobile && selectedSector && (
            <>
              {/* Overlay semi-transparent pour cliquer en dehors */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/30 z-20"
                onClick={toggleSidebar}
                style={{ top: 0, bottom: 0 }} // Assurez-vous qu'il couvre toute la page
              />

              {/* Panneau latéral */}
              <motion.div
                variants={articleListVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed right-0 h-full w-[300px] bg-white shadow-lg z-30 flex flex-col"
                style={{
                  top: 0, // Commencer depuis le haut de la page
                  height: "100vh", // Hauteur pleine page
                  borderLeft: "1px solid #eee",
                }}
              >
                {/* En-tête de la barre latérale avec options de tri */}
                <div
                  className="flex justify-between items-center p-3 border-b"
                  style={{ marginTop: "64px" }}
                >
                  <div className="flex items-center">
                    <h3 className="font-medium truncate max-w-[200px]">
                      Articles ({filteredArticles.length})
                    </h3>
                    <button
                      onClick={toggleSortDirection}
                      className="ml-2 p-1 rounded hover:bg-gray-100"
                      title={sortDirection === "asc" ? "Tri A-Z" : "Tri Z-A"}
                    >
                      {sortDirection === "asc" ? (
                        <ArrowUp size={16} className="text-gray-500" />
                      ) : (
                        <ArrowDown size={16} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Barre de recherche */}
                <motion.div
                  variants={searchBarVariants}
                  initial="visible"
                  animate="visible"
                  className="border-b border-gray-200 p-3"
                >
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Rechercher un article..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full py-2 pl-10 pr-8 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Liste des articles filtrée */}
                <div className="flex-1 overflow-y-auto p-3">
                  {filteredArticles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {articles.length === 0
                        ? "Aucun article disponible pour ce secteur"
                        : "Aucun article ne correspond à votre recherche"}
                    </div>
                  ) : (
                    filteredArticles.map((article) => (
                      <div
                        key={article.id}
                        className={`mb-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          hoveredArticleId === article.id ||
                          selectedArticleId === article.id
                            ? "bg-amber-50 border-amber-200"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleArticleClick(article.id)}
                        onMouseEnter={() => handleArticleHover(article.id)}
                        onMouseLeave={() => handleArticleHover(null)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium mb-1">{article.title}</h4>
                          <ExternalLink
                            size={14}
                            className="text-gray-400 mt-1"
                          />
                        </div>
                        {article.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {article.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
