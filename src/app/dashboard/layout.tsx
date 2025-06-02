"use client";

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
      {/* Header avec breadcrumb */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
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
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
    </ProtectedRoute>
  );
}
