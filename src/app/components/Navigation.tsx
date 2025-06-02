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

// Fonction pour générer les breadcrumbs basés sur le pathname
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Mapping des chemins vers des labels personnalisés
  const pathLabels: Record<string, string> = {
    "/dashboard": "Tableau de bord",
    "/dashboard/mandates": "Mandats",
    "/dashboard/mandates/create": "Créer un mandat",
    "/dashboard/day-values": "Valeurs journalières",
    "/dashboard/day-values/create": "Nouvelle valeur",
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
    const label =
      pathLabels[currentPath] ||
      segments[i].charAt(0).toUpperCase() + segments[i].slice(1);

    breadcrumbs.push({
      label,
      href: currentPath,
      isActive,
    });
  }

  return breadcrumbs;
};

export default function ModernNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Générer les breadcrumbs
  const breadcrumbs = generateBreadcrumbs(pathname);

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

                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/profile")}
                >
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
