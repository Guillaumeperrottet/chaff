// src/app/dashboard/mandates/create/page.tsx - Version sobre et moderne
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
import { Checkbox } from "@/app/components/ui/checkbox";
import { BackButton } from "@/app/components/ui/BackButton";
import { Building2, Plus, X, Loader2, AlertCircle } from "lucide-react";
import { getIconById, EstablishmentIconType } from "@/lib/establishment-icons";
import { IconSelector } from "@/app/components/ui/icon-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

// Interface pour les types d'établissement
interface EstablishmentType {
  id: string;
  label: string;
  description: string;
  icon: string; // Maintenant on stocke l'ID de l'icône
  iconColor: string;
  bgColor: string;
}

export default function CreateMandatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [limitStatus, setLimitStatus] = useState<{
    canCreate: boolean;
    current: number;
    limit: number | null;
    unlimited: boolean;
  } | null>(null);

  // Types d'établissement disponibles avec API pour la persistance
  const [availableTypes, setAvailableTypes] = useState<EstablishmentType[]>([]);

  // Charger les types depuis l'API au démarrage
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const response = await fetch("/api/establishment-types");
        if (response.ok) {
          const { types } = await response.json();
          setAvailableTypes(types);

          // Vérifier s'il y a des données localStorage à migrer
          await migrateLocalStorageData();
        } else {
          throw new Error("Erreur lors du chargement des types");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des types:", error);
        // Fallback vers les types par défaut si l'API échoue
        const defaultTypes: EstablishmentType[] = [
          {
            id: "HEBERGEMENT",
            label: "Hébergement",
            description:
              "Hôtels, auberges, gîtes • Suivi des nuitées et revenus",
            icon: "BUILDING2",
            iconColor: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          {
            id: "RESTAURATION",
            label: "Restauration",
            description:
              "Restaurants, bars, cafés • Suivi des ventes et revenus",
            icon: "UTENSILS",
            iconColor: "text-orange-600",
            bgColor: "bg-orange-100",
          },
        ];
        setAvailableTypes(defaultTypes);
      }
    };

    loadTypes();
  }, []);

  // Fonction pour migrer les données localStorage vers la base de données
  const migrateLocalStorageData = async () => {
    try {
      const savedCustomTypes = localStorage.getItem(
        "chaff-custom-establishment-types"
      );
      if (savedCustomTypes) {
        const customTypes = JSON.parse(savedCustomTypes);
        if (customTypes.length > 0) {
          const response = await fetch("/api/establishment-types/migrate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ customTypes }),
          });

          if (response.ok) {
            const { migratedCount } = await response.json();
            if (migratedCount > 0) {
              console.log(
                `${migratedCount} type(s) migré(s) depuis localStorage`
              );
              // Supprimer les données localStorage après migration réussie
              localStorage.removeItem("chaff-custom-establishment-types");
              // Recharger les types pour inclure les nouveaux
              const refreshResponse = await fetch("/api/establishment-types");
              if (refreshResponse.ok) {
                const { types } = await refreshResponse.json();
                setAvailableTypes(types);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la migration localStorage:", error);
    }
  };

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    group: "" as string,
    active: true,
  });

  // État pour l'ajout de nouveaux types
  const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [selectedIcon, setSelectedIcon] =
    useState<EstablishmentIconType>("BUILDING2");
  const [selectedIconColor, setSelectedIconColor] = useState("text-purple-600");
  const [selectedBgColor, setSelectedBgColor] = useState("bg-purple-100");
  const [isAddingType, setIsAddingType] = useState(false);

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

  // Vérification des limites au chargement
  useEffect(() => {
    const checkLimits = async () => {
      try {
        const response = await fetch("/api/limits/mandates");
        if (response.ok) {
          const data = await response.json();
          setLimitStatus({
            canCreate:
              data.canCreate ||
              data.unlimited ||
              (data.limit && data.current < data.limit),
            current: data.current,
            limit: data.limit,
            unlimited: data.unlimited,
          });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des limites:", error);
        // En cas d'erreur, on assume qu'on peut créer
        setLimitStatus({
          canCreate: true,
          current: 0,
          limit: null,
          unlimited: true,
        });
      }
    };

    checkLimits();
  }, []);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est obligatoire";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.group) {
      newErrors.group = "Veuillez sélectionner un type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/mandats", {
        method: "POST",
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

        // Gestion spécifique des limites d'abonnement
        if (response.status === 403 && errorData.limits) {
          setErrors({
            general:
              "Vous avez atteint la limite de mandats autorisés pour votre plan actuel.",
          });
          toast.error("Limite atteinte", {
            description:
              "Vous ne pouvez pas créer plus d'établissements avec votre plan actuel.",
          });
          return;
        }

        if (errorData.code === "UNIQUE_CONSTRAINT_VIOLATION") {
          setErrors({ name: "Un établissement avec ce nom existe déjà" });
          toast.error("Ce nom existe déjà");
          return;
        }

        throw new Error(errorData.message || "Erreur lors de la création");
      }

      const newMandate = await response.json();
      toast.success(`"${newMandate.name}" créé avec succès`);
      router.push("/dashboard/mandates");
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

  // Fonction pour ajouter un nouveau type avec persistance
  const handleAddNewType = async () => {
    if (!newTypeName.trim()) return;

    setIsAddingType(true);

    try {
      // Appel API pour enregistrer côté serveur
      const response = await fetch("/api/establishment-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: newTypeName.trim(),
          description: newTypeDescription.trim(),
          icon: selectedIcon,
          iconColor: selectedIconColor,
          bgColor: selectedBgColor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création du type"
        );
      }

      const { type: newTypeFromAPI } = await response.json();

      // Ajouter le nouveau type à la liste
      setAvailableTypes((prev) => [...prev, newTypeFromAPI]);

      // Sélectionner automatiquement le nouveau type
      setFormData((prev) => ({
        ...prev,
        group: newTypeFromAPI.id,
      }));

      // Réinitialiser les champs et fermer le dialog
      setNewTypeName("");
      setNewTypeDescription("");
      setSelectedIcon("BUILDING2");
      setSelectedIconColor("text-purple-600");
      setSelectedBgColor("bg-purple-100");
      setIsAddTypeDialogOpen(false);

      toast.success(`Type "${newTypeFromAPI.label}" créé avec succès !`);
    } catch (error) {
      console.error("Erreur lors de l'ajout du type:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du type"
      );
    } finally {
      setIsAddingType(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Navigation */}
        <BackButton
          href="/dashboard/mandates"
          label="Retour aux établissements"
          className="mb-6"
        />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Nouvel établissement
          </h1>
          <p className="text-slate-600">
            Créez un nouveau mandat pour suivre son activité
          </p>

          {/* Indicateur de limites */}
          {limitStatus && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-sm text-slate-600">
              <Building2 className="h-4 w-4" />
              <span>
                {limitStatus.unlimited
                  ? "Établissements illimités"
                  : `${limitStatus.current}/${limitStatus.limit} établissements utilisés`}
              </span>
              {!limitStatus.unlimited && limitStatus.limit && (
                <span
                  className={`font-medium ${
                    limitStatus.current >= limitStatus.limit * 0.8
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  ({limitStatus.limit - limitStatus.current} disponibles)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Formulaire */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">
              Informations
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Bannière d'alerte préventive si proche de la limite */}
            {limitStatus &&
              !limitStatus.unlimited &&
              limitStatus.limit &&
              limitStatus.current >= limitStatus.limit * 0.9 &&
              limitStatus.canCreate && (
                <div className="mb-6 p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
                  <p className="text-sm text-amber-800">
                    Plus que {limitStatus.limit - limitStatus.current}{" "}
                    établissement(s) disponible(s)
                  </p>
                </div>
              )}

            {/* Bannière d'erreur pour les limites */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Impossible de créer l&apos;établissement
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      {errors.general}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message simple si limite atteinte */}
            {limitStatus?.canCreate === false && (
              <div className="mb-6 p-3 bg-gray-50 border-l-4 border-gray-400 rounded">
                <p className="text-sm text-gray-700">
                  Limite d&apos;établissements atteinte ({limitStatus.current}/
                  {limitStatus.limit}).
                  <a
                    href="/pricing"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Voir les options d&apos;upgrade
                  </a>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-base font-medium text-slate-900"
                >
                  Nom <span className="text-red-500">*</span>
                </Label>

                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`h-12 text-base transition-all duration-200 ${
                    errors.name
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Nom de l'établissement"
                  disabled={isLoading}
                />

                {errors.name && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Type */}
              <div className="space-y-5">
                <Label
                  htmlFor="group"
                  className="text-base font-medium text-slate-900"
                >
                  Type <span className="text-red-500">*</span>
                </Label>

                <Select
                  value={formData.group}
                  onValueChange={(value) => handleInputChange("group", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    className={`h-16 text-base transition-all duration-200 px-4 py-3 ${
                      errors.group
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <SelectValue placeholder="Sélectionnez le type d'établissement" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    {availableTypes.map((type) => {
                      const iconData = getIconById(
                        type.icon as EstablishmentIconType
                      );
                      const IconComponent = iconData.component;
                      return (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-4 py-4">
                            <div
                              className={`w-10 h-10 ${type.bgColor} rounded-lg flex items-center justify-center`}
                            >
                              <IconComponent
                                className={`h-5 w-5 ${type.iconColor}`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 text-base">
                                {type.label}
                              </div>
                              <div className="text-sm text-slate-500 mt-1">
                                {type.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}

                    {/* Bouton pour ajouter un nouveau type */}
                    <div className="border-t border-slate-200 mt-3 pt-3">
                      <Dialog
                        open={isAddTypeDialogOpen}
                        onOpenChange={setIsAddTypeDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Plus className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 text-base">
                                Ajouter un nouveau type
                              </div>
                              <div className="text-sm text-slate-500 mt-1">
                                Créer un type d&apos;établissement personnalisé
                              </div>
                            </div>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Ajouter un nouveau type</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="newTypeName">Nom du type</Label>
                              <Input
                                id="newTypeName"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                placeholder="Ex: Camping, Spa, etc."
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newTypeDescription">
                                Description (optionnel)
                              </Label>
                              <Input
                                id="newTypeDescription"
                                value={newTypeDescription}
                                onChange={(e) =>
                                  setNewTypeDescription(e.target.value)
                                }
                                placeholder="Description du type d'établissement"
                                className="h-10"
                              />
                            </div>

                            {/* Sélection d'icône */}
                            <IconSelector
                              selectedIcon={selectedIcon}
                              onIconSelect={(iconId, iconColor, bgColor) => {
                                setSelectedIcon(iconId);
                                setSelectedIconColor(iconColor);
                                setSelectedBgColor(bgColor);
                              }}
                            />
                            <div className="flex justify-end gap-3 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsAddTypeDialogOpen(false);
                                  setNewTypeName("");
                                  setNewTypeDescription("");
                                  setSelectedIcon("BUILDING2");
                                  setSelectedIconColor("text-purple-600");
                                  setSelectedBgColor("bg-purple-100");
                                }}
                              >
                                Annuler
                              </Button>
                              <Button
                                type="button"
                                onClick={handleAddNewType}
                                disabled={!newTypeName.trim() || isAddingType}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isAddingType ? (
                                  <>
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Ajout...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ajouter
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </SelectContent>
                </Select>

                {errors.group && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.group}
                  </div>
                )}
              </div>

              {/* Statut actif */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    handleInputChange("active", !!checked)
                  }
                  disabled={isLoading}
                  className="h-5 w-5"
                />
                <Label
                  htmlFor="active"
                  className="text-base font-medium text-slate-900 cursor-pointer"
                >
                  Établissement actif
                </Label>
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
                  disabled={isLoading || limitStatus?.canCreate === false}
                  className={`bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
                    isMobile ? "w-full h-11 order-2" : "px-8 py-2.5"
                  } ${limitStatus?.canCreate === false ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Création...
                    </>
                  ) : limitStatus?.canCreate === false ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Limite atteinte
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/mandates")}
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
