// src/app/components/LoadingSystem.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// Types
type LoaderState = {
  isVisible: boolean;
  message: string;
  source: string; // Identifie la source du loader ("navigation", "manual", etc.)
  priority: number; // Plus le nombre est élevé, plus la priorité est haute
  timestamp: number; // Pour gérer les concurrences
};

interface LoadingSystemContextType {
  // Méthodes principales
  showLoader: (options: {
    message?: string;
    source?: string;
    priority?: number;
    skipDelay?: boolean;
  }) => string; // Retourne un ID de loader
  hideLoader: (id: string) => void;
  hideAllLoaders: () => void;

  // État
  isLoading: boolean;
  currentMessage: string;
}

// Créer le contexte
const LoadingSystemContext = createContext<
  LoadingSystemContextType | undefined
>(undefined);

// Hook pour utiliser le système de chargement
export const useLoadingSystem = () => {
  const context = useContext(LoadingSystemContext);
  if (!context) {
    throw new Error(
      "useLoadingSystem doit être utilisé à l'intérieur d'un LoadingSystemProvider"
    );
  }
  return context;
};

// Configuration
const DEFAULT_PRIORITY = 5;
const PAGE_NAVIGATION_PRIORITY = 10;
const MANUAL_PRIORITY = 15;

// Provider principal
export function LoadingSystemProvider({ children }: { children: ReactNode }) {
  // État des loaders actifs (permet plusieurs loaders simultanés avec priorités)
  const [loaders, setLoaders] = useState<Map<string, LoaderState>>(new Map());

  // État dérivé: le loader visible est celui avec la plus haute priorité
  const [activeLoader, setActiveLoader] = useState<LoaderState | null>(null);

  // Variables pour la gestion des animations
  const [opacity, setOpacity] = useState(0);
  const fadeInTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pour suivre les changements de page
  const pathname = usePathname();
  const router = useRouter();

  // Effet pour déterminer quel loader afficher en fonction des priorités
  useEffect(() => {
    if (loaders.size === 0) {
      setActiveLoader(null);
      return;
    }

    // Trouver le loader avec la priorité la plus élevée
    let highestPriority = -1;
    let highestLoader: LoaderState | null = null;

    loaders.forEach((loader) => {
      if (loader.priority > highestPriority) {
        highestPriority = loader.priority;
        highestLoader = loader;
      } else if (
        loader.priority === highestPriority &&
        loader.timestamp > (highestLoader?.timestamp || 0)
      ) {
        // À priorité égale, prendre le plus récent
        highestLoader = loader;
      }
    });

    setActiveLoader(highestLoader);
  }, [loaders]);

  // Effet pour gérer l'opacité du loader actif
  useEffect(() => {
    if (activeLoader) {
      // Nettoyer les timers existants
      if (fadeInTimerRef.current) clearTimeout(fadeInTimerRef.current);

      if (activeLoader.source === "pageNavigation") {
        // Animation progressive pour la navigation de page
        setOpacity(0.3);
        fadeInTimerRef.current = setTimeout(() => {
          setOpacity(0.7);
          fadeInTimerRef.current = setTimeout(() => {
            setOpacity(1);
          }, 150);
        }, 50);
      } else {
        // Affichage immédiat pour les autres types
        setOpacity(1);
      }

      // Désactiver les interactions
      document.body.style.pointerEvents = "none";
    } else {
      // Réinitialiser l'opacité et réactiver les interactions
      setOpacity(0);
      document.body.style.pointerEvents = "";
    }
  }, [activeLoader]);

  // Réinitialiser les loaders lors des changements de chemin
  useEffect(() => {
    hideAllLoaders();

    // Délai de sécurité maximum pour tout loader
    const maxLoaderTimeout = setTimeout(() => {
      hideAllLoaders();
    }, 8000);

    return () => clearTimeout(maxLoaderTimeout);
  }, [pathname]);

  // Intercepter les événements de navigation Next.js
  useEffect(() => {
    const handleStart = () => {
      showLoader({
        message: "Chargement...",
        source: "pageNavigation",
        priority: PAGE_NAVIGATION_PRIORITY,
      });
    };

    const handleComplete = () => {
      // Masquer tous les loaders de navigation de page
      setLoaders((prev) => {
        const newLoaders = new Map(prev);
        newLoaders.forEach((loader, id) => {
          if (loader.source === "pageNavigation") {
            newLoaders.delete(id);
          }
        });
        return newLoaders;
      });
    };

    // Ajouter les écouteurs
    window.addEventListener("beforeunload", handleStart);
    document.addEventListener("navigatestart", handleStart);
    document.addEventListener("navigatecomplete", handleComplete);

    // Nettoyer
    return () => {
      window.removeEventListener("beforeunload", handleStart);
      document.removeEventListener("navigatestart", handleStart);
      document.removeEventListener("navigatecomplete", handleComplete);
    };
  }, [router]);

  // Méthode pour afficher un loader
  const showLoader = ({
    message = "Chargement...",
    source = "manual",
    priority = DEFAULT_PRIORITY,
    skipDelay = false,
  }) => {
    // Générer un ID unique pour ce loader
    const id = `loader-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Ajouter le nouveau loader à la map
    setLoaders((prev) => {
      const newLoaders = new Map(prev);
      newLoaders.set(id, {
        isVisible: true,
        message,
        source,
        priority: skipDelay ? priority + 5 : priority, // Les loaders sans délai ont une priorité légèrement plus élevée
        timestamp: Date.now(),
      });
      return newLoaders;
    });

    return id;
  };

  // Méthode pour masquer un loader spécifique
  const hideLoader = (id: string) => {
    setLoaders((prev) => {
      const newLoaders = new Map(prev);
      newLoaders.delete(id);
      return newLoaders;
    });
  };

  // Méthode pour masquer tous les loaders
  const hideAllLoaders = () => {
    setLoaders(new Map());
  };

  return (
    <LoadingSystemContext.Provider
      value={{
        showLoader,
        hideLoader,
        hideAllLoaders,
        isLoading: activeLoader !== null,
        currentMessage: activeLoader?.message || "Chargement...",
      }}
    >
      {children}

      <AnimatePresence>
        {activeLoader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: opacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9999] flex items-center justify-center"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)] mb-4"></div>
              <p className="text-lg font-medium text-[color:var(--foreground)]">
                {activeLoader.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingSystemContext.Provider>
  );
}

// HOC pour créer des composants qui utilisent le système de chargement
export function withLoading<P extends object>(
  Component: React.ComponentType<React.PropsWithChildren<P>>
) {
  return function WithLoadingComponent(props: React.PropsWithChildren<P>) {
    const { isLoading, currentMessage } = useLoadingSystem();

    return (
      <>
        <Component {...(props as P)} />
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)] mb-4"></div>
              <p className="text-lg font-medium text-[color:var(--foreground)]">
                {currentMessage}
              </p>
            </div>
          </div>
        )}
      </>
    );
  };
}

// Utilitaire pour la navigation avec loader intégré
export function useRouterWithLoading() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoadingSystem();

  const navigateWithLoading = (
    url: string,
    options: {
      message?: string;
      skipDelay?: boolean;
      onComplete?: () => void;
    } = {}
  ) => {
    // Créer un loader avec haute priorité
    const loaderId = showLoader({
      message: options.message || "Navigation...",
      source: "manualNavigation",
      priority: MANUAL_PRIORITY,
      skipDelay: options.skipDelay,
    });

    // Naviguer
    router.push(url);

    // Configurer un timeout pour masquer le loader (Next.js n'a pas d'événement de fin de navigation fiable)
    setTimeout(() => {
      hideLoader(loaderId);
      if (options.onComplete) options.onComplete();
    }, 500);
  };

  return {
    ...router,
    navigateWithLoading,
  };
}
