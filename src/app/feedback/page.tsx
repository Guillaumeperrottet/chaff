import { Metadata } from "next";
import FeaturesForm from "@/app/components/FeaturesForm";
import { BackButton } from "@/app/components/ui/BackButton";
import { MessageSquarePlus, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Feedback & Suggestions | Chaff.ch",
  description:
    "Proposez de nouvelles fonctionnalités ou signalez des bugs pour améliorer Chaff.ch",
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header avec navigation */}
      <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] sticky top-0 z-40">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton
              href="/profile"
              label="Retour au profil"
              loadingMessage="Retour au profil..."
            />
            <div className="h-4 w-px bg-[color:var(--border)]"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-chaff-gradient rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquarePlus size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[color:var(--foreground)]">
                  Feedback & Suggestions
                </h1>
                <p className="text-sm text-[color:var(--muted-foreground)] hidden sm:block">
                  Aidez-nous à améliorer Chaff.ch
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container max-w-4xl px-4 py-8 mx-auto">
        <div className="grid gap-6">
          {/* Introduction Card */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 card-chaff">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-chaff-gradient rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2 text-[color:var(--foreground)]">
                  Votre avis compte pour Chaff.ch
                </h2>
                <p className="text-[color:var(--foreground)] leading-relaxed">
                  Nous développons constamment de nouvelles fonctionnalités pour
                  améliorer votre expérience d&apos;analytics business. Vos
                  suggestions et signalements nous aident à prioriser nos
                  développements et à corriger les problèmes rapidement.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6 shadow-sm card-chaff">
            <FeaturesForm />
          </div>

          {/* Process Info Card */}
          <div className="bg-[color:var(--muted)] border border-[color:var(--border)] rounded-xl p-6 card-chaff">
            <h2 className="text-lg font-semibold mb-4 text-[color:var(--foreground)] flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
              Notre processus de traitement
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[color:var(--foreground)] mb-1">
                      Réception & Analyse
                    </h3>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Chaque suggestion est examinée par notre équipe technique
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[color:var(--foreground)] mb-1">
                      Priorisation
                    </h3>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Nous évaluons l&apos;impact et la faisabilité technique
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[color:var(--foreground)] mb-1">
                      Développement
                    </h3>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Les fonctionnalités approuvées sont intégrées à notre
                      roadmap
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[color:var(--foreground)] mb-1">
                      Déploiement
                    </h3>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Nouvelle fonctionnalité disponible pour tous les
                      utilisateurs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[color:var(--border)]">
              <p className="text-sm text-[color:var(--muted-foreground)] text-center">
                <strong>Urgence ?</strong> Contactez-nous directement à{" "}
                <a
                  href="mailto:support@chaff.ch"
                  className="text-[color:var(--primary)] hover:underline font-medium"
                >
                  support@chaff.ch
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
