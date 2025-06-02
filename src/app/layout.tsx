import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import { BarChart3, Building2, Plus, Home } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gestion CA - Campus",
  description: "Application de gestion des chiffres d'affaires",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <span className="text-xl font-bold text-gray-900">
                      Campus
                    </span>
                  </Link>
                </div>

                <div className="flex items-center space-x-4">
                  <Link
                    href="/"
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Home className="h-4 w-4" />
                    <span>Tableau de bord</span>
                  </Link>

                  <Link
                    href="/valeurs"
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Valeurs journalières</span>
                  </Link>

                  <Link
                    href="/mandats"
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Mandats</span>
                  </Link>

                  <Link
                    href="/valeurs/nouvelle"
                    className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nouvelle valeur</span>
                  </Link>
                </div>

                <div className="flex items-center">
                  <span className="text-sm text-gray-500">
                    Bonjour perrottet@soge-sa.ch!
                  </span>
                </div>
              </div>
            </div>
          </nav>

          {/* Contenu principal */}
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-auto">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <div className="text-center text-sm text-gray-500">
                © 2025 - Campus - Version 2025-02-12
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
