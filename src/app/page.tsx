"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Navigation } from "@/app/components/navigation";
import { Footer } from "@/app/components/footer";

export default function ChaffLandingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Redirection si déjà connecté
  useEffect(() => {
    if (session?.user && !isPending) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Design minimaliste inspiré de l'image */}
      <section className="flex-1 flex items-center justify-center relative pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Version Mobile - Layout empilé */}
          <div className="lg:hidden flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] space-y-8 py-8">
            {/* Titre mobile en haut */}
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-center">
              <span className="block text-slate-900">less is</span>
              <span className="block text-blue-600">more.</span>
            </h1>

            {/* Logo mobile */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              <Image
                src="/chaff_logo.png"
                alt="Chaff Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Texte mobile */}
            <div className="space-y-6 max-w-md text-center px-4">
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Plateforme d&apos;analyse business pour transformer vos données
                en insights stratégiques et prendre des décisions éclairées.
              </p>
              <a
                href="#features"
                className="inline-flex flex-col items-center gap-2 text-slate-900 font-medium hover:text-blue-600 transition-colors group"
              >
                <span className="border-b-2 border-slate-900 group-hover:border-blue-600 pb-1">
                  En savoir plus
                </span>
                <ChevronDown className="w-6 h-6 animate-bounce" />
              </a>
            </div>
          </div>

          {/* Version Desktop - Layout absolu */}
          <div className="hidden lg:flex relative items-center justify-center min-h-[calc(100vh-5rem)]">
            {/* Texte à gauche - encore plus décalé */}
            <div className="absolute left-0 lg:-left-12 xl:-left-20 space-y-6 z-20 max-w-md">
              <p className="text-slate-600 leading-relaxed text-base">
                Plateforme d&apos;analyse business pour transformer vos données
                en insights stratégiques et prendre
                <br />
                des décisions éclairées.
              </p>
              <a
                href="#features"
                className="inline-flex flex-col items-center gap-2 text-slate-900 font-medium hover:text-blue-600 transition-colors group"
              >
                <span className="border-b-2 border-slate-900 group-hover:border-blue-600 pb-1">
                  En savoir plus
                </span>
                <ChevronDown className="w-6 h-6 animate-bounce" />
              </a>
            </div>

            {/* Logo centré (comme le rond jaune dans l'image) */}
            <div className="relative w-[600px] h-[600px] z-10">
              <Image
                src="/logo-chaff.svg"
                alt="Chaff Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Titre "less is more." qui chevauche légèrement le logo à droite - encore plus décalé */}
            <div className="absolute right-0 lg:-right-20 xl:-right-32 top-1/2 -translate-y-1/2 z-20">
              <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-none">
                <span className="block text-slate-900">less is</span>
                <span className="block text-blue-600">more.</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Localisation en bas à droite */}
        <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-6 lg:right-8">
          <p className="text-slate-600 text-xs sm:text-sm">Bulle, Suisse</p>
        </div>
      </section>

      {/* Section Features minimaliste */}
      <section id="features" className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Titre de section */}
          <div className="mb-12 sm:mb-16 lg:mb-20 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-4 sm:mb-6">
              Fonctionnalités
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
              Des outils puissants pour transformer vos données en décisions
              stratégiques
            </p>
          </div>

          {/* Grid de fonctionnalités avec numérotation */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="text-slate-300 text-5xl font-bold">01</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Analytics en temps réel
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Graphiques interactifs pour suivre vos performances en temps
                réel
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-slate-300 text-5xl font-bold">02</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Suivi du chiffre d&apos;affaires
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Analyse quotidienne et tendances de vos revenus
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-slate-300 text-5xl font-bold">03</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Gestion salariale
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Analyse complète de votre masse salariale et ratios
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-slate-300 text-5xl font-bold">04</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Ratios de rentabilité
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Calculs automatiques par période pour mesurer votre performance
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-slate-300 text-5xl font-bold">05</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Tableaux de bord
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Dashboards intuitifs et personnalisables selon vos besoins
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-slate-300 text-5xl font-bold">06</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Conformité RGPD
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Hébergement européen sécurisé et conforme aux normes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Tarifs */}
      <section id="pricing" className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Titre de section */}
          <div className="mb-12 sm:mb-16 lg:mb-20 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-4 sm:mb-6">
              Tarifs
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>

          {/* Grid de tarifs */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Plan Gratuit */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200 hover:border-slate-900 transition-colors">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  Gratuit
                </h3>
                <p className="text-slate-600 text-sm">Pour découvrir Chaff</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-slate-900">
                  0CHF
                </span>
                <span className="text-slate-600">/mois</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">1 organisation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">
                    Fonctionnalités de base
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">Support</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">1 seul accès </span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 bg-slate-900 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                Commencer
              </Link>
            </div>

            {/* Plan Premium */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200 hover:border-slate-900 transition-colors">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  Premium
                </h3>
                <p className="text-slate-600 text-sm">
                  Pour les professionnels
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-slate-900">
                  29CHF
                </span>
                <span className="text-slate-600">/mois</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">
                    Organisations illimitées
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">
                    Toutes les fonctionnalités
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">
                    Support prioritaire
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">
                    Partage multi-utilisateurs
                  </span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 bg-slate-900 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                Choisir Premium
              </Link>
            </div>

            {/* Plan Entreprise */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-6 border border-slate-200 hover:border-slate-900 transition-colors">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  Entreprise
                </h3>
                <p className="text-slate-600 text-sm">
                  Pour les grandes équipes
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
                  Sur mesure
                </span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">
                    Tout Premium inclus
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">Support dédié</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">
                    Formations personnalisées
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0 mt-2"></div>
                  <span className="text-slate-600 text-sm">
                    Modifications sur mesure
                  </span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="block w-full text-center px-6 py-3 bg-slate-900 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Webbing Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Contenu centré */}
            <div className="space-y-6 max-w-2xl">
              <div>
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">
                  Partenaire technologique
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900">
                Développé par
                <br />
                <span className="text-blue-600">Webbing</span>
              </h2>
              <div className="pt-4">
                <a
                  href="https://www.webbing.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-blue-600 transition-all hover:scale-105 text-sm sm:text-base"
                >
                  Découvrir Webbing
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
