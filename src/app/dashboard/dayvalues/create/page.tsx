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
  DollarSign,
  Building2,
  Calendar,
  Info,
  AlertTriangle,
  TrendingUp,
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
      // Vérifier que la date n'est pas dans le futur
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

  // Calculer la valeur formatée
  const formattedValue = formData.value
    ? new Intl.NumberFormat("fr-CH", {
        style: "currency",
        currency: "CHF",
      }).format(parseFloat(formData.value) || 0)
    : "0.00 CHF";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Navigation */}
        <BackButton
          href="/dashboard"
          label="Retour au dashboard"
          loadingMessage="Retour au dashboard..."
        />

        {/* Header modernisé */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Nouvelle valeur journalière
            </h1>
            <p className="text-lg text-slate-600 mt-2">
              Enregistrez rapidement une nouvelle valeur CA pour vos
              établissements
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire principal */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
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

              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Sélection du mandat avec style amélioré */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Établissement
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.mandateId}
                      onValueChange={(value) =>
                        handleInputChange("mandateId", value)
                      }
                      disabled={loadingMandates}
                    >
                      <SelectTrigger
                        className={`h-12 border-2 transition-all ${
                          errors.mandateId
                            ? "border-red-300 focus:ring-red-500/20"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                      >
                        <SelectValue
                          placeholder={
                            loadingMandates
                              ? "Chargement des établissements..."
                              : "Choisissez un établissement..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {loadingMandates ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                            <span className="text-slate-600">
                              Chargement...
                            </span>
                          </div>
                        ) : (
                          <>
                            {hebergementMandates.length > 0 && (
                              <div className="py-2">
                                <div className="px-3 py-2 text-sm font-bold text-blue-700 bg-blue-50 border-b">
                                  🏨 Hébergement
                                </div>
                                {hebergementMandates.map((mandate) => (
                                  <SelectItem
                                    key={mandate.id}
                                    value={mandate.id}
                                    className="py-3"
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-medium">
                                        {mandate.name}
                                      </span>
                                      <div className="flex items-center gap-2 ml-4">
                                        {mandate._count &&
                                          mandate._count.dayValues > 0 && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              {mandate._count.dayValues} valeurs
                                            </Badge>
                                          )}
                                        <Badge className="text-xs bg-blue-100 text-blue-700">
                                          {new Intl.NumberFormat("fr-CH", {
                                            style: "currency",
                                            currency: "CHF",
                                            notation: "compact",
                                          }).format(mandate.totalRevenue)}
                                        </Badge>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            )}

                            {restaurationMandates.length > 0 && (
                              <div className="py-2">
                                <div className="px-3 py-2 text-sm font-bold text-orange-700 bg-orange-50 border-b">
                                  🍽️ Restauration
                                </div>
                                {restaurationMandates.map((mandate) => (
                                  <SelectItem
                                    key={mandate.id}
                                    value={mandate.id}
                                    className="py-3"
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-medium">
                                        {mandate.name}
                                      </span>
                                      <div className="flex items-center gap-2 ml-4">
                                        {mandate._count &&
                                          mandate._count.dayValues > 0 && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              {mandate._count.dayValues} valeurs
                                            </Badge>
                                          )}
                                        <Badge className="text-xs bg-orange-100 text-orange-700">
                                          {new Intl.NumberFormat("fr-CH", {
                                            style: "currency",
                                            currency: "CHF",
                                            notation: "compact",
                                          }).format(mandate.totalRevenue)}
                                        </Badge>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            )}

                            {mandates.length === 0 && (
                              <div className="text-center py-8 text-slate-500">
                                <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                <p>Aucun établissement actif</p>
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
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-blue-900">
                          Informations établissement
                        </h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">
                            Catégorie:
                          </span>
                          <Badge
                            className={`ml-2 ${
                              selectedMandate.group === "HEBERGEMENT"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {selectedMandate.group === "HEBERGEMENT"
                              ? "🏨 Hébergement"
                              : "🍽️ Restauration"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">
                            CA Total:
                          </span>
                          <span className="ml-2 font-bold text-blue-900">
                            {new Intl.NumberFormat("fr-CH", {
                              style: "currency",
                              currency: "CHF",
                            }).format(selectedMandate.totalRevenue)}
                          </span>
                        </div>
                        {selectedMandate.lastEntry && (
                          <div>
                            <span className="text-blue-700 font-medium">
                              Dernière saisie:
                            </span>
                            <span className="ml-2 text-blue-800">
                              {new Date(
                                selectedMandate.lastEntry
                              ).toLocaleDateString("fr-CH")}
                            </span>
                          </div>
                        )}
                        {selectedMandate._count &&
                          selectedMandate._count.dayValues > 0 && (
                            <div>
                              <span className="text-blue-700 font-medium">
                                Nombre de valeurs:
                              </span>
                              <span className="ml-2 text-blue-800 font-semibold">
                                {selectedMandate._count.dayValues}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Date avec calendrier stylé */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Date
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className={`h-12 border-2 transition-all ${
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
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      La date ne peut pas être dans le futur
                    </p>
                  </div>

                  {/* Valeur avec aperçu formaté */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Montant du CA
                      <span className="text-red-500">*</span>
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
                        className={`h-12 border-2 pr-16 text-lg font-medium transition-all ${
                          errors.value
                            ? "border-red-300 focus:ring-red-500/20"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <span className="text-slate-500 font-medium">CHF</span>
                      </div>
                    </div>
                    {formData.value && !errors.value && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Aperçu:{" "}
                          <span className="font-bold">{formattedValue}</span>
                        </p>
                      </div>
                    )}
                    {errors.value && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {errors.value}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Entrez le montant en francs suisses (décimales autorisées)
                    </p>
                  </div>

                  {/* Boutons d'action modernisés */}
                  <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      disabled={isLoading}
                      className="px-6 py-2 h-11"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>

                    <Button
                      type="submit"
                      disabled={
                        isLoading || loadingMandates || mandates.length === 0
                      }
                      className="px-8 py-2 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Enregistrement...
                        </div>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer la valeur
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar d'aide modernisée */}
          <div className="space-y-6">
            {/* Guide rapide */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <Info className="h-4 w-4 text-emerald-600" />
                  </div>
                  Guide rapide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">
                        Choisissez l&apos;établissement
                      </p>
                      <p className="text-slate-500">
                        Sélectionnez parmi vos mandats actifs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">
                        Définissez la date
                      </p>
                      <p className="text-slate-500">
                        Maximum: aujourd&apos;hui
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
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

            {/* Statistiques rapides */}
            {mandates.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    Vos établissements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total actifs:</span>
                      <span className="font-bold text-slate-800">
                        {mandates.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Hébergement:</span>
                      <span className="font-bold text-blue-600">
                        {hebergementMandates.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Restauration:</span>
                      <span className="font-bold text-orange-600">
                        {restaurationMandates.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Message si aucun mandat */}
            {mandates.length === 0 && !loadingMandates && (
              <Card className="shadow-lg border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800">
                        Aucun établissement
                      </h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Créez d&apos;abord un mandat pour pouvoir saisir des
                        valeurs
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
    </div>
  );
}
