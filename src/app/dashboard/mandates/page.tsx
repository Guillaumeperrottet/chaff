// src/app/dashboard/mandates/page.tsx - Version moderne et mobile-friendly
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import {
  Loader2,
  Plus,
  Upload,
  Undo2,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Menu,
  Download,
  BarChart3,
} from "lucide-react";

// Types basés sur le schema Prisma
interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  active: boolean;
  totalRevenue: number;
  lastEntry: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    dayValues: number;
  };
}

export default function MandatesIndexPage() {
  const router = useRouter();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // États pour mobile
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // États de filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // État pour la corbeille temporaire
  const [deletedMandates, setDeletedMandates] = useState<Map<string, Mandate>>(
    new Map()
  );

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Charger les mandats
  useEffect(() => {
    fetchMandates();
  }, []);

  const fetchMandates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mandats?includeInactive=true");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des mandats");
      }

      const data = await response.json();
      setMandates(data);
    } catch (error) {
      console.error("Erreur lors du chargement des mandats:", error);
      toast.error("Erreur lors du chargement des mandats");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les mandats
  const filteredMandates = mandates.filter((mandate) => {
    const matchesSearch = mandate.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesGroup =
      groupFilter === "all" ||
      (groupFilter === "hebergement" && mandate.group === "HEBERGEMENT") ||
      (groupFilter === "restauration" && mandate.group === "RESTAURATION");
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && mandate.active) ||
      (statusFilter === "inactive" && !mandate.active);

    return matchesSearch && matchesGroup && matchesStatus;
  });

  // Fonction pour supprimer un mandat
  const handleDelete = async (mandateId: string) => {
    try {
      const mandateToDelete = mandates.find((m) => m.id === mandateId);
      if (!mandateToDelete) {
        toast.error("Mandat introuvable");
        return;
      }

      setDeletingId(mandateId);

      const response = await fetch(`/api/mandats/${mandateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      setDeletedMandates((prev) =>
        new Map(prev).set(mandateId, mandateToDelete)
      );

      setMandates((prev) => prev.filter((m) => m.id !== mandateId));

      toast.success("Mandat supprimé", {
        description: `"${mandateToDelete.name}" supprimé avec succès`,
        duration: 12000,
        action: {
          label: "Annuler",
          onClick: () => handleUndoDelete(mandateId, mandateToDelete),
        },
      });

      setTimeout(() => {
        setDeletedMandates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(mandateId);
          return newMap;
        });
      }, 12000);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression du mandat"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Fonction pour annuler une suppression
  const handleUndoDelete = async (
    mandateId: string,
    originalMandate: Mandate
  ) => {
    try {
      const response = await fetch("/api/mandats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: originalMandate.name,
          group: originalMandate.group,
          active: originalMandate.active,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la restauration");
      }

      const restoredMandate = await response.json();
      setMandates((prev) => [...prev, restoredMandate]);

      setDeletedMandates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(mandateId);
        return newMap;
      });

      toast.success("Mandat restauré", {
        description: `"${originalMandate.name}" a été restauré`,
        icon: <Undo2 className="h-4 w-4" />,
      });

      setTimeout(() => {
        fetchMandates();
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      toast.error("Impossible de restaurer le mandat");
    }
  };

  // Fonction pour vider la corbeille
  const handleEmptyTrash = () => {
    const count = deletedMandates.size;
    setDeletedMandates(new Map());

    toast.info("Corbeille vidée", {
      description: `${count} mandat(s) définitivement supprimé(s)`,
    });
  };

  // Fonction pour restaurer tous les éléments de la corbeille
  const handleRestoreAll = async () => {
    const itemsToRestore = Array.from(deletedMandates.values());

    for (const mandate of itemsToRestore) {
      await handleUndoDelete(mandate.id, mandate);
    }

    toast.success(`${itemsToRestore.length} mandat(s) restauré(s)`);
  };

  // Fonctions de navigation
  const handleEdit = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}/edit`);
  };

  const handleViewCA = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}`);
  };

  const handleCreateNew = () => {
    router.push("/dashboard/mandates/create");
  };

  const handleImport = () => {
    router.push("/dashboard/import");
  };

  // Fonctions utilitaires
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Jamais";
    return new Date(date).toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Composant Card pour mobile
  const MandateCard = ({ mandate }: { mandate: Mandate }) => (
    <Card className="mb-4 hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        {/* Header avec nom et actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900">
              {mandate.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  mandate.group === "HEBERGEMENT" ? "default" : "secondary"
                }
                className="text-xs"
              >
                {mandate.group === "HEBERGEMENT" ? (
                  <>
                    <Building2 className="mr-1 h-3 w-3" />
                    Hébergement
                  </>
                ) : (
                  <>
                    <MapPin className="mr-1 h-3 w-3" />
                    Restauration
                  </>
                )}
              </Badge>

              <Badge
                variant={mandate.active ? "outline" : "secondary"}
                className="text-xs"
              >
                {mandate.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewCA(mandate.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir CA
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(mandate.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(mandate.id)}
                className="text-red-600"
                disabled={deletingId === mandate.id}
              >
                {deletingId === mandate.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-50 p-3 rounded-lg border">
            <div className="flex items-center gap-1 text-slate-600 mb-1">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs font-medium">Revenue Total</span>
            </div>
            <div className="font-semibold text-slate-900">
              {formatCurrency(mandate.totalRevenue)}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border">
            <div className="flex items-center gap-1 text-slate-600 mb-1">
              <BarChart3 className="h-3 w-3" />
              <span className="text-xs font-medium">Saisies</span>
            </div>
            <div className="font-semibold text-slate-900">
              {mandate._count?.dayValues || 0}
            </div>
          </div>
        </div>

        {/* Dernière saisie */}
        <div className="flex items-center justify-between text-sm text-slate-600 mb-3 py-2 px-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Dernière saisie:</span>
          </div>
          <span className="font-medium">{formatDate(mandate.lastEntry)}</span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewCA(mandate.id)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Eye className="mr-2 h-4 w-4" />
            Voir CA
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(mandate.id)}
            className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Composant filtres mobile
  const MobileFilters = () => (
    <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Filtres</SheetTitle>
          <SheetDescription>
            Filtrez la liste des établissements
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Recherche */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Nom de l'établissement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Groupe */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="hebergement">Hébergement</SelectItem>
                <SelectItem value="restauration">Restauration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs seulement</SelectItem>
                <SelectItem value="inactive">Inactifs seulement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bouton reset */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setGroupFilter("all");
              setStatusFilter("all");
            }}
            className="w-full"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header moderne et responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Établissements
          </h1>
          <p className="text-slate-600 mt-1">
            Gérez vos mandats et suivez leurs performances
          </p>

          {/* Badge corbeille */}
          {deletedMandates.size > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {deletedMandates.size} en corbeille
              </Badge>
              <Button
                variant="link"
                size="sm"
                onClick={handleRestoreAll}
                className="p-0 h-auto text-xs text-blue-600"
              >
                Tout restaurer
              </Button>
              <span className="text-slate-400">•</span>
              <Button
                variant="link"
                size="sm"
                onClick={handleEmptyTrash}
                className="p-0 h-auto text-xs text-red-600"
              >
                Vider
              </Button>
            </div>
          )}
        </div>

        {/* Actions - Responsive */}
        {isMobile ? (
          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvel établissement
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Menu className="mr-2 h-4 w-4" />
                  Plus d&apos;actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={handleImport}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importer des données
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter la liste
                </DropdownMenuItem>
                {deletedMandates.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleEmptyTrash}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Vider corbeille ({deletedMandates.size})
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvel établissement
            </Button>

            <div className="h-6 w-px bg-slate-300"></div>

            <Button variant="outline" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>

            {deletedMandates.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmptyTrash}
                className="text-slate-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Corbeille ({deletedMandates.size})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Contenu principal avec filtres */}
      <Card className="shadow-lg border-slate-200">
        {/* Header avec filtres */}
        <CardHeader className="border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Liste des établissements
              </CardTitle>
              <CardDescription className="text-slate-600">
                {filteredMandates.length} établissement(s)
                {filteredMandates.length !== mandates.length &&
                  ` sur ${mandates.length}`}
              </CardDescription>
            </div>

            {/* Filtres - Desktop inline, Mobile bouton */}
            <div className="flex items-center gap-3">
              {isMobile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  {(searchTerm ||
                    groupFilter !== "all" ||
                    statusFilter !== "all") && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {
                        [
                          searchTerm,
                          groupFilter !== "all",
                          statusFilter !== "all",
                        ].filter(Boolean).length
                      }
                    </Badge>
                  )}
                </Button>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>

                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="hebergement">Hébergement</SelectItem>
                      <SelectItem value="restauration">Restauration</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>

                  {(searchTerm ||
                    groupFilter !== "all" ||
                    statusFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setGroupFilter("all");
                        setStatusFilter("all");
                      }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      ✕
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Affichage conditionnel : Cards sur mobile, Table sur desktop */}
          {isMobile ? (
            /* Version MOBILE - Cards */
            <div className="space-y-4">
              {filteredMandates.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    {mandates.length === 0
                      ? "Aucun établissement"
                      : "Aucun résultat"}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {mandates.length === 0
                      ? "Créez votre premier établissement pour commencer"
                      : "Essayez de modifier vos critères de recherche"}
                  </p>
                  {mandates.length === 0 && (
                    <Button
                      onClick={handleCreateNew}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Créer un établissement
                    </Button>
                  )}
                </div>
              ) : (
                filteredMandates.map((mandate) => (
                  <MandateCard key={mandate.id} mandate={mandate} />
                ))
              )}
            </div>
          ) : (
            /* Version DESKTOP - Table moderne */
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-200">
                    <TableHead className="font-semibold text-slate-900">
                      Nom
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900">
                      Type
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">
                      Revenue Total
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 text-center">
                      Saisies
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900">
                      Dernière Saisie
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 text-center">
                      Statut
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMandates.map((mandate) => (
                    <TableRow
                      key={mandate.id}
                      className="hover:bg-slate-50 transition-colors border-slate-200"
                    >
                      <TableCell className="font-medium text-slate-900">
                        {mandate.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mandate.group === "HEBERGEMENT"
                              ? "default"
                              : "secondary"
                          }
                          className="font-medium"
                        >
                          {mandate.group === "HEBERGEMENT" ? (
                            <>
                              <Building2 className="mr-1 h-3 w-3" />
                              Hébergement
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-1 h-3 w-3" />
                              Restauration
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        {formatCurrency(mandate.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-center text-slate-700">
                        {mandate._count?.dayValues || 0}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {formatDate(mandate.lastEntry)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={mandate.active ? "outline" : "secondary"}
                        >
                          {mandate.active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCA(mandate.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(mandate.id)}
                            className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(mandate.id)}
                            disabled={deletingId === mandate.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingId === mandate.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Message si aucun mandat */}
              {filteredMandates.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {mandates.length === 0
                      ? "Aucun établissement"
                      : "Aucun résultat"}
                  </h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    {mandates.length === 0
                      ? "Créez votre premier établissement pour commencer à suivre vos revenus"
                      : "Aucun établissement ne correspond à vos critères de recherche"}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {mandates.length === 0 ? (
                      <>
                        <Button
                          onClick={handleCreateNew}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Créer un établissement
                        </Button>
                        <Button onClick={handleImport} variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Importer des données
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setGroupFilter("all");
                          setStatusFilter("all");
                        }}
                      >
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Composant filtres mobile */}
      <MobileFilters />
    </div>
  );
}
