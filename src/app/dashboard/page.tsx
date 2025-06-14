"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
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
  DropdownMenuLabel,
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
  Building2,
  MapPin,
  ChevronDown,
} from "lucide-react";
import EmptyState from "@/app/components/EmptyState";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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

  // ✅ FONCTION POUR OBTENIR L'ICÔNE D'UN TYPE
  const getTypeIcon = (groupId: string) => {
    if (groupId === "HEBERGEMENT" || groupId === "Hébergement") {
      return <Building2 className="mr-1 h-3 w-3" />;
    }
    if (groupId === "RESTAURATION" || groupId === "Restauration") {
      return <MapPin className="mr-1 h-3 w-3" />;
    }

    // Pour les types personnalisés, essayer de récupérer l'icône
    const customType = establishmentTypes.find((type) => type.id === groupId);
    if (customType) {
      // Vous pouvez implémenter une logique pour mapper les icônes ici
      // Pour l'instant, on utilise l'icône par défaut
      return <Building2 className="mr-1 h-3 w-3" />;
    }

    return <Building2 className="mr-1 h-3 w-3" />; // Icône par défaut
  };

  // ✅ FONCTION POUR OBTENIR LA COULEUR D'UN TYPE
  const getTypeVariant = (): "default" | "secondary" | "outline" => {
    // Tous les types utilisent maintenant la même couleur que la Restauration
    return "secondary";
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

    dashboardData.columnLabels.forEach((col) => {
      const dailyCATotal = groupData.reduce((sum, item) => {
        const valueStr = item.values[col.key] || "0,00";
        const value = parseFloat(valueStr.replace(",", "."));
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

    // Calculer le sous-total du groupe pour chaque jour
    const dailyGroupTotals: Record<string, number> = {};

    dashboardData.columnLabels.forEach((col) => {
      const dailyTotal = groupData.reduce((sum, campus) => {
        const valueStr = campus.values[col.key] || "0,00";
        const value = parseFloat(valueStr.replace(",", "."));
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
          dashboardData.columnLabels.find((col) => col.key === dateKey)
            ?.label || dateKey;
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

    dashboardData.columnLabels.forEach((col) => {
      totals[col.key] = mergedData.reduce((sum, item) => {
        const valueStr = item.values[col.key] || "0,00";
        const value = parseFloat(valueStr.replace(",", "."));
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    });

    return totals;
  };

  // ✅ NOUVEAU: Calculer le Top général (meilleur jour du total général)
  const calculateGrandTop = (): string => {
    if (!dashboardData) return "Aucune donnée";
    const mergedData = getMergedData();
    if (mergedData.length === 0) return "Aucune donnée";

    // Calculer le total général pour chaque jour
    const dailyGrandTotals: Record<string, number> = {};

    dashboardData.columnLabels.forEach((col) => {
      const dailyTotal = mergedData.reduce((sum, campus) => {
        const valueStr = campus.values[col.key] || "0,00";
        const value = parseFloat(valueStr.replace(",", "."));
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
          dashboardData.columnLabels.find((col) => col.key === dateKey)
            ?.label || dateKey;
        bestDate = dateLabel;
      }
    });

    return maxValue > 0
      ? `${formatCurrency(maxValue)} / ${bestDate}`
      : "Aucune donnée";
  };

  // ✅ COMPOSANT POUR LES FILTRES DE CATÉGORIE
  const CategoryFilter = () => (
    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
      <SelectTrigger className="w-full h-8 text-xs border-slate-200 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 bg-white/80">
        <SelectValue placeholder="Catégorie" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes catégories</SelectItem>
        <SelectItem value="hebergement">Hébergement</SelectItem>
        <SelectItem value="restauration">Restauration</SelectItem>
        {/* ✅ AJOUTER CHAQUE TYPE PERSONNALISÉ INDIVIDUELLEMENT */}
        {establishmentTypes
          .filter(
            (type) =>
              type.id !== "HEBERGEMENT" &&
              type.id !== "RESTAURATION" &&
              type.label !== "Hébergement" &&
              type.label !== "Restauration"
          )
          .map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );

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
        {/* Header avec titre et actions */}
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Tableau de bord
            </h1>
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

        {/* Header avec filtres */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="bg-white border-b border-slate-200 py-3">
            <div className="flex flex-col space-y-3 md:space-y-0">
              {/* Titre centré */}
              <div className="text-center">
                <CardTitle className="text-xl font-bold text-slate-800 mb-1">
                  Vue d&apos;ensemble du chiffre d&apos;affaires journalier
                </CardTitle>
                <CardDescription className="text-slate-600">
                  <Link
                    href="/dashboard/mandates"
                    className="underline text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Index des mandats
                  </Link>
                </CardDescription>
              </div>

              {/* Menu déroulant des filtres */}
              <div className="flex justify-center pt-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm"
                    >
                      <span className="mr-2">Filtres et recherche</span>
                      <ChevronDown className="h-3 w-3 opacity-70" />
                      {(searchTerm ||
                        categoryFilter !== "all" ||
                        statusFilter !== "all") && (
                        <div className="ml-1 h-2 w-2 bg-blue-500 rounded-full"></div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 p-4" align="center">
                    <div className="space-y-3">
                      {/* Recherche */}
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                          Recherche
                        </label>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <Input
                            placeholder="Rechercher un campus..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-8 text-xs border-slate-200 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 bg-white/80 placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      {/* Filtres */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Catégorie
                          </label>
                          <CategoryFilter />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Statut
                          </label>
                          <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                          >
                            <SelectTrigger className="w-full h-8 text-xs border-slate-200 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 bg-white/80">
                              <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous statuts</SelectItem>
                              <SelectItem value="active">Actif</SelectItem>
                              <SelectItem value="inactive">Inactif</SelectItem>
                              <SelectItem value="new">Nouveau</SelectItem>
                              <SelectItem value="warning">Attention</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Bouton de reset */}
                      {(searchTerm ||
                        categoryFilter !== "all" ||
                        statusFilter !== "all") && (
                        <div className="pt-1.5 border-t border-slate-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchTerm("");
                              setCategoryFilter("all");
                              setStatusFilter("all");
                            }}
                            className="w-full h-8 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                          >
                            ✕ Effacer tous les filtres
                          </Button>
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
        </Card>

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
                  <TableRow className="h-12">
                    <TableHead className="w-[200px] py-3 text-sm font-semibold">
                      Campus
                    </TableHead>
                    <TableHead className="w-[140px] py-3 text-sm font-semibold">
                      Dernière saisie
                    </TableHead>
                    <TableHead className="w-[160px] py-3 text-sm font-semibold">
                      Top
                    </TableHead>
                    {dashboardData.columnLabels.map((col) => (
                      <TableHead
                        key={col.key}
                        className="text-center w-[120px] py-3 text-sm font-semibold"
                      >
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="w-[60px] py-3"></TableHead>
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
                            className="hover:bg-muted/50 h-14"
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center space-x-2">
                                <div>
                                  <div className="font-medium text-base">
                                    {campus.name}
                                  </div>
                                  <Badge
                                    variant={getTypeVariant()}
                                    className="text-sm h-5 px-2 mt-1"
                                  >
                                    {getTypeIcon(campus.category)}
                                    <span className="ml-1">
                                      {getTypeLabel(campus.category)}
                                    </span>
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="text-sm">
                                {campus.lastEntry || "Jamais"}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="text-sm font-medium text-blue-600">
                                {campus.performance}
                              </div>
                            </TableCell>
                            {dashboardData?.columnLabels.map((col) => (
                              <TableCell
                                key={col.key}
                                className="text-center py-3"
                              >
                                <div className="text-sm font-medium">
                                  {campus.values[col.key] || "0.00"}
                                </div>
                              </TableCell>
                            ))}
                            <TableCell className="py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                          <TableRow className="bg-slate-50 hover:bg-slate-50 border-t-2 h-12">
                            <TableCell
                              colSpan={2}
                              className="font-semibold text-slate-700 py-3"
                            >
                              <span className="text-base">
                                {(() => {
                                  if (groupKey === "hebergement")
                                    return "Hébergement";
                                  if (groupKey === "restauration")
                                    return "Restauration";
                                  return getTypeLabel(groupKey);
                                })()}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-700 py-3">
                              <div className="text-sm">
                                {calculateGroupTop(groupData)}
                              </div>
                            </TableCell>
                            {dashboardData?.columnLabels.map((col) => (
                              <TableCell
                                key={col.key}
                                className="text-center font-semibold text-slate-700 py-3"
                              >
                                <div className="text-base">
                                  {formatCurrency(
                                    groupTotals[groupKey][col.key] || 0
                                  )}
                                </div>
                              </TableCell>
                            ))}
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>

                {categoryFilter === "all" && (
                  <TableFooter>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border-t-4 border-gray-300 h-14">
                      <TableCell
                        colSpan={2}
                        className="font-bold text-gray-900 py-3"
                      >
                        <span className="text-base">Total général</span>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900 py-3">
                        <div className="text-sm">{calculateGrandTop()}</div>
                      </TableCell>
                      {dashboardData.columnLabels.map((col) => (
                        <TableCell
                          key={col.key}
                          className="text-center font-bold text-gray-900 py-3"
                        >
                          <div className="text-base">
                            {formatCurrency(grandTotals[col.key] || 0)}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell></TableCell>
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
