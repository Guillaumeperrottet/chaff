"use client";

import { useState } from "react";
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
import { Building2, Plus } from "lucide-react";

// Types basés sur ton schema Prisma
type MandateGroup = "HEBERGEMENT" | "RESTAURATION";

export default function CreateMandatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    group: "" as MandateGroup | "",
    active: true,
  });

  // Gestion des erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    setIsLoading(true);

    try {
      const response = await fetch("/api/mandates", {
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

        // Gérer l'erreur de nom unique
        if (errorData.code === "UNIQUE_CONSTRAINT_VIOLATION") {
          setErrors({ name: "Un mandat avec ce nom existe déjà" });
          toast.error("Un mandat avec ce nom existe déjà");
          return;
        }

        throw new Error(errorData.message || "Erreur lors de la création");
      }

      const newMandate = await response.json();
      toast.success(`Mandat "${newMandate.name}" créé avec succès`);

      // Redirection vers la liste des mandats
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
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton
        href="/dashboard/mandates"
        label="Back to List"
        loadingMessage="Retour à la liste..."
      />

      {/* Header avec style similaire à ton image */}
      <div className="border-b pb-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Create
        </h1>
        <h2 className="text-2xl font-medium text-gray-700 mt-2">Mandate</h2>
      </div>

      {/* Formulaire avec style épuré comme ton image */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Champ Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-lg font-medium text-gray-900">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`h-12 text-base ${errors.name ? "border-red-500" : "border-gray-300"}`}
              placeholder="Entrez le nom du mandat..."
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Champ Group */}
          <div className="space-y-3">
            <Label
              htmlFor="group"
              className="text-lg font-medium text-gray-900"
            >
              Group
            </Label>
            <Select
              value={formData.group}
              onValueChange={(value) => handleInputChange("group", value)}
              disabled={isLoading}
            >
              <SelectTrigger
                className={`h-12 text-base ${errors.group ? "border-red-500" : "border-gray-300"}`}
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
              <p className="text-sm text-red-500 mt-1">{errors.group}</p>
            )}
          </div>

          {/* Checkbox Activ */}
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
              className="text-lg font-medium text-gray-900 cursor-pointer"
            >
              Activ
            </Label>
          </div>

          {/* Boutons d'action avec style similaire à ton image */}
          <div className="flex items-center space-x-4 pt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium rounded-md min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </div>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/mandates")}
              disabled={isLoading}
              className="px-8 py-3 text-base"
            >
              Annuler
            </Button>
          </div>
        </form>

        {/* Lien "Back to List" avec style de ton image */}
        <div className="mt-8 pt-6 border-t">
          <Button
            variant="link"
            onClick={() => router.push("/dashboard/mandates")}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-base"
          >
            Back to List
          </Button>
        </div>
      </div>

      {/* Section d'aide (optionnelle) */}
      <Card className="max-w-2xl bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-blue-900">
            💡 Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              • <strong>Name :</strong> Le nom doit être unique et descriptif
            </p>
            <p>
              • <strong>Group :</strong> Choisissez entre Hébergement ou
              Restauration
            </p>
            <p>
              • <strong>Activ :</strong> Décochez pour créer un mandat inactif
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
