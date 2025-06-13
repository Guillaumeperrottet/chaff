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
        <main className="md:flex md:flex-1 md:flex-col md:gap-4 md:p-4">
          {children}
        </main>{" "}
      </div>
    </ProtectedRoute>
  );
}
