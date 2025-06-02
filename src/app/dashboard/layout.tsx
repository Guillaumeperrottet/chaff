"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/AppSidebar";
import { Separator } from "@/app/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Générer le breadcrumb basé sur le pathname
  const generateBreadcrumb = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbItems = [];

    // Commencer par Dashboard
    breadcrumbItems.push({ href: "/dashboard", label: "Dashboard" });

    // Ajouter les segments suivants
    for (let i = 1; i < segments.length; i++) {
      const href = "/" + segments.slice(0, i + 1).join("/");
      const label = segments[i].charAt(0).toUpperCase() + segments[i].slice(1);
      breadcrumbItems.push({ href, label });
    }

    return breadcrumbItems;
  };

  const breadcrumbItems = generateBreadcrumb();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <SidebarProvider
          style={
            {
              "--sidebar-width": "16rem",
              "--sidebar-width-mobile": "18rem",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <SidebarInset className="flex-1">
            {/* Header avec breadcrumb */}
            <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbItems.map((item, index) => (
                      <div key={item.href} className="flex items-center">
                        {index > 0 && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                        <BreadcrumbItem className="hidden md:block">
                          {index === breadcrumbItems.length - 1 ? (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={item.href}>
                              {item.label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </div>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            {/* Contenu principal */}
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto p-4 max-w-7xl">{children}</div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
}
