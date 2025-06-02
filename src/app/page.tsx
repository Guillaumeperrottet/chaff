"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { ChevronRight, Shield, Users, BarChart3, Zap } from "lucide-react";
import { toast } from "sonner";

export default function LandingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Redirection si déjà connecté
  useEffect(() => {
    if (session?.user && !isPending) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  // Form states
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: signInData.email,
        password: signInData.password,
      });

      if (result.error) {
        toast.error("Erreur de connexion", {
          description: "Email ou mot de passe incorrect",
        });
      } else {
        toast.success("Connexion réussie");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la connexion",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error("Erreur", {
        description: "Les mots de passe ne correspondent pas",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await authClient.signUp.email({
        email: signUpData.email,
        password: signUpData.password,
        name: signUpData.name,
      });

      if (result.error) {
        toast.error("Erreur d'inscription", {
          description: "Cet email est peut-être déjà utilisé",
        });
      } else {
        toast.success("Inscription réussie", {
          description: "Vérifiez votre email pour activer votre compte",
        });
      }
    } catch {
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de l'inscription",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

            <Button size="lg" className="group">
              Découvrir la démo
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Auth Forms */}
          <div className="lg:max-w-md mx-auto w-full">
            <Card>
              <CardHeader>
                <CardTitle>Commencer maintenant</CardTitle>
                <CardDescription>
                  Créez votre compte ou connectez-vous pour accéder à votre
                  dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Connexion</TabsTrigger>
                    <TabsTrigger value="signup">Inscription</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={signInData.email}
                          onChange={(e) =>
                            setSignInData({
                              ...signInData,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Mot de passe</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          value={signInData.password}
                          onChange={(e) =>
                            setSignInData({
                              ...signInData,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Connexion..." : "Se connecter"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nom complet</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Jean Dupont"
                          value={signUpData.name}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={signUpData.email}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Mot de passe</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={signUpData.password}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">
                          Confirmer le mot de passe
                        </Label>
                        <Input
                          id="signup-confirm"
                          type="password"
                          value={signUpData.confirmPassword}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Inscription..." : "S'inscrire"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
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
    </div>
  );
}
