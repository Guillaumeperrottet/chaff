"use client";

import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Contenu principal avec padding pour la navbar sticky */}
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
