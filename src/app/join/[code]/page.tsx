// Modifier le fichier : src/app/join/[code]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function JoinRedirectPage() {
  const { code } = useParams();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    async function handleRedirect() {
      if (!code) {
        console.log("❌ Pas de code d'invitation");
        router.push("/signup");
        return;
      }

      console.log("🔄 Redirection vers invitation simplifiée:", code);
      setIsRedirecting(true);

      // Petit délai pour afficher le message de redirection
      setTimeout(() => {
        router.push(`/invite/${code}`);
      }, 500);
    }

    handleRedirect();
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#d9840d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-[#d9840d] animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-[#141313] mb-2">
          Redirection en cours...
        </h2>
        <p className="text-[#62605d]">
          {isRedirecting
            ? "Préparation de votre invitation..."
            : "Vérification du code d'invitation..."}
        </p>
      </div>
    </div>
  );
}
