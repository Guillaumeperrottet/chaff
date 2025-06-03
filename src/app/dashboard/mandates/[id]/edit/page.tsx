// src/app/dashboard/Mandates/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { BackButton } from "@/app/components/ui/BackButton";
import { Building2, Save, X, Loader2, Trash2 } from "lucide-react";
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

export default function EditMandatePage() {
  const params = useParams();
  const router = useRouter();
  const mandateId = params.id as string;

  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    group: "" as "HEBERGEMENT" | "RESTAURATION" | "",
    active: true,
  });

  // Gestion des erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données du mandat
  useEffect(() => {
    const loadMandate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/mandats/${mandateId}`);

        if (!response.ok) {
          throw new Error("Mandat non trouvé");
        }

        const mandateData = await response.json();
        setMandate(mandateData);

        // Initialiser le formulaire
        setFormData({
          name: mandateData.name,
          group: mandateData.group,
          active: mandateData.active,
        });
      } catch (error) {
        console.error("Erreur:", error);
        toast.error(
          error instanceof Error ? error.message : "Erreur lors du chargement"
        );
        router.push("/dashboard/mandates");
      } finally {
        setLoading(false);
      }
    };

    if (mandateId) {
      loadMandate();
    }
  }, [mandateId, router]);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est obligatoire";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.group) {
      newErrors.group = "Veuillez sélectionner un groupe";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/mandats/${mandateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          group: formData.group,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.error?.includes("existe déjà")) {
          setErrors({ name: "Un mandat avec ce nom existe déjà" });
          toast.error("Un mandat avec ce nom existe déjà");
          return;
        }

        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      const updatedMandate = await response.json();
      setMandate(updatedMandate);
      toast.success("Mandat mis à jour avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setSaving(false);
    }
  };

  // Suppression du mandat
  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/mandats/${mandateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      toast.success("Mandat supprimé avec succès");
      router.push("/dashboard/mandates");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeleting(false);
    }
  };

  // Gestion des changements dans le formulaire
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/mandates" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/mandates" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Mandat non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton href="/dashboard/mandates" label="Retour aux mandats" />

      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Edit
        </h1>
        <h2 className="text-2xl font-medium text-gray-700 mt-2">
          {mandate.name}
        </h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations du mandat</CardTitle>
              <CardDescription>
                Modifiez les informations de ce mandat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Champ Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Nom
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`h-10 ${errors.name ? "border-red-500" : ""}`}
                    placeholder="Nom du mandat..."
                    disabled={saving}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Champ Group */}
                <div className="space-y-2">
                  <Label htmlFor="group" className="text-base font-medium">
                    Groupe
                  </Label>
                  <Select
                    value={formData.group}
                    onValueChange={(value) => handleInputChange("group", value)}
                    disabled={saving}
                  >
                    <SelectTrigger
                      className={`h-10 ${errors.group ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Sélectionnez un groupe..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEBERGEMENT">
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4" />
                          Hébergement
                        </div>
                      </SelectItem>
                      <SelectItem value="RESTAURATION">
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4" />
                          Restauration
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.group && (
                    <p className="text-sm text-red-500">{errors.group}</p>
                  )}
                </div>

                {/* Checkbox Activ */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) =>
                      handleInputChange("active", !!checked)
                    }
                    disabled={saving}
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor="active"
                    className="text-base font-medium cursor-pointer"
                  >
                    Actif
                  </Label>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center justify-between pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={saving || deleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Confirmer la suppression
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer le mandat
                          {mandate.name} ?
                          {mandate._count && mandate._count.dayValues > 0 && (
                            <span className="text-red-600 font-medium">
                              <br />
                              ⚠️ Ce mandat contient {
                                mandate._count.dayValues
                              }{" "}
                              valeur(s) journalière(s) qui seront également
                              supprimées.
                            </span>
                          )}
                          <br />
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Suppression...
                            </>
                          ) : (
                            "Supprimer"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard/mandates")}
                      disabled={saving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>

                    <Button
                      type="submit"
                      disabled={saving}
                      className="min-w-[120px]"
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Enregistrement...
                        </div>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Revenue total
                </div>
                <div className="text-lg font-bold">
                  {formatCurrency(mandate.totalRevenue)}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Dernière saisie
                </div>
                <div className="text-sm">{formatDate(mandate.lastEntry)}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Nombre de valeurs
                </div>
                <div className="text-sm">
                  {mandate._count?.dayValues || 0} saisie(s)
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Créé le</div>
                <div className="text-sm">{formatDate(mandate.createdAt)}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Modifié le</div>
                <div className="text-sm">{formatDate(mandate.updatedAt)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/mandates/${mandate.id}`)}
              >
                Voir les données CA
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/dashboard/dayvalues/create")}
              >
                Ajouter une valeur
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
