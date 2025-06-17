"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  User,
  ChevronDown,
  Home,
  ChevronRight,
  // Bell,
  Users,
  DollarSign,
  BarChart3,
  MessageSquarePlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
// import { Badge } from "@/app/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import CustomThemeToggle from "@/app/components/ui/custom-theme-toggle";

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
    "/dashboard/mandates": "Entreprises",
    "/dashboard/mandates/create": "Nouvelle entreprise",
    "/dashboard/dayvalues": "Chiffres d'affaires",
    "/dashboard/dayvalues/create": "Nouveau CA",
    "/dashboard/ca-global": "CA Global",
    "/dashboard/ca-types": "CA Types",
    "/dashboard/employees": "Employés",
    "/dashboard/payroll": "Masse salariale",
    "/dashboard/payroll/import": "Import données",
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

// Composant de navigation Chaff.ch avec design bleu
function ChaffNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
          {/* Logo/Brand Chaff.ch à gauche */}
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 text-xl font-bold text-primary hover:opacity-80 transition-opacity group"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-chaff-gradient text-white rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <BarChart3 className="text-lg font-bold" />
              </div>
              <div className="flex flex-col">
                <span className="text-primary text-xl font-bold">Chaff.ch</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Analytics Business
                </span>
              </div>
            </Link>
          </div>

          {/* Breadcrumbs au centre */}
          <div className="hidden md:flex items-center flex-1 justify-center">
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
            {/* Toggle thème */}
            <CustomThemeToggle />

            {/* Menu utilisateur */}
            <DropdownMenu
              open={isUserMenuOpen}
              onOpenChange={setIsUserMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 rounded-full px-2 hover:bg-primary/10"
                >
                  <div className="flex items-center space-x-2">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-chaff-gradient text-white flex items-center justify-center text-xs font-medium shadow-md">
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
                  onClick={() => router.push("/dashboard/mandates")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Entreprises</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/employees")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Employés</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/payroll")}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>Masse salariale</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/analytics")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Analytics</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push("/feedback")}>
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  <span>Feedback</span>
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
        </div>{" "}
      </div>
    </nav>
  );
}

// Composant principal avec logique conditionnelle améliorée
export default function ConditionalNavbar({
  children,
}: ConditionalNavbarProps) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  // Routes où la navigation ne doit pas s'afficher
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

  // Marquer comme initialisé quand la session est chargée (même si null)
  useEffect(() => {
    if (!isPending) {
      setIsInitialized(true);
    }
  }, [isPending]);

  // Déterminer si on doit afficher la navbar
  const shouldShowNavbar = isInitialized && session && !isAuthRoute;

  // Afficher un loader pendant le chargement initial de la session
  if (!isInitialized && !isAuthRoute) {
    return (
      <div className="min-h-screen bg-background">
        {/* Placeholder navbar pendant le chargement */}
        <div className="sticky top-0 z-50 w-full h-16 border-b bg-white/95 backdrop-blur dark:bg-gray-950/95">
          <div className="container mx-auto px-4 h-full flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-chaff-gradient rounded-xl flex items-center justify-center">
                <BarChart3 className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary">Chaff.ch</span>
                <span className="text-xs text-muted-foreground">
                  Analytics Business
                </span>
              </div>
            </div>

            {/* Skeleton pour les actions */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {shouldShowNavbar && <ChaffNavbar />}
      <div className={shouldShowNavbar ? "" : ""}>{children}</div>
    </div>
  );
}
