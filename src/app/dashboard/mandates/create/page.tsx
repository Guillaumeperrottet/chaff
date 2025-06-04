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
import { Building2, Plus, X, Loader2, MapPin, AlertCircle } from "lucide-react";

// Types basés sur le schema Prisma
type MandateGroup = "HEBERGEMENT" | "RESTAURATION";

export default function CreateMandatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    group: "" as MandateGroup | "",
    active: true,
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
              <div className="space-y-3">
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
                    className={`h-12 text-base transition-all duration-200 ${
                      errors.group
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <SelectValue placeholder="Sélectionnez le type d'établissement" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    <SelectItem value="HEBERGEMENT">
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            Hébergement
                          </div>
                          <div className="text-sm text-slate-500">
                            Hôtels, auberges, gîtes • Suivi des nuitées et
                            revenus
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="RESTAURATION">
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            Restauration
                          </div>
                          <div className="text-sm text-slate-500">
                            Restaurants, bars, cafés • Suivi des ventes et
                            revenus
                          </div>
                        </div>
                      </div>
                    </SelectItem>
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
                  disabled={isLoading}
                  className={`bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
                    isMobile ? "w-full h-11 order-2" : "px-8 py-2.5"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Création...
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
