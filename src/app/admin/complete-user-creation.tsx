"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { UserPlus, Building, CreditCard, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface CreateUserData {
  // Données utilisateur
  name: string;
  email: string;
  password: string;

  // Données organisation
  organizationName: string;

  // Plan d'abonnement
  planType: "FREE" | "PERSONAL" | "PROFESSIONAL" | "ENTERPRISE";

  // Configuration
  makeAdmin: boolean;
  sendWelcomeEmail: boolean;
}

const PLANS = [
  { id: "FREE", name: "Gratuit", description: "Pour découvrir PlanniKeeper" },
  {
    id: "PERSONAL",
    name: "Particulier",
    description: "Pour la gestion personnelle",
  },
  {
    id: "PROFESSIONAL",
    name: "Professionnel",
    description: "Pour les indépendants",
  },
  { id: "ENTERPRISE", name: "Entreprise", description: "Pour les équipes" },
];

export function CompleteUserCreation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateUserData>({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    planType: "FREE",
    makeAdmin: true,
    sendWelcomeEmail: true,
  });

  const handleInputChange = (
    field: keyof CreateUserData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.name.trim() !== "" &&
          formData.email.trim() !== "" &&
          formData.password.length >= 8
        );
      case 2:
        return formData.organizationName.trim() !== "";
      case 3:
        return true; // Plan step is always valid
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error("Veuillez remplir tous les champs requis");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const createCompleteUser = async () => {
    setIsCreating(true);

    try {
      // 1. Créer l'organisation
      const orgResponse = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.organizationName,
          planName: formData.planType,
        }),
      });

      if (!orgResponse.ok) {
        throw new Error("Erreur lors de la création de l'organisation");
      }

      const { organization } = await orgResponse.json();

      // 2. Créer l'utilisateur
      const userResponse = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organizationId: organization.id,
          role: formData.makeAdmin ? "admin" : "member",
          emailVerified: true, // Admin vérifie l'email
        }),
      });

      if (!userResponse.ok) {
        throw new Error("Erreur lors de la création de l'utilisateur");
      }

      await userResponse.json();

      // 3. Créer l'abonnement si ce n'est pas gratuit
      if (formData.planType !== "FREE") {
        const subResponse = await fetch("/api/admin/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: organization.id,
            planName: formData.planType,
            status: "ACTIVE",
          }),
        });

        if (!subResponse.ok) {
          console.warn(
            "Erreur lors de la création de l'abonnement, mais utilisateur créé"
          );
        }
      }

      // 4. Envoyer l'email de bienvenue si demandé
      if (formData.sendWelcomeEmail) {
        try {
          await fetch("/api/admin/send-welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: formData.email,
              userName: formData.name,
              organizationName: formData.organizationName,
              temporaryPassword: formData.password,
              planName: formData.planType,
            }),
          });
        } catch (emailError) {
          console.warn("Email de bienvenue non envoyé:", emailError);
        }
      }

      toast.success(`Utilisateur ${formData.name} créé avec succès !`);
      setIsOpen(false);
      setCurrentStep(1);
      setFormData({
        name: "",
        email: "",
        password: "",
        organizationName: "",
        planType: "FREE",
        makeAdmin: true,
        sendWelcomeEmail: true,
      });

      // Recharger la page pour voir les changements
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Créer un utilisateur complet
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Créer un utilisateur complet
            </CardTitle>
            <CardDescription>
              Étape {currentStep} sur 4 - Création d&apos;un utilisateur avec
              son organisation et abonnement
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Indicateur de progression */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 4 && (
                    <div
                      className={`h-1 w-12 mx-2 ${
                        step < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Étape 1: Informations utilisateur */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Informations utilisateur
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nom complet *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Jean Dupont"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="jean.dupont@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mot de passe temporaire *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="Minimum 8 caractères"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                    >
                      Générer
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    L&apos;utilisateur devra changer ce mot de passe à sa
                    première connexion
                  </p>
                </div>
              </div>
            )}

            {/* Étape 2: Organisation */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Organisation
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nom de l&apos;organisation *
                  </label>
                  <Input
                    value={formData.organizationName}
                    onChange={(e) =>
                      handleInputChange("organizationName", e.target.value)
                    }
                    placeholder="Dupont Immobilier"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Une nouvelle organisation sera créée pour cet utilisateur
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="makeAdmin"
                    checked={formData.makeAdmin}
                    onChange={(e) =>
                      handleInputChange("makeAdmin", e.target.checked)
                    }
                  />
                  <label htmlFor="makeAdmin" className="text-sm">
                    Faire de cet utilisateur un administrateur de
                    l&apos;organisation
                  </label>
                </div>
              </div>
            )}

            {/* Étape 3: Plan d'abonnement */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Plan d&apos;abonnement
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.planType === plan.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleInputChange("planType", plan.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={formData.planType === plan.id}
                          onChange={() =>
                            handleInputChange("planType", plan.id)
                          }
                        />
                        <div>
                          <h4 className="font-medium">{plan.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Étape 4: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Confirmation
                </h3>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p>
                    <strong>Utilisateur:</strong> {formData.name} (
                    {formData.email})
                  </p>
                  <p>
                    <strong>Organisation:</strong> {formData.organizationName}
                  </p>
                  <p>
                    <strong>Plan:</strong>{" "}
                    {PLANS.find((p) => p.id === formData.planType)?.name}
                  </p>
                  <p>
                    <strong>Rôle:</strong>{" "}
                    {formData.makeAdmin ? "Administrateur" : "Membre"}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendWelcome"
                    checked={formData.sendWelcomeEmail}
                    onChange={(e) =>
                      handleInputChange("sendWelcomeEmail", e.target.checked)
                    }
                  />
                  <label htmlFor="sendWelcome" className="text-sm">
                    Envoyer un email de bienvenue avec les informations de
                    connexion
                  </label>
                </div>
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex justify-between pt-4">
              <div>
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    Précédent
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Annuler
                </Button>

                {currentStep < 4 ? (
                  <Button onClick={nextStep}>Suivant</Button>
                ) : (
                  <Button
                    onClick={createCompleteUser}
                    disabled={isCreating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isCreating ? "Création..." : "Créer l'utilisateur"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
