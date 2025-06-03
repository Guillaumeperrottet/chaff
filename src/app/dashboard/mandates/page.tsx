"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Loader2, Plus, Upload, Undo2, Trash2 } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";

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

  // État pour la corbeille temporaire
  const [deletedMandates, setDeletedMandates] = useState<Map<string, Mandate>>(
    new Map()
  );

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

  // Fonction pour supprimer un mandat
  const handleDelete = async (mandateId: string) => {
    try {
      // 1. Trouver le mandat à supprimer
      const mandateToDelete = mandates.find((m) => m.id === mandateId);
      if (!mandateToDelete) {
        toast.error("Mandat introuvable");
        return;
      }

      setDeletingId(mandateId);

      // 2. Supprimer côté serveur
      const response = await fetch(`/api/mandats/${mandateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      // 3. Sauvegarder dans la corbeille temporaire
      setDeletedMandates((prev) =>
        new Map(prev).set(mandateId, mandateToDelete)
      );

      // 4. Retirer de la liste locale immédiatement
      setMandates((prev) => prev.filter((m) => m.id !== mandateId));

      // 5. Afficher le toast avec annulation
      toast.success("Mandat supprimé", {
        description: `"${mandateToDelete.name}" supprimé avec succès`,
        duration: 12000, // 12 secondes pour annuler
        action: {
          label: "Annuler",
          onClick: () => handleUndoDelete(mandateId, mandateToDelete),
        },
      });

      // 6. Programmer le nettoyage de la corbeille
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
      // 1. Recréer le mandat côté serveur
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

      // 2. Remettre dans la liste (remplacer l'ancien ID par le nouveau)
      setMandates((prev) => [...prev, restoredMandate]);

      // 3. Retirer de la corbeille
      setDeletedMandates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(mandateId);
        return newMap;
      });

      // 4. Confirmation
      toast.success("Mandat restauré", {
        description: `"${originalMandate.name}" a été restauré`,
        icon: <Undo2 className="h-4 w-4" />,
      });

      // 5. Rafraîchir pour être sûr que tout est synchronisé
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

  // Fonction pour naviguer vers l'édition
  const handleEdit = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}/edit`);
  };

  // Fonction pour voir les données CA
  const handleViewCA = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}`);
  };

  // Fonction pour créer un nouveau mandat
  const handleCreateNew = () => {
    router.push("/dashboard/mandates/create");
  };

  // Fonction pour l'import
  const handleImport = () => {
    router.push("/dashboard/import");
  };

  // Fonction pour formater la devise
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  // Fonction pour formater la date
  const formatDate = (date: Date | null) => {
    if (!date) return "Jamais";
    return new Date(date).toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Index
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec style identique à ton image */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Index
            </h1>
            {deletedMandates.size > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                <Badge variant="secondary" className="mr-2">
                  {deletedMandates.size} élément(s) en corbeille
                </Badge>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleRestoreAll}
                  className="p-0 h-auto text-xs"
                >
                  Tout restaurer
                </Button>
                <span className="mx-1">•</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleEmptyTrash}
                  className="p-0 h-auto text-xs text-destructive"
                >
                  Vider corbeille
                </Button>
              </p>
            )}
          </div>

          {/* Actions existantes */}
          <div className="flex items-center space-x-4">
            {deletedMandates.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmptyTrash}
                className="text-muted-foreground"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Vider ({deletedMandates.size})
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 mt-2">
          <Button
            variant="link"
            onClick={handleCreateNew}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-base"
          >
            Create New
          </Button>
          <span className="text-gray-400">|</span>
          <Button
            variant="link"
            onClick={handleImport}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-base"
          >
            <Upload className="mr-1 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total mandats</div>
          <div className="text-2xl font-bold">{mandates.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Actifs</div>
          <div className="text-2xl font-bold text-green-600">
            {mandates.filter((m) => m.active).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Hébergement</div>
          <div className="text-2xl font-bold text-blue-600">
            {mandates.filter((m) => m.group === "HEBERGEMENT").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Restauration</div>
          <div className="text-2xl font-bold text-orange-600">
            {mandates.filter((m) => m.group === "RESTAURATION").length}
          </div>
        </div>
      </div>

      {/* Table avec style épuré comme ton image */}
      <div className="bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-left text-base font-medium text-gray-900 py-4">
                Name
              </TableHead>
              <TableHead className="text-left text-base font-medium text-gray-900 py-4">
                Group
              </TableHead>
              <TableHead className="text-left text-base font-medium text-gray-900 py-4">
                Revenue Total
              </TableHead>
              <TableHead className="text-left text-base font-medium text-gray-900 py-4">
                Dernière Saisie
              </TableHead>
              <TableHead className="text-left text-base font-medium text-gray-900 py-4">
                Valeurs
              </TableHead>
              <TableHead className="text-left text-base font-medium text-gray-900 py-4">
                Activ
              </TableHead>
              <TableHead className="text-right text-base font-medium text-gray-900 py-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mandates.map((mandate) => (
              <TableRow
                key={mandate.id}
                className="border-gray-200 hover:bg-gray-50"
              >
                <TableCell className="py-4 text-gray-900 font-normal">
                  {mandate.name}
                </TableCell>
                <TableCell className="py-4 text-gray-700">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      mandate.group === "HEBERGEMENT"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {mandate.group === "HEBERGEMENT"
                      ? "Hébergement"
                      : "Restauration"}
                  </span>
                </TableCell>
                <TableCell className="py-4 text-gray-900 font-medium">
                  {formatCurrency(mandate.totalRevenue)}
                </TableCell>
                <TableCell className="py-4 text-gray-700">
                  {formatDate(mandate.lastEntry)}
                </TableCell>
                <TableCell className="py-4 text-gray-700">
                  {mandate._count?.dayValues || 0} saisies
                </TableCell>
                <TableCell className="py-4">
                  <Checkbox
                    checked={mandate.active}
                    disabled
                    className="h-4 w-4"
                  />
                </TableCell>
                <TableCell className="py-4 text-right">
                  <div className="flex items-center justify-end space-x-2 text-sm">
                    <Button
                      variant="link"
                      onClick={() => handleViewCA(mandate.id)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                    >
                      CA
                    </Button>
                    <span className="text-gray-400">|</span>
                    <Button
                      variant="link"
                      onClick={() => handleEdit(mandate.id)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                    >
                      Edit
                    </Button>
                    <span className="text-gray-400">|</span>

                    {/* Bouton Delete modifié - plus d'AlertDialog */}
                    <Button
                      variant="link"
                      onClick={() => handleDelete(mandate.id)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                      disabled={deletingId === mandate.id}
                    >
                      {deletingId === mandate.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Message si aucun mandat */}
      {mandates.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">Aucun mandat trouvé</p>
          <div className="space-x-4">
            <Button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer le premier mandat
            </Button>
            <Button onClick={handleImport} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importer des données
            </Button>
          </div>
        </div>
      )}

      {/* Footer avec résumé */}
      {mandates.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {mandates.length} mandat(s) •{" "}
              {mandates.filter((m) => m.active).length} actif(s)
            </div>
            <div>
              Revenue totale:{" "}
              <span className="font-medium text-gray-900">
                {formatCurrency(
                  mandates.reduce((sum, m) => sum + m.totalRevenue, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
