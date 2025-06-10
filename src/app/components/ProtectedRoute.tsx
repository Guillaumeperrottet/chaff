"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireEmailVerification?: boolean;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/",
  requireEmailVerification = true,
}: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Attendre que la session soit chargée
    if (isPending) return;

    // Si pas d'utilisateur connecté, rediriger vers landing
    if (!session?.user) {
      router.push(redirectTo);
      return;
    }

    // Si email non vérifié et vérification requise
    if (requireEmailVerification && !session.user.emailVerified) {
      router.push("/auth/email-verification-required");
      return;
    }
  }, [session, isPending, router, redirectTo, requireEmailVerification]);

  // Afficher un loader pendant la vérification
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si pas d'utilisateur ou email non vérifié, ne rien afficher
  // (la redirection est en cours)
  if (
    !session?.user ||
    (requireEmailVerification && !session.user.emailVerified)
  ) {
    return null;
  }

  return <>{children}</>;
}
