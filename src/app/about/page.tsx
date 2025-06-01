"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ArrowLeft,
  User,
  HomeIcon,
  RocketIcon,
  Info,
} from "lucide-react";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import PremiumBurgerButton from "@/app/components/ui/BurgerButton";
import { useState } from "react";

// Animations pour les entrées des éléments
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

// Données de team
const founder = {
  name: "Guillaume Perrottet",
  role: "Développeur",
  bio: "J'ai créé PlanniKeeper pour répondre aux défis spécifiques que nous avons rencontrés dans la gestion quotidienne de campings et d'hôtels. Combinant notre expertise dans ces deux domaines, je développe et améliore continuellement cette solution pour la rendre toujours plus intuitive et efficace.",
  image: "/images/guillaume-perrottet.jpg",
};

// Historique
const milestones = [
  {
    year: "2023",
    title: "Naissance de l'idée",
    description:
      "Face aux défis de gestion de 3 campings et 1 hôtel, l'idée de PlanniKeeper émerge comme solution à un besoin concret.",
  },
  {
    year: "2024",
    title: "Développement de PlanniKeeper",
    description:
      "Création d'une première version fonctionnelle adaptée spécifiquement aux besoins des établissements d'hébergement touristique.",
  },
  {
    year: "2025",
    title: "Lancement officiel",
    description:
      "Après des tests approfondis en conditions réelles, PlanniKeeper est proposé à d'autres professionnels du secteur.",
  },
];

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

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const triggerHapticFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const toggleMobileMenu = () => {
    triggerHapticFeedback();
    setMobileMenuOpen(!mobileMenuOpen);
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
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Fond sombre animé - Synchronisé avec le menu latéral */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
            {/* Menu latéral avec animation améliorée */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full sm:w-96 max-w-sm bg-[#f9f3ec] z-50 shadow-xl sm:rounded-l-3xl border-l border-[#beac93] flex flex-col overflow-y-auto"
              style={{ maxHeight: "100vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
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
                          className={`w-full p-4 rounded-xl transition duration-300 flex items-center gap-3 ${
                            false
                              ? "bg-[#d9840d] text-white shadow-md"
                              : "bg-white text-[#141313] hover:bg-[#e8ebe0] border border-[#beac93]"
                          }`}
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
      </AnimatePresence>
      {/* Hero section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[color:var(--primary)]/10 px-4 py-1 rounded-full mb-4 border border-[color:var(--primary)]/20">
            <span className="text-[color:var(--primary)] font-medium text-sm">
              À propos de PlanniKeeper
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
            L&apos;histoire derrière le projet
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Comment un défi personnel dans la gestion de campings et
            d&apos;hôtels a donné naissance à PlanniKeeper.
          </p>
        </motion.div>

        {/* Section de présentation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Pourquoi PlanniKeeper
            </h2>
            <p className="text-gray-600 mb-6">
              PlanniKeeper est né d&apos;un besoin concret. Pour la maintenance
              de trois campings et d&apos;un hôtel, nous avons rapidement
              constaté que les outils existants ne répondaient pas aux défis
              spécifiques de ces établissements : planification de la
              maintenance, suivi des tâches, centralisation des documents...
            </p>
            <p className="text-gray-600 mb-6">
              Passionné par la technologie et l&apos;optimisation des processus,
              nous avons décidé de créer notre propre solution. PlanniKeeper a
              d&apos;abord été développé pour notre usage personnel, avec
              l&apos;objectif de simplifier notre quotidien. C&apos;est en
              voyant les résultats concrets - gain de temps, réduction des
              erreurs, meilleure communication - que nous avons réalisé que
              cette solution pourrait aider d&apos;autres professionnels du
              secteur.
            </p>
            <div className="flex gap-4 mt-8">
              <Link href="/contact">
                <Button className="bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2 relative"
          >
            <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-[color:var(--primary)]/10 rounded-2xl transform rotate-3"></div>
              <div className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-[color:var(--primary)]/20">
                <Image
                  src="/images/camping-hotel-collage.jpg"
                  alt="Les campings et hôtels qui utilisent PlanniKeeper"
                  fill
                  className="object-cover"
                  priority={false}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  placeholder="blur"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section Fondateur */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mb-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Derrière PlanniKeeper
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Un projet développé avec passion
            </p>
          </div>

          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center text-center max-w-2xl"
            >
              <div className="w-32 h-32 relative rounded-full overflow-hidden mb-6 border-4 border-[color:var(--primary)]/20">
                <Image
                  src={founder.image}
                  alt={founder.name}
                  width={128}
                  height={128}
                  className="object-cover rounded-full"
                  placeholder="blur"
                />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-gray-900">
                {founder.name}
              </h3>
              <p className="text-[color:var(--primary)] font-medium mb-6">
                {founder.role}
              </p>
              <p className="text-gray-600">{founder.bio}</p>
              <p className="text-gray-600 mt-4">
                &quot;Je crois fermement que la technologie doit servir
                l&apos;humain, pas l&apos;inverse. C&apos;est pourquoi
                PlanniKeeper a été conçu pour être intuitif, adapté à la réalité
                du terrain, et en constante évolution selon les retours des
                utilisateurs.&quot;
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Section Jalons */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Notre parcours
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Plannikeeper est un projet récent. Et donc a la pointe de la
              technologie actuelle et surtout en constante amélioration.
            </p>
          </div>

          <div className="relative">
            {/* Ligne de temps verticale */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-[color:var(--primary)]/20"></div>

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex flex-col md:flex-row items-center ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div
                    className={`md:w-1/2 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}
                  >
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                      <p className="text-[color:var(--primary)] font-bold mb-2">
                        {milestone.year}
                      </p>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-[color:var(--primary)] text-white font-bold relative z-10 my-4 md:my-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="md:w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section Pour les Geeks */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="py-20 bg-gradient-to-b from-[#f5f3ef] to-[#f9f8f4]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-[#e36002]/10 px-4 py-1 rounded-full mb-4 border border-[#e36002]/20">
              <span className="text-[#e36002] font-medium text-sm">
                Pour les geeks
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Notre stack technique
            </h2>
            <p className="text-lg text-[#62605d] max-w-3xl mx-auto">
              PlanniKeeper est bâti sur des technologies modernes et robustes,
              garantissant performance, sécurité et évolutivité.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Colonne 1: Stack Technique */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-200"
            >
              <h3 className="text-2xl font-bold mb-6 text-[#141313]">
                Stack Technique
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[#d9840d]">
                    Frontend
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>Next.js 15 (React 19)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>TypeScript pour une robustesse accrue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>TailwindCSS pour l&apos;interface utilisateur</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>Framer Motion pour les animations fluides</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[#d9840d]">
                    Backend
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>API Routes Next.js</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>Base de données PostgreSQL</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>Prisma ORM pour la manipulation des données</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>
                        Better-Auth pour l&apos;authentification sécurisée
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[#d9840d]">
                    Intégrations
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>Stripe pour les paiements sécurisés</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>Cloudinary pour la gestion des médias</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>
                        Vercel pour l&apos;hébergement et le déploiement
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full"></div>
                      <span>Resend pour les communications par email</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Colonne 2: Sécurité et Performance */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-200"
            >
              <h3 className="text-2xl font-bold mb-6 text-[#141313]">
                Sécurité & Performance
              </h3>

              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[#d9840d]">
                    Protection des données
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Votre sécurité est notre priorité. PlanniKeeper implémente
                    plusieurs niveaux de protection :
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>
                        Chiffrement des données sensibles en base de données
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>
                        Connexions HTTPS sécurisées sur toute la plateforme
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>
                        Authentification sécurisée avec protection contre les
                        attaques de force brute
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>
                        Système de permissions granulaires pour contrôler
                        l&apos;accès aux ressources
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[#d9840d]">
                    Optimisations de performance
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Une application rapide et fluide, même avec de grandes
                    quantités de données :
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>Architecture moderne basée sur les composants</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>Mise en cache intelligente des requêtes API</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>Application Progressive Web App (PWA)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>
                        Optimisation des images et des assets pour un chargement
                        rapide
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[#d9840d]">
                    Évolutivité
                  </h4>
                  <p className="text-gray-600 mb-4">
                    PlanniKeeper est conçu pour évoluer avec vos besoins :
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>
                        Infrastructure serverless qui s&apos;adapte
                        automatiquement à la charge
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>
                        Base de données relationnelle optimisée pour les
                        performances
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-[#d9840d] rounded-full mt-2"></div>
                      <span>
                        Architecture modulaire facilitant l&apos;ajout de
                        nouvelles fonctionnalités
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Citation tech */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true, amount: 0.3 }}
            className="mt-16 text-center"
          >
            <div className="inline-block bg-[#d9840d]/5 px-8 py-4 rounded-full border border-[#d9840d]/20">
              <span className="text-xl font-medium text-[#d9840d] italic">
                &quot;La technologie est au service de l&apos;expérience
                utilisateur, pas l&apos;inverse.&quot;
              </span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Appel à l'action */}
      <section className="py-16 bg-[color:var(--primary)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Prêt à transformer la gestion de votre établissement ?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-3xl mx-auto">
            Découvrez comment PlanniKeeper peut simplifier votre quotidien et
            améliorer l&apos;efficacité de vos opérations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-[color:var(--primary)]/80"
              >
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "À propos de PlanniKeeper",
        description: "L'histoire derrière PlanniKeeper et notre mission",
        url: "https://plannikeeper.ch/about",
        mainEntity: {
          "@type": "Organization",
          name: "PlanniKeeper",
          founder: {
            "@type": "Person",
            name: "Guillaume Perrottet",
            jobTitle: "Développeur et Fondateur",
            image: "/images/guillaume-perrottet.jpg",
          },
          foundingDate: "2023",
          description:
            "Solution de gestion immobilière simplifiée pour campings et hôtels",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Rue de Battentin 1",
            addressLocality: "Bulle",
            postalCode: "1630",
            addressCountry: "CH",
          },
        },
      }),
    }}
  />;
}
