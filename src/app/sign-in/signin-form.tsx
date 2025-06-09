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
import { ChevronRight, User, Lock, Eye, EyeOff, Home } from "lucide-react";

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
            className="text-gray-600 hover:text-orange-600 transition-colors"
          >
            <Home size={20} />
          </Link>
        </div>

        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <div className="w-8 h-8 text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue sur Chaff.ch
        </h1>
        <p className="text-gray-600 mt-2">
          Connectez-vous pour accéder à votre espace
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
                className="pl-10 bg-white border-orange-200 focus:border-orange-500 rounded-lg shadow-sm hover:border-orange-400 transition-colors"
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
                className="pl-10 pr-10 bg-white border-orange-200 focus:border-orange-500 rounded-lg shadow-sm hover:border-orange-400 transition-colors"
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
          className="w-full py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-[1.02] font-medium shadow-md text-white rounded-lg"
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
              className="text-orange-600 hover:text-orange-700 hover:underline underline-offset-4 font-medium transition-colors"
            >
              Inscrivez-vous
            </Link>
          </div>

          <div className="text-sm">
            <Link
              href="/pricing"
              className="text-orange-600 hover:text-orange-700 hover:underline underline-offset-4 font-medium transition-colors"
            >
              Découvrez nos formules
            </Link>
          </div>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-orange-200/30">
        <p className="text-xs text-center text-gray-600">
          En continuant, vous acceptez nos{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-orange-600 transition-colors"
          >
            Conditions d&apos;utilisation
          </a>{" "}
          et notre{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-orange-600 transition-colors"
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

// Composant principal exporté avec Suspense
export default function SignInForm(
  props: React.ComponentPropsWithoutRef<"div">
) {
  return (
    <Suspense fallback={<SignInFormSkeleton />}>
      <SignInFormWithParams {...props} />
    </Suspense>
  );
}
