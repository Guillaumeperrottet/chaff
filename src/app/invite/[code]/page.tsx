// Créer le fichier : src/app/invite/[code]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Building,
  Loader2,
} from "lucide-react";

interface InvitationDetails {
  valid: boolean;
  organizationName?: string;
  role?: string;
  organizationId?: string;
  error?: string;
  createdBy?: {
    name: string;
    email: string;
  };
  organizationInfo?: {
    memberCount: number;
    planName: string;
  };
}

export default function SimplifiedInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const [inviteDetails, setInviteDetails] = useState<InvitationDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteCode = typeof params.code === "string" ? params.code : "";

  // Vérifier la validité du code d'invitation
  useEffect(() => {
    async function validateInvitation() {
      try {
        if (!inviteCode) {
          setInviteDetails({
            valid: false,
            error: "Code d'invitation manquant",
          });
          setIsLoading(false);
          return;
        }

        console.log("🔍 Validation invitation:", inviteCode);

        const response = await fetch(
          `/api/invitations/validate?code=${inviteCode}`
        );
        const data = await response.json();

        console.log("📋 Réponse validation:", data);

        setInviteDetails(data);
        setIsLoading(false);

        if (!data.valid) {
          toast.error(data.error || "Code d'invitation invalide");
        } else {
          toast.success("Invitation validée !");
        }
      } catch (err) {
        console.error("❌ Erreur validation:", err);
        setInviteDetails({
          valid: false,
          error: "Erreur lors de la validation du code d'invitation",
        });
        setIsLoading(false);
      }
    }

    validateInvitation();
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    console.log("📤 Soumission invitation:", { inviteCode, email, name });

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          email,
          password,
          name,
        }),
      });

      const result = await response.json();
      console.log("📥 Réponse acceptation:", result);

      if (!response.ok) {
        throw new Error(
          result.error || "Erreur lors de l'acceptation de l'invitation"
        );
      }

      // Afficher message de succès
      toast.success(`🎉 Bienvenue dans ${result.user.organizationName} !`);

      // Redirection avec rechargement pour actualiser la session
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err) {
      console.error("❌ Erreur acceptation:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      toast.error("Erreur lors de la création du compte");
    } finally {
      setIsSubmitting(false);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d9840d] mx-auto mb-4"></div>
          <p className="text-[#62605d]">Vérification de l&apos;invitation...</p>
        </div>
      </div>
    );
  }

  // Invitation invalide
  if (!inviteDetails?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50 p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-[#beac93]/30 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-[#141313] mb-2">
              Invitation invalide
            </h2>
            <p className="text-[#62605d] mb-6">
              {inviteDetails?.error ||
                "Cette invitation n'est pas valide ou a expiré."}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/signup")}
                className="bg-[#d9840d] hover:bg-[#c6780c] w-full"
              >
                Créer un nouveau compte
              </Button>
              <Button
                onClick={() => router.push("/signin")}
                variant="outline"
                className="w-full border-[#beac93] hover:bg-[#e8ebe0]"
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire d'invitation
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50 p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-[#beac93]/30 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#d9840d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-[#d9840d]" />
          </div>
          <h2 className="text-2xl font-bold text-[#141313] mb-2">
            Rejoindre l&apos;équipe
          </h2>
          <p className="text-[#62605d]">
            Vous êtes invité à rejoindre{" "}
            <strong>{inviteDetails.organizationName}</strong>
          </p>
        </div>

        {/* Informations sur l'invitation */}
        <div className="mb-6 p-4 bg-[#e0f2fe] border border-[#7dd3fc] rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#0284c7] mt-0.5 flex-shrink-0" />
            <div className="text-[#0284c7] text-sm">
              <p className="font-medium">Invitation validée !</p>
              <p>
                Rôle:{" "}
                <strong>
                  {inviteDetails.role === "admin" ? "Administrateur" : "Membre"}
                </strong>
              </p>
              {inviteDetails.createdBy && (
                <p>
                  Invité par: <strong>{inviteDetails.createdBy.name}</strong>
                </p>
              )}
              {inviteDetails.organizationInfo && (
                <p className="mt-1 text-xs">
                  {inviteDetails.organizationInfo.memberCount} membres • Plan{" "}
                  {inviteDetails.organizationInfo.planName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-[#fee2e2] border border-[#fca5a5] rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#b91c1c] mt-0.5 flex-shrink-0" />
              <p className="text-[#b91c1c] text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label
              htmlFor="name"
              className="text-sm font-medium text-[#141313]"
            >
              Nom complet
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#62605d]" />
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Votre nom complet"
                className="pl-10 bg-white border-[#beac93] focus:border-[#d9840d] rounded-lg"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="email"
              className="text-sm font-medium text-[#141313]"
            >
              Adresse email
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#62605d]" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="votre@email.com"
                className="pl-10 bg-white border-[#beac93] focus:border-[#d9840d] rounded-lg"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="password"
              className="text-sm font-medium text-[#141313]"
            >
              Mot de passe
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#62605d]" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Minimum 8 caractères"
                minLength={8}
                className="pl-10 bg-white border-[#beac93] focus:border-[#d9840d] rounded-lg"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 mt-6 bg-gradient-to-r from-[#d9840d] to-[#e36002] hover:from-[#c6780c] hover:to-[#d9840d] text-white font-medium rounded-lg transition-all duration-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création du compte...
              </>
            ) : (
              "Rejoindre l'organisation"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 p-4 bg-[#f8f9fa] rounded-lg text-center">
          <p className="text-xs text-[#62605d]">
            En rejoignant, vous acceptez nos{" "}
            <a href="#" className="text-[#d9840d] hover:underline">
              conditions d&apos;utilisation
            </a>
          </p>
        </div>

        {/* Lien de connexion pour les comptes existants */}
        <div className="mt-4 text-center">
          <p className="text-sm text-[#62605d]">
            Vous avez déjà un compte ?{" "}
            <button
              type="button"
              onClick={() => router.push("/signin")}
              className="text-[#d9840d] hover:underline font-medium"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
