// src/app/components/landing/Pricing.tsx - Version simplifiée et uniforme
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Check, Star, Sparkles, ArrowRight, Crown, Mail } from "lucide-react";
import Link from "next/link";
import { track } from "@vercel/analytics";

const plans = [
  {
    id: "FREE",
    name: "Gratuit",
    description: "Pour découvrir PlanniKeeper",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    color: "gray",
    features: [
      "1 utilisateur",
      "1 objet immobilier",
      "500MB de stockage",
      "Support communauté",
    ],
    ctaText: "Commencer gratuitement",
    highlight: "Idéal pour découvrir",
  },
  {
    id: "PERSONAL",
    name: "Particulier",
    description: "Pour la gestion personnelle",
    price: 12,
    monthlyPrice: 12,
    yearlyPrice: 120,
    popular: false,
    color: "blue",
    features: [
      "1 utilisateur",
      "1 objet immobilier",
      "2GB de stockage",
      "Support email",
    ],
    ctaText: "Choisir Particulier",
    highlight: "Pour les propriétaires",
  },
  {
    id: "PROFESSIONAL",
    name: "Professionnel",
    description: "Pour les professionnels indépendants",
    price: 50,
    monthlyPrice: 50,
    yearlyPrice: 500,
    popular: true,
    color: "orange",
    features: [
      "5 utilisateurs",
      "3 objets immobiliers",
      "10GB de stockage",
      "Support prioritaire",
    ],
    ctaText: "Choisir Professionnel",
    highlight: "Le plus populaire",
  },
  {
    id: "ENTERPRISE",
    name: "Entreprise",
    description: "Pour les équipes et entreprises",
    price: 90,
    monthlyPrice: 90,
    yearlyPrice: 850,
    popular: false,
    color: "purple",
    features: [
      "10 utilisateurs",
      "5 objets immobiliers",
      "50GB de stockage",
      "Support premium",
    ],
    ctaText: "Choisir Entreprise",
    highlight: "Solution complète",
  },
  {
    id: "SPECIAL",
    name: "Sur mesure",
    description: "Solution personnalisée",
    price: null,
    monthlyPrice: null,
    yearlyPrice: null,
    popular: false,
    color: "gold",
    isCustom: true,
    features: [
      "Utilisateurs illimités",
      "Objets illimités",
      "Stockage illimité",
      "Support dédié",
    ],
    ctaText: "Nous contacter",
    highlight: "Personnalisé",
  },
];

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const handlePlanClick = (planId: string, source: string) => {
    track("pricing_plan_clicked", {
      plan: planId,
      source: source,
      billing_cycle: billingCycle,
      timestamp: new Date().toISOString(),
    });
  };

  const getColorClasses = (color: string, isPopular: boolean = false) => {
    const colors = {
      gray: {
        gradient: "from-gray-500 to-gray-600",
        button: "bg-gray-600 hover:bg-gray-700",
        border: "border-gray-200 hover:border-gray-400",
        accent: "text-gray-600",
        bg: "bg-gray-50",
        icon: <Star className="w-6 h-6 text-white" />,
      },
      blue: {
        gradient: "from-blue-500 to-blue-600",
        button: "bg-blue-600 hover:bg-blue-700",
        border: "border-blue-200 hover:border-blue-400",
        accent: "text-blue-600",
        bg: "bg-blue-50",
        icon: <Check className="w-6 h-6 text-white" />,
      },
      orange: {
        gradient: "from-[#d9840d] to-[#e36002]",
        button: "bg-[#d9840d] hover:bg-[#c6780c]",
        border: isPopular
          ? "border-[#d9840d] ring-2 ring-[#d9840d]/20"
          : "border-[#ffedd5] hover:border-[#d9840d]",
        accent: "text-[#d9840d]",
        bg: "bg-[#fff7ed]",
        icon: <Sparkles className="w-6 h-6 text-white" />,
      },
      purple: {
        gradient: "from-purple-500 to-purple-600",
        button: "bg-purple-600 hover:bg-purple-700",
        border: "border-purple-200 hover:border-purple-400",
        accent: "text-purple-600",
        bg: "bg-purple-50",
        icon: <Star className="w-6 h-6 text-white" />,
      },
      gold: {
        gradient: "from-amber-500 to-yellow-600",
        button: "bg-amber-600 hover:bg-amber-700",
        border: "border-amber-200 hover:border-amber-400",
        accent: "text-amber-600",
        bg: "bg-amber-50",
        icon: <Crown className="w-6 h-6 text-white" />,
      },
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-[#f9f3ec] to-[#f5f3ef] relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute -right-32 top-1/4 w-96 h-96 rounded-full bg-[#d9840d]/10 blur-3xl"></div>
      <div className="absolute left-1/4 bottom-1/4 w-72 h-72 rounded-full bg-[#e8ebe0]/40 blur-2xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* En-tête de section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#d9840d]/10 px-4 py-2 rounded-full mb-6 border border-[#d9840d]/20">
            <span className="text-[#d9840d] font-medium text-sm">
              Plans et tarifs
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#141313]">
            Choisissez votre plan
          </h2>
          <p className="text-lg text-[#62605d] max-w-3xl mx-auto mb-8">
            Sélectionnez l&apos;offre qui correspond le mieux à vos besoins et
            commencez à optimiser la gestion de vos projets immobiliers dès
            aujourd&apos;hui.
          </p>

          {/* Toggle de facturation */}
          <div className="inline-flex items-center justify-center gap-4 bg-white p-2 rounded-xl border border-[#beac93]">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-[#d9840d] text-white shadow-sm"
                  : "text-[#62605d] hover:text-[#141313]"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 relative ${
                billingCycle === "yearly"
                  ? "bg-[#d9840d] text-white shadow-sm"
                  : "text-[#62605d] hover:text-[#141313]"
              }`}
            >
              Annuel
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                -15%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Grille des plans - hauteur uniforme */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {plans.map((plan, index) => {
            const colors = getColorClasses(plan.color, plan.popular);
            const price =
              plan.price === null
                ? null
                : billingCycle === "yearly"
                  ? plan.yearlyPrice
                  : plan.monthlyPrice;
            const displayPrice =
              price === null
                ? null
                : billingCycle === "yearly"
                  ? price / 12
                  : price;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`relative bg-white rounded-2xl border-2 transition-all duration-300 shadow-lg hover:shadow-xl h-[480px] flex flex-col ${colors.border} ${
                  plan.popular ? "transform scale-105" : ""
                }`}
              >
                {/* Badge populaire */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-[#d9840d] to-[#e36002] text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      {plan.highlight}
                    </div>
                  </div>
                )}

                <div className="p-6 flex flex-col h-full">
                  {/* En-tête du plan */}
                  <div className="text-center mb-6">
                    <div
                      className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}
                    >
                      {colors.icon}
                    </div>

                    <h3 className={`text-xl font-bold ${colors.accent} mb-2`}>
                      {plan.name}
                    </h3>
                    <p className="text-[#62605d] text-sm">{plan.description}</p>
                  </div>

                  {/* Prix */}
                  <div className="text-center mb-6">
                    {plan.isCustom ? (
                      <div className="text-2xl font-bold text-[#141313]">
                        Sur devis
                      </div>
                    ) : plan.price === 0 ? (
                      <div className="text-2xl font-bold text-[#141313]">
                        Gratuit
                      </div>
                    ) : (
                      <div>
                        <span className="text-2xl font-bold text-[#141313]">
                          {Math.round(displayPrice!)}€
                        </span>
                        <span className="text-[#62605d] ml-1 text-sm">
                          /mois
                        </span>
                        {billingCycle === "yearly" && (
                          <div className="text-xs text-[#16a34a] mt-1">
                            Facturé {plan.yearlyPrice}€/an
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fonctionnalités - flex-grow pour occuper l'espace */}
                  <div className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: featureIndex * 0.05,
                        }}
                        viewport={{ once: true }}
                        className="flex items-start gap-3"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center mt-0.5 flex-shrink-0`}
                        >
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-[#62605d] text-sm leading-relaxed">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA - toujours en bas */}
                  <div className="mt-auto">
                    <Link
                      href={
                        plan.isCustom
                          ? "/contact?subject=Demande%20Plan%20Sur%20Mesure"
                          : `/signup?plan=${plan.id}`
                      }
                      onClick={() =>
                        handlePlanClick(plan.id, "pricing_section")
                      }
                    >
                      <Button
                        className={`w-full py-2.5 ${colors.button} text-white font-medium transition-all duration-200 hover:shadow-lg text-sm`}
                      >
                        {plan.isCustom ? (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            {plan.ctaText}
                          </>
                        ) : (
                          <>
                            {plan.ctaText}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Accent en bas */}
                <div
                  className={`h-1 bg-gradient-to-r ${colors.gradient} rounded-b-2xl`}
                ></div>
              </motion.div>
            );
          })}
        </div>

        {/* Section informative simplifiée */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="bg-white/50 backdrop-blur-sm border border-[#beac93]/30 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold text-[#141313] mb-2">
                  Tous les plans incluent
                </h3>
                <p className="text-[#62605d] text-sm">
                  Accès à toutes les fonctionnalités • Mises à jour gratuites •
                  Support technique • Garantie 30 jours
                </p>
              </div>
              <div className="flex gap-3">
                <div className="text-center">
                  <div className="w-8 h-8 bg-[#d9840d]/10 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Check className="w-4 h-4 text-[#d9840d]" />
                  </div>
                  <span className="text-xs text-[#62605d]">
                    Sans engagement
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-[#d9840d]/10 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Star className="w-4 h-4 text-[#d9840d]" />
                  </div>
                  <span className="text-xs text-[#62605d]">Support inclus</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-[#d9840d]/10 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Sparkles className="w-4 h-4 text-[#d9840d]" />
                  </div>
                  <span className="text-xs text-[#62605d]">Évolutif</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
