"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

// Types basés sur le schema Prisma
interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  active: boolean;
  totalRevenue: number;
  lastEntry: Date | null;
  _count?: {
    dayValues: number;
  };
}

export default function CreateDayValuePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loadingMandates, setLoadingMandates] = useState(true);

  // État du formulaire
  const [formData, setFormData] = useState({
    mandateId: "",
    date: new Date().toISOString().split("T")[0], // Date d'aujourd'hui par défaut
    value: "",
  });

  // Gestion des erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les mandats depuis l'API
  useEffect(() => {
    const loadMandates = async () => {
      try {
        setLoadingMandates(true);
        const response = await fetch("/api/mandats");

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des mandats");
        }

        const data = await response.json();
        // Filtrer seulement les mandats actifs
        setMandates(data.filter((m: Mandate) => m.active));
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors du chargement des mandats");
      } finally {
        setLoadingMandates(false);
      }
    };

    loadMandates();
  }, []);

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

    setIsLoading(true);

    try {
      const response = await fetch("/api/valeurs", {
        method: "POST",
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
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      toast.success("Valeur journalière créée avec succès");
      router.push("/dashboard"); // Retour au dashboard
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
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

  // Obtenir le mandat sélectionné
  const selectedMandate = mandates.find((m) => m.id === formData.mandateId);

  // Grouper les mandats par catégorie
  const hebergementMandates = mandates.filter((m) => m.group === "HEBERGEMENT");
  const restaurationMandates = mandates.filter(
    (m) => m.group === "RESTAURATION"
  );

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton
        href="/dashboard"
        label="Retour au dashboard"
        loadingMessage="Retour au dashboard..."
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Nouvelle valeur journalière
        </h1>
        <p className="text-muted-foreground">
          Ajouter une nouvelle valeur pour un mandat à une date donnée
        </p>
      </div>

      {/* Formulaire */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Saisie de valeur
            </CardTitle>
            <CardDescription>
              Remplissez les informations ci-dessous pour enregistrer une
              nouvelle valeur journalière
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
                  disabled={loadingMandates}
                >
                  <SelectTrigger
                    className={errors.mandateId ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={
                        loadingMandates
                          ? "Chargement..."
                          : "Sélectionnez un mandat..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingMandates ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Chargement des mandats...
                      </div>
                    ) : (
                      <>
                        {/* Grouper par type */}
                        {hebergementMandates.length > 0 && (
                          <div className="py-1">
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                              Hébergement
                            </div>
                            {hebergementMandates.map((mandate) => (
                              <SelectItem key={mandate.id} value={mandate.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{mandate.name}</span>
                                  {mandate._count &&
                                    mandate._count.dayValues > 0 && (
                                      <span className="text-xs text-muted-foreground ml-2">
                                        ({mandate._count.dayValues} valeurs)
                                      </span>
                                    )}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        )}

                        {restaurationMandates.length > 0 && (
                          <div className="py-1">
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                              Restauration
                            </div>
                            {restaurationMandates.map((mandate) => (
                              <SelectItem key={mandate.id} value={mandate.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{mandate.name}</span>
                                  {mandate._count &&
                                    mandate._count.dayValues > 0 && (
                                      <span className="text-xs text-muted-foreground ml-2">
                                        ({mandate._count.dayValues} valeurs)
                                      </span>
                                    )}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        )}

                        {mandates.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground">
                            Aucun mandat actif trouvé
                          </div>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errors.mandateId && (
                  <p className="text-sm text-red-500">{errors.mandateId}</p>
                )}
                {selectedMandate && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Groupe:{" "}
                      {selectedMandate.group === "HEBERGEMENT"
                        ? "Hébergement"
                        : "Restauration"}
                    </p>
                    {selectedMandate.lastEntry && (
                      <p>
                        Dernière saisie:{" "}
                        {new Date(selectedMandate.lastEntry).toLocaleDateString(
                          "fr-CH"
                        )}
                      </p>
                    )}
                  </div>
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
                  max={new Date().toISOString().split("T")[0]} // Limite à aujourd'hui
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  La date ne peut pas être dans le futur
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Entrez la valeur en francs suisses (ex: 1250.50)
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>

                <Button
                  type="submit"
                  disabled={
                    isLoading || loadingMandates || mandates.length === 0
                  }
                  className="min-w-[120px]"
                >
                  {isLoading ? (
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
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Aide contextuelle */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">💡 Aide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • <strong>Mandat :</strong> Sélectionnez l&apos;établissement pour
              lequel vous saisissez la valeur
            </p>
            <p>
              • <strong>Date :</strong> La date ne peut pas être dans le futur
            </p>
            <p>
              • <strong>Valeur :</strong> Entrez le montant en francs suisses
              (décimales autorisées)
            </p>
            {mandates.length === 0 && !loadingMandates && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  ⚠️ Aucun mandat actif n&apos;est disponible. Veuillez
                  d&apos;abord créer un mandat.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push("/dashboard/mandates/create")}
                >
                  Créer un mandat
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
