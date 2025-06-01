"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  List,
  X,
  ExternalLink,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  XCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
};

interface ArticleListProps {
  articles: Article[];
  selectedSectorName: string;
  objetId: string;
  sectorId: string;
  onArticleClick: (articleId: string) => void;
  onArticleHover: (articleId: string | null) => void;
  hoveredArticleId: string | null;
  isMobile?: boolean;
}

// Options disponibles pour le tri
type SortOption = {
  id: string;
  label: string;
  compareFn: (a: Article, b: Article) => number;
};

const sortOptions: SortOption[] = [
  {
    id: "title-asc",
    label: "Titre (A-Z)",
    compareFn: (a, b) =>
      a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1,
  },
  {
    id: "title-desc",
    label: "Titre (Z-A)",
    compareFn: (a, b) =>
      a.title.toLowerCase() < b.title.toLowerCase() ? 1 : -1,
  },
];

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  selectedSectorName,
  onArticleClick,
  onArticleHover,
  hoveredArticleId,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(articles);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fonction pour appliquer les filtres et le tri
  // Utiliser useCallback pour la mémoriser et éviter les recréations
  const applyFiltersAndSort = useCallback(() => {
    // Appliquer le filtre de recherche
    const filtered = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.description &&
          article.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Appliquer le tri en fonction de la direction
    const sortOption = sortOptions.find((option) =>
      sortDirection === "asc"
        ? option.id === "title-asc"
        : option.id === "title-desc"
    );

    if (sortOption) {
      filtered.sort(sortOption.compareFn);
    }

    setFilteredArticles(filtered);
  }, [articles, searchTerm, sortDirection]);

  // Mettre à jour les articles filtrés quand les articles source changent
  useEffect(() => {
    applyFiltersAndSort();
  }, [articles, searchTerm, sortDirection, applyFiltersAndSort]);

  // Focus sur le champ de recherche quand les filtres sont affichés
  useEffect(() => {
    if (showFilters && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showFilters]);

  // Feedback haptique pour les interactions
  const triggerHapticFeedback = (intensity = "light") => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      switch (intensity) {
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(15);
          break;
        case "strong":
          navigator.vibrate([15, 30, 15]);
          break;
      }
    }
  };

  const togglePanel = () => {
    triggerHapticFeedback();
    setIsOpen(!isOpen);
  };

  const toggleFilters = () => {
    triggerHapticFeedback();
    setShowFilters(!showFilters);
  };

  // Fonction pour alterner la direction de tri
  const toggleSortDirection = () => {
    setSortDirection((prevDirection) =>
      prevDirection === "asc" ? "desc" : "asc"
    );
    triggerHapticFeedback("light");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortDirection("asc");
    triggerHapticFeedback("medium");
  };

  const handleArticleSelect = (articleId: string) => {
    triggerHapticFeedback("medium");
    onArticleClick(articleId);
  };

  const getFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    return count;
  };

  // Animations
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  // Différentes animations selon mobile ou desktop
  const panelVariants = isMobile
    ? {
        hidden: { y: "100%" },
        visible: {
          y: 0,
          transition: {
            type: "spring",
            damping: 30,
            stiffness: 300,
          },
        },
      }
    : {
        hidden: { x: "-100%" },
        visible: {
          x: 0,
          transition: {
            type: "spring",
            damping: 30,
            stiffness: 300,
          },
        },
      };

  const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  const filterBarVariants = {
    hidden: { height: 0, opacity: 0 },
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
    <div className={isMobile ? "md:hidden" : "hidden md:inline-block"}>
      {/* Bouton pour ouvrir la liste */}
      <motion.button
        onClick={togglePanel}
        className={`${isMobile ? "fixed bottom-20 left-4" : "relative ml-2"} z-[50] flex items-center gap-1 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg shadow-md px-3 py-2`}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X size={18} />
        ) : (
          <>
            {isMobile ? <List size={18} /> : <PanelLeft size={18} />}
            <span className="ml-1 text-sm font-medium">Articles</span>
          </>
        )}
      </motion.button>

      {/* Panel avec animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay animé - uniquement sur mobile */}
            {isMobile && (
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                onClick={togglePanel}
                className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40"
              />
            )}

            {/* Panneau animé - différent selon desktop ou mobile */}
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={`fixed z-50 bg-[color:var(--card)] border-[color:var(--border)] shadow-lg ${
                isMobile
                  ? "inset-x-0 bottom-0 rounded-t-xl border-t mobile-panel"
                  : "top-0 left-0 bottom-0 w-80 border-r"
              }`}
              style={{
                maxHeight: isMobile ? "80vh" : "100vh",
              }}
            >
              {/* Indicateur de défilement (handle) - uniquement sur mobile */}
              {isMobile && <div className="mobile-panel-handle" />}

              {/* En-tête du panneau */}
              <div className="flex justify-between items-center p-4 border-b border-[color:var(--border)]">
                <div className="flex items-center">
                  <h3 className="text-[color:var(--foreground)] font-medium">
                    Articles de &quot;{selectedSectorName}&quot;
                  </h3>
                  {/* Bouton de tri */}
                  <button
                    onClick={toggleSortDirection}
                    className="ml-2 p-1 rounded hover:bg-[color:var(--muted)] transition-colors"
                    title={
                      sortDirection === "asc"
                        ? "Tri croissant"
                        : "Tri décroissant"
                    }
                  >
                    {sortDirection === "asc" ? (
                      <ArrowUp
                        size={16}
                        className="text-[color:var(--muted-foreground)]"
                      />
                    ) : (
                      <ArrowDown
                        size={16}
                        className="text-[color:var(--muted-foreground)]"
                      />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={toggleFilters}
                    whileTap={{ scale: 0.9 }}
                    className={`relative p-2 rounded-md transition-colors ${
                      showFilters
                        ? "bg-[color:var(--primary)]/20 text-[color:var(--primary)]"
                        : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                    }`}
                    aria-label="Filtres"
                  >
                    <Filter size={18} />
                    {getFilterCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {getFilterCount()}
                      </span>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={togglePanel}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md transition-colors"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </div>

              {/* Barre de filtres - apparaît/disparaît en fonction de showFilters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    variants={filterBarVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="border-b border-[color:var(--border)] overflow-hidden bg-[color:var(--card)]"
                  >
                    <div className="p-4">
                      {/* Recherche */}
                      <div className="relative w-full">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)]"
                        />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full py-2 pl-10 pr-8 border border-[color:var(--border)] rounded-md text-sm bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] placeholder:text-[color:var(--muted-foreground)]"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>

                      {/* Bouton pour réinitialiser les filtres */}
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={clearFilters}
                          className="text-xs font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] py-1.5 px-3 rounded hover:bg-[color:var(--muted)] transition-colors"
                        >
                          Réinitialiser les filtres
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Contenu du panneau avec défilement */}
              <div
                ref={listRef}
                className="overflow-y-auto mobile-scroll-container bg-[color:var(--card)]"
                style={{
                  // Ajustement de la hauteur maximale pour s'adapter au panneau de filtres
                  height: isMobile
                    ? `calc(80vh - ${showFilters ? "130px" : "60px"})`
                    : `calc(100vh - ${showFilters ? "130px" : "60px"})`,
                  paddingBottom: isMobile
                    ? "env(safe-area-inset-bottom, 16px)"
                    : 0,
                }}
              >
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-10 px-4 text-[color:var(--muted-foreground)]">
                    {articles.length === 0
                      ? "Aucun article disponible pour ce secteur"
                      : "Aucun article ne correspond à vos critères"}
                  </div>
                ) : (
                  <div className="p-4">
                    {filteredArticles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        custom={index}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => handleArticleSelect(article.id)}
                        onMouseEnter={() => onArticleHover(article.id)}
                        onMouseLeave={() => onArticleHover(null)}
                        className={`p-4 mb-3 rounded-lg border shadow-sm transition-all duration-200 article-list-item ${
                          hoveredArticleId === article.id
                            ? "bg-[color:var(--primary)]/10 border-[color:var(--primary)]/30 dark:bg-[color:var(--primary)]/20"
                            : "bg-[color:var(--background)] border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                        } cursor-pointer`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-[color:var(--foreground)] mb-2 text-base">
                            {article.title}
                          </h4>
                          <ExternalLink
                            size={14}
                            className="text-[color:var(--muted-foreground)] mt-1 flex-shrink-0 ml-2"
                          />
                        </div>

                        {article.description && (
                          <p className="text-sm text-[color:var(--muted-foreground)] line-clamp-2">
                            {article.description}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation sur desktop */}
              {!isMobile && filteredArticles.length > 0 && (
                <div className="border-t border-[color:var(--border)] p-3 flex justify-between items-center bg-[color:var(--card)]">
                  <button
                    className="p-2 rounded-full bg-[color:var(--muted)] hover:bg-[color:var(--accent)] text-[color:var(--foreground)] transition-colors"
                    aria-label="Articles précédents"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    Page 1 de 1
                  </span>
                  <button
                    className="p-2 rounded-full bg-[color:var(--muted)] hover:bg-[color:var(--accent)] text-[color:var(--foreground)] transition-colors"
                    aria-label="Articles suivants"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArticleList;
