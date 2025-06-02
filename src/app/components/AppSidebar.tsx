"use client";

import * as React from "react";
import {
  BarChart3,
  Building2,
  Home,
  Settings,
  Users,
  Database,
  FolderOpen,
  Bell,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/app/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useSession } from "@/hooks/useSession";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";

// Configuration du menu
const menuItems = [
  {
    title: "Accueil",
    icon: Home,
    url: "/dashboard",
  },
  {
    title: "Données",
    icon: Database,
    items: [
      { title: "Vue d'ensemble", url: "/dashboard/data" },
      { title: "Import/Export", url: "/dashboard/data/import" },
      { title: "Historique", url: "/dashboard/data/history" },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    items: [
      { title: "Tableau de bord", url: "/dashboard/analytics" },
      { title: "Rapports", url: "/dashboard/analytics/reports" },
      { title: "Tendances", url: "/dashboard/analytics/trends" },
    ],
  },
  {
    title: "Projets",
    icon: FolderOpen,
    items: [
      { title: "Tous les projets", url: "/dashboard/projects" },
      { title: "Nouveau projet", url: "/dashboard/projects/new" },
      { title: "Archives", url: "/dashboard/projects/archived" },
    ],
  },
  {
    title: "Équipe",
    icon: Users,
    items: [
      { title: "Membres", url: "/dashboard/team" },
      { title: "Invitations", url: "/dashboard/team/invites" },
      { title: "Rôles", url: "/dashboard/team/roles" },
    ],
  },
];

const settingsItems = [
  {
    title: "Organisation",
    icon: Building2,
    url: "/dashboard/settings/organization",
  },
  {
    title: "Notifications",
    icon: Bell,
    url: "/dashboard/settings/notifications",
  },
  {
    title: "Paramètres",
    icon: Settings,
    url: "/dashboard/settings",
  },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { setTheme, theme } = useTheme();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Déconnexion réussie");
      router.push("/");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const handleNavigation = (url: string) => {
    router.push(url);
    setOpenMobile(false); // Fermer le sidebar mobile après navigation
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Chaff.ch</span>
            <span className="truncate text-xs text-muted-foreground">
              Plateforme de gestion
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Menu principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    // Menu avec sous-éléments
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  ) : (
                    // Menu simple
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url!)}
                      className="cursor-pointer"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                  {item.items && (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            onClick={() => handleNavigation(subItem.url)}
                            className="cursor-pointer"
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu paramètres */}
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    className="cursor-pointer"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={session?.user?.image || ""}
                      alt={session?.user?.name || ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.name || "Utilisateur"}
                    </span>
                    <span className="truncate text-xs">
                      {session?.user?.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem
                  onClick={() => handleNavigation("/dashboard/profile")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation("/dashboard/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
