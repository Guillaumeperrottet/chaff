// signup-form.tsx - Version avec Suspense sécurisé
"use client";

import {
  FormEvent,
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
  Suspense,
} from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Home,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const SignupImageUpload = dynamic(() => import("./SignupImageUpload"), {
  loading: () => (
    <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto mb-4"></div>
  ),
  ssr: false,
});

// Skeleton pour le formulaire d'inscription
function SignUpFormSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="absolute top-4 right-4">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
      </div>

      <div className="h-6 bg-gray-200 rounded mb-6 w-1/2 mx-auto"></div>

      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded mt-6"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
    </div>
  );
}

// Composant qui utilise useSearchParams
function SignUpFormWithParams() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  const [isInvite, setIsInvite] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const planType = searchParams.get("plan") || "FREE";

  const handleImageSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
  }, []);

  useEffect(() => {
    let mounted = true;

    if (inviteCode) {
      fetch(`/api/invitations/validate?code=${inviteCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (!mounted) return;
          if (data.valid) {
            setIsInvite(true);
            setOrganizationName(data.organizationName);
            setOrganizationId(data.organizationId);
            console.log("📋 Invitation validée:", data);
          } else {
            console.error("Code d'invitation invalide:", data.error);
            setError(
              `Code d'invitation invalide: ${data.error || "Code inconnu ou expiré"}`
            );
          }
        })
        .catch((err) => {
          console.error("Erreur de validation du code:", err);
          setError("Erreur lors de la validation du code d'invitation");
        });
    }

    return () => {
      mounted = false;
    };
  }, [inviteCode]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmitting) return;
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string;

      try {
        let imageUrl: string | undefined = undefined;

        // Upload d'image si nécessaire
        if (selectedFile) {
          const imageFormData = new FormData();
          imageFormData.append("file", selectedFile);

          const toastId = toast.loading("Téléchargement de l'image...");

          try {
            const uploadResponse = await fetch("/api/auth/temp-image-upload", {
              method: "POST",
              body: imageFormData,
            });

            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              imageUrl = uploadData.imageUrl;
              toast.success("Image téléchargée avec succès", { id: toastId });
            } else {
              throw new Error("Erreur lors de l'upload de l'image");
            }
          } catch {
            toast.error(
              "Impossible de télécharger l'image. L'inscription continuera sans image.",
              { id: toastId }
            );
          }
        }

        console.log("📤 Données d'inscription:", {
          email,
          name,
          inviteCode: inviteCode ? "***" : undefined,
          planType,
          organizationId: isInvite ? organizationId : undefined,
        });

        const signupData = {
          email,
          password,
          name,
          image: imageUrl,
          inviteCode: inviteCode || undefined,
          planType: planType || "FREE",
          organizationId: isInvite ? organizationId : undefined,
        };

        const result = await authClient.signUp.email(signupData);

        if (result.error) {
          console.error("Erreur d'inscription:", result.error);
          setError(result.error.message || "Erreur lors de l'inscription");
          setIsSubmitting(false);
          return;
        }

        // Afficher le message de succès
        setShowSuccess(true);
        toast.success("Email de vérification envoyé !");
      } catch (err) {
        console.error("Erreur d'inscription:", err);
        setError("Une erreur inattendue est survenue");
        setIsSubmitting(false);
      }
    },
    [inviteCode, planType, selectedFile, isSubmitting, isInvite, organizationId]
  );

  if (showSuccess) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Vérifiez votre email
        </h2>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <Mail className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-blue-700 mb-2">
                Email de vérification envoyé !
              </h3>
              <p className="text-blue-700 text-sm mb-3">
                Nous avons envoyé un lien de vérification à votre adresse email.
                <strong>
                  {" "}
                  Votre compte ne sera activé qu&apos;après avoir cliqué sur ce
                  lien.
                </strong>
              </p>
              <p className="text-blue-700 text-sm">
                💡 <strong>Vérifiez également votre dossier spam</strong> si
                vous ne voyez pas l&apos;email dans quelques minutes.
              </p>
            </div>
          </div>
        </div>

        {isInvite && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-green-600 mt-0.5">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-green-700 text-sm">
                  <strong>Invitation détectée :</strong> Après vérification de
                  votre email, vous serez ajouté à l&apos;organisation{" "}
                  <strong>{organizationName}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-left">
              <p className="text-yellow-700 text-sm">
                <strong>Important :</strong> Le lien expire dans 24 heures. Si
                vous ne finalisez pas votre inscription dans ce délai, vous
                devrez recommencer le processus.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Vous n&apos;avez pas reçu l&apos;email ?
          </p>
          <Button
            onClick={() => setShowSuccess(false)}
            variant="outline"
            className="w-full border-orange-200 hover:bg-orange-50"
          >
            Réessayer avec une autre adresse
          </Button>
          <p className="text-xs text-gray-600">
            Ou{" "}
            <Link href="/signin" className="text-orange-600 hover:underline">
              connectez-vous si vous avez déjà un compte
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="absolute top-4 right-4">
        <Link
          href="/"
          className="text-gray-600 hover:text-orange-600 transition-colors"
        >
          <Home size={20} />
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
        Inscription
      </h2>

      {isInvite && (
        <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-blue-700 flex-1">
              Vous avez été invité à rejoindre{" "}
              <strong className="font-semibold">{organizationName}</strong>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-red-600 mt-0.5">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-red-700 flex-1 font-medium text-sm">{error}</p>
          </div>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        <SignupImageUpload onImageSelect={handleImageSelect} />

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-900">
            Nom complet
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Entrez votre nom complet"
              autoComplete="name"
              className="pl-10 bg-white border-orange-200 focus:border-orange-500 rounded-lg shadow-sm hover:border-orange-400 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-900">
            Adresse email
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-600" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Entrez votre email"
              autoComplete="email"
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
              name="password"
              type="password"
              required
              placeholder="Mot de passe (min. 8 caractères)"
              minLength={8}
              autoComplete="new-password"
              className="pl-10 bg-white border-orange-200 focus:border-orange-500 rounded-lg shadow-sm hover:border-orange-400 transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-6 mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-[1.02] font-medium shadow-md text-white rounded-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Envoi en cours..."
          ) : (
            <>
              Créer mon compte
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte?{" "}
            <Link
              href="/signin"
              className="text-orange-600 hover:text-orange-700 hover:underline underline-offset-4 font-medium transition-colors"
            >
              Connectez-vous
            </Link>
          </p>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-orange-200/30">
        <p className="text-xs text-center text-gray-600">
          En vous inscrivant, vous acceptez nos{" "}
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

// Composant principal exporté avec Suspense
function SignUpForm() {
  return (
    <Suspense fallback={<SignUpFormSkeleton />}>
      <SignUpFormWithParams />
    </Suspense>
  );
}

export default memo(SignUpForm);
