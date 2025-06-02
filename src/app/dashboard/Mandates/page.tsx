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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

// Types basés sur ton schema Prisma
interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  active: boolean;
}

// Données simulées (à remplacer par tes vraies données)
const mockMandates: Mandate[] = [
  { id: "1", name: "Camping Lac", group: "HEBERGEMENT", active: true },
  { id: "2", name: "Camping Pont", group: "HEBERGEMENT", active: true },
  { id: "3", name: "Camping Sapins", group: "HEBERGEMENT", active: true },
  { id: "4", name: "Lodges de Camargue", group: "HEBERGEMENT", active: true },
  { id: "5", name: "Granby Café", group: "RESTAURATION", active: false },
  { id: "6", name: "DP-Aigle", group: "RESTAURATION", active: true },
  { id: "7", name: "DP-Bulle", group: "RESTAURATION", active: true },
  { id: "8", name: "DP-Sierre", group: "RESTAURATION", active: true },
  { id: "9", name: "DP-Susten", group: "RESTAURATION", active: true },
  { id: "10", name: "DP-Yverdon", group: "RESTAURATION", active: true },
  { id: "11", name: "Popliving Riaz", group: "HEBERGEMENT", active: true },
  { id: "12", name: "Hôtel Alpha", group: "HEBERGEMENT", active: true },
];

export default function MandatesIndexPage() {
  const router = useRouter();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Charger les mandats (à remplacer par un appel API)
  useEffect(() => {
    const loadMandates = async () => {
      try {
        setLoading(true);

        // Simuler un appel API
        // const response = await fetch("/api/mandates");
        // const data = await response.json();

        // Pour l'instant, utiliser les données simulées
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simuler le chargement
        setMandates(mockMandates);
      } catch (error) {
        console.error("Erreur lors du chargement des mandats:", error);
        toast.error("Erreur lors du chargement des mandats");
      } finally {
        setLoading(false);
      }
    };

    loadMandates();
  }, []);

  // Fonction pour supprimer un mandat
  const handleDelete = async (mandateId: string) => {
    try {
      setDeletingId(mandateId);

      // Appel API pour supprimer
      // const response = await fetch(`/api/mandates/${mandateId}`, {
      //   method: "DELETE",
      // });

      // if (!response.ok) {
      //   throw new Error("Erreur lors de la suppression");
      // }

      // Simuler la suppression
      await new Promise((resolve) => setTimeout(resolve, 500));

      setMandates((prev) => prev.filter((m) => m.id !== mandateId));
      toast.success("Mandat supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression du mandat");
    } finally {
      setDeletingId(null);
    }
  };

  // Fonction pour naviguer vers l'édition
  const handleEdit = (mandateId: string) => {
    router.push(`/dashboard/mandates/${mandateId}/edit`);
  };

  // Fonction pour créer un nouveau mandat
  const handleCreateNew = () => {
    router.push("/dashboard/mandates/create");
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
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Index
        </h1>
        <Button
          variant="link"
          onClick={handleCreateNew}
          className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-base mt-2"
        >
          Create New
        </Button>
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
                  {mandate.group === "HEBERGEMENT"
                    ? "Hébergement"
                    : "Restauration"}
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
                      onClick={() =>
                        router.push(`/dashboard/mandates/${mandate.id}`)
                      }
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="link"
                          className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-sm"
                          disabled={deletingId === mandate.id}
                        >
                          {deletingId === mandate.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Confirmer la suppression
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le mandat &quot;
                            {mandate.name}&quot; ? Cette action est
                            irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(mandate.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Message si aucun mandat */}
      {mandates.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun mandat trouvé</p>
          <Button
            onClick={handleCreateNew}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Créer le premier mandat
          </Button>
        </div>
      )}
    </div>
  );
}
