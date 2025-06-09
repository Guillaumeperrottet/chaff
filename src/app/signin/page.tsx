// src/app/sign-in/page.tsx - Page de connexion complète Chaff.ch
import { Suspense } from "react";
import SignInForm from "./signin-form";

// Skeleton de chargement
const SignInSkeleton = () => (
  <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-primary/30 p-8 z-10">
    <div className="animate-pulse">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-6"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="h-12 bg-gray-200 rounded"></div>

        <div className="space-y-4 text-center">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
);

// Contenu principal de la page avec les parties statiques
function SignInPageContent() {
  return (
    <div className="flex min-h-svh bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Section gauche - Features Chaff.ch */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-700/30"
          aria-hidden="true"
        />
        {/* Cercles décoratifs bleus */}
        <div className="absolute -right-20 top-1/4 w-64 h-64 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute left-1/4 bottom-1/4 w-48 h-48 rounded-full bg-blue-600/40 blur-xl" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-md p-8">
            <div className="relative mb-12">
              <div className="absolute -left-6 -top-6 w-16 h-16 bg-primary/20 rounded-full"></div>
              <div className="text-4xl font-bold mb-6 text-gray-900 relative z-10">
                <span className="block">Analysez.</span>
                <span className="block">Optimisez.</span>
                <span className="block text-primary">Prospérez.</span>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-10 border-l-4 border-primary/40 pl-4">
              Transformez vos données financières en décisions stratégiques avec
              Chaff.ch, la plateforme d&apos;analytics business conçue pour
              votre succès.
            </p>

            <div className="space-y-6">
              {/* Feature analytics temps réel */}
              <div className="bg-white p-5 rounded-xl border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-primary/10 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-primary/20 transition-all duration-300"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-md">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900">
                      Analytics temps réel
                    </h3>
                    <p className="text-sm text-gray-600">
                      Visualisez vos performances instantanément
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature ratios financiers */}
              <div className="bg-white p-5 rounded-xl border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-primary/10 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-primary/20 transition-all duration-300"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900">
                      Ratios financiers
                    </h3>
                    <p className="text-sm text-gray-600">
                      Optimisez votre rentabilité
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature tableaux de bord */}
              <div className="bg-white p-5 rounded-xl border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-primary/10 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-primary/20 transition-all duration-300"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white shadow-md">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                      <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900">
                      Tableaux de bord
                    </h3>
                    <p className="text-sm text-gray-600">
                      Pilotez votre activité efficacement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 relative">
        {/* Cercles décoratifs pour le côté droit */}
        <div className="absolute right-10 bottom-10 w-40 h-40 rounded-full bg-primary/5 blur-xl" />
        <div className="absolute left-10 top-1/4 w-32 h-32 rounded-full bg-blue-600/30 blur-xl" />

        {/* Le formulaire de connexion avec Suspense */}
        <Suspense fallback={<SignInSkeleton />}>
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-primary/30 p-8 z-10">
            <SignInForm />
          </div>
        </Suspense>
      </div>
    </div>
  );
}

// Page principale avec Suspense
export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInPageContent />
    </Suspense>
  );
}
