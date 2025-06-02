// src/app/dashboard/DayValues/[id]/edit/page.tsx
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
import { BackButton } from "@/app/components/ui/BackButton";
import { CalendarIcon, Save, X, Loader2 } from "lucide-react";

interface DayValue {
  id: string;
  date: string;
  value: number;
  mandateId: string;
  mandate: {
    id: string;
    name: string;
    group: "HEBERGEMENT" | "RESTAURATION";
  };
  createdAt: string;
  updatedAt: string;
}

interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  active: boolean;
}

export default function EditDayValuePage() {
  const params = useParams();
  const router = useRouter();
  const valueId = params.id as string;

  const [dayValue, setDayValue] = useState<DayValue | null>(null);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    mandateId: "",
    date: "",
    value: "",
  });

  // Gestion des erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Charger la valeur journalière
        const valueResponse = await fetch(`/api/valeurs/${valueId}`);
        if (!valueResponse.ok) {
          throw new Error("Valeur journalière non trouvée");
        }
        const valueData = await valueResponse.json();
        setDayValue(valueData);

        // Charger les mandats
        const mandatesResponse = await fetch("/api/mandats");
        if (!mandatesResponse.ok) {
          throw new Error("Erreur lors du chargement des mandats");
        }
        const mandatesData = await mandatesResponse.json();
        setMandates(mandatesData.filter((m: Mandate) => m.active));

        // Initialiser le formulaire
        setFormData({
          mandateId: valueData.mandateId,
          date: valueData.date.split("T")[0], // Format YYYY-MM-DD
          value: valueData.value.toString(),
        });
      } catch (error) {
        console.error("Erreur:", error);
        toast.error(
          error instanceof Error ? error.message : "Erreur lors du chargement"
        );
        router.push("/dashboard/DayValues");
      } finally {
        setLoading(false);
      }
    };

    if (valueId) {
      loadData();
    }
  }, [valueId, router]);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.mandateId) {
      newErrors.mandateId = "Veuillez sélectionner un mandat";
    }

    if (!formData.date) {
      newErrors.date = "Veuillez sélectionner une date";
    }

    if (!formData.value || isNaN(Number(formData.value))) {
      newErrors.value = "Veuillez entrer une valeur numérique valide";
    } else if (Number(formData.value) < 0) {
      newErrors.value = "La valeur ne peut pas être négative";
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
      const response = await fetch(`/api/valeurs/${valueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mandateId: formData.mandateId,
          date: formData.date,
          value: parseFloat(formData.value),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      toast.success("Valeur journalière mise à jour avec succès");
      router.push("/dashboard/DayValues");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setSaving(false);
    }
  };

  // Gestion des changements dans le formulaire
  const handleInputChange = (field: string, value: string) => {
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

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette valeur ?")) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/valeurs/${valueId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      toast.success("Valeur journalière supprimée avec succès");
      router.push("/dashboard/DayValues");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/DayValues" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!dayValue) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/DayValues" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Valeur journalière non trouvée
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton href="/dashboard/DayValues" label="Retour aux valeurs" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier la valeur journalière
        </h1>
        <p className="text-muted-foreground">
          Modifiez les informations de cette valeur journalière
        </p>
      </div>

      {/* Formulaire */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Modification de valeur
            </CardTitle>
            <CardDescription>
              Modifiez les informations ci-dessous
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection du mandat */}
              <div className="space-y-2">
                <Label htmlFor="mandate">
                  Mandat <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.mandateId}
                  onValueChange={(value) =>
                    handleInputChange("mandateId", value)
                  }
                >
                  <SelectTrigger
                    className={errors.mandateId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Sélectionnez un mandat..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Grouper par type */}
                    <div className="py-1">
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        Hébergement
                      </div>
                      {mandates
                        .filter((mandate) => mandate.group === "HEBERGEMENT")
                        .map((mandate) => (
                          <SelectItem key={mandate.id} value={mandate.id}>
                            {mandate.name}
                          </SelectItem>
                        ))}
                    </div>

                    <div className="py-1">
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        Restauration
                      </div>
                      {mandates
                        .filter((mandate) => mandate.group === "RESTAURATION")
                        .map((mandate) => (
                          <SelectItem key={mandate.id} value={mandate.id}>
                            {mandate.name}
                          </SelectItem>
                        ))}
                    </div>
                  </SelectContent>
                </Select>
                {errors.mandateId && (
                  <p className="text-sm text-red-500">{errors.mandateId}</p>
                )}
              </div>

              {/* Sélection de la date */}
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={errors.date ? "border-red-500" : ""}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date}</p>
                )}
              </div>

              {/* Saisie de la valeur */}
              <div className="space-y-2">
                <Label htmlFor="value">
                  Valeur <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.value}
                    onChange={(e) => handleInputChange("value", e.target.value)}
                    className={`pr-12 ${errors.value ? "border-red-500" : ""}`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-muted-foreground text-sm">CHF</span>
                  </div>
                </div>
                {errors.value && (
                  <p className="text-sm text-red-500">{errors.value}</p>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>

                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/DayValues")}
                    disabled={saving}
                  >
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

      {/* Informations sur la valeur */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Créé le :</span>
              <span>
                {new Date(dayValue.createdAt).toLocaleDateString("fr-CH")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modifié le :</span>
              <span>
                {new Date(dayValue.updatedAt).toLocaleDateString("fr-CH")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mandat actuel :</span>
              <span>{dayValue.mandate.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
