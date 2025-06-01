// src/app/components/MobileArticleList.tsx
"use client";

import React, { useState, useRef } from "react";
import {
  List,
  X,
  ExternalLink,
  Search,
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

interface MobileArticleListProps {
  articles: Article[];
  selectedSectorName: string;
  objetId: string;
  sectorId: string;
  onArticleClick: (articleId: string) => void;
  onArticleHover: (articleId: string | null) => void;
  hoveredArticleId: string | null;
}

const MobileArticleList: React.FC<MobileArticleListProps> = ({
  articles,
  selectedSectorName,
  onArticleClick,
  onArticleHover,
  hoveredArticleId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    triggerHapticFeedback("light");
  };

  const handleArticleSelect = (articleId: string) => {
    triggerHapticFeedback("medium");
    onArticleClick(articleId);
  };

  // Fonction pour filtrer et trier les articles
  const getFilteredArticles = () => {
    let filtered = [...articles];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(term) ||
          (article.description &&
            article.description.toLowerCase().includes(term))
      );
    }

    // Tri par titre
    filtered.sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      if (sortDirection === "asc") {
        return titleA > titleB ? 1 : -1;
      } else {
        return titleA < titleB ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredArticles = getFilteredArticles();

  const clearSearch = () => {
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Animations
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  const panelVariants = {
    hidden: { y: "100%" },
    visible: {
      y: 0,
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

  return (
    <div className="md:hidden">
      {/* Bouton flottant pour ouvrir la liste */}
      <motion.button
        onClick={togglePanel}
        className="fixed bottom-20 left-4 z-[1000] flex items-center gap-1 bg-primary text-primary-foreground rounded-full shadow-lg px-3 py-3"
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={18} /> : <List size={18} />}
        {!isOpen && (
          <span className="ml-1 text-sm font-medium">
            {articles.length} Articles
          </span>
        )}
      </motion.button>

      {/* Panel avec animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay animé */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={togglePanel}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40"
            />

            {/* Panneau animé */}
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed bottom-0 left-0 right-0 bg-background border-t border-[color:var(--border)] rounded-t-xl shadow-xl z-50 max-h-[80vh] flex flex-col"
            >
              {/* Indicateur de défilement (handle) */}
              <div className="w-10 h-1 bg-[color:var(--muted-foreground)]/30 rounded-full mx-auto my-3" />

              {/* En-tête du panneau */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-[color:var(--border)]">
                <div className="flex items-center">
                  <h3 className="font-medium text-[color:var(--foreground)]">
                    Articles de &quot;{selectedSectorName}&quot;
                  </h3>
                  <button
                    onClick={toggleSortDirection}
                    className="ml-2 p-1 rounded hover:bg-[color:var(--muted)]"
                    title={sortDirection === "asc" ? "Tri A-Z" : "Tri Z-A"}
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
                <button
                  onClick={togglePanel}
                  className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded-md"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Barre de recherche */}
              <div className="px-4 py-3 border-b border-[color:var(--border)]">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)]"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Rechercher un article..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2 pl-10 pr-8 border border-[color:var(--border)] rounded-md text-sm bg-transparent text-[color:var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Contenu du panneau avec défilement */}
              <div
                ref={listRef}
                className="overflow-y-auto overflow-x-hidden flex-1 pb-safe"
                style={{
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-10 px-6 text-[color:var(--muted-foreground)]">
                    {articles.length === 0
                      ? "Aucun article disponible pour ce secteur"
                      : "Aucun article ne correspond à votre recherche"}
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
                        className={`p-4 mb-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          hoveredArticleId === article.id
                            ? "bg-[color:var(--primary)]/10 border-[color:var(--primary)]/30"
                            : "bg-[color:var(--card)] border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-[color:var(--foreground)] mb-2 pr-5">
                            {article.title}
                          </h4>
                          <ExternalLink
                            size={14}
                            className="text-[color:var(--muted-foreground)] flex-shrink-0 mt-1"
                          />
                        </div>

                        {article.description && (
                          <p className="text-sm text-[color:var(--muted-foreground)] line-clamp-2">
                            {article.description}
                          </p>
                        )}
                      </motion.div>
                    ))}
                    <div className="h-8"></div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileArticleList;
