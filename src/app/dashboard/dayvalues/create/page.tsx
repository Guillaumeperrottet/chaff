"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
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
import { Plus, X, Loader2, Building2, AlertCircle, MapPin } from "lucide-react";

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
  const [isMobile, setIsMobile] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    mandateId: "",
    date: new Date().toISOString().split("T")[0],
    value: "",
  });

  // Gestion des erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Détection mobile
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

  // Grouper les mandats par catégorie
  const hebergementMandates = mandates.filter((m) => m.group === "HEBERGEMENT");
  const restaurationMandates = mandates.filter(
    (m) => m.group === "RESTAURATION"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Navigation */}
        <BackButton
          href="/dashboard"
          label="Retour au dashboard"
          className="mb-6"
        />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Nouvelle valeur journalière
          </h1>
          <p className="text-slate-600">
            Ajoutez une nouvelle valeur pour un mandat à une date donnée
          </p>
        </div>

        {/* Formulaire */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">
              Informations
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection du mandat */}
              <div className="space-y-3">
                <Label
                  htmlFor="mandateId"
                  className="text-base font-medium text-slate-900"
                >
                  Établissement
                  <span className="text-red-500 ml-1">*</span>
                </Label>

                <Select
                  value={formData.mandateId}
                  onValueChange={(value) =>
                    handleInputChange("mandateId", value)
                  }
                  disabled={loadingMandates || isLoading}
                >
                  <SelectTrigger
                    className={`h-12 text-base transition-all duration-200 ${
                      errors.mandateId
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <SelectValue
                      placeholder={
                        loadingMandates
                          ? "Chargement des établissements..."
                          : "Sélectionnez votre établissement"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
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
                                <div className="flex items-center gap-3 py-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-slate-900">
                                      {mandate.name}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      Hôtels, auberges, gîtes • CA:{" "}
                                      {new Intl.NumberFormat("fr-CH", {
                                        style: "currency",
                                        currency: "CHF",
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                      }).format(mandate.totalRevenue)}
                                    </div>
                                  </div>
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
                                <div className="flex items-center gap-3 py-2">
                                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <MapPin className="h-4 w-4 text-orange-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-slate-900">
                                      {mandate.name}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      Restaurants, bars, cafés • CA:{" "}
                                      {new Intl.NumberFormat("fr-CH", {
                                        style: "currency",
                                        currency: "CHF",
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                      }).format(mandate.totalRevenue)}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        )}

                        {mandates.length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                              <Building2 className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="font-medium text-slate-900 mb-1">
                              Aucun établissement actif
                            </p>
                            <p className="text-sm text-slate-500">
                              Contactez votre administrateur pour activer des
                              établissements
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>

                {errors.mandateId && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.mandateId}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="date"
                  className="text-base font-medium text-slate-900"
                >
                  Date <span className="text-red-500">*</span>
                </Label>

                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={`h-11 ${
                    errors.date
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={isLoading}
                />

                {errors.date && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.date}
                  </div>
                )}
              </div>

              {/* Valeur */}
              <div className="space-y-2">
                <Label
                  htmlFor="value"
                  className="text-base font-medium text-slate-900"
                >
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
                    onChange={(e) => handleInputChange("value", e.target.value)}
                    className={`h-11 pr-16 ${
                      errors.value
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-slate-500 font-medium">CHF</span>
                  </div>
                </div>

                {errors.value && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.value}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div
                className={`pt-6 ${
                  isMobile
                    ? "flex flex-col gap-3"
                    : "flex items-center justify-between"
                }`}
              >
                <Button
                  type="submit"
                  disabled={
                    isLoading || loadingMandates || mandates.length === 0
                  }
                  className={`bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
                    isMobile ? "w-full h-11 order-2" : "px-8 py-2.5"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  disabled={isLoading}
                  className={`border-slate-300 hover:bg-slate-50 ${
                    isMobile ? "w-full h-11 order-1" : "px-8 py-2.5"
                  }`}
                >
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
