"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  HomeIcon,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Globe,
  ArrowLeft,
  RocketIcon,
  User,
  Info,
} from "lucide-react";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import PremiumBurgerButton from "@/app/components/ui/BurgerButton";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

// Données pour les bureaux
const offices = [
  {
    city: "Bulle",
    address: "Rue de Battentin 1, 1630 bulle",
    phone: "+41 79 341 40 74",
    email: "perrottet.guillaume.97@gmail.com",
  },
];

// Liste des secteurs d'activité pour le formulaire
const industries = [
  "Immobilier",
  "Architecture",
  "Hôtellerie",
  "Tourisme",
  "Services aux entreprises",
  "Construction",
  "Éducation",
  "Santé",
  "Autre",
];

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

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    industry: "",
    employees: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulation d'envoi du formulaire
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Votre message a été envoyé avec succès!");

      // Réinitialiser le formulaire après un délai
      setTimeout(() => {
        setFormState({
          name: "",
          email: "",
          company: "",
          industry: "",
          employees: "",
          message: "",
        });
        setIsSubmitted(false);
      }, 5000);
    }, 1500);
  };

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
              Contactez-nous
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
            Discutons de votre projet
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Notre équipe est prête à vous accompagner dans la gestion de vos
            biens immobiliers. Prenez contact avec nous dès aujourd&apos;hui.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Formulaire de contact */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.6,
                  delay: 0.2,
                  ease: "easeOut",
                },
              },
            }}
            className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Contactez-nous
            </h2>

            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Message envoyé !
                </h3>
                <p className="text-gray-600 mb-6">
                  Merci de nous avoir contactés. Notre équipe vous répondra dans
                  les plus brefs délais.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  className="bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90"
                >
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      placeholder="Jean Dupont"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email professionnel</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                      required
                      placeholder="jean.dupont@entreprise.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="company">Entreprise</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formState.company}
                      onChange={handleChange}
                      required
                      placeholder="Nom de votre entreprise"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Secteur d&apos;activité</Label>
                    <select
                      id="industry"
                      name="industry"
                      value={formState.industry}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] sm:text-sm"
                    >
                      <option value="" disabled>
                        Sélectionnez votre secteur
                      </option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="employees">Nombre d&apos;employés</Label>
                  <select
                    id="employees"
                    name="employees"
                    value={formState.employees}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] sm:text-sm"
                  >
                    <option value="" disabled>
                      Sélectionnez une option
                    </option>
                    <option value="1-10">1-10 employés</option>
                    <option value="11-50">11-50 employés</option>
                    <option value="51-200">51-200 employés</option>
                    <option value="201-500">201-500 employés</option>
                    <option value="501+">Plus de 500 employés</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Votre message</Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Décrivez votre projet ou vos besoins..."
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] sm:text-sm"
                  ></textarea>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="privacy"
                      name="privacy"
                      type="checkbox"
                      required
                      className="h-4 w-4 rounded border-gray-300 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="privacy" className="text-gray-600">
                      J&apos;accepte que mes données soient traitées
                      conformément à la{" "}
                      <a
                        href="/privacy"
                        className="text-[color:var(--primary)] hover:underline"
                      >
                        politique de confidentialité
                      </a>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Envoyer votre message
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Informations de contact */}
          <div className="space-y-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.3,
                    ease: "easeOut",
                  },
                },
              }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Contactez-nous directement
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-[color:var(--primary)] mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <a
                      href="mailto:perrottet.guillaume.97@gmail.com"
                      className="text-gray-600 hover:text-[color:var(--primary)]"
                    >
                      perrottet.guillaume.97@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-[color:var(--primary)] mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Téléphone</p>
                    <a
                      href="tel:+41793414074"
                      className="text-gray-600 hover:text-[color:var(--primary)]"
                    >
                      +41 79 341 40 74
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <Globe className="w-5 h-5 text-[color:var(--primary)] mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Site web</p>
                    <a
                      href="https://www.campus-gerance.ch/"
                      className="text-gray-600 hover:text-[color:var(--primary)]"
                    >
                      www.campus-gerance.ch
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.4,
                    ease: "easeOut",
                  },
                },
              }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Nos bureaux
              </h3>
              <div className="space-y-6">
                {offices.map((office, index) => (
                  <div
                    key={office.city}
                    className={
                      index !== 0 ? "pt-4 border-t border-gray-200" : ""
                    }
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {office.city}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-[color:var(--primary)] mt-0.5 mr-2" />
                        <span className="text-gray-600">{office.address}</span>
                      </div>
                      <div className="flex items-start">
                        <Phone className="w-4 h-4 text-[color:var(--primary)] mt-0.5 mr-2" />
                        <a
                          href={`tel:${office.phone}`}
                          className="text-gray-600 hover:text-[color:var(--primary)]"
                        >
                          {office.phone}
                        </a>
                      </div>
                      <div className="flex items-start">
                        <Mail className="w-4 h-4 text-[color:var(--primary)] mt-0.5 mr-2" />
                        <a
                          href={`mailto:${office.email}`}
                          className="text-gray-600 hover:text-[color:var(--primary)]"
                        >
                          {office.email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Questions fréquentes
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Vous avez des questions ? Consultez notre FAQ ou contactez-nous
            directement.
          </p>
        </motion.div>

        <div className="space-y-6">
          {[
            {
              question:
                "Comment PlanniKeeper peut-il s'adapter à mon entreprise ?",
              answer:
                "PlanniKeeper propose différentes formules adaptées à tous types d'entreprises, du privé au grand groupe. Notre solution est entièrement personnalisable pour répondre à vos besoins spécifiques.",
            },
            {
              question: "Proposez-vous des formations pour mon équipe ?",
              answer:
                "Oui, nous proposons des sessions de formation personnalisées pour votre équipe si besoin. Nous voulons nous assurer que vous tirez le meilleur parti de notre plateforme. Tout en sachant que la prise en main est intuitive et rapide.",
            },
            {
              question:
                "Comment sont gérées les mises à jour de la plateforme ?",
              answer:
                "Les mises à jour sont automatiques et régulières, sans interruption de service. Nous vous informons des nouvelles fonctionnalités via notre newsletter.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.1 * index,
                    ease: "easeOut",
                  },
                },
              }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {item.question}
              </h3>
              <p className="text-gray-600">{item.answer}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.6,
                delay: 0.5,
                ease: "easeOut",
              },
            },
          }}
          className="mt-12 text-center"
        ></motion.div>
      </section>
    </div>
  );
  // À ajouter dans le return de ContactPage, juste après le div principal

  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contactez PlanniKeeper",
        description: "Page de contact pour PlanniKeeper",
        url: "https://plannikeeper.ch/contact",
        mainEntity: {
          "@type": "Organization",
          name: "PlanniKeeper",
          url: "https://plannikeeper.ch",
          logo: "https://plannikeeper.ch/images/logo.png",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+41-79-341-40-74",
            contactType: "customer service",
            email: "perrottet.guillaume.97@gmail.com",
            availableLanguage: ["French", "English"],
            areaServed: "CH",
          },
          address: {
            "@type": "PostalAddress",
            streetAddress: "Rue de Battentin 1",
            addressLocality: "Bulle",
            postalCode: "1630",
            addressCountry: "CH",
          },
          sameAs: ["https://www.campus-gerance.ch/"],
        },
        potentialAction: {
          "@type": "CommunicateAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://plannikeeper.ch/contact",
            inLanguage: "fr",
            actionPlatform: [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform",
            ],
          },
          query: "required",
        },
      }),
    }}
  />;
}
