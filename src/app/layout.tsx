import "./globals.css";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import Navigation from "@/app/components/Navigation";

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
          <Suspense fallback={<div className="h-16 bg-white border-b"></div>}>
            <Navigation />
          </Suspense>

          {/* Contenu principal */}
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Suspense
              fallback={
                <div className="px-4 sm:px-6 lg:px-8">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              }
            >
              {children}
            </Suspense>
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
