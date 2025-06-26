"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/app/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Download,
  Upload,
  Search,
  Eye,
  Edit,
  Loader2,
  Calculator,
  BarChart3,
  Users,
} from "lucide-react";
import EmptyState from "@/app/components/EmptyState";
import { Input } from "@/app/components/ui/input";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { toast } from "sonner";
import PremiumBurgerButton from "@/app/components/ui/BurgerButton";
import { motion, AnimatePresence } from "framer-motion";

// ✅ INTERFACES MISES À JOUR
interface EstablishmentType {
  id: string;
  label: string;
  description: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  isCustom: boolean;
}

// Types inchangés (copier depuis votre code original)
interface DashboardData {
  id: string;
  name: string;
  lastEntry: string | null;
  daysSinceLastEntry: number | null;
  performance: string;
  values: Record<string, string>;
  category: string; // ✅ Maintenant c'est l'ID du type (ex: "cmbrjy31r0001sbeubwotxmhw")
  status: string;
  totalRevenue: number;
}

interface PayrollRatioData {
  mandateId: string;
  mandateName: string;
  mandateGroup: string;
  year: number;
  month: number;
  monthName: string;
  totalRevenue: number;
  revenueEntries: number;
  averageDailyRevenue: number;
  payrollAmount: number | null;
  payrollSource: "manual" | "calculated" | null;
  employeeCount: number | null;
  payrollToRevenueRatio: number | null;
  ratioStatus: "excellent" | "good" | "warning" | "critical" | "no-data";
  previousMonthRatio: number | null;
  ratioTrend: "up" | "down" | "stable" | "no-data";
}

interface ColumnLabel {
  key: string;
  label: string;
}

interface DashboardResponse {
  data: DashboardData[];
  totals: {
    totalRevenue: number;
    totalMandates: number;
    activeMandates: number;
    dailyTotals: Record<string, number>;
    subtotalsByCategory: Record<string, Record<string, number>>; // ✅ MODIFIÉ: Structure dynamique pour tous les types
  };
  columnLabels: ColumnLabel[];
  meta: {
    dateRange: {
      start: string;
      end: string;
    };
    generatedAt: string;
  };
}

interface PayrollRatiosResponse {
  currentPeriod: {
    year: number;
    month: number;
    monthName: string;
  };
  mandatesData: PayrollRatioData[];
  summary: {
    totalMandates: number;
    mandatesWithData: number;
    totalRevenue: number;
    totalPayroll: number;
    globalRatio: number | null;
    averageRatio: number | null;
    ratioDistribution: {
      excellent: number;
      good: number;
      warning: number;
      critical: number;
      noData: number;
    };
  };
}

// ✅ NOUVEAU: Composant pour l'édition inline des cellules
interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  formatDisplay?: (value: string) => string;
}

// ✅ AMÉLIORATION: Fonction pour valider en temps réel pendant la saisie
const validateAndFormatInput = (input: string): string => {
  // Autoriser uniquement les chiffres, points, virgules, apostrophes et espaces
  return input.replace(/[^\d.,'\s]/g, "");
};

// ✅ VERSION COMPLÈTE DU COMPOSANT EditableCell AMÉLIORÉ
const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  formatDisplay,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  // Fonction pour obtenir la valeur brute pour l'édition
  const getRawValue = (formattedValue: string): string => {
    // Pour l'édition, on garde la valeur telle qu'elle est affichée
    // L'utilisateur peut saisir dans n'importe quel format
    return formattedValue.replace(/['\s]/g, "").replace(",", ".");
  };

  const handleSave = async () => {
    // Pas besoin de comparer, on sauvegarde toujours
    // La logique de nettoyage se fait dans handleSaveValue
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      // En cas d'erreur, on remet la valeur originale
      setEditValue(getRawValue(value));
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(getRawValue(value));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <Input
          value={editValue}
          onChange={(e) => {
            const validatedValue = validateAndFormatInput(e.target.value);
            setEditValue(validatedValue);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-6 text-xs text-center border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
          autoFocus
          disabled={isSaving}
        />
        {isSaving && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  const displayValue = formatDisplay ? formatDisplay(value) : value;

  return (
    <div
      className="text-xs font-medium cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded px-1 py-0.5 transition-colors group"
      onClick={() => {
        // Pour l'édition, on utilise la valeur affichée mais nettoyée
        const rawValue = getRawValue(value);
        setEditValue(rawValue);
        setIsEditing(true);
      }}
      title="Cliquer pour modifier"
    >
      {displayValue}
      <span className="ml-1 opacity-0 group-hover:opacity-50 text-xs">✏️</span>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [payrollRatios, setPayrollRatios] =
    useState<PayrollRatiosResponse | null>(null);

  // ✅ NOUVEAU: État pour stocker les types d'établissement
  const [establishmentTypes, setEstablishmentTypes] = useState<
    EstablishmentType[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const categoryFilter = "all"; // Afficher toutes les catégories par défaut
  const statusFilter = "all"; // Afficher tous les statuts par défaut
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // ✅ FONCTION POUR RÉCUPÉRER LES TYPES D'ÉTABLISSEMENT
  const fetchEstablishmentTypes = async () => {
    try {
      const response = await fetch("/api/establishment-types");
      if (response.ok) {
        const data = await response.json();
        setEstablishmentTypes(data.types || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des types:", error);
    }
  };

  // ✅ FONCTION POUR OBTENIR LE LABEL D'UN TYPE
  const getTypeLabel = (groupId: string): string => {
    // Types par défaut
    if (groupId === "HEBERGEMENT" || groupId === "Hébergement")
      return "Hébergement";
    if (groupId === "RESTAURATION" || groupId === "Restauration")
      return "Restauration";

    // Types personnalisés
    const customType = establishmentTypes.find((type) => type.id === groupId);
    return customType?.label || groupId; // Fallback vers l'ID si pas trouvé
  };

  // ✅ MODIFIER LE useEffect POUR CHARGER AUSSI LES TYPES
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchDashboardData(),
        fetchPayrollRatios(),
        fetchEstablishmentTypes(), // ✅ Ajouter ici
      ]);
      setLoading(false);
    };

    loadAllData();
  }, []);

  // Fermer le menu burger avec la touche Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsBurgerMenuOpen(false);
      }
    };

    if (isBurgerMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isBurgerMenuOpen]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/data");
      if (!response.ok)
        throw new Error("Erreur lors du chargement des données CA");
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données CA");
    }
  };

  const fetchPayrollRatios = async () => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await fetch(
        `/api/dashboard/payroll-ratios?year=${year}&month=${month}`
      );
      if (!response.ok) throw new Error("Erreur lors du chargement des ratios");
      const data = await response.json();
      setPayrollRatios(data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des ratios(faut avoir le premium):",
        error
      );
    }
  };

  // ✅ FONCTION POUR FILTRER AVEC LES NOUVEAUX TYPES
  const filteredData =
    dashboardData?.data.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // ✅ AMÉLIORER LE FILTRAGE PAR CATÉGORIE POUR CHAQUE TYPE INDIVIDUEL
      const matchesCategory = (() => {
        if (categoryFilter === "all") return true;
        if (
          categoryFilter === "hebergement" &&
          (item.category === "HEBERGEMENT" || item.category === "Hébergement")
        )
          return true;
        if (
          categoryFilter === "restauration" &&
          (item.category === "RESTAURATION" || item.category === "Restauration")
        )
          return true;

        // Pour les types personnalisés, comparer directement l'ID
        return item.category === categoryFilter;
      })();

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    }) || [];

  // Fusionner les données CA et Payroll (inchangé)
  const getMergedData = () => {
    return filteredData.map((caData) => {
      const payrollData = payrollRatios?.mandatesData.find(
        (p) => p.mandateId === caData.id
      );
      return {
        ...caData,
        payroll: payrollData,
      };
    });
  };

  // ✅ FONCTION DE NETTOYAGE AMÉLIORÉE
  const cleanNumericValue = (value: string): number => {
    console.log("🔍 Valeur d'entrée:", value);

    // Étape 1: Supprimer tous les espaces
    let cleaned = value.replace(/\s/g, "");
    console.log("Après suppression espaces:", cleaned);

    // Étape 2: Gérer les différents formats de séparateurs
    // Format suisse: 3'110,79 ou 3'110.79
    // Format international: 3,110.79 ou 3.110,79
    // Format simple: 3110.79 ou 3110,79

    // Détecter le format en comptant les séparateurs
    const apostropheCount = (cleaned.match(/'/g) || []).length;
    const commaCount = (cleaned.match(/,/g) || []).length;
    const dotCount = (cleaned.match(/\./g) || []).length;

    console.log("Séparateurs détectés:", {
      apostropheCount,
      commaCount,
      dotCount,
    });

    // Cas 1: Format suisse avec apostrophe (3'110,79 ou 3'110.79)
    if (apostropheCount > 0) {
      console.log("Format suisse détecté");
      // Supprimer les apostrophes (séparateurs de milliers)
      cleaned = cleaned.replace(/'/g, "");
      console.log("Après suppression apostrophes:", cleaned);

      // Si il y a une virgule, c'est le séparateur décimal
      if (commaCount === 1) {
        cleaned = cleaned.replace(",", ".");
      }
    }
    // Cas 2: Format avec virgule comme séparateur décimal (3110,79)
    else if (commaCount === 1 && dotCount === 0) {
      console.log("Format avec virgule décimale détecté");
      cleaned = cleaned.replace(",", ".");
    }
    // Cas 3: Format international avec virgule comme séparateur de milliers (3,110.79)
    else if (commaCount > 0 && dotCount === 1) {
      console.log("Format international détecté");
      // La dernière virgule ou point est le séparateur décimal
      const lastCommaIndex = cleaned.lastIndexOf(",");
      const lastDotIndex = cleaned.lastIndexOf(".");

      if (lastDotIndex > lastCommaIndex) {
        // Le point est le séparateur décimal, supprimer toutes les virgules
        cleaned = cleaned.replace(/,/g, "");
      } else {
        // La virgule est le séparateur décimal, supprimer tous les points et remplacer la dernière virgule par un point
        cleaned = cleaned.replace(/\./g, "");
        const parts = cleaned.split(",");
        if (parts.length === 2) {
          cleaned = parts[0] + "." + parts[1];
        }
      }
    }
    // Cas 4: Plusieurs points (format comme 3.110.79 où le dernier point est décimal)
    else if (dotCount > 1) {
      console.log("Format avec multiples points détecté");
      const parts = cleaned.split(".");
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        // Si la dernière partie fait 2 chiffres ou moins, c'est probablement décimal
        if (lastPart.length <= 2) {
          const integerParts = parts.slice(0, -1).join("");
          cleaned = integerParts + "." + lastPart;
        } else {
          // Sinon, tous les points sont des séparateurs de milliers
          cleaned = cleaned.replace(/\./g, "");
        }
      }
    }

    console.log("Valeur finale nettoyée:", cleaned);

    const numericValue = parseFloat(cleaned);
    console.log("Valeur numérique:", numericValue);

    return numericValue;
  };

  // ✅ NOUVELLE VERSION DE handleSaveValue AVEC POSSIBILITÉ D'ANNULATION
  const handleSaveValue = async (
    mandateId: string,
    dateKey: string,
    newValue: string
  ) => {
    try {
      console.log("🔄 handleSaveValue appelée avec:", {
        mandateId,
        dateKey,
        newValue,
        type: typeof newValue,
      });

      // Sauvegarder l'ancienne valeur pour l'annulation
      const campus = dashboardData?.data.find((item) => item.id === mandateId);
      const oldValueStr = campus?.values[dateKey] || "0.00";
      const oldValue = cleanNumericValue(oldValueStr);

      // Utiliser la nouvelle fonction de nettoyage
      const numericValue = cleanNumericValue(newValue);

      if (isNaN(numericValue) || numericValue < 0) {
        toast.error("Veuillez entrer une valeur numérique valide");
        return;
      }

      console.log("✅ Valeur à sauvegarder:", numericValue);

      // Appel API pour sauvegarder
      const response = await fetch("/api/dashboard/update-value", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mandateId,
          dateKey,
          value: numericValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur API:", errorData);
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      // Recharger les données pour refléter les changements
      await fetchDashboardData();

      // Fonction pour formater le montant pour l'affichage
      const formatDisplayValue = (value: number) => {
        if (value >= 1000) {
          const parts = value.toFixed(2).split(".");
          const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
          return `CHF ${integerPart},${parts[1]}`;
        } else {
          return `CHF ${value.toFixed(2).replace(".", ",")}`;
        }
      };

      // Toast avec possibilité d'annulation pendant 8 secondes
      let isUndoing = false;
      const toastId = toast.success(
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="font-medium">Valeur mise à jour</div>
            <div className="text-sm text-muted-foreground">
              {formatDisplayValue(oldValue)} →{" "}
              {formatDisplayValue(numericValue)}
            </div>
          </div>
          <button
            onClick={async (e) => {
              if (isUndoing) return; // Empêcher les clics multiples

              const button = e.target as HTMLButtonElement;
              isUndoing = true;

              // Mettre à jour le bouton pour afficher le chargement
              button.innerHTML = `
                <div class="flex items-center gap-1">
                  <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Annulation...</span>
                </div>
              `;
              button.disabled = true;

              try {
                // Annuler la modification en restaurant l'ancienne valeur
                const undoResponse = await fetch(
                  "/api/dashboard/update-value",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      mandateId,
                      dateKey,
                      value: oldValue,
                    }),
                  }
                );

                if (undoResponse.ok) {
                  // Recharger les données
                  await fetchDashboardData();

                  // Fermer le toast actuel et afficher un nouveau message
                  toast.dismiss(toastId);
                  toast.info("Modification annulée");
                } else {
                  toast.error("Erreur lors de l'annulation");
                }
              } catch (error) {
                console.error("Erreur lors de l'annulation:", error);
                toast.error("Erreur lors de l'annulation");
              }
            }}
            className="px-3 py-1 text-xs bg-white text-gray-700 border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        </div>,
        {
          duration: 8000, // 8 secondes
          id: `update-${mandateId}-${dateKey}-${Date.now()}`,
        }
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
      throw error;
    }
  };

  // Fonctions utilitaires inchangées
  const formatCurrency = (value: number) => {
    // Formatage manuel avec apostrophe suisse si Intl ne fonctionne pas
    try {
      const formatted = new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: "CHF",
        useGrouping: true,
      }).format(value);

      // Si le formatage ne contient pas d'apostrophe, forcer manuellement
      if (value >= 1000 && !formatted.includes("'")) {
        const parts = value.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
        return `CHF ${integerPart}.${parts[1]}`;
      }

      return formatted;
    } catch {
      // Fallback manuel
      const parts = value.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
      return `CHF ${integerPart}.${parts[1]}`;
    }
  };

  // ✅ NOUVELLE FONCTION D'EXPORT
  const handleExport = async () => {
    try {
      toast.loading("Génération de l'export...", { id: "export-loading" });

      // Construire les paramètres de filtrage
      const queryParams = new URLSearchParams();

      // Si un filtre de catégorie est appliqué, l'ajouter aux paramètres
      if (categoryFilter !== "all") {
        // Pour les types par défaut
        if (categoryFilter === "hebergement") {
          queryParams.set("group", "HEBERGEMENT");
        } else if (categoryFilter === "restauration") {
          queryParams.set("group", "RESTAURATION");
        } else {
          // Pour les types personnalisés, utiliser l'ID du type
          queryParams.set("establishmentTypeId", categoryFilter);
        }
      }

      // Exporter les valeurs journalières avec les filtres appliqués
      const response = await fetch(`/api/export/valeurs?${queryParams}`);

      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Nom de fichier dynamique selon le filtre
      const filterSuffix =
        categoryFilter !== "all" ? `_${getTypeLabel(categoryFilter)}` : "";
      a.download = `dashboard_ca${filterSuffix}_${new Date().toISOString().split("T")[0]}.csv`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export téléchargé avec succès", { id: "export-loading" });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Erreur lors de l'export", { id: "export-loading" });
    }
  };

  // ✅ MODIFIER: Grouper les données par TOUS les types d'établissement
  const groupedData = () => {
    if (!dashboardData) return {};
    const mergedData = getMergedData();

    // Grouper par type d'établissement
    const grouped: Record<
      string,
      (DashboardData & { payroll?: PayrollRatioData })[]
    > = {};

    // Groupes par défaut
    const hebergementItems = mergedData.filter(
      (item) =>
        item.category === "HEBERGEMENT" || item.category === "Hébergement"
    );
    const restaurationItems = mergedData.filter(
      (item) =>
        item.category === "RESTAURATION" || item.category === "Restauration"
    );

    if (hebergementItems.length > 0) {
      grouped["hebergement"] = hebergementItems;
    }
    if (restaurationItems.length > 0) {
      grouped["restauration"] = restaurationItems;
    }

    // Grouper par types personnalisés
    establishmentTypes.forEach((type) => {
      if (
        type.id !== "HEBERGEMENT" &&
        type.id !== "RESTAURATION" &&
        type.label !== "Hébergement" &&
        type.label !== "Restauration"
      ) {
        const typeItems = mergedData.filter(
          (item) => item.category === type.id
        );
        if (typeItems.length > 0) {
          grouped[type.id] = typeItems;
        }
      }
    });

    return grouped;
  };

  // Calculer les totaux pour un groupe (inchangé)
  const calculateGroupTotals = (
    groupData: (DashboardData & { payroll?: PayrollRatioData })[]
  ) => {
    if (!dashboardData) return {};
    const totals: Record<string, number> = {};

    // Utiliser seulement les colonnes visibles
    const visibleColumns = getVisibleColumns();
    visibleColumns.forEach((col) => {
      const dailyCATotal = groupData.reduce((sum, item) => {
        const valueStr = item.values[col.key] || "0,00";
        // Nettoyer la valeur : supprimer apostrophes et espaces, puis remplacer virgules par points
        const cleanedValue = valueStr.replace(/['\s]/g, "").replace(",", ".");
        const value = parseFloat(cleanedValue);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
      totals[col.key] = dailyCATotal;
    });

    return totals;
  };

  // ✅ NOUVEAU: Calculer le Top pour un groupe (meilleur jour du sous-total groupe)
  const calculateGroupTop = (
    groupData: (DashboardData & { payroll?: PayrollRatioData })[]
  ): string => {
    if (groupData.length === 0 || !dashboardData) return "Aucune donnée";

    // Utiliser TOUTES les colonnes pour calculer le top
    const allColumns = dashboardData.columnLabels;
    const dailyGroupTotals: Record<string, number> = {};

    allColumns.forEach((col) => {
      const dailyTotal = groupData.reduce((sum, campus) => {
        const valueStr = campus.values[col.key] || "0,00";
        // Nettoyer la valeur : supprimer apostrophes et espaces, puis remplacer virgules par points
        const cleanedValue = valueStr.replace(/['\s]/g, "").replace(",", ".");
        const value = parseFloat(cleanedValue);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
      dailyGroupTotals[col.key] = dailyTotal;
    });

    // Trouver le jour avec le sous-total le plus élevé
    let maxValue = 0;
    let bestDate = "";

    Object.entries(dailyGroupTotals).forEach(([dateKey, total]) => {
      if (total > maxValue) {
        maxValue = total;
        // Trouver le label correspondant à cette clé
        const dateLabel =
          allColumns.find((col) => col.key === dateKey)?.label || dateKey;
        bestDate = dateLabel;
      }
    });

    return maxValue > 0
      ? `${formatCurrency(maxValue)} / ${bestDate}`
      : "Aucune donnée";
  };

  // Calculer le total général (inchangé)
  const calculateGrandTotal = () => {
    if (!dashboardData) return {};
    const mergedData = getMergedData();
    const totals: Record<string, number> = {};

    // Utiliser seulement les colonnes visibles
    const visibleColumns = getVisibleColumns();
    visibleColumns.forEach((col) => {
      totals[col.key] = mergedData.reduce((sum, item) => {
        const valueStr = item.values[col.key] || "0,00";
        // Nettoyer la valeur : supprimer apostrophes et espaces, puis remplacer virgules par points
        const cleanedValue = valueStr.replace(/['\s]/g, "").replace(",", ".");
        const value = parseFloat(cleanedValue);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    });

    return totals;
  };

  // ✅ NOUVEAU: Calculer le Top général (meilleur jour du total général)
  const calculateGrandTop = (): string => {
    if (!dashboardData) return "Aucune donnée";

    // ✅ CORRECTION: Utiliser TOUTES les données brutes (non filtrées)
    const allData = dashboardData.data;
    if (allData.length === 0) return "Aucune donnée";

    // Utiliser TOUTES les colonnes pour calculer le grand total
    const allColumns = dashboardData.columnLabels;
    const dailyGrandTotals: Record<string, number> = {};

    allColumns.forEach((col) => {
      const dailyTotal = allData.reduce((sum, campus) => {
        const valueStr = campus.values[col.key] || "0,00";
        // Nettoyer la valeur : supprimer apostrophes et espaces, puis remplacer virgules par points
        const cleanedValue = valueStr.replace(/['\s]/g, "").replace(",", ".");
        const value = parseFloat(cleanedValue);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
      dailyGrandTotals[col.key] = dailyTotal;
    });

    // Trouver le jour avec le total général le plus élevé
    let maxValue = 0;
    let bestDate = "";

    Object.entries(dailyGrandTotals).forEach(([dateKey, total]) => {
      if (total > maxValue) {
        maxValue = total;
        // Trouver le label correspondant à cette clé
        const dateLabel =
          allColumns.find((col) => col.key === dateKey)?.label || dateKey;
        bestDate = dateLabel;
      }
    });

    return maxValue > 0
      ? `${formatCurrency(maxValue)} / ${bestDate}`
      : "Aucune donnée";
  };

  // ✅ FONCTION POUR FILTRER LES COLONNES AVEC DONNÉES INTELLIGENTE (MAX 7 COLONNES)
  const getVisibleColumns = () => {
    if (!dashboardData) return [];

    const mergedData = getMergedData();
    const allColumns = dashboardData.columnLabels;

    // Identifier toutes les colonnes avec des données (total > 0)
    const columnsWithDataIndexes: number[] = [];

    allColumns.forEach((col, index) => {
      const columnTotal = mergedData.reduce((sum, item) => {
        const valueStr = item.values[col.key] || "0,00";
        const cleanedValue = valueStr.replace(/['\s]/g, "").replace(",", ".");
        const value = parseFloat(cleanedValue);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);

      if (columnTotal > 0) {
        columnsWithDataIndexes.push(index);
      }
    });

    // Si aucune donnée, retourner les 7 dernières colonnes
    if (columnsWithDataIndexes.length === 0) {
      return allColumns.slice(-7);
    }

    // Trouver le premier et le dernier index avec des données
    const firstDataIndex = Math.min(...columnsWithDataIndexes);
    const lastDataIndex = Math.max(...columnsWithDataIndexes);

    // Calculer la plage complète (du premier au dernier jour avec données)
    const fullRange = allColumns.slice(firstDataIndex, lastDataIndex + 1);

    // Si la plage complète fait 7 colonnes ou moins, la retourner entièrement
    if (fullRange.length <= 7) {
      return fullRange;
    }

    // Sinon, prendre les 7 dernières colonnes de cette plage
    return fullRange.slice(-7);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Erreur lors du chargement des données
          </p>
          <Button
            onClick={() =>
              Promise.all([fetchDashboardData(), fetchPayrollRatios()])
            }
            className="mt-4"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const grouped = groupedData();
  const grandTotals = calculateGrandTotal();
  const mergedData = getMergedData();
  const visibleColumns = getVisibleColumns();

  // ✅ NOUVEAU: Calculer les totaux pour chaque groupe dynamiquement
  const groupTotals: Record<string, Record<string, number>> = {};
  const groupTops: Record<string, string> = {};
  Object.keys(grouped).forEach((groupKey) => {
    groupTotals[groupKey] = calculateGroupTotals(grouped[groupKey]);
    groupTops[groupKey] = calculateGroupTop(grouped[groupKey]);
  });

  return (
    <TooltipProvider>
      {/* ✅ CHANGEMENT 1: Conteneur principal SANS width/padding contraints */}
      <div className="w-full">
        {/* Header avec titre et actions - Hauteur réduite */}
        <div className="flex items-center justify-between mb-2 px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Tableau de bord
            </h1>
            <Link
              href="/dashboard/mandates"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors underline"
            >
              Index des mandats
            </Link>
          </div>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              onClick={() => router.push("/dashboard/dayvalues/create")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 text-base font-semibold"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un CA
            </Button>

            <div className="h-8 w-px bg-border"></div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push("/dashboard/analytics")}
                variant="outline"
                className="border-slate-200 hover:bg-slate-50"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>

              <Button
                onClick={() => router.push("/dashboard/payroll")}
                variant="outline"
                className="border-slate-200 hover:bg-slate-50"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Masse salariale
              </Button>

              <Button
                onClick={() => router.push("/dashboard/import")}
                variant="outline"
                size="sm"
                className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>

              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Menu Burger - Mobile uniquement */}
          <div className="md:hidden relative">
            <PremiumBurgerButton
              isOpen={isBurgerMenuOpen}
              onClick={() => setIsBurgerMenuOpen(!isBurgerMenuOpen)}
              variant="subtle"
            />

            {/* Menu dropdown mobile */}
            <AnimatePresence>
              {isBurgerMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setIsBurgerMenuOpen(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 w-64 bg-white rounded-md shadow-lg border border-slate-200 z-50 overflow-hidden"
                  >
                    <div className="py-2">
                      {/* Action principale */}
                      <div className="px-3 pb-2 border-b border-slate-100">
                        <Button
                          onClick={() => {
                            router.push("/dashboard/dayvalues/create");
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm h-8"
                          size="sm"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter un CA
                        </Button>
                      </div>

                      {/* Autres actions */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            router.push("/dashboard/analytics");
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <BarChart3 className="mr-3 h-4 w-4 text-slate-500" />
                          Analytics
                        </button>

                        <button
                          onClick={() => {
                            router.push("/dashboard/payroll");
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Calculator className="mr-3 h-4 w-4 text-slate-500" />
                          Masse salariale
                        </button>

                        <div className="h-px bg-slate-100 my-1 mx-3"></div>

                        <button
                          onClick={() => {
                            router.push("/dashboard/import");
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Upload className="mr-3 h-4 w-4 text-slate-500" />
                          Import
                        </button>

                        <button
                          onClick={() => {
                            handleExport();
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="mr-3 h-4 w-4 text-slate-500" />
                          Exporter
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Table avec scroll horizontal sur mobile */}
        {mergedData.length === 0 ? (
          <EmptyState
            type="mandates"
            onPrimaryAction={() => router.push("/dashboard/mandates/create")}
            className="min-h-[500px]"
          />
        ) : (
          <Card className="shadow-lg border-slate-200">
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[1000px]">
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="w-[200px] py-0.5 text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <span>Mandants</span>
                        <div className="relative">
                          {!isSearchExpanded ? (
                            <button
                              onClick={() => setIsSearchExpanded(true)}
                              className="p-1 hover:bg-slate-100 rounded transition-colors"
                              title="Cliquer pour rechercher"
                            >
                              <Search className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                                <Input
                                  placeholder="Rechercher..."
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                  onBlur={() => {
                                    if (!searchTerm) {
                                      setIsSearchExpanded(false);
                                    }
                                  }}
                                  className="pl-7 h-6 w-32 text-xs border-slate-200 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 bg-white/90 placeholder:text-slate-400"
                                  autoFocus
                                />
                              </div>
                              {searchTerm && (
                                <button
                                  onClick={() => {
                                    setSearchTerm("");
                                    setIsSearchExpanded(false);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                                  title="Effacer la recherche"
                                >
                                  <span className="text-xs text-slate-400 hover:text-slate-600">
                                    ✕
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px] py-0.5 text-sm font-semibold">
                      Dernière saisie
                    </TableHead>
                    <TableHead className="w-[160px] py-0.5 text-sm font-semibold">
                      Top
                    </TableHead>
                    {visibleColumns.map((col) => (
                      <TableHead
                        key={col.key}
                        className="text-center w-[120px] py-0.5 text-sm font-semibold"
                      >
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="w-[60px] py-0.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(grouped).map(([groupKey, groupData]) => {
                    const shouldShowGroup = (() => {
                      if (categoryFilter === "all") return true;
                      if (
                        categoryFilter === "hebergement" &&
                        groupKey === "hebergement"
                      )
                        return true;
                      if (
                        categoryFilter === "restauration" &&
                        groupKey === "restauration"
                      )
                        return true;
                      return categoryFilter === groupKey;
                    })();

                    if (!shouldShowGroup) return null;

                    return (
                      <React.Fragment key={groupKey}>
                        {groupData.map((campus) => (
                          <TableRow
                            key={campus.id}
                            className="hover:bg-muted/50 h-10"
                          >
                            <TableCell className="py-2">
                              <div className="flex items-center space-x-2">
                                <div>
                                  <div className="font-medium text-sm">
                                    {campus.name}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="text-xs">
                                {campus.lastEntry || "Jamais"}
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="text-xs font-medium text-blue-600">
                                {campus.performance}
                              </div>
                            </TableCell>
                            {visibleColumns.map((col) => (
                              <TableCell
                                key={col.key}
                                className="text-center py-2"
                              >
                                <EditableCell
                                  value={campus.values[col.key] || "0.00"}
                                  onSave={async (newValue) => {
                                    await handleSaveValue(
                                      campus.id,
                                      col.key,
                                      newValue
                                    );
                                  }}
                                  formatDisplay={(value) => {
                                    // D'abord nettoyer complètement la valeur (supprimer apostrophes et espaces, puis remplacer virgules par points)
                                    const cleanedValue = value
                                      .replace(/['\s]/g, "")
                                      .replace(",", ".");
                                    const num = parseFloat(cleanedValue);

                                    if (isNaN(num)) return "0";

                                    // Formater avec l'apostrophe suisse pour les milliers et la virgule pour les décimales
                                    if (num >= 1000) {
                                      // Pour les milliers, utiliser l'apostrophe suisse
                                      const parts = num.toFixed(2).split(".");
                                      const integerPart = parts[0].replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        "'"
                                      );
                                      return `${integerPart},${parts[1]}`;
                                    } else {
                                      // Pour les montants < 1000, format normal avec virgule
                                      return num.toFixed(2).replace(".", ",");
                                    }
                                  }}
                                />
                              </TableCell>
                            ))}
                            <TableCell className="py-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/mandates/${campus.id}`
                                      )
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Chiffre d&apos;affaires
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/mandates/${campus.id}/payroll`
                                      )
                                    }
                                  >
                                    <Calculator className="mr-2 h-4 w-4" />
                                    Masse salariale
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/employees?mandateId=${campus.id}`
                                      )
                                    }
                                  >
                                    <Users className="mr-2 h-4 w-4" />
                                    Employés
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/mandates/${campus.id}/edit`
                                      )
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}

                        {groupData.length > 0 && (
                          <TableRow className="bg-slate-50 hover:bg-slate-50 border-t-2 h-10">
                            <TableCell
                              colSpan={2}
                              className="font-semibold text-slate-700 py-2"
                            >
                              <span className="text-sm">
                                {(() => {
                                  if (groupKey === "hebergement")
                                    return "Hébergement";
                                  if (groupKey === "restauration")
                                    return "Restauration";
                                  return getTypeLabel(groupKey);
                                })()}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-700 py-2">
                              <div className="text-xs">
                                {calculateGroupTop(groupData)}
                              </div>
                            </TableCell>
                            {visibleColumns.map((col) => (
                              <TableCell
                                key={col.key}
                                className="text-center font-semibold text-slate-700 py-2"
                              >
                                <div className="text-sm">
                                  {formatCurrency(
                                    groupTotals[groupKey][col.key] || 0
                                  )}
                                </div>
                              </TableCell>
                            ))}
                            <TableCell className="py-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push("/dashboard/ca-types")
                                    }
                                  >
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Voir CA Types
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>

                {categoryFilter === "all" && (
                  <TableFooter>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border-t-4 border-gray-300 h-10">
                      <TableCell
                        colSpan={2}
                        className="font-bold text-gray-900 py-2"
                      >
                        <span className="text-sm">Total général</span>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900 py-2">
                        <div className="text-xs">{calculateGrandTop()}</div>
                      </TableCell>
                      {visibleColumns.map((col) => (
                        <TableCell
                          key={col.key}
                          className="text-center font-bold text-gray-900 py-2"
                        >
                          <div className="text-sm">
                            {formatCurrency(grandTotals[col.key] || 0)}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push("/dashboard/ca-global")
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir CA Global
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
