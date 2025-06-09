"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await authClient.signOut();
        // Redirection après déconnexion
        router.push("/");
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        // Redirection même en cas d'erreur
        router.push("/");
      }
    };

    handleSignOut();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p>Déconnexion en cours...</p>
      </div>
    </div>
  );
}
