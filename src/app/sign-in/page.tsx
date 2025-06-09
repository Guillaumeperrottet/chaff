// src/app/auth/sign-in/page.tsx - Version corrigée avec Suspense
import { Suspense } from "react";
import SignInForm from "./signin-form";

// Skeleton de chargement
const SignInSkeleton = () => (
  <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-orange-200/30 p-8 z-10">
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
    <div className="flex min-h-svh bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/30"
          aria-hidden="true"
        />
        {/* Cercles décoratifs */}
        <div className="absolute -right-20 top-1/4 w-64 h-64 rounded-full bg-orange-500/10 blur-2xl" />
        <div className="absolute left-1/4 bottom-1/4 w-48 h-48 rounded-full bg-yellow-500/40 blur-xl" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-md p-8">
            <div className="relative mb-12">
              <div className="absolute -left-6 -top-6 w-16 h-16 bg-orange-500/20 rounded-full"></div>
              <div className="text-4xl font-bold mb-6 text-gray-900 relative z-10">
                <span className="block">Organisez.</span>
                <span className="block">Planifiez.</span>
                <span className="block text-orange-600">Maîtrisez.</span>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-10 border-l-4 border-orange-500/40 pl-4">
              Simplifiez la gestion de vos projets avec notre solution
              tout-en-un, conçue pour optimiser votre temps et maximiser votre
              efficacité.
            </p>

            <div className="space-y-6">
              {/* Première feature avec animation */}
              <div className="bg-white p-5 rounded-xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-orange-500/10 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-orange-500/20 transition-all duration-300"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-md">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <polyline points="9 11 12 14 22 4"></polyline>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900">
                      Visualisation interactive
                    </h3>
                    <p className="text-sm text-gray-600">
                      Interface intuitive et moderne
                    </p>
                  </div>
                </div>
              </div>

              {/* Deuxième feature avec animation */}
              <div className="bg-white p-5 rounded-xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-orange-500/10 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-orange-500/20 transition-all duration-300"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-md">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900">
                      Gestion des tâches
                    </h3>
                    <p className="text-sm text-gray-600">
                      Organisez efficacement votre quotidien
                    </p>
                  </div>
                </div>
              </div>

              {/* Troisième feature avec animation */}
              <div className="bg-white p-5 rounded-xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-orange-500/10 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-orange-500/20 transition-all duration-300"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-700 rounded-xl flex items-center justify-center text-white shadow-md">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900">
                      Mode collaboratif
                    </h3>
                    <p className="text-sm text-gray-600">
                      Travaillez en équipe en temps réel
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 relative">
        {/* Cercles décoratifs pour le côté droit aussi */}
        <div className="absolute right-10 bottom-10 w-40 h-40 rounded-full bg-orange-500/5 blur-xl" />
        <div className="absolute left-10 top-1/4 w-32 h-32 rounded-full bg-yellow-500/30 blur-xl" />

        {/* Le formulaire de connexion avec Suspense */}
        <Suspense fallback={<SignInSkeleton />}>
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-orange-200/30 p-8 z-10">
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
