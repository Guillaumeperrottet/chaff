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
import {
  Building2,
  Save,
  X,
  Loader2,
  Trash2,
  MapPin,
  Eye,
  Calculator,
  BarChart3,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Download,
  Upload,
} from "lucide-react";
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

// ✅ Interface pour les types d'établissement
interface EstablishmentType {
  id: string;
  label: string;
  description: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  isCustom: boolean;
}

interface Mandate {
  id: string;
  name: string;
  group: string; // ✅ Maintenant accepte n'importe quel string (ID du type)
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

  // ✅ Nouveau : État pour les types d'établissement
  const [establishmentTypes, setEstablishmentTypes] = useState<
    EstablishmentType[]
  >([]);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    group: "", // ✅ Maintenant accepte n'importe quel string
    active: true,
  });

  // Gestion des erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Fonctions utilitaires pour les types
  const fetchEstablishmentTypes = async () => {
    try {
      const response = await fetch("/api/establishment-types");
      if (response.ok) {
        const data = await response.json();
        setEstablishmentTypes(data.types || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des types:", error);
    }
  };

  const getTypeLabel = (groupId: string): string => {
    if (groupId === "HEBERGEMENT") return "Hébergement";
    if (groupId === "RESTAURATION") return "Restauration";

    const customType = establishmentTypes.find((type) => type.id === groupId);
    return customType?.label || groupId;
  };

  const getTypeIcon = (groupId: string) => {
    if (groupId === "HEBERGEMENT")
      return <Building2 className="mr-2 h-4 w-4" />;
    if (groupId === "RESTAURATION") return <MapPin className="mr-2 h-4 w-4" />;

    // Pour les types personnalisés, utiliser l'icône par défaut
    return <Building2 className="mr-2 h-4 w-4" />;
  };

  // Charger les données du mandat et les types d'établissement
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Charger en parallèle les données du mandat et les types
        const [mandateResponse] = await Promise.all([
          fetch(`/api/mandats/${mandateId}`),
          fetchEstablishmentTypes(),
        ]);

        if (!mandateResponse.ok) {
          throw new Error("Mandat non trouvé");
        }

        const mandateData = await mandateResponse.json();
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
      loadData();
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
      <BackButton
        href="/dashboard/mandates"
        label="Retour aux établissements"
      />

      {/* Header moderne avec gradient */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            {/* Avatar avec gradient */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {mandate.name.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 ${mandate.active ? "bg-green-500" : "bg-gray-400"} rounded-full border-2 border-white`}
              ></div>
            </div>

            {/* Infos du mandat */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {mandate.name}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Édition des informations</span>
                <span className="text-blue-600">•</span>
                <span className="flex items-center gap-1">
                  {getTypeIcon(mandate.group)}
                  {getTypeLabel(mandate.group)}
                </span>
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="text-right">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                mandate.active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {mandate.active ? "Actif" : "Inactif"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {mandate._count?.dayValues || 0} saisie(s) CA
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="bg-white border-b border-slate-200">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Informations de l&apos;établissement
              </CardTitle>
              <CardDescription className="text-slate-600">
                Modifiez les paramètres de votre établissement
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Champ Name */}
                <div className="space-y-3">
                  <Label
                    htmlFor="name"
                    className="text-base font-medium text-slate-900"
                  >
                    Nom de l&apos;établissement
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
                    placeholder="Nom de l'établissement..."
                    disabled={saving}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <X className="h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Champ Group */}
                <div className="space-y-3">
                  <Label
                    htmlFor="group"
                    className="text-base font-medium text-slate-900"
                  >
                    Type d&apos;établissement
                  </Label>
                  <Select
                    value={formData.group}
                    onValueChange={(value) => handleInputChange("group", value)}
                    disabled={saving}
                  >
                    <SelectTrigger
                      className={`h-12 text-base transition-all duration-200 ${
                        errors.group
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    >
                      <SelectValue placeholder="Sélectionnez un type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Types par défaut */}
                      <SelectItem value="HEBERGEMENT">
                        <div className="flex items-center gap-2">
                          {getTypeIcon("HEBERGEMENT")}
                          <span>Hébergement</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="RESTAURATION">
                        <div className="flex items-center gap-2">
                          {getTypeIcon("RESTAURATION")}
                          <span>Restauration</span>
                        </div>
                      </SelectItem>

                      {/* Types personnalisés */}
                      {establishmentTypes
                        .filter(
                          (type) =>
                            type.id !== "HEBERGEMENT" &&
                            type.id !== "RESTAURATION" &&
                            type.label !== "Hébergement" &&
                            type.label !== "Restauration"
                        )
                        .map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(type.id)}
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.group && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <X className="h-4 w-4" />
                      {errors.group}
                    </p>
                  )}
                </div>

                {/* Checkbox Actif */}
                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) =>
                      handleInputChange("active", !!checked)
                    }
                    disabled={saving}
                    className="h-5 w-5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="active"
                      className="text-base font-medium cursor-pointer text-slate-900"
                    >
                      Établissement actif
                    </Label>
                    <p className="text-sm text-slate-600">
                      Un établissement inactif ne sera pas visible dans les
                      rapports
                    </p>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={saving || deleting}
                        className="hover:bg-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer l&apos;établissement
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Confirmer la suppression
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer
                          l&apos;établissement &quot;{mandate.name}&quot; ?
                          {mandate._count && mandate._count.dayValues > 0 && (
                            <span className="text-red-600 font-medium">
                              <br />
                              ⚠️ Cet établissement contient{" "}
                              {mandate._count.dayValues} valeur(s) de chiffre
                              d&apos;affaires qui seront également supprimées.
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
                            "Supprimer définitivement"
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
                      className="px-6"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>

                    <Button
                      type="submit"
                      disabled={saving}
                      className="min-w-[140px] bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Enregistrement...
                        </div>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer les modifications
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec statistiques et actions */}
        <div className="space-y-6">
          {/* Statistiques */}
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="bg-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-600 font-medium">
                      Revenue Total
                    </div>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-blue-900 mt-1">
                    {formatCurrency(mandate.totalRevenue)}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-green-600 font-medium">
                      Saisies CA
                    </div>
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-xl font-bold text-green-900 mt-1">
                    {mandate._count?.dayValues || 0}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Dernière: {formatDate(mandate.lastEntry)}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Type</span>
                  <div className="flex items-center text-sm font-medium text-slate-900">
                    {getTypeIcon(mandate.group)}
                    {getTypeLabel(mandate.group)}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Créé le</span>
                  <span className="text-sm text-slate-900">
                    {formatDate(mandate.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Modifié le</span>
                  <span className="text-sm text-slate-900">
                    {formatDate(mandate.updatedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="bg-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => router.push(`/dashboard/mandates/${mandate.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Analyse du CA
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                onClick={() =>
                  router.push(`/dashboard/mandates/${mandate.id}/payroll`)
                }
              >
                <Calculator className="mr-2 h-4 w-4" />
                Masse salariale
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                onClick={() => router.push("/dashboard/dayvalues/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un CA
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                onClick={() => router.push("/dashboard/analytics")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Actions de gestion */}
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="bg-white border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                Gestion
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => router.push("/dashboard/employees")}
              >
                <Users className="mr-2 h-4 w-4" />
                Employés
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => router.push("/dashboard/import")}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import données
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                onClick={() =>
                  window.open(
                    `/api/export/ca/${mandate.id}?year=${new Date().getFullYear()}`,
                    "_blank"
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter CA
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
