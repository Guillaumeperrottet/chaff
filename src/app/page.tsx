"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  ChevronRight,
  BarChart3,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart,
  Shield,
  Lock,
  MapPin,
} from "lucide-react";
import Link from "next/link";

export default function ChaffLandingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Redirection si déjà connecté
  useEffect(() => {
    if (session?.user && !isPending) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-card/80 backdrop-blur-md border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-chaff-gradient text-white rounded-xl shadow-lg">
                <BarChart3 className="text-lg font-bold" />
              </div>
              <div className="flex flex-col">
                <div className="text-2xl font-bold text-primary">Chaff.ch</div>
                <div className="text-xs text-muted-foreground">
                  Analytics Business
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground"
              >
                Fonctionnalités
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-foreground"
              >
                Tarifs
              </a>
              <a
                href="/contact"
                className="text-muted-foreground hover:text-foreground"
              >
                Contact
              </a>
              <Link
                href="/signin"
                className="text-muted-foreground hover:text-foreground"
              >
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent">
                Visualisez vos{" "}
                <span className="text-primary">performances</span> en temps réel
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Chaff.ch vous aide à analyser votre chiffre d&apos;affaires et
                votre masse salariale pour optimiser la rentabilité de votre
                entreprise.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Analytics avancés</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Suivi CA</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Ratios financiers</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Suivi quotidien</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="group w-full sm:w-auto btn-chaff-primary"
                >
                  Commencer gratuitement
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/signin">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-primary/30 hover:bg-primary/10"
                >
                  Se connecter
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              ✨ Essai gratuit • Configuration en 2 minutes • Données sécurisées
              en Europe
            </p>
          </div>

          {/* CTA Card */}
          <div className="lg:max-w-md mx-auto w-full">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 card-chaff">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  Optimisez votre rentabilité
                </CardTitle>
                <CardDescription className="text-base">
                  Analysez vos performances financières en quelques clics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm">
                      Suivi quotidien du chiffre d&apos;affaires
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm">
                      Analyse de la masse salariale
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm">Ratios de rentabilité</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm">Tableaux de bord intuitifs</span>
                  </div>
                </div>

                <Link href="/signup" className="block">
                  <Button className="w-full btn-chaff-primary" size="lg">
                    Démarrer l&apos;analyse
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Vous avez déjà un compte ?{" "}
                    <Link
                      href="/signin"
                      className="text-primary hover:underline font-medium"
                    >
                      Connectez-vous ici
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold">
              Fonctionnalités puissantes pour votre business
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvrez comment Chaff.ch transforme vos données financières en
              insights actionnables
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-chaff">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Analytics en temps réel</CardTitle>
                <CardDescription>
                  Visualisez l&apos;évolution de votre chiffre d&apos;affaires
                  avec des graphiques interactifs et des métriques précises
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-chaff">
              <CardHeader>
                <DollarSign className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Gestion de la masse salariale</CardTitle>
                <CardDescription>
                  Suivez et optimisez vos coûts de personnel en calculant les
                  ratios de rentabilité par période
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-chaff">
              <CardHeader>
                <PieChart className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Tableaux de bord</CardTitle>
                <CardDescription>
                  Des dashboards personnalisables pour analyser vos performances
                  et prendre des décisions éclairées
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold">
              Vos données en sécurité, notre priorité
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chaff.ch garantit la protection de vos données financières avec
              les plus hauts standards de sécurité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-chaff border-green-200 bg-green-50/50">
              <CardHeader>
                <Shield className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Chiffrement end-to-end</CardTitle>
                <CardDescription>
                  Toutes vos données sont chiffrées en transit et au repos avec
                  les protocoles de sécurité les plus avancés (AES-256)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-chaff border-blue-200 bg-blue-50/50">
              <CardHeader>
                <MapPin className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Hébergement européen</CardTitle>
                <CardDescription>
                  Vos données sont exclusivement stockées sur des serveurs
                  sécurisés en Europe, conformément au RGPD
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-chaff border-purple-200 bg-purple-50/50">
              <CardHeader>
                <Lock className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>Accès sécurisé</CardTitle>
                <CardDescription>
                  Authentification renforcée, sauvegarde automatique et accès
                  contrôlé pour protéger votre business
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm">
              <Shield className="h-4 w-4" />
              <span className="font-medium">
                Conforme RGPD • Certifié ISO 27001 • Hébergement Suisse & UE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold">
              Tarifs transparents et accessibles
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Commencez gratuitement, évoluez selon vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan Gratuit */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Gratuit</CardTitle>
                <CardDescription>Parfait pour découvrir</CardDescription>
                <div className="text-3xl font-bold">
                  0CHF<span className="text-base font-normal">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/signup">
                  <Button
                    className="w-full"
                    variant="outline"
                    style={{ borderColor: "hsl(var(--primary))" }}
                  >
                    Commencer gratuitement
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan Premium */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <CardDescription>Pour les professionnels</CardDescription>
                <div className="text-3xl font-bold">
                  29CHF<span className="text-base font-normal">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/signup">
                  <Button className="w-full btn-chaff-primary">
                    Essayer Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan Entreprise */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Entreprise</CardTitle>
                <CardDescription>Pour les grandes équipes</CardDescription>
                <div className="text-3xl font-bold">Sur mesure</div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  style={{ borderColor: "hsl(var(--primary))" }}
                >
                  Nous contacter
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-chaff-gradient text-white rounded-lg">
                <BarChart3 />
              </div>
              <span className="text-xl font-bold text-primary">Chaff.ch</span>
            </div>
            <p className="text-muted-foreground">
              La solution d&apos;analytics business pour optimiser votre
              rentabilité
            </p>
            <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary">
                Conditions d&apos;utilisation
              </a>
              <a href="#" className="hover:text-primary">
                Politique de confidentialité
              </a>
              <a href="#contact" className="hover:text-primary">
                Support
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 Chaff.ch. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
