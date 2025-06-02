"use client";

import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  fallback,
}: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/sign-in");
    }
  }, [session, isPending, router]);

  // Pendant le chargement
  if (isPending) {
    return (
      fallback || (
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      )
    );
  }

  // Pas de session - redirection en cours
  if (!session) {
    return (
      fallback || (
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Redirection vers la connexion...</p>
          </div>
        </div>
      )
    );
  }

  // Session valide - afficher le contenu
  return <>{children}</>;
}
