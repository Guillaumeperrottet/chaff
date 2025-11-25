"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo à gauche */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              chaff.ch
            </span>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/#features"
              className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
            >
              FONCTIONNALITÉS
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              TARIFS
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              CONTACT
            </Link>

            {/* Boutons CTA */}
            <Link
              href="/signin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              CONNEXION
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-all hover:scale-105"
            >
              Créer un compte
            </Link>
          </div>

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-900 hover:text-blue-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100">
          <div className="px-4 py-6 space-y-4">
            <Link
              href="/#features"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors py-2"
            >
              FONCTIONNALITÉS
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-2"
            >
              TARIFS
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-2"
            >
              CONTACT
            </Link>
            <Link
              href="/signin"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-2"
            >
              CONNEXION
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-center px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-all"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
