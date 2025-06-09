// src/app/sign-in/signin-form.tsx - Formulaire de connexion Chaff.ch avec design bleu
"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  User,
  Lock,
  Eye,
  EyeOff,
  Home,
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
} from "lucide-react";

// Composant séparé pour la partie qui utilise useSearchParams
function SignInFormWithParams({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
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

      // Petite pause pour permettre aux cookies d'être définis
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Utiliser le router Next.js au lieu de window.location.href
      router.push(redirectPath);
      router.refresh(); // Force Next.js à revalider les données
    } catch (err) {
      console.error("Login error:", err);
      setError("Une erreur est survenue, veuillez réessayer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <div className="mb-8 text-center">
        <div className="absolute top-4 right-4">
          <Link
            href="/"
            className="text-gray-600 hover:text-primary transition-colors"
          >
            <Home size={20} />
          </Link>
        </div>

        <div className="w-16 h-16 bg-chaff-gradient rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue sur Chaff.ch
        </h1>
        <p className="text-gray-600 mt-2">
          Connectez-vous pour accéder à vos analytics business
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 shadow-sm">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-900"
            >
              Email
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="pl-10 bg-white border-primary/30 focus:border-primary rounded-lg shadow-sm hover:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-900"
            >
              Mot de passe
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-600" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-10 pr-10 bg-white border-primary/30 focus:border-primary rounded-lg shadow-sm hover:border-primary/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-600 hover:text-gray-900 transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-600 hover:text-gray-900 transition-colors" />
                )}
              </button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-6 btn-chaff-primary font-medium shadow-md text-white rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
          {!isLoading && <ChevronRight className="ml-2 h-5 w-5" />}
        </Button>

        <div className="flex flex-col space-y-4 text-center">
          <div className="text-sm">
            <span className="text-gray-600">
              Vous n&apos;avez pas encore de compte ?{" "}
            </span>
            <Link
              href="/signup"
              className="text-primary hover:text-primary/80 hover:underline underline-offset-4 font-medium transition-colors"
            >
              Inscrivez-vous
            </Link>
          </div>

          <div className="text-sm">
            <Link
              href="/pricing"
              className="text-primary hover:text-primary/80 hover:underline underline-offset-4 font-medium transition-colors"
            >
              Découvrez nos formules
            </Link>
          </div>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-primary/20">
        <p className="text-xs text-center text-gray-600">
          En continuant, vous acceptez nos{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary transition-colors"
          >
            Conditions d&apos;utilisation
          </a>{" "}
          et notre{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary transition-colors"
          >
            Politique de confidentialité
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// Fallback pour le chargement
function SignInFormSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-6"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="h-12 bg-gray-200 rounded"></div>

        <div className="space-y-4 text-center">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

// Page de connexion complète avec design bleu Chaff.ch
export default function SignInPage() {
  return (
    <div className="flex min-h-svh bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-700/30"
          aria-hidden="true"
        />
        {/* Cercles décoratifs bleus */}
        <div className="absolute -right-20 top-1/4 w-64 h-64 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute left-1/4 bottom-1/4 w-48 h-48 rounded-full bg-blue-600/40 blur-xl" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-md p-8">
            <div className="relative mb-12">
              <div className="absolute -left-6 -top-6 w-16 h-16 bg-primary/20 rounded-full"></div>
              <div className="text-4xl font-bold mb-6 text-gray-900 relative z-10">
                <span className="block">Analysez.</span>
                <span className="block">Optimisez.</span>
                <span className="block text-primary">Prospérez.</span>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-10 border-l-4 border-primary/40 pl-4">
              Transformez vos données financières en décisions stratégiques avec
              Chaff.ch, la plateforme d&apos;analytics business conçue pour
              votre succès.
            </p>

            <div className="space-y-6">
              {/* Feature analytics */}
              <div className="bg-white p-5 rounded-xl border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-primary/10 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-primary/20 transition-all duration-300"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-md">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900">
                      Analytics temps réel
                    </h3>
                    <p className="text-sm text-gray-600">
                      Visualisez vos performances instantanément
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature ratios */}
              <div className="bg-white p-5 rounded-xl border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-primary/10 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-primary/20 transition-all duration-300"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900">
                      Ratios financiers
                    </h3>
                    <p className="text-sm text-gray-600">
                      Optimisez votre rentabilité
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature dashboards */}
              <div className="bg-white p-5 rounded-xl border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-primary/10 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-primary/20 transition-all duration-300"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white shadow-md">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900">
                      Tableaux de bord
                    </h3>
                    <p className="text-sm text-gray-600">
                      Pilotez votre activité efficacement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 relative">
        {/* Cercles décoratifs pour le côté droit aussi */}
        <div className="absolute right-10 bottom-10 w-40 h-40 rounded-full bg-primary/5 blur-xl" />
        <div className="absolute left-10 top-1/4 w-32 h-32 rounded-full bg-blue-600/30 blur-xl" />

        {/* Le formulaire de connexion avec Suspense */}
        <Suspense fallback={<SignInFormSkeleton />}>
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-primary/30 p-8 z-10">
            <SignInFormWithParams />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
