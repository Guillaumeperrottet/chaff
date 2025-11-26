"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold">chaff.ch</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Pilotez vos établissements avec des données claires et des
              analyses précises.
            </p>

            {/* Webbing Credit */}
            <div className="border-l-2 border-blue-600 pl-3 py-2">
              <p className="text-slate-400 text-xs">
                Développé par{" "}
                <a
                  href="https://www.webbing.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                >
                  Webbing
                </a>
              </p>
              <p className="text-slate-500 text-xs">
                Solutions SaaS innovantes conçues en Suisse
              </p>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">
              Produit
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#features"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Tarifs
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">
              Entreprise
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/feedback"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column - Removed Webbing link since it's in brand column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/signin"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Connexion
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Créer un compte
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Conditions d&apos;utilisation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 py-8">
          <div className="text-center">
            <div className="text-slate-400 text-sm">
              © {new Date().getFullYear()} Chaff Tous droits réservés.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
