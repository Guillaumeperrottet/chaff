// src/app/components/ImportHelp.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import {
  ChevronDown,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

export function ImportHelp() {
  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Format des fichiers */}
      <Collapsible open={isFormatOpen} onOpenChange={setIsFormatOpen}>
        <CollapsibleTrigger className="w-full">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  Format des fichiers Excel
                </CardTitle>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isFormatOpen ? "rotate-180" : ""}`}
              />
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">
                    Feuille &quot;Mandants&quot;
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left">Colonne</th>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-left">Obligatoire</th>
                          <th className="p-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-mono">Id</td>
                          <td className="p-2">Texte/Nombre</td>
                          <td className="p-2">
                            <Badge variant="destructive" className="text-xs">
                              Oui
                            </Badge>
                          </td>
                          <td className="p-2">Identifiant unique du mandat</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">Nom</td>
                          <td className="p-2">Texte</td>
                          <td className="p-2">
                            <Badge variant="destructive" className="text-xs">
                              Oui
                            </Badge>
                          </td>
                          <td className="p-2">Nom du mandat/établissement</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">Catégorie</td>
                          <td className="p-2">Texte</td>
                          <td className="p-2">
                            <Badge variant="destructive" className="text-xs">
                              Oui
                            </Badge>
                          </td>
                          <td className="p-2">
                            &quot;Hébergement&quot; ou &quot;Restauration&quot;
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono">Monnaie</td>
                          <td className="p-2">Texte</td>
                          <td className="p-2">
                            <Badge variant="secondary" className="text-xs">
                              Non
                            </Badge>
                          </td>
                          <td className="p-2">CHF, EUR, etc. (défaut: CHF)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">
                    Feuille &quot;DayValues&quot;
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left">Colonne</th>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-left">Obligatoire</th>
                          <th className="p-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-mono">Date</td>
                          <td className="p-2">Date</td>
                          <td className="p-2">
                            <Badge variant="destructive" className="text-xs">
                              Oui
                            </Badge>
                          </td>
                          <td className="p-2">Format MM/DD/YY ou MM/DD/YYYY</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">Valeur</td>
                          <td className="p-2">Nombre</td>
                          <td className="p-2">
                            <Badge variant="destructive" className="text-xs">
                              Oui
                            </Badge>
                          </td>
                          <td className="p-2">
                            Montant en décimal (ex: 1250.50)
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">MandantId</td>
                          <td className="p-2">Texte/Nombre</td>
                          <td className="p-2">
                            <Badge variant="destructive" className="text-xs">
                              Oui
                            </Badge>
                          </td>
                          <td className="p-2">
                            Référence à l&apos;Id du mandat
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono">Mandant</td>
                          <td className="p-2">Texte</td>
                          <td className="p-2">
                            <Badge variant="secondary" className="text-xs">
                              Non
                            </Badge>
                          </td>
                          <td className="p-2">
                            Nom du mandat (pour vérification)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Exemples */}
      <Collapsible open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
        <CollapsibleTrigger className="w-full">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">Exemples de données</CardTitle>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isExamplesOpen ? "rotate-180" : ""}`}
              />
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">
                    Exemple - Feuille &quot;Mandants&quot;
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left font-mono">Id</th>
                          <th className="p-2 text-left font-mono">Nom</th>
                          <th className="p-2 text-left font-mono">Monnaie</th>
                          <th className="p-2 text-left font-mono">Catégorie</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs">
                        <tr className="border-b">
                          <td className="p-2">1</td>
                          <td className="p-2">Camping Lac</td>
                          <td className="p-2">CHF</td>
                          <td className="p-2">Hébergement</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">2</td>
                          <td className="p-2">Restaurant Central</td>
                          <td className="p-2">CHF</td>
                          <td className="p-2">Restauration</td>
                        </tr>
                        <tr>
                          <td className="p-2">3</td>
                          <td className="p-2">Hôtel Alpha</td>
                          <td className="p-2">EUR</td>
                          <td className="p-2">Hébergement</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">
                    Exemple - Feuille &quot;DayValues&quot;
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left font-mono">Date</th>
                          <th className="p-2 text-left font-mono">Valeur</th>
                          <th className="p-2 text-left font-mono">MandantId</th>
                          <th className="p-2 text-left font-mono">Mandant</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs">
                        <tr className="border-b">
                          <td className="p-2">1/15/24</td>
                          <td className="p-2">1250.50</td>
                          <td className="p-2">1</td>
                          <td className="p-2">Camping Lac</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">1/15/24</td>
                          <td className="p-2">850.25</td>
                          <td className="p-2">2</td>
                          <td className="p-2">Restaurant Central</td>
                        </tr>
                        <tr>
                          <td className="p-2">1/16/24</td>
                          <td className="p-2">1380.75</td>
                          <td className="p-2">1</td>
                          <td className="p-2">Camping Lac</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Résolution de problèmes */}
      <Collapsible
        open={isTroubleshootingOpen}
        onOpenChange={setIsTroubleshootingOpen}
      >
        <CollapsibleTrigger className="w-full">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base">
                  Résolution de problèmes
                </CardTitle>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isTroubleshootingOpen ? "rotate-180" : ""}`}
              />
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-red-500 bg-red-50">
                    <h5 className="font-medium text-red-700">
                      Erreur: &quot;Feuilles manquantes&quot;
                    </h5>
                    <p className="text-sm text-red-600 mt-1">
                      Votre fichier doit contenir exactement deux feuilles
                      nommées &quot;Mandants&quot; et &quot;DayValues&quot;
                      (respectez la casse).
                    </p>
                  </div>

                  <div className="p-3 border-l-4 border-amber-500 bg-amber-50">
                    <h5 className="font-medium text-amber-700">
                      Erreur: &quot;Format de date invalide&quot;
                    </h5>
                    <p className="text-sm text-amber-600 mt-1">
                      Utilisez le format MM/DD/YY ou MM/DD/YYYY. Évitez les
                      formats DD/MM/YY ou YYYY-MM-DD.
                    </p>
                  </div>

                  <div className="p-3 border-l-4 border-amber-500 bg-amber-50">
                    <h5 className="font-medium text-amber-700">
                      Erreur: &quot;Valeur invalide&quot;
                    </h5>
                    <p className="text-sm text-amber-600 mt-1">
                      Les valeurs doivent être des nombres positifs. Utilisez le
                      point comme séparateur décimal (ex: 1250.50).
                    </p>
                  </div>

                  <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                    <h5 className="font-medium text-blue-700">
                      Conseil: Validation des données
                    </h5>
                    <p className="text-sm text-blue-600 mt-1">
                      Utilisez la prévisualisation pour identifier les erreurs
                      avant l&apos;import. Corrigez les données dans Excel et
                      réessayez.
                    </p>
                  </div>

                  <div className="p-3 border-l-4 border-green-500 bg-green-50">
                    <h5 className="font-medium text-green-700">
                      Conseil: Sauvegarde
                    </h5>
                    <p className="text-sm text-green-600 mt-1">
                      Exportez vos données actuelles avant d&apos;effectuer un
                      import pour pouvoir revenir en arrière si nécessaire.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
