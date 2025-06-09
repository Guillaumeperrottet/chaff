import React from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Building2,
  Plus,
  Upload,
  Users,
  Calendar,
  BarChart3,
  Lightbulb,
  BookOpen,
  PlayCircle,
} from "lucide-react";

interface EmptyStateProps {
  type: "mandates" | "dayvalues" | "employees" | "payroll" | "analytics";
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  mandateCount?: number;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onPrimaryAction,
  onSecondaryAction,
  mandateCount = 0,
  className = "",
}) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case "mandates":
        return {
          icon: <Building2 className="h-20 w-20 text-blue-500" />,
          title: "Créez votre premier établissement",
          subtitle: "Commencez votre suivi financier",
          description:
            "Un établissement vous permet de suivre le chiffre d'affaires et la masse salariale d'un point de vente, hôtel, ou restaurant.",
          primaryButton: {
            text: "Créer un établissement",
            icon: <Plus className="mr-2 h-5 w-5" />,
          },
          secondaryButton: {
            text: "Importer des données",
            icon: <Upload className="mr-2 h-4 w-4" />,
          },
          helpSteps: [
            "Donnez un nom à votre établissement",
            "Choisissez le type (Hébergement ou Restauration)",
            "Commencez à saisir vos données quotidiennes",
          ],
        };

      case "dayvalues":
        return {
          icon: <Calendar className="h-20 w-20 text-green-500" />,
          title:
            mandateCount === 0
              ? "Créez d'abord un établissement"
              : "Commencez votre suivi quotidien",
          subtitle:
            mandateCount === 0
              ? "Vous devez avoir au moins un établissement"
              : "Aucune saisie de chiffre d'affaires",
          description:
            mandateCount === 0
              ? "Pour saisir des valeurs quotidiennes, vous devez d'abord créer un établissement dans la section Mandats."
              : "Le suivi quotidien vous permet d'analyser l'évolution de votre chiffre d'affaires et d'identifier les tendances.",
          primaryButton:
            mandateCount === 0
              ? {
                  text: "Créer un établissement",
                  icon: <Building2 className="mr-2 h-5 w-5" />,
                }
              : {
                  text: "Première saisie",
                  icon: <Plus className="mr-2 h-5 w-5" />,
                },
          secondaryButton: {
            text: "Importer des données",
            icon: <Upload className="mr-2 h-4 w-4" />,
          },
          helpSteps:
            mandateCount === 0
              ? [
                  "Allez dans la section 'Établissements'",
                  "Créez votre premier établissement",
                  "Revenez ici pour saisir vos données",
                ]
              : [
                  "Sélectionnez votre établissement",
                  "Choisissez la date",
                  "Saisissez le montant du chiffre d'affaires",
                ],
        };

      case "employees":
        return {
          icon: <Users className="h-20 w-20 text-purple-500" />,
          title: "Gérez votre équipe",
          subtitle: "Aucun employé enregistré",
          description:
            "Ajoutez vos employés pour pouvoir importer les données Gastrotime et calculer automatiquement la masse salariale.",
          primaryButton: {
            text: "Ajouter un employé",
            icon: <Plus className="mr-2 h-5 w-5" />,
          },
          secondaryButton: {
            text: "Import Gastrotime",
            icon: <Upload className="mr-2 h-4 w-4" />,
          },
          helpSteps: [
            "Créez la fiche employé avec son ID unique",
            "Définissez son taux horaire",
            "Importez ses heures depuis Gastrotime",
          ],
        };

      case "payroll":
        return {
          icon: <BarChart3 className="h-20 w-20 text-orange-500" />,
          title: "Analysez votre masse salariale",
          subtitle: "Aucune donnée de masse salariale",
          description:
            "Suivez le ratio masse salariale / chiffre d'affaires pour optimiser la rentabilité de votre établissement.",
          primaryButton: {
            text: "Saisir manuellement",
            icon: <Plus className="mr-2 h-5 w-5" />,
          },
          secondaryButton: {
            text: "Import Gastrotime",
            icon: <Upload className="mr-2 h-4 w-4" />,
          },
          helpSteps: [
            "Saisissez le montant mensuel de la masse salariale",
            "Ou importez les données détaillées depuis Gastrotime",
            "Analysez les ratios automatiquement calculés",
          ],
        };

      case "analytics":
        return {
          icon: <BarChart3 className="h-20 w-20 text-indigo-500" />,
          title: "Visualisez vos performances",
          subtitle: "Pas assez de données pour les analytics",
          description:
            "Les analytics nécessitent au moins quelques saisies de chiffre d'affaires pour générer des graphiques et analyses.",
          primaryButton: {
            text: "Saisir des données CA",
            icon: <Calendar className="mr-2 h-5 w-5" />,
          },
          secondaryButton: {
            text: "Voir le guide",
            icon: <BookOpen className="mr-2 h-4 w-4" />,
          },
          helpSteps: [
            "Ajoutez au moins 7 jours de données CA",
            "Les graphiques apparaîtront automatiquement",
            "Explorez les tendances et comparaisons",
          ],
        };

      default:
        return {
          icon: <Calendar className="h-20 w-20 text-gray-500" />,
          title: "Aucune donnée disponible",
          subtitle: "Commencez par ajouter des données",
          description: "Ajoutez des données pour voir du contenu ici.",
          primaryButton: {
            text: "Commencer",
            icon: <Plus className="mr-2 h-5 w-5" />,
          },
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div
      className={`flex items-center justify-center min-h-[400px] p-6 ${className}`}
    >
      <Card className="max-w-2xl w-full border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <CardContent className="p-12 text-center space-y-8">
          {/* Icône principale */}
          <div className="flex justify-center">
            <div className="p-6 bg-white rounded-2xl shadow-sm border">
              {content.icon}
            </div>
          </div>

          {/* Texte principal */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-900">
              {content.title}
            </h3>
            <p className="text-lg text-blue-600 font-medium">
              {content.subtitle}
            </p>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              {content.description}
            </p>
          </div>

          {/* Étapes d'aide */}
          {content.helpSteps && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Comment commencer :
                </span>
              </div>
              <div className="space-y-3">
                {content.helpSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 text-left">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-blue-800 text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onPrimaryAction}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-base font-semibold"
            >
              {content.primaryButton.icon}
              {content.primaryButton.text}
            </Button>

            {content.secondaryButton && onSecondaryAction && (
              <Button
                onClick={onSecondaryAction}
                variant="outline"
                size="lg"
                className="border-gray-300 hover:bg-gray-50 px-8 py-3 text-base"
              >
                {content.secondaryButton.icon}
                {content.secondaryButton.text}
              </Button>
            )}
          </div>

          {/* Lien d'aide supplémentaire */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">
              Besoin d&apos;aide pour commencer ?
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Voir la démo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Guide d&apos;utilisation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyState;
