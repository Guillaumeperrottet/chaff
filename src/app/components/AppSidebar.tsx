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
  ChevronRight,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Chaff.ch</span>
                  <span className="truncate text-xs">
                    Plateforme de gestion
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Menu principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <Collapsible key={item.title} asChild defaultOpen={false}>
                  <SidebarMenuItem>
                    {item.items ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <a href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : (
                      <SidebarMenuButton tooltip={item.title} asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
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
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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
