"use client";

import { Button } from "@/app/components/ui/button";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function OfflinePage() {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Function to check internet connection
  const checkConnection = () => {
    setIsReconnecting(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // After countdown, check if we're back online
          if (navigator.onLine) {
            window.location.reload();
          } else {
            setIsReconnecting(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      window.location.reload();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <section className="min-h-screen bg-[#f9f3ec] text-[#141313] flex flex-col items-center justify-center p-4">
      <div className="container max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6 text-center">
        <div className="relative w-40 h-40 mx-auto mb-6">
          <Image
            src="/images/offline-illustration.svg"
            alt="Aucune connexion"
            layout="fill"
            className="object-contain"
            onError={(e) => {
              // Fallback if image doesn't load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />

          {/* Fallback if image doesn't load */}
          <div className="absolute inset-0 flex items-center justify-center text-6xl text-[#d9840d]">
            <span className="wifi-off-icon">📶</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-[#d9840d]">
          Vous êtes hors ligne
        </h1>

        <div className="bg-[#f5f3ef] border border-[#beac93] rounded-lg p-4 mb-6">
          <p className="text-lg mb-3">
            Il semble que vous ayez perdu votre connexion internet.
          </p>
          <p className="text-[#62605d]">
            Vérifiez votre connexion réseau et réessayez.
          </p>
        </div>

        <Button
          onClick={checkConnection}
          disabled={isReconnecting}
          className="bg-[#d9840d] hover:bg-[#c6780c] text-white py-3 px-6 rounded-lg font-medium transition-all w-full sm:w-auto"
        >
          {isReconnecting
            ? `Reconnexion en cours (${countdown})...`
            : "Essayer de reconnecter"}
        </Button>

        <div className="mt-8 text-sm text-[#62605d]">
          <p>
            Les fonctionnalités de PlanniKeeper nécessitent une connexion
            internet active.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center text-[#62605d]">
        <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
      </div>
    </section>
  );
}
