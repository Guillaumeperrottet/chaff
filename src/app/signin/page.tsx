// src/app/signin/page.tsx - Version unifiée
"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  BarChart3,
  Mail,
  Lock,
  ArrowRight,
  Home,
  TrendingUp,
  DollarSign,
  PieChart,
  Sparkles,
} from "lucide-react";

// Skeleton de chargement
const SignInSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="w-full max-w-md animate-pulse">
      <div className="bg-white rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  </div>
);

// Composant qui utilise useSearchParams
function SignInFormWithParams() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirectPath,
      });

      if (authError) {
        setError("Identifiants invalides");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Une erreur est survenue, veuillez réessayer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Section gauche - Features avec design moderne */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Motifs géométriques en arrière-plan */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div
            className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/20 rounded-3xl rotate-45 animate-bounce"
            style={{ animationDuration: "3s" }}
          ></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-300/20 rounded-2xl rotate-12"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          {/* Logo et titre */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Chaff.ch</h1>
                <p className="text-blue-200 text-sm">Analytics Business</p>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-bold leading-tight">
                Transformez vos
                <span className="block text-blue-200">données en insights</span>
              </h2>
              <p className="text-blue-100 text-lg">
                La plateforme d&apos;analytics business qui révolutionne votre
                approche des données financières
              </p>
            </div>
          </div>

          {/* Features modernes */}
          <div className="space-y-6">
            <div className="group hover:bg-white/10 p-4 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Analytics en temps réel
                  </h3>
                  <p className="text-blue-200 text-sm">
                    Visualisez vos KPIs instantanément avec des tableaux de bord
                    dynamiques
                  </p>
                </div>
              </div>
            </div>

            <div className="group hover:bg-white/10 p-4 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Optimisation financière
                  </h3>
                  <p className="text-blue-200 text-sm">
                    Calculez vos ratios masse salariale/CA pour maximiser la
                    rentabilité
                  </p>
                </div>
              </div>
            </div>

            <div className="group hover:bg-white/10 p-4 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Rapports intelligents
                  </h3>
                  <p className="text-blue-200 text-sm">
                    Générez des insights actionnables grâce à l&apos;IA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-2 text-blue-200">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">
                Rejoignez plus de 1,000+ entreprises qui utilisent Chaff.ch
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section droite - Formulaire moderne */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Header du formulaire */}
          <div className="text-center mb-8">
            <div className="lg:hidden mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bon retour !
            </h1>
            <p className="text-gray-600">
              Connectez-vous pour accéder à vos analytics
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            {/* Champ Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Adresse email
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Mot de passe
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Options supplémentaires */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600">Se souvenir de moi</span>
              </label>
              <Link
                href="#"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton de connexion */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-50 text-gray-500">ou</span>
              </div>
            </div>

            {/* Liens de navigation */}
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Pas encore de compte ?{" "}
                <Link
                  href="/signup"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
              <Link
                href="/pricing"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Découvrir nos tarifs
              </Link>
            </div>
          </form>
        </div>

        {/* Bouton retour accueil */}
        <div className="absolute top-6 right-6">
          <Link
            href="/"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Home className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Page principale avec Suspense
export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInFormWithParams />
    </Suspense>
  );
}
