// src/app/signup/page.tsx - Version unifiée
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  BarChart3,
  Mail,
  Lock,
  ArrowRight,
  Home,
  TrendingUp,
  User,
  Camera,
  X,
  CheckCircle,
  Gift,
  Zap,
} from "lucide-react";

// Skeleton de chargement
const SignUpSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="w-full max-w-md animate-pulse">
      <div className="bg-white rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  </div>
);

// Composant qui utilise useSearchParams
function SignUpFormWithParams() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasProfileImage, setHasProfileImage] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Vérifier s'il y a un code d'invitation et rediriger
  useEffect(() => {
    const inviteCode = searchParams.get("code");
    if (inviteCode) {
      setRedirecting(true);
      router.push(`/invitation/${inviteCode}`);
    }
  }, [searchParams, router]);

  const handleImageUpload = () => {
    setHasProfileImage(!hasProfileImage);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("📤 Inscription Chaff.ch:", { email, name });

      const signupData = {
        email,
        password,
        name,
        planType: "FREE", // Toujours FREE par défaut
      };

      const result = await authClient.signUp.email(signupData);

      if (result.error) {
        console.error("Erreur d'inscription:", result.error);
        setError(result.error.message || "Erreur lors de l'inscription");
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      console.error("Erreur d'inscription:", err);
      setError("Une erreur inattendue est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher l'écran de chargement pendant la redirection
  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Redirection vers la page d&apos;invitation...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Vérifiez votre email
            </h1>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-blue-800 text-sm font-medium mb-2">
                    Email de vérification envoyé !
                  </p>
                  <p className="text-blue-700 text-sm">
                    Nous avons envoyé un lien de vérification à votre adresse
                    email.{" "}
                    <strong>
                      Votre compte sera activé après avoir cliqué sur ce lien.
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-green-800 text-sm font-medium mb-1">
                    Plan gratuit activé
                  </p>
                  <p className="text-green-700 text-sm">
                    Votre espace Chaff.ch sera créé automatiquement après
                    vérification
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              Réessayer avec une autre adresse
            </Button>

            <p className="text-sm text-gray-600 mt-4">
              Déjà un compte ?{" "}
              <Link
                href="/signin"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Section gauche - Features avec design moderne */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Motifs géométriques en arrière-plan */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div
            className="absolute bottom-24 right-12 w-56 h-56 bg-blue-400/20 rounded-3xl rotate-45 animate-bounce"
            style={{ animationDuration: "4s" }}
          ></div>
          <div className="absolute top-1/3 left-1/3 w-28 h-28 bg-indigo-300/20 rounded-2xl rotate-12"></div>
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
                Démarrez votre
                <span className="block text-blue-200">
                  transformation digitale
                </span>
              </h2>
              <p className="text-blue-100 text-lg">
                Rejoignez les entreprises qui optimisent déjà leur performance
                avec nos analytics
              </p>
            </div>
          </div>

          {/* Avantages de l'inscription */}
          <div className="space-y-6">
            <div className="group hover:bg-white/10 p-4 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Démarrage gratuit</h3>
                  <p className="text-blue-200 text-sm">
                    Commencez immédiatement sans frais avec notre plan gratuit
                  </p>
                </div>
              </div>
            </div>

            <div className="group hover:bg-white/10 p-4 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Configuration instantanée
                  </h3>
                  <p className="text-blue-200 text-sm">
                    Votre espace de travail prêt en moins de 2 minutes
                  </p>
                </div>
              </div>
            </div>

            <div className="group hover:bg-white/10 p-4 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Résultats immédiats</h3>
                  <p className="text-blue-200 text-sm">
                    Visualisez vos KPIs dès la première connexion
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">1K+</div>
                <div className="text-blue-200 text-sm">Entreprises</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">50M+</div>
                <div className="text-blue-200 text-sm">Données analysées</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">98%</div>
                <div className="text-blue-200 text-sm">Satisfaction</div>
              </div>
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
              Créer votre compte
            </h1>
            <p className="text-gray-600">
              Rejoignez Chaff.ch et transformez vos données
            </p>
          </div>

          {/* Upload d'image de profil */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl text-gray-600 font-bold border-2 border-gray-300 group-hover:border-blue-500 cursor-pointer transition-all duration-300">
                {hasProfileImage ? (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
                    {name ? name.charAt(0).toUpperCase() : "U"}
                  </div>
                ) : (
                  <User className="w-8 h-8" />
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-300">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {hasProfileImage ? (
              <button
                onClick={handleImageUpload}
                className="mt-3 flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Supprimer
              </button>
            ) : (
              <button
                onClick={handleImageUpload}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Ajouter une photo (optionnel)
              </button>
            )}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            {/* Champ Nom */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Nom complet
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400"
                  placeholder="Jean Dupont"
                  required
                />
              </div>
            </div>

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
                  placeholder="jean@entreprise.com"
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
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
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
              <div className="text-xs text-gray-500">
                Au moins 8 caractères avec une majuscule et un chiffre
              </div>
            </div>

            {/* Conditions d'utilisation */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <Label
                htmlFor="terms"
                className="text-sm text-gray-600 leading-relaxed"
              >
                J&apos;accepte les{" "}
                <Link
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  conditions d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  politique de confidentialité
                </Link>
              </Label>
            </div>

            {/* Bouton d'inscription */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Création en cours...
                </>
              ) : (
                <>
                  Créer mon compte gratuit
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
                Déjà un compte ?{" "}
                <Link
                  href="/signin"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Se connecter
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
export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpSkeleton />}>
      <SignUpFormWithParams />
    </Suspense>
  );
}
