"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/lib/router-helper";
import { toast } from "sonner";
import { Calendar, Save, X, Building2, MapPin, Euro } from "lucide-react";
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

interface CreateValueForm {
  date: string;
  value: string;
  mandateId: string;
}

interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  active: boolean;
}

export default function NouvelleValeurPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loadingMandates, setLoadingMandates] = useState(true);
  const [form, setForm] = useState<CreateValueForm>({
    date: new Date().toISOString().split("T")[0], // Date d'aujourd'hui par défaut
    value: "",
    mandateId: "",
  });
  const [errors, setErrors] = useState<Partial<CreateValueForm>>({});

  useEffect(() => {
    fetchMandates();
  }, []);

  const fetchMandates = async () => {
    try {
      const response = await fetch("/api/mandats");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      // Filtrer seulement les mandats actifs
      const activeMandates = data.filter((m: Mandate) => m.active);
      setMandates(activeMandates);

      // Si un seul mandat actif, le présélectionner
      if (activeMandates.length === 1) {
        setForm((prev) => ({ ...prev, mandateId: activeMandates[0].id }));
      }
    } catch {
      toast.error("Erreur lors du chargement des mandats");
    } finally {
      setLoadingMandates(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateValueForm> = {};

    // Validation de la date
    if (!form.date) {
      newErrors.date = "La date est obligatoire";
    } else {
      const selectedDate = new Date(form.date);
      const today = new Date();
      const maxDate = new Date(
        today.getFullYear() + 1,
        today.getMonth(),
        today.getDate()
      );

      if (selectedDate > maxDate) {
        newErrors.date = "La date ne peut pas être dans un futur lointain";
      }
    }

    // Validation de la valeur
    if (!form.value.trim()) {
      newErrors.value = "La valeur est obligatoire";
    } else {
      const numValue = parseFloat(form.value.replace(/[^\d.-]/g, ""));
      if (isNaN(numValue) || numValue < 0) {
        newErrors.value = "La valeur doit être un nombre positif";
      } else if (numValue > 1000000) {
        newErrors.value = "La valeur ne peut pas dépasser 1'000'000";
      }
    }

    // Validation du mandat
    if (!form.mandateId) {
      newErrors.mandateId = "Veuillez sélectionner un établissement";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convertir la valeur en nombre
      const numValue = parseFloat(form.value.replace(/[^\d.-]/g, ""));

      const response = await fetch("/api/valeurs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: form.date,
          value: numValue,
          mandateId: form.mandateId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      toast.success("Valeur saisie avec succès");

      // Rediriger vers la liste des valeurs
      router.navigateWithLoading("/dashboard/valeurs", {
        loadingMessage: "Retour à la liste...",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la saisie"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.navigateWithLoading("/dashboard/valeurs", {
      loadingMessage: "Retour à la liste...",
    });
  };

  const updateForm = (field: keyof CreateValueForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Nettoyer l'erreur pour ce champ
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatValueInput = (value: string) => {
    // Supprimer tout ce qui n'est pas un chiffre, un point ou une virgule
    const cleaned = value.replace(/[^\d.,]/g, "");
    // Remplacer la virgule par un point pour la cohérence
    return cleaned.replace(",", ".");
  };

  const getGroupIcon = (group: string) => {
    return group === "HEBERGEMENT" ? Building2 : MapPin;
  };

  const getGroupLabel = (group: string) => {
    return group === "HEBERGEMENT" ? "Hébergement" : "Restauration";
  };

  const selectedMandate = mandates.find((m) => m.id === form.mandateId);

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/valeurs" />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouvelle saisie</h1>
        <p className="text-muted-foreground">
          Enregistrez le chiffre d&apos;affaires journalier d&apos;un
          établissement
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Saisie journalière</CardTitle>
              <CardDescription>
                Renseignez les détails de la journée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => updateForm("date", e.target.value)}
                      className={`pl-10 ${errors.date ? "border-red-500" : ""}`}
                      max={
                        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                          .toISOString()
                          .split("T")[0]
                      }
                    />
                  </div>
                  {errors.date && (
                    <p className="text-sm text-red-500">{errors.date}</p>
                  )}
                </div>

                {/* Établissement */}
                <div className="space-y-2">
                  <Label>
                    Établissement <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.mandateId}
                    onValueChange={(value) => updateForm("mandateId", value)}
                    disabled={loadingMandates}
                  >
                    <SelectTrigger
                      className={errors.mandateId ? "border-red-500" : ""}
                    >
                      <SelectValue
                        placeholder={
                          loadingMandates
                            ? "Chargement..."
                            : "Sélectionnez un établissement"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {mandates.map((mandate) => {
                        const GroupIcon = getGroupIcon(mandate.group);
                        return (
                          <SelectItem key={mandate.id} value={mandate.id}>
                            <div className="flex items-center gap-2">
                              <GroupIcon className="h-4 w-4" />
                              <span>{mandate.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({getGroupLabel(mandate.group)})
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.mandateId && (
                    <p className="text-sm text-red-500">{errors.mandateId}</p>
                  )}
                  {mandates.length === 0 && !loadingMandates && (
                    <p className="text-sm text-amber-600">
                      Aucun mandat actif disponible.
                      <Button
                        variant="link"
                        className="p-0 h-auto ml-1 text-amber-600"
                        onClick={() =>
                          router.navigateWithLoading(
                            "/dashboard/mandats/nouveau"
                          )
                        }
                      >
                        Créer un mandat
                      </Button>
                    </p>
                  )}
                </div>

                {/* Valeur */}
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Chiffre d&apos;affaires{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="value"
                      placeholder="0.00"
                      value={form.value}
                      onChange={(e) =>
                        updateForm("value", formatValueInput(e.target.value))
                      }
                      className={`pl-10 ${errors.value ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-3 top-3 text-sm text-muted-foreground">
                      CHF
                    </span>
                  </div>
                  {errors.value && (
                    <p className="text-sm text-red-500">{errors.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Utilisez le point ou la virgule comme séparateur décimal
                  </p>
                </div>

                {/* Boutons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting || mandates.length === 0}
                    className="flex-1 sm:flex-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Aperçu et aide */}
        <div className="space-y-6">
          {/* Aperçu */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {form.date
                        ? new Date(form.date).toLocaleDateString("fr-CH")
                        : "Non définie"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Établissement:
                    </span>
                    <div className="text-right">
                      {selectedMandate ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const GroupIcon = getGroupIcon(
                              selectedMandate.group
                            );
                            return <GroupIcon className="h-4 w-4" />;
                          })()}
                          <span className="font-medium">
                            {selectedMandate.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Non sélectionné
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Montant:
                    </span>
                    <span className="font-medium font-mono">
                      {form.value ? `${form.value} CHF` : "0.00 CHF"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aide */}
          <Card>
            <CardHeader>
              <CardTitle>Aide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Saisie du montant</p>
                <p className="text-xs text-muted-foreground">
                  • Utilisez le point (.) ou la virgule (,) pour les décimales
                  <br />
                  • Les montants négatifs ne sont pas acceptés
                  <br />• Maximum: 1&apos;000&apos;000 CHF
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Doublons</p>
                <p className="text-xs text-muted-foreground">
                  Une seule valeur par établissement et par date est autorisée
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
