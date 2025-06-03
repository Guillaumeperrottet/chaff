"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  Home,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Badge } from "@/app/components/ui/badge";
import { useSession } from "@/hooks/useSession";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// Interface pour les éléments du breadcrumb
interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

// Interface pour le wrapper conditionnel
interface ConditionalNavbarProps {
  children: React.ReactNode;
}

// Interface pour le mandat (utilisé pour les breadcrumbs)
interface MandateInfo {
  id: string;
  name: string;
}

// Cache pour stocker les informations des mandats afin d'éviter les appels répétés
const mandatesCache = new Map<string, MandateInfo>();

// Fonction pour récupérer les informations d'un mandat depuis son ID
const fetchMandateInfo = async (
  mandateId: string
): Promise<MandateInfo | null> => {
  // Vérifier d'abord si l'info est dans le cache
  if (mandatesCache.has(mandateId)) {
    return mandatesCache.get(mandateId)!;
  }

  try {
    const response = await fetch(`/api/mandats/${mandateId}`);

    if (!response.ok) {
      console.error(
        "Erreur lors de la récupération du mandat:",
        response.statusText
      );
      return null;
    }

    const mandate = await response.json();

    // Stocker dans le cache pour les futurs appels
    mandatesCache.set(mandateId, {
      id: mandate.id,
      name: mandate.name,
    });

    return {
      id: mandate.id,
      name: mandate.name,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du mandat:", error);
    return null;
  }
};

// Fonction pour générer les breadcrumbs basés sur le pathname
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Mapping des chemins vers des labels personnalisés
  const pathLabels: Record<string, string> = {
    "/dashboard": "Tableau de bord",
    "/dashboard/mandates": "Mandats",
    "/dashboard/mandates/create": "Créer un mandat",
    "/dashboard/dayvalues": "Valeurs journalières",
    "/dashboard/dayvalues/create": "Nouvelle valeur",
    "/dashboard/analytics": "Analytics",
    "/dashboard/profile": "Profil",
    "/dashboard/settings": "Paramètres",
  };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Toujours commencer par l'accueil
  breadcrumbs.push({
    label: "Accueil",
    href: "/dashboard",
    isActive: pathname === "/dashboard",
  });

  // Construire le chemin cumulatif
  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;

    // Ignorer si c'est la racine du dashboard (déjà ajoutée)
    if (currentPath === "/dashboard") continue;

    // Créer l'élément breadcrumb
    const isActive = i === segments.length - 1;

    let label = pathLabels[currentPath];

    if (!label) {
      // Si c'est potentiellement un ID de mandat (nous le remplacerons plus tard)
      if (segments[i - 1] === "mandates" && segments[i] !== "create") {
        label = "Chargement..."; // Placeholder temporaire
      } else {
        // Pour les autres segments, capitaliser la première lettre
        label = segments[i].charAt(0).toUpperCase() + segments[i].slice(1);
      }
    }

    // Ajouter au breadcrumb
    breadcrumbs.push({
      label,
      href: currentPath,
      isActive,
    });
  }

  return breadcrumbs;
};

// Composant de navigation moderne
function ModernNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // État pour les breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Générer les breadcrumbs au chargement et quand le pathname change
  useEffect(() => {
    // Générer les breadcrumbs initiaux
    const initialBreadcrumbs = generateBreadcrumbs(pathname);
    setBreadcrumbs(initialBreadcrumbs);

    // Vérifier s'il y a des IDs de mandats dans le chemin
    const segments = pathname.split("/").filter(Boolean);

    // Trouver l'index de 'mandates'
    const mandatesIndex = segments.findIndex(
      (segment) => segment === "mandates"
    );

    // Si 'mandates' est suivi par un ID (non 'create')
    if (
      mandatesIndex !== -1 &&
      mandatesIndex + 1 < segments.length &&
      segments[mandatesIndex + 1] !== "create"
    ) {
      const mandateId = segments[mandatesIndex + 1];

      // Récupérer le nom du mandat
      fetchMandateInfo(mandateId).then((mandate) => {
        if (mandate) {
          // Créer une copie pour mettre à jour l'état
          const updatedBreadcrumbs = [...initialBreadcrumbs];

          // Calculer l'index du breadcrumb à mettre à jour
          // +1 pour 'Accueil' et +1 pour l'index des segments après 'mandates'
          const breadcrumbIndex = mandatesIndex + 1;

          // Mettre à jour le label avec le nom du mandat
          if (updatedBreadcrumbs[breadcrumbIndex]) {
            updatedBreadcrumbs[breadcrumbIndex].label = mandate.name;
            setBreadcrumbs(updatedBreadcrumbs);
          }
        }
      });
    }
  }, [pathname]);

  // Gestion de la déconnexion
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Déconnexion réussie");
      router.push("/");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  // Focus automatique sur la recherche
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Gestion de la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Logique de recherche ici
      console.log("Recherche:", searchQuery);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return session?.user?.email?.charAt(0)?.toUpperCase() || "U";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand à gauche */}
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-lg">
                <span className="text-sm font-bold">C</span>
              </div>
              <span>Chaff.ch</span>
            </Link>
          </div>

          {/* Breadcrumbs au centre */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center max-w-2xl">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center space-x-1 text-sm text-muted-foreground">
                {breadcrumbs.map((item, index) => (
                  <li key={item.href} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                    )}
                    {index === 0 && (
                      <Home className="h-4 w-4 mr-2 text-muted-foreground/70" />
                    )}
                    {item.isActive ? (
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className="hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Actions à droite */}
          <div className="flex items-center space-x-3">
            {/* Recherche */}
            <div className="relative">
              {showSearch ? (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "200px", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  onSubmit={handleSearch}
                  className="flex items-center"
                >
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setShowSearch(false);
                    }}
                    className="h-8 text-sm"
                  />
                </motion.form>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                  className="h-8 w-8 p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                3
              </Badge>
            </Button>

            {/* Menu utilisateur */}
            <DropdownMenu
              open={isUserMenuOpen}
              onOpenChange={setIsUserMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 rounded-full px-2 hover:bg-accent"
                >
                  <div className="flex items-center space-x-2">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span>{getUserInitials()}</span>
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium leading-none">
                        {session?.user?.name || "Utilisateur"}
                      </p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">
                      {session?.user?.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Breadcrumbs mobile (en dessous sur petits écrans) */}
        <div className="md:hidden pb-3">
          <nav aria-label="Breadcrumb mobile">
            <ol className="flex items-center space-x-1 text-sm text-muted-foreground overflow-x-auto">
              {breadcrumbs.slice(-2).map((item, index) => (
                <li
                  key={item.href}
                  className="flex items-center whitespace-nowrap"
                >
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                  )}
                  {item.isActive ? (
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </nav>
  );
}

// Composant principal avec logique conditionnelle
export default function ConditionalNavbar({
  children,
}: ConditionalNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Routes où la navigation ne doit pas s'afficher (pages d'authentification et publiques)
  const authRoutes = [
    "/auth/sign-in",
    "/auth/signup",
    "/auth/email-verification-required",
    "/auth/verification-success",
    "/auth/verification-failed",
    "/resend-verification",
    "/about",
    "/",
  ];

  // Fonction pour vérifier si on est sur une route d'authentification
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Ne pas afficher la navbar si :
  // - L'utilisateur n'est pas connecté
  // - On est sur une route d'authentification
  const shouldShowNavbar = session && !isAuthRoute;

  return (
    <div className="min-h-screen bg-background">
      {shouldShowNavbar && <ModernNavbar />}
      <div className={shouldShowNavbar ? "" : ""}>{children}</div>
    </div>
  );
}
