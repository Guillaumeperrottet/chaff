"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";
import {
  RefreshCw,
  Save,
  Settings,
  Database,
  Mail,
  CreditCard,
  Lock,
  Cloud,
} from "lucide-react";

interface SystemSetting {
  key: string;
  value: string;
  description: string;
  category: "email" | "stripe" | "security" | "system" | "cloudinary";
  isSecret: boolean;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([
    // Email settings
    {
      key: "RESEND_API_KEY",
      value: "••••••••••••••••••",
      description: "Clé API Resend pour l'envoi d'emails",
      category: "email",
      isSecret: true,
    },
    {
      key: "RESEND_FROM_EMAIL",
      value: "notifications@plannikeeper.ch",
      description: "Adresse email utilisée pour envoyer les notifications",
      category: "email",
      isSecret: false,
    },
    {
      key: "EMAIL_API_SECRET",
      value: "••••••••••••••••••",
      description: "Secret pour l'API d'envoi d'emails",
      category: "email",
      isSecret: true,
    },

    // Stripe settings
    {
      key: "STRIPE_SECRET_KEY",
      value: "••••••••••••••••••",
      description: "Clé secrète Stripe pour les paiements",
      category: "stripe",
      isSecret: true,
    },
    {
      key: "STRIPE_WEBHOOK_SECRET",
      value: "••••••••••••••••••",
      description: "Secret pour les webhooks Stripe",
      category: "stripe",
      isSecret: true,
    },
    {
      key: "STRIPE_PUBLIC_KEY",
      value: "pk_test_••••••••••••••••••",
      description: "Clé publique Stripe",
      category: "stripe",
      isSecret: false,
    },

    // Cloudinary settings
    {
      key: "CLOUDINARY_CLOUD_NAME",
      value: "plannikeeper",
      description: "Nom du cloud Cloudinary",
      category: "cloudinary",
      isSecret: false,
    },
    {
      key: "CLOUDINARY_API_KEY",
      value: "••••••••••••••••••",
      description: "Clé API Cloudinary",
      category: "cloudinary",
      isSecret: true,
    },
    {
      key: "CLOUDINARY_API_SECRET",
      value: "••••••••••••••••••",
      description: "Secret API Cloudinary",
      category: "cloudinary",
      isSecret: true,
    },

    // Security settings
    {
      key: "BETTER_AUTH_SECRET",
      value: "••••••••••••••••••",
      description: "Secret pour l'authentification",
      category: "security",
      isSecret: true,
    },
    {
      key: "SUPER_ADMIN_EMAILS",
      value: "perrottet.guillaume.97@gmail.com",
      description:
        "Liste des emails des super-administrateurs (séparés par des virgules)",
      category: "security",
      isSecret: false,
    },

    // System settings
    {
      key: "DATABASE_URL",
      value: "postgresql://••••••••••••••••••",
      description: "URL de la base de données PostgreSQL",
      category: "system",
      isSecret: true,
    },
    {
      key: "NEXT_PUBLIC_APP_URL",
      value: "https://plannikeeper.ch",
      description: "URL publique de l'application",
      category: "system",
      isSecret: false,
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);

  // Fonction pour mettre à jour une valeur
  const handleSettingChange = (key: string, value: string) => {
    setSettings(
      settings.map((setting) =>
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  // Fonction pour révéler/masquer une valeur secrète
  const toggleRevealSecret = (key: string) => {
    setSettings(
      settings.map((setting) => {
        if (setting.key === key && setting.isSecret) {
          // Si la valeur est masquée, la remplacer par une vraie valeur (simulé ici)
          if (setting.value.includes("•")) {
            // Ceci est une simulation - normalement vous feriez une requête à l'API
            return {
              ...setting,
              value: `fake_revealed_value_for_${key.toLowerCase()}`,
            };
          } else {
            // Masquer à nouveau la valeur
            return {
              ...setting,
              value: "••••••••••••••••••",
            };
          }
        }
        return setting;
      })
    );
  };

  // Fonction pour sauvegarder les paramètres
  const saveSettings = async () => {
    setIsSaving(true);

    try {
      // Simuler une requête API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Normalement vous feriez une vraie requête API ici
      // const response = await fetch('/api/admin/settings', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ settings }),
      // });

      toast.success("Paramètres du système enregistrés avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction pour obtenir l'icône de catégorie
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "email":
        return <Mail className="h-5 w-5" />;
      case "stripe":
        return <CreditCard className="h-5 w-5" />;
      case "security":
        return <Lock className="h-5 w-5" />;
      case "cloudinary":
        return <Cloud className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  // Filtrer les paramètres par catégorie
  const filteredSettings = filteredCategory
    ? settings.filter((setting) => setting.category === filteredCategory)
    : settings;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres du Système</CardTitle>
          <CardDescription>
            Configurez les variables d&apos;environnement et les paramètres
            système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant={filteredCategory === null ? "default" : "outline"}
                onClick={() => setFilteredCategory(null)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Tous
              </Button>
              <Button
                variant={filteredCategory === "email" ? "default" : "outline"}
                onClick={() => setFilteredCategory("email")}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button
                variant={filteredCategory === "stripe" ? "default" : "outline"}
                onClick={() => setFilteredCategory("stripe")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Paiement
              </Button>
              <Button
                variant={
                  filteredCategory === "security" ? "default" : "outline"
                }
                onClick={() => setFilteredCategory("security")}
              >
                <Lock className="mr-2 h-4 w-4" />
                Sécurité
              </Button>
              <Button
                variant={
                  filteredCategory === "cloudinary" ? "default" : "outline"
                }
                onClick={() => setFilteredCategory("cloudinary")}
              >
                <Cloud className="mr-2 h-4 w-4" />
                Stockage
              </Button>
            </div>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6">
            {filteredSettings.map((setting) => (
              <div key={setting.key} className="border p-4 rounded-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`p-1.5 rounded-full 
                      ${setting.category === "email" ? "bg-blue-100 text-blue-600" : ""}
                      ${setting.category === "stripe" ? "bg-purple-100 text-purple-600" : ""}
                      ${setting.category === "security" ? "bg-red-100 text-red-600" : ""}
                      ${setting.category === "cloudinary" ? "bg-green-100 text-green-600" : ""}
                      ${setting.category === "system" ? "bg-gray-100 text-gray-600" : ""}
                    `}
                    >
                      {getCategoryIcon(setting.category)}
                    </div>
                    <h3 className="font-medium">{setting.key}</h3>
                  </div>
                  {setting.isSecret && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRevealSecret(setting.key)}
                    >
                      {setting.value.includes("•") ? "Révéler" : "Masquer"}
                    </Button>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  {setting.description}
                </p>

                <div className="flex gap-2 items-center">
                  <Input
                    value={setting.value}
                    onChange={(e) =>
                      handleSettingChange(setting.key, e.target.value)
                    }
                    type={
                      setting.isSecret && setting.value.includes("•")
                        ? "password"
                        : "text"
                    }
                    className="font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
