// src/lib/establishment-icons.tsx
import {
  Building2,
  MapPin,
  Hotel,
  Utensils,
  Tent,
  Waves,
  TreePine,
  Coffee,
  ShoppingBag,
  Briefcase,
  Heart,
  Music,
} from "lucide-react";

export type EstablishmentIconType =
  | "BUILDING2"
  | "MAP_PIN"
  | "HOTEL"
  | "UTENSILS"
  | "TENT"
  | "WAVES"
  | "TREE_PINE"
  | "COFFEE"
  | "SHOPPING_BAG"
  | "BRIEFCASE"
  | "HEART"
  | "MUSIC";

export interface IconOption {
  id: EstablishmentIconType;
  label: string;
  description: string;
  component: React.ComponentType<{ className?: string }>;
  defaultColor: string;
  defaultBgColor: string;
}

export const ICON_OPTIONS: IconOption[] = [
  {
    id: "BUILDING2",
    label: "Bâtiment",
    description: "Établissement générique",
    component: Building2,
    defaultColor: "text-gray-600",
    defaultBgColor: "bg-gray-100",
  },
  {
    id: "HOTEL",
    label: "Hôtel",
    description: "Hébergement touristique",
    component: Hotel,
    defaultColor: "text-blue-600",
    defaultBgColor: "bg-blue-100",
  },
  {
    id: "UTENSILS",
    label: "Restaurant",
    description: "Restauration et cuisine",
    component: Utensils,
    defaultColor: "text-orange-600",
    defaultBgColor: "bg-orange-100",
  },
  {
    id: "TENT",
    label: "Camping",
    description: "Hébergement de plein air",
    component: Tent,
    defaultColor: "text-green-600",
    defaultBgColor: "bg-green-100",
  },
  {
    id: "WAVES",
    label: "Spa/Wellness",
    description: "Bien-être et détente",
    component: Waves,
    defaultColor: "text-cyan-600",
    defaultBgColor: "bg-cyan-100",
  },
  {
    id: "TREE_PINE",
    label: "Nature",
    description: "Activités nature/montagne",
    component: TreePine,
    defaultColor: "text-emerald-600",
    defaultBgColor: "bg-emerald-100",
  },
  {
    id: "COFFEE",
    label: "Café/Bar",
    description: "Boissons et détente",
    component: Coffee,
    defaultColor: "text-amber-600",
    defaultBgColor: "bg-amber-100",
  },
  {
    id: "SHOPPING_BAG",
    label: "Commerce",
    description: "Vente et commerce",
    component: ShoppingBag,
    defaultColor: "text-pink-600",
    defaultBgColor: "bg-pink-100",
  },
  {
    id: "MAP_PIN",
    label: "Localisation",
    description: "Service localisé",
    component: MapPin,
    defaultColor: "text-red-600",
    defaultBgColor: "bg-red-100",
  },
  {
    id: "BRIEFCASE",
    label: "Business",
    description: "Services professionnels",
    component: Briefcase,
    defaultColor: "text-slate-600",
    defaultBgColor: "bg-slate-100",
  },
  {
    id: "HEART",
    label: "Services personnels",
    description: "Soins et services à la personne",
    component: Heart,
    defaultColor: "text-rose-600",
    defaultBgColor: "bg-rose-100",
  },
  {
    id: "MUSIC",
    label: "Divertissement",
    description: "Loisirs et spectacles",
    component: Music,
    defaultColor: "text-purple-600",
    defaultBgColor: "bg-purple-100",
  },
];

// Fonction utilitaire pour obtenir une icône par ID
export const getIconById = (iconId: EstablishmentIconType) => {
  return ICON_OPTIONS.find((option) => option.id === iconId) || ICON_OPTIONS[0];
};

// Fonction utilitaire pour obtenir le composant d'icône
export const getIconComponent = (iconId: EstablishmentIconType) => {
  const iconOption = getIconById(iconId);
  return iconOption.component;
};
