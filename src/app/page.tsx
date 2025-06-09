// src/app/page.tsx - Page d'accueil redirigée vers inscription
"use client";

import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";
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
  Shield,
  Users,
  BarChart3,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
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
            <div className="flex items-center">
              <div className="text-2xl font-bold text-primary">Chaff.ch</div>
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
                href="#contact"
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
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Gérez vos données avec{" "}
                <span className="text-primary">Chaff.ch</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                La plateforme moderne qui simplifie la gestion de vos données et
                optimise votre productivité.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Sécurisé</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Collaboratif</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Performant</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="group w-full sm:w-auto">
                  Commencer gratuitement
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/signin">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Se connecter
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              ✨ Aucune carte bancaire requise • Configuration en 2 minutes
            </p>
          </div>

          {/* CTA Card */}
          <div className="lg:max-w-md mx-auto w-full">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Commencez maintenant</CardTitle>
                <CardDescription className="text-base">
                  Rejoignez nous !
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm">
                      Inscription gratuite en 30 secondes
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm">
                      Interface intuitive et moderne
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm">Support client réactif</span>
                  </div>
                </div>

                <Link href="/signup" className="block">
                  <Button className="w-full" size="lg">
                    Créer mon compte gratuitement
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
            <h2 className="text-3xl font-bold">Fonctionnalités principales</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvrez les outils qui vous aideront à gérer vos données
              efficacement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Sécurité avancée</CardTitle>
                <CardDescription>
                  Vos données sont protégées par les dernières technologies de
                  sécurité
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Collaboration</CardTitle>
                <CardDescription>
                  Travaillez en équipe avec des outils de partage et de gestion
                  des droits
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Obtenez des insights précieux grâce à nos outils
                  d&apos;analyse intégrés
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold">
              Tarifs simples et transparents
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
                  0€<span className="text-base font-normal">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/signup">
                  <Button className="w-full" variant="outline">
                    Commencer gratuitement
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan Premium */}
            <Card className="relative border-2 border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  Populaire
                </span>
              </div>
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <CardDescription>Pour les professionnels</CardDescription>
                <div className="text-3xl font-bold">
                  29€<span className="text-base font-normal">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/signup">
                  <Button className="w-full">Essayer Premium</Button>
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
                <Button className="w-full" variant="outline">
                  Nous contacter
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
