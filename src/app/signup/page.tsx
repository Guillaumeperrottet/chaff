"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SignUpForm from "@/app/auth/signup/signup-form";
import { Shield, Star, Zap, Crown } from "lucide-react";

const PLAN_DETAILS = {
  FREE: { name: "Gratuit", price: 0, icon: Shield, color: "text-gray-600" },
  PERSONAL: {
    name: "Particulier",
    price: 9,
    icon: Star,
    color: "text-blue-600",
  },
  PROFESSIONAL: {
    name: "Professionnel",
    price: 29,
    icon: Zap,
    color: "text-orange-600",
  },
  ENTERPRISE: {
    name: "Entreprise",
    price: 99,
    icon: Crown,
    color: "text-purple-600",
  },
};

function SignUpPageContent() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "FREE";
  const planDetails =
    PLAN_DETAILS[selectedPlan as keyof typeof PLAN_DETAILS] ||
    PLAN_DETAILS.FREE;
  const Icon = planDetails.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-md p-8">
              <div className="text-4xl font-bold mb-6 text-gray-900">
                <span className="block">Organisez.</span>
                <span className="block">Planifiez.</span>
                <span className="block text-orange-600">Maîtrisez.</span>
              </div>
              <p className="text-lg text-gray-600 mb-10">
                Simplifiez la gestion de vos projets avec notre solution
                tout-en-un.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-orange-200/30 p-8">
            {/* Plan selected banner */}
            {selectedPlan !== "FREE" && (
              <div
                className={`mb-6 p-4 rounded-lg bg-muted border ${planDetails.color}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${planDetails.color}`} />
                  <div>
                    <p className="font-medium">
                      Plan sélectionné: {planDetails.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {planDetails.price}€/mois
                    </p>
                  </div>
                </div>
              </div>
            )}

            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SignUpPageContent />
    </Suspense>
  );
}
