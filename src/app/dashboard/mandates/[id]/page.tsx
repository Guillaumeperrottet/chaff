"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  CalendarIcon,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calculator,
  DollarSign,
  RefreshCw,
  FileSpreadsheet,
  Info,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import PrintableCAReport from "@/app/components/ca/PrintableCAReport";
import PremiumBurgerButton from "@/app/components/ui/BurgerButton";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/app/components/ui/input";

// Types pour les données CA
interface DayCAData {
  date: string;
  value: number;
  formattedDate: string;
}

interface PayrollData {
  year: number;
  month: number;
  grossAmount: number;
  socialCharges: number;
  totalCost: number;
  employeeCount?: number;
}

interface PeriodData {
  year: number;
  month: number;
  label: string;
  totalValue: number;
  dailyValues: DayCAData[];
  previousYearDailyValues: DayCAData[];
  averageDaily: number;
  daysWithData: number;
  cumulativeTotal?: number;
  cumulativePayroll?: number;
  cumulativePreviousYearRevenue?: number;
  cumulativePreviousYearPayroll?: number;
  cumulativeRevenueGrowth?: number | null;
  cumulativePayrollGrowth?: number | null;
  payrollData?: PayrollData;
  payrollToRevenueRatio?: number;
  yearOverYear: {
    previousYearRevenue: number;
    previousYearPayroll?: number;
    revenueGrowth: number | null;
    payrollGrowth: number | null;
  };
}

interface Comparison {
  period: PeriodData;
  comparison: {
    previous: number;
    percentage: number | null;
  };
  yearOverYear: {
    previousYearRevenue: number;
    previousYearPayroll?: number;
    revenueGrowth: number | null;
    payrollGrowth: number | null;
  };
}

interface CAResponse {
  mandate: {
    id: string;
    name: string;
    group: string;
  };
  periods: PeriodData[];
  comparisons: Comparison[];
  summary: {
    totalPeriods: number;
    grandTotal: number;
    averagePerPeriod: number;
    bestPeriod: PeriodData;
    worstPeriod: PeriodData;
    totalPayrollCost: number;
    globalPayrollRatio: number | null;
    yearOverYearGrowth: {
      revenue: number | null;
      payroll: number | null;
    };
  };
  meta: {
    year: number;
    startMonth: number;
    period: string;
    generatedAt: string;
  };
}

// ✅ NOUVEAU: Composant pour l'édition inline des cellules
interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  formatDisplay?: (value: string) => string;
  isEditable: boolean; // Renommé pour plus de clarté
}

// ✅ Validation et formatage de l'input en temps réel
const validateAndFormatInput = (input: string): string => {
  // Autoriser uniquement les chiffres, points, virgules, apostrophes et espaces
  return input.replace(/[^\d.,'\s]/g, "");
};

// ✅ Fonction de nettoyage numérique améliorée (même que dashboard principal)
const cleanNumericValue = (value: string): number => {
  console.log("🔍 Valeur d'entrée:", value);

  // Étape 1: Supprimer tous les espaces
  let cleaned = value.replace(/\s/g, "");
  console.log("Après suppression espaces:", cleaned);

  // Étape 2: Gérer les différents formats de séparateurs
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
    cleaned = cleaned.replace(/'/g, "");
    console.log("Après suppression apostrophes:", cleaned);

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
    const lastCommaIndex = cleaned.lastIndexOf(",");
    const lastDotIndex = cleaned.lastIndexOf(".");

    if (lastDotIndex > lastCommaIndex) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      const parts = cleaned.split(",");
      const integerPart = parts.slice(0, -1).join("");
      const decimalPart = parts[parts.length - 1];
      cleaned = integerPart + "." + decimalPart;
    }
  }
  // Cas 4: Plusieurs points (format comme 3.110.79 où le dernier point est décimal)
  else if (dotCount > 1) {
    console.log("Format avec multiples points détecté");
    const parts = cleaned.split(".");
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.length <= 2) {
        const integerParts = parts.slice(0, -1).join("");
        cleaned = integerParts + "." + lastPart;
      } else {
        cleaned = cleaned.replace(/\./g, "");
      }
    }
  }

  console.log("Valeur finale nettoyée:", cleaned);

  const numericValue = parseFloat(cleaned);
  console.log("Valeur numérique:", numericValue);

  return numericValue;
};

// ✅ COMPOSANT EditableCell ADAPTÉ POUR LES MANDATS
const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  formatDisplay,
  isEditable,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  // Fonction pour obtenir la valeur brute pour l'édition
  const getRawValue = (formattedValue: string): string => {
    return formattedValue.replace(/['\s]/g, "").replace(",", ".");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
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

  // Ne permettre l'édition que si explicitement autorisée
  if (!isEditable) {
    const displayValue = formatDisplay ? formatDisplay(value) : value;
    return (
      <div className="text-sm font-medium text-muted-foreground">
        {displayValue}
      </div>
    );
  }

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
          className="h-8 text-sm text-center border-blue-500 focus:ring-2 focus:ring-blue-500"
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
      className="text-sm font-medium cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded px-1 py-1 transition-colors group"
      onClick={() => {
        const rawValue = getRawValue(value);
        setEditValue(rawValue);
        setIsEditing(true);
      }}
      title="Cliquer pour modifier (année courante uniquement)"
    >
      {displayValue}
      <span className="ml-1 opacity-0 group-hover:opacity-50 text-xs">✏️</span>
    </div>
  );
};

export default function MandateCAPage() {
  const params = useParams();
  const router = useRouter();
  const mandateId = params.id as string;

  const [caData, setCAData] = useState<CAResponse | null>(null);
  const [availableMandates, setAvailableMandates] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedSemester, setSelectedSemester] = useState(() => {
    // Démarrer sur le semestre actuel
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return currentMonth <= 6 ? "1" : "2";
  });
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  // Charger les données CA depuis l'API (maintenant pour 6 mois par semestre)
  useEffect(() => {
    const loadCAData = async () => {
      try {
        setLoading(true);

        // Calculer les mois pour le semestre sélectionné
        const startMonth = selectedSemester === "1" ? 1 : 7;
        const endMonth = selectedSemester === "1" ? 6 : 12;

        const response = await fetch(
          `/api/mandats/${mandateId}/ca?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months`
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données CA");
        }

        const data = await response.json();
        setCAData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des données CA:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    loadCAData();
  }, [mandateId, selectedYear, selectedSemester]);

  // ✅ NOUVELLE FONCTION POUR SAUVEGARDER LES VALEURS AVEC POSSIBILITÉ D'ANNULATION
  const handleSaveValue = async (
    day: number,
    periodIndex: number,
    newValue: string
  ) => {
    try {
      console.log("🔄 handleSaveValue appelée avec:", {
        day,
        periodIndex,
        newValue,
        selectedYear,
      });

      // NOUVELLE LOGIQUE D'ÉDITION :
      // Les données sont éditables quand elles correspondent à l'année sélectionnée
      // (pas forcément l'année système courante)
      console.log(
        "✅ Édition autorisée pour l'année sélectionnée:",
        selectedYear
      );

      // Utiliser la fonction de nettoyage
      const numericValue = cleanNumericValue(newValue);

      if (isNaN(numericValue) || numericValue < 0) {
        toast.error("Veuillez entrer une valeur numérique valide");
        return;
      }

      console.log("✅ Valeur à sauvegarder:", numericValue);

      // Construire la date à partir du jour et de la période
      const period = caData?.periods[periodIndex];
      if (!period) {
        toast.error("Période non trouvée");
        return;
      }

      // Construire la date YYYY-MM-DD
      const dateString = `${period.year}-${period.month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

      console.log("Date construite:", dateString);

      // Sauvegarder l'ancienne valeur pour l'annulation
      const oldValue =
        period.dailyValues.find((dv) => new Date(dv.date).getDate() === day)
          ?.value || 0;

      // Appel API pour sauvegarder (utiliser l'API existante de dashboard/update-value)
      const response = await fetch("/api/dashboard/update-value", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mandateId,
          dateKey: dateString,
          value: numericValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur API:", errorData);
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      // Recharger les données pour refléter les changements
      const startMonth = selectedSemester === "1" ? 1 : 7;
      const endMonth = selectedSemester === "1" ? 6 : 12;
      const refreshResponse = await fetch(
        `/api/mandats/${mandateId}/ca?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months`
      );

      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setCAData(refreshedData);
      }

      // Toast avec possibilité d'annulation pendant 8 secondes
      let isUndoing = false;
      const toastId = toast.success(
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="font-medium">Valeur mise à jour</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(oldValue)} → {formatCurrency(numericValue)}
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
                      dateKey: dateString,
                      value: oldValue,
                    }),
                  }
                );

                if (undoResponse.ok) {
                  // Recharger les données
                  const refreshResponse = await fetch(
                    `/api/mandats/${mandateId}/ca?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months`
                  );

                  if (refreshResponse.ok) {
                    const refreshedData = await refreshResponse.json();
                    setCAData(refreshedData);
                  }

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
          id: `update-${dateString}-${Date.now()}`,
        }
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    }
  };

  // Charger la liste des mandats disponibles
  useEffect(() => {
    const loadAvailableMandates = async () => {
      try {
        const response = await fetch("/api/mandats");
        if (response.ok) {
          const mandates = await response.json();
          setAvailableMandates(
            mandates.map((m: { id: string; name: string }) => ({
              id: m.id,
              name: m.name,
            }))
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement des mandats:", error);
      }
    };
    loadAvailableMandates();
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

  const handleRefresh = () => {
    const loadCAData = async () => {
      try {
        setLoading(true);

        // Calculer les mois pour le semestre sélectionné
        const startMonth = selectedSemester === "1" ? 1 : 7;
        const endMonth = selectedSemester === "1" ? 6 : 12;

        const response = await fetch(
          `/api/mandats/${mandateId}/ca?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months`
        );
        if (!response.ok) throw new Error("Erreur lors du chargement");
        const data = await response.json();
        setCAData(data);
        toast.success("Données actualisées");
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors de l'actualisation");
      } finally {
        setLoading(false);
      }
    };
    loadCAData();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    try {
      toast.loading("Génération de l'export...");

      // Calculer les mois pour le semestre sélectionné
      const startMonth = selectedSemester === "1" ? 1 : 7;
      const endMonth = selectedSemester === "1" ? 6 : 12;

      const response = await fetch(
        `/api/export/ca/${mandateId}?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months`
      );

      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const semesterName = selectedSemester === "1" ? "S1" : "S2";
      a.download = `ca_${caData?.mandate.name}_${selectedYear}_${semesterName}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export téléchargé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  const formatCurrency = (amount: number) => {
    // Formatage manuel avec apostrophe suisse si Intl ne fonctionne pas
    try {
      const formatted = new Intl.NumberFormat("de-CH", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(amount);

      // Si le formatage ne contient pas d'apostrophe, forcer manuellement
      if (amount >= 1000 && !formatted.includes("'")) {
        const parts = amount.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
        return `${integerPart}.${parts[1]}`;
      }

      return formatted;
    } catch {
      // Fallback manuel
      const parts = amount.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
      return `${integerPart}.${parts[1]}`;
    }
  };

  const formatPercentage = (
    value: number | null,
    showSign = true,
    decimals = 1
  ) => {
    if (value === null) return "-";
    const formatted = new Intl.NumberFormat("fr-CH", {
      style: "decimal",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.abs(value));
    const sign = value >= 0 ? "+" : "-";
    const color = value >= 0 ? "text-green-600" : "text-red-600";
    return (
      <span className={color}>
        {showSign && sign}
        {formatted}%
      </span>
    );
  };

  const getGrowthIcon = (value: number | null) => {
    if (value === null) return null;
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  // Créer la structure de données pour le tableau
  const tableData = () => {
    if (!caData)
      return { rows: [], totals: {}, comparisons: {}, payrollTotals: {} };

    // Obtenir tous les jours uniques
    const allDays = new Set<number>();
    caData.periods.forEach((period) => {
      period.dailyValues.forEach((dv) => {
        const day = new Date(dv.date).getDate();
        allDays.add(day);
      });
      period.previousYearDailyValues?.forEach((dv) => {
        const day = new Date(dv.date).getDate();
        allDays.add(day);
      });
    });

    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    // Construire les lignes du tableau
    const rows = sortedDays.map((day) => {
      const values: Record<string, { current: number; previous: number }> = {};

      caData.periods.forEach((period, index) => {
        const dayValue = period.dailyValues.find(
          (dv) => new Date(dv.date).getDate() === day
        );
        const previousDayValue = period.previousYearDailyValues?.find(
          (dv) => new Date(dv.date).getDate() === day
        );

        values[`period_${index}`] = {
          current: dayValue?.value || 0,
          previous: previousDayValue?.value || 0,
        };
      });

      return { day, values };
    });

    // Calculer les totaux
    const totals: Record<string, { current: number; previous: number }> = {};
    const payrollTotals: Record<string, { current: number; previous: number }> =
      {};

    caData.periods.forEach((period, index) => {
      totals[`period_${index}`] = {
        current: period.totalValue,
        previous: period.yearOverYear.previousYearRevenue,
      };

      payrollTotals[`period_${index}`] = {
        current: period.payrollData?.totalCost || 0,
        previous: period.yearOverYear.previousYearPayroll || 0,
      };
    });

    return { rows, totals, payrollTotals };
  };

  // Fonction pour naviguer vers un autre mandat
  const handleMandateChange = (newMandateId: string) => {
    router.push(`/dashboard/mandates/${newMandateId}`);
  };

  const { rows, totals } = tableData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!caData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucune donnée CA trouvée pour ce mandat
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header moderne avec card élégante */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 gap-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {/* Avatar avec gradient */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg">
                  {caData.mandate.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Infos du mandat */}
              <div className="flex-1 min-w-0">
                {/* Nom du mandat avec menu déroulant discret */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 text-xl md:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200 group truncate">
                        <span className="truncate">{caData.mandate.name}</span>
                        <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500 flex-shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {availableMandates
                        .filter((mandate) => mandate.id !== mandateId)
                        .map((mandate) => (
                          <DropdownMenuItem
                            key={mandate.id}
                            onClick={() => handleMandateChange(mandate.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {mandate.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {mandate.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Voir l&apos;analyse CA
                                </div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      {availableMandates.filter(
                        (mandate) => mandate.id !== mandateId
                      ).length === 0 && (
                        <DropdownMenuItem disabled>
                          <div className="text-muted-foreground">
                            Aucun autre mandat disponible
                          </div>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>
                    Analyse CA • {selectedSemester === "1" ? "1er" : "2ème"}{" "}
                    semestre
                  </span>
                  <span className="text-blue-600">•</span>
                  <span>
                    {selectedSemester === "1"
                      ? "Janvier - Juin"
                      : "Juillet - Décembre"}{" "}
                    {selectedYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons d'action - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
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
                      className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50 overflow-hidden"
                    >
                      <div className="py-2">
                        <button
                          onClick={() => {
                            handleRefresh();
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <RefreshCw className="mr-3 h-4 w-4 text-slate-500" />
                          Actualiser
                        </button>

                        <button
                          onClick={() => {
                            handleExport();
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <FileSpreadsheet className="mr-3 h-4 w-4 text-slate-500" />
                          Exporter
                        </button>

                        <button
                          onClick={() => {
                            handlePrint();
                            setIsBurgerMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="mr-3 h-4 w-4 text-slate-500" />
                          Imprimer
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sélecteurs d'année et semestre intégrés */}
          <div className="px-4 md:px-6 py-3 bg-gray-50 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Période :
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Sélecteur d'année */}
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2022, 2023, 2024, 2025].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sélecteur de semestre */}
                  <Select
                    value={selectedSemester}
                    onValueChange={setSelectedSemester}
                  >
                    <SelectTrigger className="w-30 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1er semestre</SelectItem>
                      <SelectItem value="2">2ème semestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <span className="text-xs text-muted-foreground">
                  {selectedSemester === "1"
                    ? "Janvier - Juin"
                    : "Juillet - Décembre"}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <span>Année précédente</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span>Année courante</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau optimisé pour 6 mois par semestre - AFFICHAGE ÉCRAN */}
        <div className="overflow-x-auto border rounded-lg print:hidden">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="border-r w-[60px] text-center text-sm p-2">
                  Jour
                </TableHead>
                {caData.periods.map((period, index) => (
                  <TableHead
                    key={index}
                    className="text-center w-[180px] border-r px-1 py-2"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {period.label.split(" ")[0]}
                      </div>
                      <div className="text-xs">
                        {period.label.split(" ")[1]}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{parseInt(selectedYear) - 1}</span>
                        <span>Actuel</span>
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.day} className="h-8">
                  <TableCell className="border-r font-medium text-center py-1 text-sm p-2">
                    {row.day.toString().padStart(2, "0")}
                  </TableCell>
                  {caData.periods.map((_, index) => (
                    <TableCell
                      key={index}
                      className="text-center border-r px-1 py-1 whitespace-nowrap"
                    >
                      <div className="flex justify-between items-center space-x-1 text-sm">
                        {/* Année précédente */}
                        <div className="flex-1 text-left text-muted-foreground">
                          {row.values[`period_${index}`]?.previous > 0
                            ? formatCurrency(
                                row.values[`period_${index}`].previous
                              )
                            : "-"}
                        </div>
                        {/* Année courante - EDITABLE */}
                        <div className="flex-1 text-right font-medium">
                          <EditableCell
                            value={
                              row.values[
                                `period_${index}`
                              ]?.current?.toString() || "0"
                            }
                            onSave={async (newValue) => {
                              await handleSaveValue(row.day, index, newValue);
                            }}
                            formatDisplay={(value) => {
                              const num = parseFloat(value);
                              return isNaN(num) || num === 0
                                ? "-"
                                : formatCurrency(num);
                            }}
                            isEditable={true} // Toujours éditable dans la vue correspondante
                          />
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* Ligne des totaux CA */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold">Total CA</span>
                </TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      <div className="flex-1 text-left text-muted-foreground">
                        {formatCurrency(
                          (
                            totals as Record<
                              string,
                              { current: number; previous: number }
                            >
                          )[`period_${index}`]?.previous || 0
                        )}
                      </div>
                      <div className="flex-1 text-right font-bold">
                        {formatCurrency(
                          (
                            totals as Record<
                              string,
                              { current: number; previous: number }
                            >
                          )[`period_${index}`]?.current || 0
                        )}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne total jour (moyenne journalière) */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold">CA jour</span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      {/* Année précédente - moyenne journalière */}
                      <div className="flex-1 text-left text-muted-foreground">
                        {period.yearOverYear.previousYearRevenue > 0
                          ? formatCurrency(
                              period.yearOverYear.previousYearRevenue /
                                (period.previousYearDailyValues?.filter(
                                  (dv) => dv.value > 0
                                ).length || 1)
                            )
                          : "-"}
                      </div>
                      {/* Année courante - moyenne journalière */}
                      <div className="flex-1 text-right font-bold">
                        {period.daysWithData > 0
                          ? formatCurrency(period.averageDaily)
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne évolution CA basée sur moyenne journalière */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold">CA %</span>
                </TableCell>
                {caData.periods.map((period, index) => {
                  // Calculer l'évolution basée sur les moyennes journalières
                  const currentAverage = period.averageDaily;
                  const previousAverage =
                    period.yearOverYear.previousYearRevenue > 0 &&
                    period.previousYearDailyValues
                      ? period.yearOverYear.previousYearRevenue /
                        period.previousYearDailyValues.filter(
                          (dv) => dv.value > 0
                        ).length
                      : 0;

                  const averageGrowth =
                    previousAverage > 0
                      ? ((currentAverage - previousAverage) / previousAverage) *
                        100
                      : null;

                  return (
                    <TableCell
                      key={index}
                      className="text-center border-r px-1 py-2 whitespace-nowrap"
                    >
                      <div className="flex justify-center items-center text-sm">
                        {averageGrowth !== null
                          ? formatPercentage(averageGrowth, true, 2)
                          : "-"}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Ligne évolution du cumul */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold">CA cumul</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-xs bg-white border border-gray-200 shadow-lg p-3"
                        sideOffset={8}
                      >
                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-gray-900">
                            Cumul depuis le début du semestre
                          </div>
                          <div className="text-gray-600">
                            Somme progressive des valeurs depuis le début de la
                            période sélectionnée pour l&apos;année courante et
                            l&apos;année précédente.
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-600">
                              <span className="font-medium">Gauche :</span>{" "}
                              Cumul année précédente
                            </div>
                            <div className="text-gray-600">
                              <span className="font-medium">Droite :</span>{" "}
                              Cumul année courante
                            </div>
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            Permet de comparer la progression des objectifs par
                            rapport à l&apos;année précédente.
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      {/* Année précédente - à gauche */}
                      <div className="flex-1 text-left text-muted-foreground">
                        {period.cumulativePreviousYearRevenue
                          ? formatCurrency(period.cumulativePreviousYearRevenue)
                          : "-"}
                      </div>
                      {/* Année courante - à droite */}
                      <div className="flex-1 text-right font-bold">
                        {period.cumulativeTotal
                          ? formatCurrency(period.cumulativeTotal)
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne % cumul */}
              <TableRow className="bg-gray-100 font-medium">
                <TableCell className="bg-gray-100 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold">Cumul %</span>
                  </div>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      <div className="flex-1 text-center font-bold">
                        {period.cumulativeRevenueGrowth !== null &&
                        period.cumulativeRevenueGrowth !== undefined
                          ? formatPercentage(
                              period.cumulativeRevenueGrowth,
                              true,
                              2
                            )
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne des totaux Masse salariale */}
              <TableRow className="bg-blue-50 font-medium border-t-2 border-blue-200">
                <TableCell className="bg-blue-50 border-r text-center py-2 p-2">
                  <span className="text-sm font-bold text-blue-800">
                    Masse sal.
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-1 py-2 whitespace-nowrap"
                  >
                    <div className="flex justify-between items-center space-x-1 text-sm">
                      {/* Année précédente - masse salariale */}
                      <div className="flex-1 text-left text-muted-foreground">
                        {period.yearOverYear.previousYearPayroll
                          ? formatCurrency(
                              period.yearOverYear.previousYearPayroll
                            )
                          : "-"}
                      </div>
                      {/* Année courante - masse salariale */}
                      <div className="flex-1 text-right font-bold text-blue-800">
                        {period.payrollData?.totalCost
                          ? formatCurrency(period.payrollData.totalCost)
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne pourcentage Masse salariale / CA */}
              <TableRow className="bg-blue-50 font-medium">
                <TableCell className="bg-blue-50 border-r text-center py-2 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold text-blue-800">
                      Masse sal. %
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-xs bg-white border border-gray-200 shadow-lg p-3"
                        sideOffset={8}
                      >
                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-gray-900">
                            Ratio Masse salariale / CA
                          </div>
                          <div className="text-gray-600">
                            Pourcentage que représente la masse salariale par
                            rapport au chiffre d&pos;affaires du mois.
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            Un ratio élevé peut indiquer des coûts salariaux
                            importants par rapport aux revenus.
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                {caData.periods.map((period, index) => {
                  // Calculer le ratio pour l'année précédente
                  const previousPayrollRatio =
                    period.yearOverYear.previousYearRevenue > 0 &&
                    period.yearOverYear.previousYearPayroll
                      ? (period.yearOverYear.previousYearPayroll /
                          period.yearOverYear.previousYearRevenue) *
                        100
                      : null;

                  // Ratio pour l'année courante
                  const currentPayrollRatio =
                    period.payrollToRevenueRatio ?? null;

                  return (
                    <TableCell
                      key={index}
                      className="text-center border-r px-1 py-2 whitespace-nowrap"
                    >
                      <div className="flex justify-between items-center space-x-1 text-sm">
                        {/* Année précédente - ratio */}
                        <div className="flex-1 text-left text-muted-foreground">
                          {previousPayrollRatio !== null
                            ? formatPercentage(previousPayrollRatio, false, 1)
                            : "-"}
                        </div>
                        {/* Année courante - ratio */}
                        <div className="flex-1 text-right font-bold text-blue-800">
                          {currentPayrollRatio !== null
                            ? formatPercentage(currentPayrollRatio, false, 1)
                            : "-"}
                        </div>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Ligne séparatrice vide */}
              <TableRow className="h-4">
                <TableCell className="border-r"></TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell key={index} className="border-r"></TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Composant d'impression (caché à l'écran, visible à l'impression) */}
        <div className="hidden print:block">
          <PrintableCAReport caData={caData} selectedYear={selectedYear} />
        </div>

        {/* Statistiques de performance - En bas de page */}
        <div className="print:hidden">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">CA Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.grandTotal)}
                  </div>
                  {caData.summary.yearOverYearGrowth.revenue !== null && (
                    <div className="flex items-center text-sm">
                      {getGrowthIcon(caData.summary.yearOverYearGrowth.revenue)}
                      <span className="ml-1">
                        {formatPercentage(
                          caData.summary.yearOverYearGrowth.revenue,
                          true,
                          2
                        )}{" "}
                        vs {parseInt(selectedYear) - 1}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Masse Salariale</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.totalPayrollCost)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ratio global:{" "}
                    {caData.summary.globalPayrollRatio
                      ? formatPercentage(
                          caData.summary.globalPayrollRatio,
                          false,
                          2
                        )
                      : "-"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Meilleur Mois</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.bestPeriod.totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {caData.summary.bestPeriod.label}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Pire Mois</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.worstPeriod.totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {caData.summary.worstPeriod.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="text-sm text-gray-600 print:hidden">
          <p>
            Données générées le{" "}
            {new Date(caData.meta.generatedAt).toLocaleString("fr-CH")} |
            Comparaisons avec {parseInt(selectedYear) - 1} |
            {selectedSemester === "1" ? "1er semestre" : "2ème semestre"}{" "}
            {selectedYear} | Ratios masse salariale inclus
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
