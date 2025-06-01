"use client";

import { MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Editbutton from "./ui/edit-button";
import { useRouter } from "@/lib/router-helper";

interface ObjetCardProps {
  objet: {
    id: string;
    nom: string;
    adresse: string;
    secteur: string;
  };
}

export default function ObjetCard({ objet }: ObjetCardProps) {
  const router = useRouter();

  const getSecteurIcon = (secteur: string) => {
    switch (secteur.toLowerCase()) {
      case "bureau":
        return "/window.svg";
      case "commercial":
        return "/globe.svg";
      default:
        return "/file.svg";
    }
  };

  const handleCardClick = () => {
    router.navigateWithLoading(`/dashboard/objet/${objet.id}/view`, {
      loadingMessage: `Chargement de ${objet.nom}...`,
      hapticFeedback: true,
    });
  };

  return (
    <div
      className="
        rounded-lg border border-[color:var(--border)]
        bg-[color:var(--card)] text-[color:var(--card-foreground)]
        hover:border-[color:#6C5A41] hover:shadow-md
        transition-all duration-200 relative
        cursor-pointer
      "
      onClick={handleCardClick}
    >
      <div className="block p-5">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-xl font-semibold line-clamp-1">{objet.nom}</h2>

          {/* Arrêt de la propagation pour que seul ce lien réagisse */}
          <Link
            href={`/dashboard/objet/${objet.id}/edit`}
            onClick={(e) => e.stopPropagation()}
          >
            <Editbutton aria-label="Modifier cet objet" />
          </Link>
        </div>

        <div className="flex items-center gap-2 text-[color:var(--muted-foreground)] mb-2">
          <MapPin size={16} />
          <span className="text-sm line-clamp-1">{objet.adresse}</span>
        </div>

        <div className="flex items-center gap-2 text-[color:var(--muted-foreground)]">
          <Briefcase size={16} />
          <span className="text-sm">{objet.secteur}</span>
        </div>

        <div className="mt-4 pt-3 border-t border-[color:var(--border)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <Image
                src={getSecteurIcon(objet.secteur)}
                alt={objet.secteur}
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <span className="text-xs text-[color:var(--muted-foreground)] capitalize">
              {objet.secteur}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
