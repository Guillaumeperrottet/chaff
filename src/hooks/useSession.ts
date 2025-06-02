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

  useEffect(() => {
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

    getSession();
  }, []);

  return { data, isPending, error };
}
