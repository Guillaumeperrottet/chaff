"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsMenuOpen(false);
    }
  };

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
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "features")}
              className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
            >
              FONCTIONNALITÉS
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, "pricing")}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              TARIFS
            </a>
            <Link
              href="/contact"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              CONTACT
            </Link>

            {/* Séparateur vertical */}
            <div className="h-6 w-px bg-slate-300"></div>

            {/* Bouton CTA unique */}
            <Link
              href="/signin"
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-all hover:scale-105"
            >
              Se connecter
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
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "features")}
              className="block text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors py-2 cursor-pointer"
            >
              FONCTIONNALITÉS
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, "pricing")}
              className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-2 cursor-pointer"
            >
              TARIFS
            </a>
            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-2"
            >
              CONTACT
            </Link>

            {/* Séparateur */}
            <div className="border-t border-slate-200 my-4"></div>

            <Link
              href="/signin"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-center px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-all"
            >
              Se connecter
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
