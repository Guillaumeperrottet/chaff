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
import { Checkbox } from "@/app/components/ui/checkbox";
import { BackButton } from "@/app/components/ui/BackButton";
import {
  User,
  Save,
  X,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  IdCard,
} from "lucide-react";

interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  active: boolean;
}

export default function CreateEmployeePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loadingMandates, setLoadingMandates] = useState(true);

  // État du formulaire
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    mandateId: "",
    position: "",
    hourlyRate: "",
    hiredAt: "",
    isActive: true,
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

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "L'ID employé est obligatoire";
    } else if (formData.employeeId.trim().length < 2) {
      newErrors.employeeId = "L'ID employé doit contenir au moins 2 caractères";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est obligatoire";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "Le prénom doit contenir au moins 2 caractères";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est obligatoire";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Le nom doit contenir au moins 2 caractères";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.mandateId) {
      newErrors.mandateId = "Veuillez sélectionner un établissement";
    }

    if (
      formData.hourlyRate &&
      (isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) < 0)
    ) {
      newErrors.hourlyRate = "Le taux horaire doit être un nombre positif";
    }

    if (
      formData.phoneNumber &&
      !/^[\d\s\+\-\(\)]+$/.test(formData.phoneNumber)
    ) {
      newErrors.phoneNumber = "Format de téléphone invalide";
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
      // Préparer les données
      const submitData = {
        employeeId: formData.employeeId.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        mandateId: formData.mandateId,
        position: formData.position.trim() || undefined,
        hourlyRate: formData.hourlyRate
          ? parseFloat(formData.hourlyRate)
          : undefined,
        hiredAt: formData.hiredAt || undefined,
      };

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Gérer l'erreur d'ID unique
        if (errorData.error?.includes("existe déjà")) {
          setErrors({ employeeId: "Un employé avec cet ID existe déjà" });
          toast.error("Un employé avec cet ID existe déjà");
          return;
        }

        throw new Error(errorData.error || "Erreur lors de la création");
      }

      const newEmployee = await response.json();
      toast.success(
        `Employé "${newEmployee.firstName} ${newEmployee.lastName}" créé avec succès`
      );

      // Redirection vers la liste des employés
      router.push("/dashboard/employees");
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

  // Générer un ID employé automatique
  const generateEmployeeId = () => {
    const selectedMandate = mandates.find((m) => m.id === formData.mandateId);
    if (selectedMandate) {
      const prefix = selectedMandate.group === "HEBERGEMENT" ? "HEB" : "REST";
      const timestamp = Date.now().toString().slice(-4);
      const autoId = `${prefix}${timestamp}`;
      handleInputChange("employeeId", autoId);
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
        href="/dashboard/employees"
        label="Retour aux employés"
        loadingMessage="Retour aux employés..."
      />

      {/* Header avec style similaire aux autres pages */}
      <div className="border-b pb-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Create
        </h1>
        <h2 className="text-2xl font-medium text-gray-700 mt-2">Employee</h2>
      </div>

      {/* Formulaire */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Renseignez les informations de base de l&apos;employé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Employé */}
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-base font-medium">
                    ID Employé <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="employeeId"
                      type="text"
                      value={formData.employeeId}
                      onChange={(e) =>
                        handleInputChange("employeeId", e.target.value)
                      }
                      className={`h-10 ${errors.employeeId ? "border-red-500" : ""}`}
                      placeholder="Ex: HEB001, REST002..."
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateEmployeeId}
                      disabled={!formData.mandateId || isLoading}
                      className="shrink-0"
                    >
                      <IdCard className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.employeeId && (
                    <p className="text-sm text-red-500">{errors.employeeId}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Identifiant unique (sera utilisé pour l&apos;import
                    Gastrotime)
                  </p>
                </div>

                {/* Prénom */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-base font-medium">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`h-10 ${errors.firstName ? "border-red-500" : ""}`}
                    placeholder="Jean"
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>

                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-base font-medium">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`h-10 ${errors.lastName ? "border-red-500" : ""}`}
                    placeholder="Dupont"
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`h-10 pl-10 ${errors.email ? "border-red-500" : ""}`}
                      placeholder="jean.dupont@example.com"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label
                    htmlFor="phoneNumber"
                    className="text-base font-medium"
                  >
                    Téléphone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      className={`h-10 pl-10 ${errors.phoneNumber ? "border-red-500" : ""}`}
                      placeholder="+41 79 123 45 67"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Date d'embauche */}
                <div className="space-y-2">
                  <Label htmlFor="hiredAt" className="text-base font-medium">
                    Date d&apos;embauche
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hiredAt"
                      type="date"
                      value={formData.hiredAt}
                      onChange={(e) =>
                        handleInputChange("hiredAt", e.target.value)
                      }
                      className="h-10 pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Emploi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations d&apos;emploi
              </CardTitle>
              <CardDescription>
                Configurez l&apos;affectation et les conditions de travail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Établissement */}
                <div className="space-y-2">
                  <Label htmlFor="mandate" className="text-base font-medium">
                    Établissement <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.mandateId}
                    onValueChange={(value) =>
                      handleInputChange("mandateId", value)
                    }
                    disabled={isLoading || loadingMandates}
                  >
                    <SelectTrigger
                      className={`h-10 ${errors.mandateId ? "border-red-500" : ""}`}
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
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Chargement des établissements...
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
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    {mandate.name}
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
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-orange-600" />
                                    {mandate.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          )}

                          {mandates.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">
                              Aucun établissement actif trouvé
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
                    <div className="text-sm text-muted-foreground">
                      Groupe:{" "}
                      {selectedMandate.group === "HEBERGEMENT"
                        ? "Hébergement"
                        : "Restauration"}
                    </div>
                  )}
                </div>

                {/* Poste */}
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-base font-medium">
                    Poste
                  </Label>
                  <Input
                    id="position"
                    type="text"
                    value={formData.position}
                    onChange={(e) =>
                      handleInputChange("position", e.target.value)
                    }
                    className="h-10"
                    placeholder="Ex: Réceptionniste, Serveur, Cuisinier..."
                    disabled={isLoading}
                  />
                </div>

                {/* Taux horaire */}
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="text-base font-medium">
                    Taux horaire
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.05"
                      min="0"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        handleInputChange("hourlyRate", e.target.value)
                      }
                      className={`h-10 pl-10 pr-12 ${errors.hourlyRate ? "border-red-500" : ""}`}
                      placeholder="25.00"
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-muted-foreground text-sm">
                        CHF/h
                      </span>
                    </div>
                  </div>
                  {errors.hourlyRate && (
                    <p className="text-sm text-red-500">{errors.hourlyRate}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Taux horaire de base (peut être modifié ultérieurement)
                  </p>
                </div>

                {/* Statut actif */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleInputChange("isActive", !!checked)
                    }
                    disabled={isLoading}
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor="isActive"
                    className="text-base font-medium cursor-pointer"
                  >
                    Employé actif
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex items-center space-x-4 pt-6">
            <Button
              type="submit"
              disabled={isLoading || loadingMandates || mandates.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium rounded-md min-w-[140px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Création...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Employee
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/employees")}
              disabled={isLoading}
              className="px-8 py-3 text-base"
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          </div>
        </form>

        {/* Lien "Back to List" */}
        <div className="mt-8 pt-6 border-t">
          <Button
            variant="link"
            onClick={() => router.push("/dashboard/employees")}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-base"
          >
            Back to List
          </Button>
        </div>
      </div>

      {/* Section d'aide */}
      <Card className="max-w-4xl bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-blue-900">
            💡 Aide à la création d&apos;employé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • <strong>ID Employé :</strong> Utilisez le bouton de génération
              automatique ou créez un identifiant unique
            </p>
            <p>
              • <strong>Établissement :</strong> Sélectionnez
              l&apos;établissement principal de l&apos;employé
            </p>
            <p>
              • <strong>Taux horaire :</strong> Peut être modifié plus tard
              selon les évolutions contractuelles
            </p>
            <p>
              • <strong>Import Gastrotime :</strong> L&apos;ID employé sera
              utilisé pour l&apos;import automatique des données
            </p>
            {mandates.length === 0 && !loadingMandates && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  ⚠️ Aucun établissement actif n&apos;est disponible. Veuillez
                  d&apos;abord créer un mandat.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push("/dashboard/mandates/create")}
                >
                  Créer un établissement
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
