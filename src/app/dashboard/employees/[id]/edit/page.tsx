"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {} from "@/app/components/ui/card";
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
  Save,
  X,
  Loader2,
  Building2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  IdCard,
  AlertCircle,
  User,
  Briefcase,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
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

  // État pour le menu déroulant de la zone de danger
  const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);

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

  // Gestion de la suppression de l'employé
  const handleDeleteEmployee = async () => {
    if (!employee) return;

    const hasData =
      employee._count.timeEntries > 0 || employee._count.payrollData > 0;

    const confirmMessage = hasData
      ? `⚠️ ATTENTION: Cet employé a des données associées (${employee._count.timeEntries} entrées de temps, ${employee._count.payrollData} périodes de paie).\n\nÊtes-vous absolument sûr de vouloir supprimer "${employee.firstName} ${employee.lastName}" ?\n\nCette action est IRRÉVERSIBLE et affectera vos rapports existants.\n\nTapez "SUPPRIMER" pour confirmer.`
      : `Êtes-vous sûr de vouloir supprimer l'employé "${employee.firstName} ${employee.lastName}" ?\n\nCette action est irréversible.\n\nTapez "SUPPRIMER" pour confirmer.`;

    const userInput = prompt(confirmMessage);

    if (userInput !== "SUPPRIMER") {
      if (userInput !== null) {
        toast.error(
          "Suppression annulée - vous devez taper exactement 'SUPPRIMER'"
        );
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      toast.success(
        `Employé "${employee.firstName} ${employee.lastName}" supprimé avec succès`
      );

      // Redirection vers la liste des employés
      router.push("/dashboard/employees");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la suppression"
      );
    } finally {
      setIsLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <BackButton href="/dashboard/employees" />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <BackButton href="/dashboard/employees" />
          <div className="text-center py-12">
            <p className="text-slate-600">Employé non trouvé</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Header avec design financier */}
      <div className="relative overflow-hidden">
        {/* Arrière-plan avec motif subtil */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-indigo-600/5 to-slate-600/3"></div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='6' cy='6' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        <div className="relative border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-6">
              <BackButton
                href="/dashboard/employees"
                label="Retour aux employés"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Icône principale avec gradient */}
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur-md"></div>
                  <div className="relative p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <User className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Modifier l&apos;employé
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-slate-600 font-medium">
                        {employee.firstName} {employee.lastName}
                      </span>
                    </div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                    <span className="text-slate-500 font-mono text-sm">
                      ID: {employee.employeeId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statut et informations */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    employee.isActive
                      ? "bg-emerald-50 border border-emerald-200/50 text-emerald-700"
                      : "bg-slate-50 border border-slate-200/50 text-slate-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      employee.isActive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  ></div>
                  <span className="text-sm font-medium">
                    {employee.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200/50 text-blue-700">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {employee.mandate.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Alerte si l'employé a des données associées */}
        {(employee._count.timeEntries > 0 ||
          employee._count.payrollData > 0) && (
          <div className="mb-8">
            <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">
                    Employé avec données existantes
                  </h3>
                  <p className="text-sm text-amber-700">
                    Cet employé a {employee._count.timeEntries} entrée(s) de
                    temps et {employee._count.payrollData} période(s) de paie.
                    Toute modification impactera les rapports existants.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section Informations personnelles */}
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/30 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      Informations personnelles
                    </h2>
                    <p className="text-sm text-slate-600">
                      Identité et coordonnées de l&apos;employé
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* ID Employé et Statut */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label
                      htmlFor="employeeId"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <IdCard className="h-4 w-4 text-blue-600" />
                      ID Employé <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
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
                          placeholder="EMP-001"
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateEmployeeId}
                        disabled={isLoading || !formData.mandateId}
                        className="h-10 px-3 text-sm"
                      >
                        Auto
                      </Button>
                    </div>
                    {errors.employeeId && (
                      <p className="text-sm text-red-500">
                        {errors.employeeId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Statut
                    </Label>
                    <div className="flex items-center space-x-3 pt-2">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          handleInputChange("isActive", !!checked)
                        }
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor="isActive"
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Employé actif
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Nom et Prénom */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-slate-700"
                    >
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

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-slate-700"
                    >
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
                </div>

                {/* Email et Téléphone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4 text-emerald-600" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`h-10 ${errors.email ? "border-red-500" : ""}`}
                      placeholder="jean.dupont@example.com"
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phoneNumber"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4 text-purple-600" />
                      Téléphone
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      className={`h-10 ${
                        errors.phoneNumber ? "border-red-500" : ""
                      }`}
                      placeholder="+41 79 123 45 67"
                      disabled={isLoading}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-500">
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date d'embauche */}
                <div className="space-y-2">
                  <Label
                    htmlFor="hiredAt"
                    className="text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    Date d&apos;embauche
                  </Label>
                  <div className="max-w-xs">
                    <Input
                      id="hiredAt"
                      type="date"
                      value={formData.hiredAt}
                      onChange={(e) =>
                        handleInputChange("hiredAt", e.target.value)
                      }
                      className="h-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section Emploi */}
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 via-transparent to-blue-50/30 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                    <Briefcase size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      Informations d&apos;emploi
                    </h2>
                    <p className="text-sm text-slate-600">
                      Poste et conditions de travail
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Établissement */}
                <div className="space-y-2">
                  <Label
                    htmlFor="mandate"
                    className="text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 text-blue-600" />
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
                      {hebergementMandates.length > 0 && (
                        <div className="py-1">
                          <div className="px-2 py-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
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
                          <div className="px-2 py-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Restauration
                          </div>
                          {restaurationMandates.map((mandate) => (
                            <SelectItem key={mandate.id} value={mandate.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-orange-600" />
                                {mandate.name}
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      )}

                      {mandates.length === 0 && (
                        <div className="text-center py-4 text-slate-500">
                          Aucun établissement actif trouvé
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.mandateId && (
                    <p className="text-sm text-red-500">{errors.mandateId}</p>
                  )}
                  {selectedMandate && (
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Groupe:{" "}
                      {selectedMandate.group === "HEBERGEMENT"
                        ? "Hébergement"
                        : "Restauration"}
                    </p>
                  )}
                </div>

                {/* Poste et Taux horaire */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="position"
                      className="text-sm font-medium text-slate-700"
                    >
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
                      placeholder="Ex: Réceptionniste, Serveur..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="hourlyRate"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      Taux horaire (CHF/h)
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.05"
                      min="0"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        handleInputChange("hourlyRate", e.target.value)
                      }
                      className={`h-10 ${
                        errors.hourlyRate ? "border-red-500" : ""
                      }`}
                      placeholder="25.00"
                      disabled={isLoading}
                    />
                    {errors.hourlyRate && (
                      <p className="text-sm text-red-500">
                        {errors.hourlyRate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/employees")}
              disabled={isLoading}
              className="px-6 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all"
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>

            <div className="flex items-center gap-4">
              {/* Bouton Zone de danger - discret */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
                className="text-slate-500 hover:text-red-600 text-sm px-3 py-2 h-auto"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Actions avancées
                {isDangerZoneOpen ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="px-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
            </div>
          </div>

          {/* Zone de danger collapsible */}
          {isDangerZoneOpen && (
            <div className="mt-6 bg-white/90 backdrop-blur-sm border border-red-200/60 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-red-100 bg-red-50/30 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <AlertCircle size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-red-800">
                      Actions sensibles
                    </h3>
                    <p className="text-sm text-red-600">
                      Ces actions peuvent avoir des conséquences importantes
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Désactivation de l'employé */}
                <div className="flex items-start justify-between p-3 border border-amber-200 rounded-lg bg-amber-50/50">
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-800 text-sm mb-1">
                      {formData.isActive
                        ? "Désactiver l'employé"
                        : "Réactiver l'employé"}
                    </h4>
                    <p className="text-xs text-amber-700">
                      {formData.isActive
                        ? "L'employé ne pourra plus pointer et ne sera plus visible dans les rapports actifs."
                        : "L'employé sera réactivé et pourra à nouveau pointer."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleInputChange("isActive", !formData.isActive)
                    }
                    disabled={isLoading}
                    className={`ml-3 text-xs ${
                      formData.isActive
                        ? "border-amber-300 text-amber-700 hover:bg-amber-100"
                        : "border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {formData.isActive ? "Désactiver" : "Réactiver"}
                  </Button>
                </div>

                {/* Suppression de l'employé */}
                <div className="flex items-start justify-between p-3 border border-red-200 rounded-lg bg-red-50/50">
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 text-sm mb-1">
                      Supprimer l&apos;employé
                    </h4>
                    <p className="text-xs text-red-700">
                      {employee._count.timeEntries > 0 ||
                      employee._count.payrollData > 0
                        ? "⚠️ Cet employé a des données associées. La suppression est irréversible."
                        : "Cette action est irréversible. L'employé sera définitivement supprimé."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteEmployee}
                    disabled={isLoading}
                    className="ml-3 text-xs"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
