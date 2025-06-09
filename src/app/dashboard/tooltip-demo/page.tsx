// src/app/dashboard/tooltip-demo/page.tsx - Page de démonstration des nouveaux tooltips
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  FeatureButton,
  FeatureNavButton,
} from "@/app/components/FeatureButton";
import {
  PremiumTooltip,
  SimpleTooltip,
} from "@/app/components/ui/improved-tooltip";
import {
  BarChart3,
  Crown,
  Upload,
  DollarSign,
  Code,
  Lock,
  FileDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function TooltipDemoPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Démonstration des Tooltips
        </h1>
        <p className="text-muted-foreground">
          Exemples d&apos;utilisation des nouveaux composants FeatureButton avec
          tooltips améliorés
        </p>
      </div>

      {/* 1. Boutons Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>1. Boutons Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {/* Bouton Analytics avec tooltip magnifique */}
            <FeatureButton
              feature="advanced_reports"
              href="/dashboard/analytics"
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              tooltipSide="bottom"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics Avancés
            </FeatureButton>

            {/* Bouton Masse Salariale avec tooltip premium */}
            <FeatureButton
              feature="payroll"
              href="/dashboard/payroll"
              variant="outline"
              className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              tooltipSide="bottom"
            >
              <Crown className="mr-2 h-4 w-4" />
              Masse Salariale
            </FeatureButton>

            {/* Bouton Import avec tooltip */}
            <FeatureButton
              feature="bulk_import"
              onClick={() => console.log("Import action")}
              variant="outline"
              tooltipSide="bottom"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </FeatureButton>
          </div>
        </CardContent>
      </Card>

      {/* 2. Menu de Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>2. Menu de Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-sm">
            <FeatureNavButton
              feature="payroll"
              href="/dashboard/payroll"
              icon={DollarSign}
              label="Masse Salariale"
              description="Gestion complète RH et charges"
            />

            <FeatureNavButton
              feature="advanced_reports"
              href="/dashboard/analytics"
              icon={BarChart3}
              label="Analytics"
              description="Rapports et métriques avancés"
            />

            <FeatureNavButton
              feature="api_access"
              href="/dashboard/api"
              icon={Code}
              label="API"
              description="Intégrations et développement"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Tooltip Simple */}
      <Card>
        <CardHeader>
          <CardTitle>3. Tooltip Simple</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleTooltip
            content="Cette fonctionnalité vous permet de gérer vos données"
            side="top"
          >
            <Button variant="outline">Hover pour info</Button>
          </SimpleTooltip>
        </CardContent>
      </Card>

      {/* 4. Tooltip Premium Personnalisé */}
      <Card>
        <CardHeader>
          <CardTitle>4. Tooltip Premium Personnalisé</CardTitle>
        </CardHeader>
        <CardContent>
          <PremiumTooltip
            title="Fonctionnalité Exclusive"
            description="Débloquez cette fonctionnalité avancée avec un abonnement Premium et accédez à des outils professionnels."
            feature="Export PDF avancé"
            onUpgradeClick={() => router.push("/pricing?feature=export")}
            side="right"
          >
            <div className="p-4 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50 cursor-help">
              <FileDown className="h-6 w-6 text-orange-600 mx-auto" />
              <p className="text-sm text-orange-700 mt-2 text-center">
                Export Premium
              </p>
            </div>
          </PremiumTooltip>
        </CardContent>
      </Card>

      {/* 5. Card avec restrictions */}
      <Card>
        <CardHeader>
          <CardTitle>5. Card avec Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <RestrictedCard />
        </CardContent>
      </Card>

      {/* 6. Boutons Navbar */}
      <Card>
        <CardHeader>
          <CardTitle>6. Boutons Navbar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FeatureButton
              feature="advanced_reports"
              href="/dashboard/analytics"
              variant="ghost"
              size="sm"
              className="text-blue-600"
              showUpgradeToast={false} // Pas de toast, juste redirection
              tooltipSide="bottom"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </FeatureButton>

            <FeatureButton
              feature="payroll"
              href="/dashboard/payroll"
              variant="ghost"
              size="sm"
              className="text-orange-600"
              showUpgradeToast={false}
              tooltipSide="bottom"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Masse Salariale
            </FeatureButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour démontrer une card avec restrictions
function RestrictedCard() {
  const hasAccess = false; // Simuler pas d'accès pour la démo
  const router = useRouter();

  return (
    <Card className={hasAccess ? "" : "opacity-75"}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Données Masse Salariale
          {!hasAccess && (
            <PremiumTooltip
              title="Accès Premium Requis"
              description="Consultez les données détaillées de masse salariale avec ratios et analytics."
              feature="Analyse RH complète"
              onUpgradeClick={() => router.push("/pricing?feature=payroll")}
            >
              <Badge variant="secondary" className="cursor-help">
                <Crown className="mr-1 h-3 w-3" />
                Premium
              </Badge>
            </PremiumTooltip>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAccess ? (
          <div>Données complètes ici...</div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-8 w-8 mx-auto mb-3 text-orange-400" />
            <p>Contenu réservé aux abonnés Premium</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
