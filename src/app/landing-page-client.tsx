"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import {
  ChevronRight,
  Check,
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  Users,
  Shield,
  Clock,
  Euro,
} from "lucide-react";

const ChaffLandingPage = () => {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  const faqRef = useRef(null);

  const features = [
    {
      title: "Saisie journalière simplifiée",
      description:
        "Enregistrez rapidement vos chiffres d'affaires quotidiens avec une interface intuitive et optimisée",
      icon: <Calendar className="w-8 h-8" />,
      color: "bg-blue-500",
    },
    {
      title: "Tableaux de bord en temps réel",
      description:
        "Visualisez vos performances avec des graphiques interactifs et des métriques clés instantanées",
      icon: <BarChart3 className="w-8 h-8" />,
      color: "bg-green-500",
    },
    {
      title: "Analyse comparative",
      description:
        "Comparez vos performances entre différentes périodes et établissements pour optimiser vos résultats",
      icon: <TrendingUp className="w-8 h-8" />,
      color: "bg-purple-500",
    },
    {
      title: "Exports automatisés",
      description:
        "Générez facilement des rapports détaillés en PDF ou Excel pour votre comptabilité et analyses",
      icon: <Download className="w-8 h-8" />,
      color: "bg-orange-500",
    },
  ];

  const benefits = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Gain de temps",
      description:
        "Réduisez de 80% le temps consacré à la saisie et au suivi de vos chiffres d'affaires",
    },
    {
      icon: <Euro className="w-6 h-6" />,
      title: "Optimisation financière",
      description:
        "Identifiez rapidement les tendances et opportunités d'amélioration de votre rentabilité",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Gestion multi-établissements",
      description:
        "Centralisez le suivi de tous vos campings et restaurants depuis une seule interface",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Sécurité des données",
      description:
        "Vos données financières sont protégées par un chiffrement de niveau bancaire",
    },
  ];

  const faqs = [
    {
      question: "Comment Chaff.ch m'aide-t-il à gérer mes établissements ?",
      answer:
        "Chaff.ch centralise la saisie des chiffres d'affaires de tous vos établissements (campings, restaurants) en une seule plateforme. Vous pouvez suivre les performances quotidiennes, comparer les périodes et générer des rapports automatisés pour votre comptabilité.",
    },
    {
      question: "Puis-je utiliser Chaff.ch sur mobile ?",
      answer:
        "Absolument ! Chaff.ch est entièrement responsive et optimisé pour les appareils mobiles. Vous pouvez saisir vos chiffres d'affaires et consulter vos tableaux de bord depuis n'importe quel appareil, où que vous soyez.",
    },
    {
      question: "Quels types d'exports sont disponibles ?",
      answer:
        "Chaff.ch propose des exports en PDF pour les rapports visuels et en Excel pour les analyses détaillées. Vous pouvez personnaliser les périodes, les établissements et les métriques à inclure dans vos exports.",
    },
    {
      question: "Comment sont sécurisées mes données financières ?",
      answer:
        "Nous utilisons un chiffrement SSL de niveau bancaire, des sauvegardes automatiques quotidiennes et des serveurs sécurisés en Europe. Vos données financières sont protégées selon les plus hauts standards de sécurité.",
    },
  ];

  const targetAudiences = [
    {
      title: "Propriétaires de campings",
      description:
        "Optimisez la gestion financière de vos campings avec un suivi précis des revenus par emplacement et période",
      features: ["Suivi par emplacement", "Saisonnalité", "Taux d'occupation"],
    },
    {
      title: "Gérants de restaurants",
      description:
        "Analysez vos performances culinaires avec des métriques adaptées à la restauration",
      features: [
        "Chiffre par service",
        "Ticket moyen",
        "Analyse des tendances",
      ],
    },
    {
      title: "Groupes hôteliers",
      description:
        "Centralisez le suivi de tous vos établissements avec une vue d'ensemble consolidée",
      features: [
        "Vue multi-établissements",
        "Comparaisons",
        "Reporting global",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-800 overflow-hidden">
      {/* Hero Section */}
      <section
        id="hero"
        ref={heroRef}
        className="min-h-screen relative flex items-center overflow-hidden pt-16 md:pt-0"
      >
        <div className="absolute inset-0 w-full h-full -z-10 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10" />

        <div className="container mx-auto px-4 sm:px-6 pt-8 md:pt-24 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <motion.div
                className="inline-block bg-blue-100 px-4 py-2 rounded-full mb-6 border border-blue-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="text-blue-700 font-medium text-sm">
                  Gestion financière intelligente
                </span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-slate-900 mb-6">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="block"
                >
                  Chaff.ch
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="block text-blue-600"
                >
                  Vos chiffres,
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="block text-blue-600"
                >
                  simplifiés.
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl"
              >
                La solution complète pour la gestion et l&apos;analyse des
                chiffres d&apos;affaires de vos campings et restaurants. Saisie
                simple, tableaux de bord intelligents, exports automatisés.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button className="w-full sm:w-auto px-8 py-6 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                  Essayez gratuitement
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto px-8 py-6 text-base border-blue-200 text-slate-700 hover:bg-blue-50"
                >
                  Voir la démo
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.3 }}
                className="mt-8 flex items-center gap-4 text-sm text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Essai gratuit 14 jours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Sans engagement</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full h-[600px]">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl transform rotate-3"></div>
                <div className="absolute top-4 right-4 w-full h-full overflow-hidden rounded-2xl border-2 border-blue-200 shadow-2xl bg-white">
                  {/* Mock Dashboard */}
                  <div className="p-6 h-full bg-gradient-to-br from-white to-blue-50">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-800">
                        Dashboard Chaff.ch
                      </h3>
                      <div className="text-sm text-slate-500">
                        Aujourd&apos;hui
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                        <div className="text-2xl font-bold text-blue-600">
                          €12,450
                        </div>
                        <div className="text-sm text-slate-500">
                          CA Aujourd&apos;hui
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                        <div className="text-2xl font-bold text-green-600">
                          +8.5%
                        </div>
                        <div className="text-sm text-slate-500">vs Hier</div>
                      </div>
                    </div>

                    {/* Chart Mockup */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 h-48">
                      <div className="text-sm font-medium text-slate-700 mb-3">
                        Évolution du CA
                      </div>
                      <div className="h-32 bg-gradient-to-t from-blue-100 to-blue-200 rounded flex items-end justify-center">
                        <div className="text-xs text-blue-700">
                          Graphique interactif
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  className="absolute -top-6 -left-6 bg-white p-4 rounded-lg shadow-lg border border-blue-100 z-10 flex items-center gap-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Performance</p>
                    <p className="font-medium text-slate-800">+15% ce mois</p>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-6 right-12 bg-white p-4 rounded-lg shadow-lg border border-green-100 z-10"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                >
                  <p className="text-xs text-slate-500">Export automatique</p>
                  <div className="w-24 h-2 bg-green-200 rounded-full mt-2">
                    <div className="w-3/4 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-right text-xs font-medium mt-1 text-green-600">
                    75%
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={featuresRef}
        className="py-20 md:py-32 bg-white z-10 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16 md:mb-20"
          >
            <div className="inline-block bg-blue-100 px-4 py-2 rounded-full mb-6 border border-blue-200">
              <span className="text-blue-700 font-medium text-sm">
                Fonctionnalités principales
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">
              Tout ce dont vous avez besoin pour gérer vos chiffres
              d&apos;affaires
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Chaff.ch combine simplicité et puissance pour vous offrir une
              solution complète de gestion financière adaptée aux campings et
              restaurants.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -10 }}
                className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl shadow-lg transition-all duration-300 border border-slate-100 hover:border-blue-200 cursor-pointer group"
              >
                <div
                  className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">
              Pourquoi choisir Chaff.ch ?
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Découvrez les avantages concrets que Chaff.ch apporte à votre
              gestion financière quotidienne.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                className="flex items-start gap-6 p-6 bg-white rounded-xl shadow-sm border border-slate-100"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-purple-100 px-4 py-2 rounded-full mb-6 border border-purple-200">
              <span className="text-purple-700 font-medium text-sm">
                Qui peut utiliser Chaff.ch
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">
              Pour qui ?
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Chaff.ch s&apos;adapte parfaitement aux besoins spécifiques de
              différents types d&apos;établissements.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {targetAudiences.map((audience, index) => (
              <motion.div
                key={audience.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -10 }}
                className="relative group cursor-pointer"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-white p-8 rounded-xl border border-slate-200 group-hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-lg">
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">
                    {audience.title}
                  </h3>
                  <p className="text-slate-600 mb-6">{audience.description}</p>
                  <ul className="space-y-3">
                    {audience.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-sm text-slate-600"
                      >
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        ref={faqRef}
        className="py-20 md:py-32 bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-green-100 px-4 py-2 rounded-full mb-6 border border-green-200">
              <span className="text-green-700 font-medium text-sm">
                Questions fréquentes
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">
              Besoin d&apos;aide ?
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Voici les réponses aux questions les plus fréquemment posées par
              nos utilisateurs.
            </p>
          </motion.div>

          <motion.div
            className="space-y-6 md:space-y-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {faqs.map((faq, index) => (
              <FaqItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Prêt à simplifier la gestion de vos chiffres d&apos;affaires ?
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
              Rejoignez les centaines d&apos;établissements qui ont déjà
              optimisé leur gestion financière avec Chaff.ch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="px-8 py-6 text-base bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                Commencer l&apos;essai gratuit
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="px-8 py-6 text-base border-blue-200 text-white hover:bg-blue-700"
              >
                Planifier une démo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">Chaff.ch</h3>
              <p className="text-slate-400 mb-4 max-w-md">
                La solution moderne pour la gestion des chiffres d&apos;affaires
                de vos campings et restaurants. Simple, efficace, et sécurisé.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Produit</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    Tarifs
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    Démo
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    À propos
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 mt-8 text-center">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} Chaff.ch. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// FAQ Item Component
const FaqItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      ref={contentRef}
      className="border border-slate-200 rounded-xl overflow-hidden bg-white"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left p-6 focus:outline-none hover:bg-slate-50 transition-colors"
      >
        <h3 className="text-lg md:text-xl font-medium pr-8 text-slate-900">
          {question}
        </h3>
        <span
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <ChevronRight className="w-5 h-5 transform rotate-90 text-slate-400" />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-slate-50"
          >
            <p className="p-6 text-slate-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChaffLandingPage;
