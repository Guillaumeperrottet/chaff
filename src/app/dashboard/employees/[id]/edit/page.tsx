"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  AlertCircle,
} from "lucide-react";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  hourlyRate?: number;
  hiredAt?: Date;
  isActive: boolean;
  mandate: {
    id: string;
    name: string;
    group: string;
  };
  _count: {
    timeEntries: number;
    payrollData: number;
  };
}

interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  active: boolean;
}

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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

  // Charger les données de l'employé et les mandats
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [employeeResponse, mandatesResponse] = await Promise.all([
          fetch(`/api/employees/${employeeId}`),
          fetch("/api/mandats"),
        ]);

        if (!employeeResponse.ok) {
          if (employeeResponse.status === 404) {
            toast.error("Employé non trouvé");
            router.push("/dashboard/employees");
            return;
          }
          throw new Error("Erreur lors du chargement de l'employé");
        }

        if (!mandatesResponse.ok) {
          throw new Error("Erreur lors du chargement des mandats");
        }

        const employeeData = await employeeResponse.json();
        const mandatesData = await mandatesResponse.json();

        setEmployee(employeeData);
        setMandates(mandatesData.filter((m: Mandate) => m.active));

        // Remplir le formulaire avec les données existantes
        setFormData({
          employeeId: employeeData.employeeId,
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email || "",
          phoneNumber: employeeData.phoneNumber || "",
          mandateId: employeeData.mandate.id,
          position: employeeData.position || "",
          hourlyRate: employeeData.hourlyRate?.toString() || "",
          hiredAt: employeeData.hiredAt
            ? new Date(employeeData.hiredAt).toISOString().split("T")[0]
            : "",
          isActive: employeeData.isActive,
        });
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors du chargement des données");
        router.push("/dashboard/employees");
      } finally {
        setLoadingData(false);
      }
    };

    if (employeeId) {
      loadData();
    }
  }, [employeeId, router]);

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
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
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

        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }

      const updatedEmployee = await response.json();
      toast.success(
        `Employé "${updatedEmployee.firstName} ${updatedEmployee.lastName}" mis à jour avec succès`
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

  if (loadingData) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/employees" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/employees" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Employé non trouvé</p>
        </div>
      </div>
    );
  }

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
          Edit
        </h1>
        <h2 className="text-2xl font-medium text-gray-700 mt-2">
          {employee.firstName} {employee.lastName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          ID: {employee.employeeId} • {employee.mandate.name}
        </p>
      </div>

      {/* Alerte si l'employé a des données associées */}
      {(employee._count.timeEntries > 0 || employee._count.payrollData > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-orange-800">
                Cet employé a {employee._count.timeEntries} entrée(s) de temps
                et {employee._count.payrollData} période(s) de paie. Soyez
                prudent lors de la modification de ses informations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                Modifiez les informations de base de l&apos;employé
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
                      className={`h-10 ${
                        errors.employeeId ? "border-red-500" : ""
                      }`}
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
                    className={`h-10 ${
                      errors.firstName ? "border-red-500" : ""
                    }`}
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
                      className={`h-10 pl-10 ${
                        errors.email ? "border-red-500" : ""
                      }`}
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
                      className={`h-10 pl-10 ${
                        errors.phoneNumber ? "border-red-500" : ""
                      }`}
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
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      className={`h-10 ${
                        errors.mandateId ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Sélectionnez un établissement..." />
                    </SelectTrigger>
                    <SelectContent>
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
                      className={`h-10 pl-10 pr-12 ${
                        errors.hourlyRate ? "border-red-500" : ""
                      }`}
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
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium rounded-md min-w-[140px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Mise à jour...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
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
            Back to Employees List
          </Button>
        </div>
      </div>

      {/* Section d'aide */}
      <Card className="max-w-4xl bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-blue-900">
            💡 Aide à l&apos;édition d&apos;employé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • <strong>ID Employé :</strong> Modifiez avec précaution car il
              est utilisé pour les imports Gastrotime
            </p>
            <p>
              • <strong>Établissement :</strong> Changer l&apos;établissement
              peut affecter les rapports existants
            </p>
            <p>
              • <strong>Statut actif :</strong> Désactiver un employé le cache
              de la plupart des vues sans supprimer ses données
            </p>
            <p>
              • <strong>Données existantes :</strong> L&apos;employé a des
              données de temps et de paie qui seront conservées
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
