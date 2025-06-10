// src/hooks/useSession.ts
"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UseSessionResult {
  data: { user: User } | null;
  isPending: boolean;
  error?: Error;
}

export function useSession(): UseSessionResult {
  const [data, setData] = useState<{ user: User } | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | undefined>();

  const getSession = async () => {
    try {
      setIsPending(true);
      const session = await authClient.getSession();

      if (session?.data?.user) {
        // Retourner seulement l'utilisateur dans le format attendu
        setData({ user: session.data.user });
      } else {
        setData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData(null);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    getSession();

    // Écouter les événements de storage pour détecter les changements de session
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "better-auth.session" || e.key === null) {
        console.log("🔄 Session change detected, refreshing...");
        getSession();
      }
    };

    // Polling périodique pour s'assurer que la session est à jour
    const interval = setInterval(() => {
      getSession();
    }, 5000); // Vérifier toutes les 5 secondes

    window.addEventListener("storage", handleStorageChange);

    // Écouter les événements focus pour rafraîchir quand on revient sur la page
    const handleFocus = () => {
      getSession();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return { data, isPending, error };
}
