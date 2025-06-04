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
import { Badge } from "@/app/components/ui/badge";
import {
  CalendarIcon,
  Save,
  X,
  Loader2,
  Building2,
  Info,
  AlertTriangle,
} from "lucide-react";

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
    date: new Date().toISOString().split("T")[0],
    value: "",
  });

  // Gestion des erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les mandats
  useEffect(() => {
    const loadMandates = async () => {
      try {
        setLoadingMandates(true);
        const response = await fetch("/api/mandats");

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des mandats");
        }

        const data = await response.json();
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
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (selectedDate > today) {
        newErrors.date = "La date ne peut pas être dans le futur";
      }
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

        if (errorData.code === "UNIQUE_CONSTRAINT_VIOLATION") {
          setErrors({
            date: "Une valeur existe déjà pour ce mandat à cette date",
            mandateId: "Une valeur existe déjà pour ce mandat à cette date",
          });
          toast.error("Une valeur existe déjà pour ce mandat à cette date");
          return;
        }

        throw new Error(errorData.error || "Erreur lors de la création");
      }

      toast.success("Valeur journalière créée avec succès");
      router.push("/dashboard");
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

      {/* Header simple et moderne */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Nouvelle valeur journalière
        </h1>
        <p className="text-slate-600 mt-2">
          Ajouter une nouvelle valeur pour un mandat à une date donnée
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-800">
                    Saisie de valeur
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Complétez les informations ci-dessous
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sélection du mandat */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Établissement <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.mandateId}
                    onValueChange={(value) =>
                      handleInputChange("mandateId", value)
                    }
                    disabled={loadingMandates}
                  >
                    <SelectTrigger
                      className={`h-11 ${
                        errors.mandateId
                          ? "border-red-300 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    >
                      <SelectValue
                        placeholder={
                          loadingMandates
                            ? "Chargement..."
                            : "Sélectionnez un établissement..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingMandates ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
                          <span className="text-slate-600">Chargement...</span>
                        </div>
                      ) : (
                        <>
                          {hebergementMandates.length > 0 && (
                            <div>
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide bg-slate-50">
                                Hébergement
                              </div>
                              {hebergementMandates.map((mandate) => (
                                <SelectItem key={mandate.id} value={mandate.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{mandate.name}</span>
                                    {mandate._count &&
                                      mandate._count.dayValues > 0 && (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2 text-xs"
                                        >
                                          {mandate._count.dayValues} valeurs
                                        </Badge>
                                      )}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          )}

                          {restaurationMandates.length > 0 && (
                            <div>
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide bg-slate-50">
                                Restauration
                              </div>
                              {restaurationMandates.map((mandate) => (
                                <SelectItem key={mandate.id} value={mandate.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{mandate.name}</span>
                                    {mandate._count &&
                                      mandate._count.dayValues > 0 && (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2 text-xs"
                                        >
                                          {mandate._count.dayValues} valeurs
                                        </Badge>
                                      )}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          )}

                          {mandates.length === 0 && (
                            <div className="text-center py-4 text-slate-500">
                              <Building2 className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                              <p className="text-sm">
                                Aucun établissement actif
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.mandateId && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.mandateId}
                    </p>
                  )}
                </div>

                {/* Informations sur le mandat sélectionné */}
                {selectedMandate && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Informations établissement
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm text-blue-800">
                      <div>
                        <span className="font-medium">Catégorie:</span>
                        <Badge
                          variant="outline"
                          className="ml-2 border-blue-300 text-blue-700"
                        >
                          {selectedMandate.group === "HEBERGEMENT"
                            ? "Hébergement"
                            : "Restauration"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">CA Total:</span>
                        <span className="ml-2 font-semibold">
                          {new Intl.NumberFormat("fr-CH", {
                            style: "currency",
                            currency: "CHF",
                          }).format(selectedMandate.totalRevenue)}
                        </span>
                      </div>
                      {selectedMandate.lastEntry && (
                        <div>
                          <span className="font-medium">Dernière saisie:</span>
                          <span className="ml-2">
                            {new Date(
                              selectedMandate.lastEntry
                            ).toLocaleDateString("fr-CH")}
                          </span>
                        </div>
                      )}
                      {selectedMandate._count &&
                        selectedMandate._count.dayValues > 0 && (
                          <div>
                            <span className="font-medium">
                              Nombre de valeurs:
                            </span>
                            <span className="ml-2 font-semibold">
                              {selectedMandate._count.dayValues}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className={`h-11 ${
                      errors.date
                        ? "border-red-300 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.date}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    La date ne peut pas être dans le futur
                  </p>
                </div>

                {/* Valeur */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Montant <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.value}
                      onChange={(e) =>
                        handleInputChange("value", e.target.value)
                      }
                      className={`h-11 pr-16 ${
                        errors.value
                          ? "border-red-300 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-slate-500 font-medium">CHF</span>
                    </div>
                  </div>
                  {errors.value && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.value}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    Entrez la valeur en francs suisses (ex: 1250.50)
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    disabled={isLoading}
                    className="px-6"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>

                  <Button
                    type="submit"
                    disabled={
                      isLoading || loadingMandates || mandates.length === 0
                    }
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Enregistrement...
                      </>
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

        {/* Sidebar d'aide simple */}
        <div className="space-y-4">
          <Card className="shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">
                      Sélectionnez l&apos;établissement
                    </p>
                    <p className="text-slate-500">
                      Choisissez parmi vos mandats actifs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">
                      Définissez la date
                    </p>
                    <p className="text-slate-500">
                      Ne peut pas être dans le futur
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">
                      Saisissez le montant
                    </p>
                    <p className="text-slate-500">En francs suisses (CHF)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message si aucun mandat */}
          {mandates.length === 0 && !loadingMandates && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto" />
                  <div>
                    <h3 className="font-medium text-amber-800">
                      Aucun établissement
                    </h3>
                    <p className="text-sm text-amber-700">
                      Créez d&apos;abord un mandat pour saisir des valeurs
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/mandates/create")}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Créer un mandat
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
