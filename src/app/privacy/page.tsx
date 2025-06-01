"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  HomeIcon,
  RocketIcon,
  Info,
  Shield,
  Lock,
  Eye,
  Database,
  Globe,
  Cookie,
  Mail,
} from "lucide-react";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import PremiumBurgerButton from "@/app/components/ui/BurgerButton";
import { useState } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const NAV_ITEMS = [
  { id: "hero", icon: HomeIcon, label: "Accueil", href: "/#hero" },
  {
    id: "features",
    icon: RocketIcon,
    label: "Fonctionnalités",
    href: "/#features",
  },
  {
    id: "pricing",
    icon: CurrencyDollarIcon,
    label: "Tarifs",
    href: "/#pricing",
  },
  { id: "about", icon: Info, label: "A propos", href: "/about" },
  { id: "contact", icon: User, label: "Nous contacter", href: "/contact" },
];

export default function PrivacyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("introduction");

  const privacySections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: Shield,
    },
    {
      id: "collected-data",
      title: "Données collectées",
      icon: Database,
    },
    {
      id: "data-use",
      title: "Utilisation des données",
      icon: Eye,
    },
    {
      id: "data-sharing",
      title: "Partage des données",
      icon: Globe,
    },
    {
      id: "cookies",
      title: "Cookies et traceurs",
      icon: Cookie,
    },
    {
      id: "your-rights",
      title: "Vos droits",
      icon: User,
    },
    {
      id: "security",
      title: "Sécurité",
      icon: Lock,
    },
    {
      id: "contact-privacy",
      title: "Nous contacter",
      icon: Mail,
    },
  ];

  const triggerHapticFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const toggleMobileMenu = () => {
    triggerHapticFeedback();
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f3ec] to-[#f5f3ef]">
      {/* Flèche de retour en haut à gauche */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 bg-white/80 hover:bg-white shadow-md rounded-full p-2 transition-colors border border-gray-200"
      >
        <ArrowLeft className="w-5 h-5 text-[color:var(--primary)]" />
        <span className="sr-only">Retour</span>
      </Link>

      {/* Burger menu en haut à droite */}
      <div className="fixed top-6 right-6 z-50">
        <PremiumBurgerButton
          isOpen={mobileMenuOpen}
          onClick={toggleMobileMenu}
          variant="primary"
        />
      </div>

      {/* Menu Overlay avec des animations synchronisées */}
      {mobileMenuOpen && (
        <>
          {/* Fond sombre animé */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu latéral avec animation améliorée */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full sm:w-96 max-w-sm bg-[#f9f3ec] z-50 shadow-xl sm:rounded-l-3xl border-l border-[#beac93] flex flex-col overflow-y-auto"
            style={{ maxHeight: "100vh", overflowY: "auto" }}
          >
            {/* En-tête du menu */}
            <div className="p-6 border-b border-[#beac93] flex items-center justify-between">
              <div className="text-2xl font-bold text-[#141313]">
                plannikeeper
              </div>
              <PremiumBurgerButton
                isOpen={true}
                onClick={toggleMobileMenu}
                variant="light"
              />
            </div>

            {/* Contenu du menu */}
            <div className="flex-1 overflow-y-auto py-6 px-6">
              <div className="mb-8">
                <h3 className="text-sm font-medium text-[#62605d] mb-3 uppercase tracking-wider">
                  Navigation
                </h3>
                <nav className="flex flex-col space-y-3">
                  {NAV_ITEMS.map(({ id, icon: Icon, label, href }, index) => (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                    >
                      <Link
                        href={href}
                        className="w-full p-4 rounded-xl transition duration-300 flex items-center gap-3 bg-white text-[#141313] hover:bg-[#e8ebe0] border border-[#beac93]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-base font-medium">{label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-medium text-[#62605d] mb-3 uppercase tracking-wider">
                  Votre compte
                </h3>
                <nav className="flex flex-col space-y-3">
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <Link
                      href="/dashboard"
                      className="w-full p-4 rounded-xl transition duration-300 flex items-center gap-3 bg-white text-[#141313] hover:bg-[#e8ebe0] border border-[#beac93]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span className="text-base font-medium">
                        Se connecter
                      </span>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Link
                      href="/signup"
                      className="w-full p-4 rounded-xl transition duration-300 flex items-center gap-3 bg-white text-[#141313] hover:bg-[#e8ebe0] border border-[#beac93]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span className="text-base font-medium">
                        Créer un compte
                      </span>
                    </Link>
                  </motion.div>
                </nav>
              </div>
            </div>

            <div className="p-6 border-t border-[#beac93]">
              <Link
                href="/signup?plan=FREE"
                className="w-full justify-center flex items-center gap-2 bg-[#d9840d] hover:bg-[#c6780c] text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-md"
                onClick={() => {
                  triggerHapticFeedback();
                  setMobileMenuOpen(false);
                }}
              >
                Commencer gratuitement
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ x: [0, 5, 0] }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 1.5,
                    repeatDelay: 2,
                  }}
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </motion.svg>
              </Link>
              <motion.p
                className="text-center text-[#62605d] text-sm mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Simplifiez la gestion de vos projets immobiliers
              </motion.p>
            </div>
          </motion.div>
        </>
      )}

      {/* Main Content */}
      <div className="pt-20 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <div className="inline-block bg-[color:var(--primary)]/10 px-4 py-1 rounded-full mb-4 border border-[color:var(--primary)]/20">
              <span className="text-[color:var(--primary)] font-medium text-sm">
                Protection de vos données
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Politique de confidentialité
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez comment nous protégeons vos données personnelles et
              respectons votre vie privée
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Dernière mise à jour : 20 mai 2025
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar with section navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:w-1/4 lg:w-1/5"
            >
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Sommaire
                </h3>
                <nav className="space-y-1">
                  {privacySections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition ${
                        activeSection === section.id
                          ? "bg-[color:var(--primary)] text-white font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <section.icon className="w-4 h-4" />
                      <span>{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Main content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="md:w-3/4 lg:w-4/5"
            >
              <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-200">
                {/* Introduction */}
                <section id="introduction" className="mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[color:var(--primary)]/10 rounded-lg">
                      <Shield className="w-6 h-6 text-[color:var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Introduction
                    </h2>
                  </div>

                  <p className="text-gray-700 mb-4">
                    Bienvenue sur la politique de confidentialité de
                    PlanniKeeper. Nous accordons une importance primordiale à la
                    protection de vos données personnelles et au respect de
                    votre vie privée. Ce document explique comment nous
                    collectons, utilisons, partageons et protégeons vos
                    informations lorsque vous utilisez notre service.
                  </p>

                  <p className="text-gray-700 mb-4">
                    PlanniKeeper est une solution de gestion immobilière
                    développée et opérée par Campus Gérance, située en Suisse.
                    Notre application vous permet de gérer efficacement vos
                    biens immobiliers, de planifier des tâches et de collaborer
                    avec votre équipe.
                  </p>

                  <p className="text-gray-700">
                    En utilisant PlanniKeeper, vous acceptez les pratiques
                    décrites dans cette politique de confidentialité. Nous vous
                    encourageons à la lire attentivement pour comprendre comment
                    nous traitons vos données.
                  </p>
                </section>

                {/* Données collectées */}
                <section id="collected-data" className="mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[color:var(--primary)]/10 rounded-lg">
                      <Database className="w-6 h-6 text-[color:var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Données collectées
                    </h2>
                  </div>

                  <p className="text-gray-700 mb-4">
                    Pour fournir et améliorer notre service, nous collectons
                    différents types de données :
                  </p>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Données d&apos;inscription et de profil
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Nom, prénom et adresse email</li>
                        <li>Mot de passe (stocké de manière sécurisée)</li>
                        <li>Nom de votre organisation</li>
                        <li>Photo de profil (optionnelle)</li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Données de vos biens immobiliers
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Informations sur vos biens (nom, type, adresse)</li>
                        <li>Structure des secteurs et articles</li>
                        <li>Tâches et activités planifiées</li>
                        <li>Documents téléchargés liés à vos biens</li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Données d&apos;utilisation
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>
                          Informations sur votre utilisation de
                          l&apos;application
                        </li>
                        <li>Interactions avec les fonctionnalités</li>
                        <li>Préférences et paramètres</li>
                        <li>Données d&apos;appareil et de navigateur</li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Données de paiement
                      </h3>
                      <p className="text-gray-700 mb-2">
                        Pour les abonnements payants, nous collectons les
                        informations de paiement via notre processeur de
                        paiement Stripe. PlanniKeeper ne stocke pas directement
                        vos informations de carte bancaire.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Utilisation des données */}
                <section id="data-use" className="mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[color:var(--primary)]/10 rounded-lg">
                      <Eye className="w-6 h-6 text-[color:var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Utilisation des données
                    </h2>
                  </div>

                  <p className="text-gray-700 mb-4">
                    Nous utilisons les données collectées pour les finalités
                    suivantes :
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Fournir et améliorer notre service
                        </h3>
                        <p className="text-gray-700">
                          Pour vous permettre d&apos;accéder et d&apos;utiliser
                          PlanniKeeper, de gérer vos biens immobiliers, et
                          d&apos;améliorer continuellement nos fonctionnalités.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Personnaliser l&apos;expérience utilisateur
                        </h3>
                        <p className="text-gray-700">
                          Pour vous offrir une expérience personnalisée, des
                          recommandations pertinentes et des notifications
                          adaptées à vos besoins.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Communiquer avec vous
                        </h3>
                        <p className="text-gray-700">
                          Pour vous envoyer des notifications importantes
                          concernant votre compte, des mises à jour de service,
                          des rappels de tâches, et des informations sur les
                          nouvelles fonctionnalités.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Gérer votre abonnement
                        </h3>
                        <p className="text-gray-700">
                          Pour traiter vos paiements, envoyer des factures, et
                          gérer votre abonnement à notre service.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Assurer la sécurité et prévenir la fraude
                        </h3>
                        <p className="text-gray-700">
                          Pour protéger votre compte, détecter et prévenir les
                          activités frauduleuses, les abus, et les violations de
                          nos conditions d&apos;utilisation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Analyse et amélioration
                        </h3>
                        <p className="text-gray-700">
                          Pour analyser l&apos;utilisation de notre service,
                          identifier les tendances d&apos;usage, et améliorer
                          nos fonctionnalités, notre interface et notre
                          performance.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Partage des données */}
                <section id="data-sharing" className="mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[color:var(--primary)]/10 rounded-lg">
                      <Globe className="w-6 h-6 text-[color:var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Partage des données
                    </h2>
                  </div>

                  <p className="text-gray-700 mb-4">
                    Nous ne vendons pas vos données personnelles à des tiers.
                    Nous partageons vos informations uniquement dans les
                    situations suivantes :
                  </p>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Avec votre consentement
                      </h3>
                      <p className="text-gray-700">
                        Nous partagerons vos données personnelles lorsque vous
                        nous avez expressément autorisés à le faire.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Avec les membres de votre organisation
                      </h3>
                      <p className="text-gray-700">
                        Les informations sur les biens, secteurs, articles et
                        tâches sont partagées avec les membres de votre
                        organisation selon les permissions que vous leur avez
                        accordées.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Avec nos fournisseurs de services
                      </h3>
                      <p className="text-gray-700 mb-2">
                        Nous travaillons avec des tiers de confiance qui nous
                        aident à opérer, fournir et améliorer notre service :
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Stripe pour le traitement des paiements</li>
                        <li>Cloudinary pour le stockage des médias</li>
                        <li>Resend pour l&apos;envoi d&apos;emails</li>
                        <li>
                          Vercel pour l&apos;hébergement de l&apos;application
                        </li>
                      </ul>
                      <p className="text-gray-700 mt-2">
                        Ces fournisseurs sont contractuellement tenus de
                        protéger vos données et de les utiliser uniquement pour
                        les services qu&apos;ils nous fournissent.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Pour des raisons légales
                      </h3>
                      <p className="text-gray-700">
                        Nous pouvons divulguer vos informations si nous y sommes
                        légalement obligés, pour respecter la loi, répondre à
                        des procédures judiciaires, protéger nos droits, ou
                        défendre contre des réclamations légales.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        En cas de transfert d&apos;entreprise
                      </h3>
                      <p className="text-gray-700">
                        Si PlanniKeeper est impliqué dans une fusion,
                        acquisition ou vente d&apos;actifs, vos données
                        pourraient être transférées. Nous vous informerons par
                        email et/ou par un avis bien visible sur notre site web
                        avant que vos données ne soient transférées et soumises
                        à une politique de confidentialité différente.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Données anonymisées
                      </h3>
                      <p className="text-gray-700">
                        Nous pouvons utiliser et partager des données agrégées
                        et anonymisées (qui ne peuvent pas être associées à
                        vous) à des fins d&apos;analyse, d&apos;amélioration de
                        notre service et de recherche.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Cookies et traceurs */}
                <section id="cookies" className="mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[color:var(--primary)]/10 rounded-lg">
                      <Cookie className="w-6 h-6 text-[color:var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Cookies et traceurs
                    </h2>
                  </div>

                  <p className="text-gray-700 mb-4">
                    PlanniKeeper utilise des cookies et des technologies
                    similaires pour améliorer votre expérience et recueillir des
                    informations sur l&apos;utilisation de notre service.
                  </p>

                  <div className="space-y-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Cookies essentiels
                        </h3>
                        <p className="text-gray-700">
                          Ces cookies sont nécessaires au fonctionnement de base
                          de notre service, comme l&apos;authentification et la
                          sécurité. Vous ne pouvez pas les désactiver.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Cookies de préférences
                        </h3>
                        <p className="text-gray-700">
                          Ces cookies nous permettent de mémoriser vos
                          préférences et paramètres pour personnaliser votre
                          expérience.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Cookies statistiques
                        </h3>
                        <p className="text-gray-700">
                          Ces cookies nous aident à comprendre comment vous
                          interagissez avec notre service, à analyser son
                          utilisation et à améliorer son fonctionnement.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">
                    Nous utilisons Vercel Analytics et Speed Insights pour
                    analyser l&apos;utilisation de notre service. Ces outils
                    respectent votre vie privée et ne collectent que des données
                    anonymisées.
                  </p>

                  <div className="bg-[color:var(--primary)]/5 p-4 rounded-lg border border-[color:var(--primary)]/20">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Gestion des cookies
                    </h3>
                    <p className="text-gray-700">
                      Vous pouvez modifier vos préférences en matière de cookies
                      à tout moment en cliquant sur &quot;Paramètres des
                      cookies&quot; en bas de notre site. La plupart des
                      navigateurs vous permettent également de gérer vos
                      préférences de cookies dans leurs paramètres.
                    </p>
                  </div>
                </section>

                {/* Vos droits */}
                <section id="your-rights" className="mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[color:var(--primary)]/10 rounded-lg">
                      <User className="w-6 h-6 text-[color:var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Vos droits
                    </h2>
                  </div>

                  <p className="text-gray-700 mb-4">
                    Selon votre lieu de résidence, vous disposez de certains
                    droits concernant vos données personnelles. Ces droits
                    peuvent inclure :
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Droit d&apos;accès
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Vous pouvez demander une copie des données personnelles
                        que nous détenons à votre sujet.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Droit de rectification
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Vous pouvez demander la correction des données inexactes
                        ou incomplètes.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Droit à l&apos;effacement
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Vous pouvez demander la suppression de vos données
                        personnelles dans certaines circonstances.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Droit à la limitation du traitement
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Vous pouvez demander de restreindre le traitement de vos
                        données dans certaines circonstances.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Droit à la portabilité des données
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Vous pouvez demander une copie de vos données dans un
                        format structuré et lisible par machine.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Droit d&apos;opposition
                      </h3>
                      <p className="text-gray-700 text-sm">
                        Vous pouvez vous opposer au traitement de vos données à
                        certaines fins.
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">
                    Vous pouvez exercer ces droits en nous contactant à
                    l&apos;adresse email indiquée à la fin de cette politique.
                    Nous répondrons à votre demande dans les délais prévus par
                    la loi applicable.
                  </p>

                  <div className="bg-[color:var(--primary)]/5 p-4 rounded-lg border border-[color:var(--primary)]/20">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Gestion de vos préférences
                    </h3>
                    <p className="text-gray-700 mb-2">
                      Vous pouvez gérer certaines préférences directement dans
                      votre compte PlanniKeeper :
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Mettre à jour vos informations de profil</li>
                      <li>Modifier vos préférences de notification</li>
                      <li>Gérer les accès des membres de votre organisation</li>
                      <li>Télécharger vos données</li>
                    </ul>
                  </div>
                </section>

                {/* Sécurité */}
                <section id="security" className="mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[color:var(--primary)]/10 rounded-lg">
                      <Lock className="w-6 h-6 text-[color:var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Sécurité
                    </h2>
                  </div>

                  <p className="text-gray-700 mb-4">
                    La sécurité de vos données est notre priorité. Nous mettons
                    en œuvre des mesures techniques et organisationnelles pour
                    protéger vos informations contre tout accès, utilisation ou
                    divulgation non autorisés.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Chiffrement des données
                        </h3>
                        <p className="text-gray-700">
                          Toutes les communications entre votre appareil et nos
                          serveurs sont chiffrées via HTTPS. Les données
                          sensibles comme les mots de passe sont stockées sous
                          forme chiffrée dans notre base de données.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Contrôle d&apos;accès
                        </h3>
                        <p className="text-gray-700">
                          L&apos;accès à vos données est strictement limité au
                          personnel autorisé. Nous avons mis en place un système
                          de permissions granulaires pour contrôler qui peut
                          accéder à quelles données au sein de votre
                          organisation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Surveillance continue
                        </h3>
                        <p className="text-gray-700">
                          Nos systèmes sont surveillés en permanence pour
                          détecter d&apos;éventuelles vulnérabilités ou
                          tentatives d&apos;accès non autorisé.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-4 mt-1">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Sauvegardes régulières
                        </h3>
                        <p className="text-gray-700">
                          Nous effectuons des sauvegardes régulières de vos
                          données pour prévenir toute perte accidentelle.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-6">
                    <h3 className="text-lg font-semibold text-orange-800 mb-2">
                      Notification de violation de données
                    </h3>
                    <p className="text-orange-800">
                      En cas de violation de données susceptible de présenter un
                      risque pour vos droits et libertés, nous vous en
                      informerons dans les meilleurs délais, conformément à nos
                      obligations légales.
                    </p>
                  </div>
                </section>

                {/* Nous contacter */}
                <section id="contact-privacy" className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[color:var(--primary)]/10 rounded-lg">
                      <Mail className="w-6 h-6 text-[color:var(--primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Nous contacter
                    </h2>
                  </div>

                  <p className="text-gray-700 mb-4">
                    Si vous avez des questions concernant cette politique de
                    confidentialité ou la manière dont nous traitons vos
                    données, n&apos;hésitez pas à nous contacter :
                  </p>

                  <div className="bg-white p-6 rounded-lg border border-[color:var(--primary)]/20 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-[color:var(--primary)] mt-0.5" />
                        <div>
                          <p className="font-medium">Email :</p>
                          <a
                            href="mailto:privacy@plannikeeper.ch"
                            className="text-[color:var(--primary)] hover:underline"
                          >
                            privacy@plannikeeper.ch
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 text-[color:var(--primary)] mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">Adresse postale :</p>
                          <p>
                            Campus Gérance
                            <br />
                            Rue de Battentin 1<br />
                            1630 Bulle
                            <br />
                            Suisse
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Mise à jour de la politique */}
                <section>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Mises à jour de la politique
                    </h3>
                    <p className="text-gray-700 mb-2">
                      Nous pouvons mettre à jour cette politique de
                      confidentialité de temps à autre pour refléter les
                      changements dans nos pratiques ou pour d&apos;autres
                      raisons légales ou opérationnelles.
                    </p>
                    <p className="text-gray-700">
                      Nous vous informerons de tout changement significatif par
                      email ou par une notification visible sur notre service.
                      Nous vous encourageons à consulter régulièrement cette
                      politique pour rester informé de la manière dont nous
                      protégeons vos informations.
                    </p>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
