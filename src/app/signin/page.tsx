import { Suspense } from "react";
import SignInForm from "@/app/auth/sign-in/signin-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        {/* Left side - Branding */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-md p-8">
              <div className="text-4xl font-bold mb-6 text-gray-900">
                <span className="block">Bienvenue</span>
                <span className="block">sur</span>
                <span className="block text-orange-600">Chaff.ch</span>
              </div>
              <p className="text-lg text-gray-600">
                Connectez-vous pour accéder à votre espace de gestion.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-orange-200/30 p-8">
            <SignInForm />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
