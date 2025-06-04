// src/app/dashboard/employees/timesheet/create/page.tsx
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
import { Badge } from "@/app/components/ui/badge";
import { BackButton } from "@/app/components/ui/BackButton";
import {
  Clock,
  Save,
  X,
  Loader2,
  Calculator,
  Calendar,
  User,
  AlertCircle,
} from "lucide-react";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  hourlyRate?: number;
  mandate: {
    id: string;
    name: string;
    group: string;
  };
}

interface Mandate {
  id: string;
  name: string;
  group: string;
}

export default function CreateTimesheetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // État du formulaire
  const [formData, setFormData] = useState({
    employeeId: "",
    mandateId: "",
    date: new Date().toISOString().split("T")[0], // Aujourd'hui par défaut
    clockIn: "",
    clockOut: "",
    breakMinutes: "30", // 30 min de pause par défaut
    entryType: "REGULAR" as const,
    hourlyRate: "",
    notes: "",
  });

  // Gestion des erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // État calculé
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Charger les données depuis l'API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [employeesResponse, mandatesResponse] = await Promise.all([
          fetch("/api/employees?includeInactive=false&limit=100"),
          fetch("/api/mandats"),
        ]);

        if (!employeesResponse.ok || !mandatesResponse.ok) {
          throw new Error("Erreur lors du chargement des données");
        }

        const employeesData = await employeesResponse.json();
        const mandatesData = await mandatesResponse.json();

        setEmployees(employeesData.data || []);
        setMandates(mandatesData.filter((m: Mandate) => m.group));
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Recalculer les heures quand les horaires changent
  useEffect(() => {
    calculateHours();
  }, [
    formData.clockIn,
    formData.clockOut,
    formData.breakMinutes,
    formData.hourlyRate,
  ]);

  const calculateHours = () => {
    if (!formData.clockIn || !formData.clockOut) {
      setCalculatedHours(0);
      setEstimatedCost(0);
      return;
    }

    try {
      const [inHour, inMin] = formData.clockIn.split(":").map(Number);
      const [outHour, outMin] = formData.clockOut.split(":").map(Number);

      const clockInMinutes = inHour * 60 + inMin;
      const clockOutMinutes = outHour * 60 + outMin;

      if (clockOutMinutes <= clockInMinutes) {
        setCalculatedHours(0);
        setEstimatedCost(0);
        return;
      }

      const totalMinutes = clockOutMinutes - clockInMinutes;
      const breakMinutes = parseInt(formData.breakMinutes) || 0;
      const workedMinutes = Math.max(0, totalMinutes - breakMinutes);
      const workedHours = workedMinutes / 60;

      setCalculatedHours(workedHours);

      // Calculer le coût estimé
      const hourlyRate = parseFloat(formData.hourlyRate) || 0;
      if (hourlyRate > 0) {
        let cost = workedHours * hourlyRate;

        // Ajouter majoration heures sup si > 8h
        if (workedHours > 8) {
          const overtimeHours = workedHours - 8;
          const overtimeBonus = overtimeHours * hourlyRate * 0.25; // 25% de majoration
          cost += overtimeBonus;
        }

        setEstimatedCost(cost);
      } else {
        setEstimatedCost(0);
      }
    } catch {
      setCalculatedHours(0);
      setEstimatedCost(0);
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = "Veuillez sélectionner un employé";
    }

    if (!formData.mandateId) {
      newErrors.mandateId = "Veuillez sélectionner un établissement";
    }

    if (!formData.date) {
      newErrors.date = "Veuillez sélectionner une date";
    }

    if (!formData.clockIn) {
      newErrors.clockIn = "Heure d'arrivée obligatoire";
    }

    if (!formData.clockOut) {
      newErrors.clockOut = "Heure de départ obligatoire";
    }

    if (formData.clockIn && formData.clockOut) {
      const [inHour, inMin] = formData.clockIn.split(":").map(Number);
      const [outHour, outMin] = formData.clockOut.split(":").map(Number);

      const clockInMinutes = inHour * 60 + inMin;
      const clockOutMinutes = outHour * 60 + outMin;

      if (clockOutMinutes <= clockInMinutes) {
        newErrors.clockOut = "L'heure de départ doit être après l'arrivée";
      }
    }

    if (
      formData.breakMinutes &&
      (isNaN(Number(formData.breakMinutes)) ||
        Number(formData.breakMinutes) < 0)
    ) {
      newErrors.breakMinutes = "Pause invalide";
    }

    if (calculatedHours > 16) {
      newErrors.clockOut = "Durée de travail excessive (max 16h)";
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
      // Préparer les données pour l'API
      const submitData = {
        employeeId: formData.employeeId,
        mandateId: formData.mandateId,
        date: formData.date,
        clockIn: `${formData.date}T${formData.clockIn}:00`,
        clockOut: `${formData.date}T${formData.clockOut}:00`,
        breakMinutes: parseInt(formData.breakMinutes) || 0,
        workedHours: calculatedHours,
        hourlyRate: formData.hourlyRate
          ? parseFloat(formData.hourlyRate)
          : undefined,
        entryType: formData.entryType,
        importSource: "manual",
      };

      const response = await fetch("/api/timesheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.error?.includes("existe déjà")) {
          toast.error("Une saisie existe déjà pour cet employé à cette date");
          return;
        }

        throw new Error(errorData.error || "Erreur lors de la création");
      }

      await response.json();
      const selectedEmployee = employees.find(
        (e) => e.id === formData.employeeId
      );

      toast.success(
        `Saisie créée pour ${selectedEmployee?.firstName} ${selectedEmployee?.lastName} - ${calculatedHours.toFixed(1)}h`
      );

      // Proposer de créer une autre saisie ou retourner
      const createAnother = confirm(
        "Saisie créée avec succès ! Voulez-vous créer une autre saisie ?"
      );

      if (createAnother) {
        // Reset formulaire en gardant quelques valeurs
        setFormData((prev) => ({
          ...prev,
          clockIn: "",
          clockOut: "",
          notes: "",
        }));
        setErrors({});
      } else {
        router.push("/dashboard/employees");
      }
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

    // Auto-remplir le taux horaire quand un employé est sélectionné
    if (field === "employeeId") {
      const selectedEmployee = employees.find((e) => e.id === value);
      if (selectedEmployee?.hourlyRate) {
        setFormData((prev) => ({
          ...prev,
          hourlyRate: selectedEmployee.hourlyRate?.toString() || "",
          mandateId: selectedEmployee.mandate.id, // Auto-sélectionner l'établissement
        }));
      }
    }
  };

  // Définir des créneaux horaires prédéfinis
  const setPresetSchedule = (preset: string) => {
    const presets = {
      morning: { clockIn: "06:00", clockOut: "14:00" },
      day: { clockIn: "08:00", clockOut: "17:00" },
      evening: { clockIn: "14:00", clockOut: "22:00" },
      night: { clockIn: "22:00", clockOut: "06:00" },
    };

    const schedule = presets[preset as keyof typeof presets];
    if (schedule) {
      setFormData((prev) => ({
        ...prev,
        clockIn: schedule.clockIn,
        clockOut: schedule.clockOut,
      }));
    }
  };

  const selectedEmployee = employees.find((e) => e.id === formData.employeeId);

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

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton href="/dashboard/employees" label="Retour aux employés" />

      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Create
        </h1>
        <h2 className="text-2xl font-medium text-gray-700 mt-2">
          Timesheet Entry
        </h2>
      </div>

      {/* Formulaire */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Employé et Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Employé et période
              </CardTitle>
              <CardDescription>
                Sélectionnez l&apos;employé et la date de travail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sélection employé */}
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-base font-medium">
                    Employé <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) =>
                      handleInputChange("employeeId", value)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      className={`h-10 ${errors.employeeId ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Sélectionnez un employé..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {employee.employeeId} - {employee.mandate.name}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.employeeId && (
                    <p className="text-sm text-red-500">{errors.employeeId}</p>
                  )}
                </div>

                {/* Sélection établissement */}
                <div className="space-y-2">
                  <Label htmlFor="mandateId" className="text-base font-medium">
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
                      className={`h-10 ${errors.mandateId ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Sélectionnez un établissement..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mandates.map((mandate) => (
                        <SelectItem key={mandate.id} value={mandate.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {mandate.group === "HEBERGEMENT"
                                ? "Hébergement"
                                : "Restauration"}
                            </Badge>
                            {mandate.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.mandateId && (
                    <p className="text-sm text-red-500">{errors.mandateId}</p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-base font-medium">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className={`h-10 pl-10 ${errors.date ? "border-red-500" : ""}`}
                      max={new Date().toISOString().split("T")[0]}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.date && (
                    <p className="text-sm text-red-500">{errors.date}</p>
                  )}
                </div>
              </div>

              {/* Informations employé sélectionné */}
              {selectedEmployee && (
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {selectedEmployee.employeeId} •{" "}
                        {selectedEmployee.mandate.name}
                      </div>
                    </div>
                    {selectedEmployee.hourlyRate && (
                      <Badge variant="secondary">
                        {selectedEmployee.hourlyRate} CHF/h
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Horaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horaires de travail
              </CardTitle>
              <CardDescription>
                Définissez les heures d&apos;arrivée, de départ et les pauses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Créneaux prédéfinis */}
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Créneaux prédéfinis
                </Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetSchedule("morning")}
                    disabled={isLoading}
                  >
                    Matin (6h-14h)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetSchedule("day")}
                    disabled={isLoading}
                  >
                    Journée (8h-17h)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetSchedule("evening")}
                    disabled={isLoading}
                  >
                    Soirée (14h-22h)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetSchedule("night")}
                    disabled={isLoading}
                  >
                    Nuit (22h-6h)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Heure d'arrivée */}
                <div className="space-y-2">
                  <Label htmlFor="clockIn" className="text-base font-medium">
                    Arrivée <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clockIn"
                    type="time"
                    value={formData.clockIn}
                    onChange={(e) =>
                      handleInputChange("clockIn", e.target.value)
                    }
                    className={`h-10 ${errors.clockIn ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                  {errors.clockIn && (
                    <p className="text-sm text-red-500">{errors.clockIn}</p>
                  )}
                </div>

                {/* Heure de départ */}
                <div className="space-y-2">
                  <Label htmlFor="clockOut" className="text-base font-medium">
                    Départ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clockOut"
                    type="time"
                    value={formData.clockOut}
                    onChange={(e) =>
                      handleInputChange("clockOut", e.target.value)
                    }
                    className={`h-10 ${errors.clockOut ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                  {errors.clockOut && (
                    <p className="text-sm text-red-500">{errors.clockOut}</p>
                  )}
                </div>

                {/* Pause */}
                <div className="space-y-2">
                  <Label
                    htmlFor="breakMinutes"
                    className="text-base font-medium"
                  >
                    Pause (minutes)
                  </Label>
                  <Input
                    id="breakMinutes"
                    type="number"
                    min="0"
                    max="480"
                    value={formData.breakMinutes}
                    onChange={(e) =>
                      handleInputChange("breakMinutes", e.target.value)
                    }
                    className={`h-10 ${errors.breakMinutes ? "border-red-500" : ""}`}
                    placeholder="30"
                    disabled={isLoading}
                  />
                  {errors.breakMinutes && (
                    <p className="text-sm text-red-500">
                      {errors.breakMinutes}
                    </p>
                  )}
                </div>

                {/* Type d'entrée */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Type</Label>
                  <Select
                    value={formData.entryType}
                    onValueChange={(
                      value:
                        | "REGULAR"
                        | "OVERTIME"
                        | "HOLIDAY"
                        | "SICK"
                        | "VACATION"
                    ) => handleInputChange("entryType", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGULAR">Normal</SelectItem>
                      <SelectItem value="OVERTIME">Heures sup.</SelectItem>
                      <SelectItem value="HOLIDAY">Jour férié</SelectItem>
                      <SelectItem value="SICK">Maladie</SelectItem>
                      <SelectItem value="VACATION">Vacances</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Taux horaire spécifique */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="text-base font-medium">
                    Taux horaire (optionnel)
                  </Label>
                  <div className="relative">
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.05"
                      min="0"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        handleInputChange("hourlyRate", e.target.value)
                      }
                      className="h-10 pr-12"
                      placeholder="25.00"
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-muted-foreground text-sm">
                        CHF/h
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour utiliser le taux de l&apos;employé
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base font-medium">
                    Notes
                  </Label>
                  <Input
                    id="notes"
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="h-10"
                    placeholder="Remarques particulières..."
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculs automatiques */}
          {formData.clockIn && formData.clockOut && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculs automatiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {calculatedHours.toFixed(1)}h
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Heures travaillées
                    </div>
                    {calculatedHours > 8 && (
                      <div className="text-xs text-orange-600 mt-1">
                        +{(calculatedHours - 8).toFixed(1)}h supplémentaires
                      </div>
                    )}
                  </div>

                  {estimatedCost > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {estimatedCost.toFixed(2)} CHF
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Coût estimé brut
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(
                        calculatedHours * 60 -
                        parseInt(formData.breakMinutes || "0")
                      ).toFixed(0)}{" "}
                      min
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Temps productif
                    </div>
                  </div>
                </div>

                {/* Alertes */}
                {calculatedHours > 10 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-800">
                      Attention: Journée de plus de 10 heures
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center space-x-4 pt-6">
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.employeeId ||
                !formData.clockIn ||
                !formData.clockOut
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium rounded-md min-w-[140px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Enregistrement...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
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

        {/* Lien retour */}
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
            💡 Aide à la saisie des heures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • <strong>Créneaux prédéfinis :</strong> Utilisez les boutons pour
              remplir rapidement les horaires courants
            </p>
            <p>
              • <strong>Calculs automatiques :</strong> Les heures et coûts sont
              calculés en temps réel
            </p>
            <p>
              • <strong>Heures supplémentaires :</strong> Majorées
              automatiquement au-delà de 8h/jour
            </p>
            <p>
              • <strong>Taux horaire :</strong> Utilise le taux de
              l&apos;employé par défaut, modifiable par saisie
            </p>
            <p>
              • <strong>Types de temps :</strong> Différenciez le temps normal,
              férié, maladie, etc.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
