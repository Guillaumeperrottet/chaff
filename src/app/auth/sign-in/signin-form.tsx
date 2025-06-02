"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, User, Lock, Eye, EyeOff, Home } from "lucide-react";

export default function SignInForm({
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
            className="text-[#62605d] hover:text-[#d9840d] transition-colors"
          >
            <Home size={20} />
          </Link>
        </div>

        <div className="w-16 h-16 bg-gradient-to-br from-[#d9840d] to-[#e36002] rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
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
        <h1 className="text-2xl font-bold text-[#141313]">
          Bienvenue sur PlanniKeeper
        </h1>
        <p className="text-[#62605d] mt-2">
          Connectez-vous pour accéder à votre espace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-[#fee2e2] border border-[#fca5a5] shadow-sm">
            <p className="text-[#b91c1c] text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-[#141313]"
            >
              Email
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-[#62605d]" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="pl-10 bg-white border-[#beac93] focus:border-[#d9840d] rounded-lg shadow-sm hover:border-[#d9840d]/70 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-[#141313]"
            >
              Mot de passe
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-[#62605d]" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-10 pr-10 bg-white border-[#beac93] focus:border-[#d9840d] rounded-lg shadow-sm hover:border-[#d9840d]/70 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-[#62605d] hover:text-[#141313] transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 text-[#62605d] hover:text-[#141313] transition-colors" />
                )}
              </button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-6 bg-gradient-to-r from-[#d9840d] to-[#e36002] hover:from-[#c6780c] hover:to-[#d9840d] transition-all duration-300 transform hover:scale-[1.02] font-medium shadow-md text-white rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
          {!isLoading && <ChevronRight className="ml-2 h-5 w-5" />}
        </Button>

        <div className="flex flex-col space-y-4 text-center">
          <div className="text-sm">
            <span className="text-[#62605d]">
              Vous n&apos;avez pas encore de compte ?{" "}
            </span>
            <Link
              href="/signup"
              className="text-[#d9840d] hover:text-[#c6780c] hover:underline underline-offset-4 font-medium transition-colors"
            >
              Inscrivez-vous
            </Link>
          </div>

          <div className="text-sm">
            <Link
              href="/pricing"
              className="text-[#d9840d] hover:text-[#c6780c] hover:underline underline-offset-4 font-medium transition-colors"
            >
              Découvrez nos formules
            </Link>
          </div>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-[#beac93]/30">
        <p className="text-xs text-center text-[#62605d]">
          En continuant, vous acceptez nos{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-[#d9840d] transition-colors"
          >
            Conditions d&apos;utilisation
          </a>{" "}
          et notre{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-[#d9840d] transition-colors"
          >
            Politique de confidentialité
          </a>
          .
        </p>
      </div>
    </div>
  );
}
