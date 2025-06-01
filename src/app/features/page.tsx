// src/app/features/page.tsx
import { Metadata } from "next";
import FeaturesForm from "@/app/components/FeaturesForm";
import { BackButton } from "@/app/components/ui/BackButton";
import { Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "Proposer une fonctionnalité | PlanniKeeper",
  description:
    "Proposez de nouvelles fonctionnalités ou signalez des bugs pour PlanniKeeper",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header avec navigation */}
      <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] sticky top-0 z-40">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton
              href="/profile"
              label="Retour au profil"
              loadingMessage="Retour au profil..."
            />
            <div className="h-4 w-px bg-[color:var(--border)]"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[color:var(--primary)] rounded-lg flex items-center justify-center">
                <Lightbulb
                  size={16}
                  className="text-[color:var(--primary-foreground)]"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[color:var(--foreground)]">
                  Proposer une amélioration
                </h1>
                <p className="text-xs text-[color:var(--muted-foreground)] hidden sm:block">
                  Suggérez des fonctionnalités ou signalez des bugs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container max-w-3xl px-4 py-8 mx-auto">
        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-6 shadow-sm mb-6">
          <p className="text-[color:var(--foreground)] mb-4">
            Nous sommes constamment à la recherche de moyens d&apos;améliorer
            PlanniKeeper. Si vous avez une idée de fonctionnalité ou si vous
            avez rencontré un bug, n&apos;hésitez pas à nous en faire part !
          </p>

          <FeaturesForm />
        </div>

        <div className="bg-[color:var(--muted)] border border-[color:var(--border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 text-[color:var(--foreground)]">
            À propos du processus
          </h2>
          <ul className="space-y-2 text-[color:var(--foreground)]">
            <li className="flex items-start gap-2">
              <span className="text-[color:var(--primary)] flex-shrink-0 mt-1">
                •
              </span>
              <span>
                Toutes les propositions sont examinées par notre équipe.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[color:var(--primary)] flex-shrink-0 mt-1">
                •
              </span>
              <span>
                Nous priorisons les fonctionnalités en fonction de leur impact
                global et de leur faisabilité.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[color:var(--primary)] flex-shrink-0 mt-1">
                •
              </span>
              <span>
                Les bugs signalés sont traités en priorité selon leur gravité.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[color:var(--primary)] flex-shrink-0 mt-1">
                •
              </span>
              <span>
                Vous pouvez également nous contacter directement à{" "}
                <a
                  href="mailto:support@plannikeeper.ch"
                  className="text-[color:var(--primary)] hover:underline"
                >
                  support@plannikeeper.ch
                </a>
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
