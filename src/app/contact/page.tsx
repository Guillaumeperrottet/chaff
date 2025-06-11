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
  BarChart3,
  User,
  Info,
  DollarSign,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

// Données pour les bureaux
const offices = [
  {
    city: "Bulle",
    address: "Rue de Battentin 1, 1630 Bulle",
    phone: "+41 79 341 40 74",
    email: "perrottet.guillaume.97@gmail.com",
  },
];

// Liste des secteurs d'activité pour le formulaire
const industries = [
  "Finance & Comptabilité",
  "Consulting & Services",
  "E-commerce",
  "Technologie",
  "Immobilier",
  "Santé",
  "Éducation",
  "Manufacturing",
  "Retail",
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
    icon: BarChart3,
    label: "Fonctionnalités",
    href: "/#features",
  },
  {
    id: "pricing",
    icon: DollarSign,
    label: "Tarifs",
    href: "/#pricing",
  },
  { id: "about", icon: Info, label: "À propos", href: "/about" },
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-card/80 backdrop-blur-md border-border fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary text-white rounded-xl shadow-lg">
                <BarChart3 className="text-lg font-bold" />
              </div>
              <div className="flex flex-col">
                <div className="text-xl font-bold text-primary">Chaff.ch</div>
                <div className="text-xs text-muted-foreground">
                  Analytics Business
                </div>
              </div>
            </Link>

            {/* Menu desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Fonctionnalités
              </Link>
              <Link
                href="/#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Tarifs
              </Link>
              <Link
                href="/signin"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Connexion
              </Link>
              <Link href="/signup">
                <Button className="bg-primary hover:bg-primary/90">
                  Commencer
                </Button>
              </Link>
            </div>

            {/* Menu mobile */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-80 bg-white z-50 shadow-xl md:hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-xl font-bold text-primary">Chaff.ch</div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <nav className="space-y-4">
                  {NAV_ITEMS.map(({ id, icon: Icon, label, href }) => (
                    <Link
                      key={id}
                      href={href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{label}</span>
                    </Link>
                  ))}

                  <div className="pt-4 border-t">
                    <Link
                      href="/signin"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 text-primary" />
                      <span className="font-medium">Connexion</span>
                    </Link>
                    <Link
                      href="/signup"
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors mt-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="font-medium">
                        Commencer gratuitement
                      </span>
                    </Link>
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-block bg-primary/10 px-4 py-1 rounded-full mb-4 border border-primary/20">
            <span className="text-primary font-medium text-sm">
              Contactez-nous
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
            Parlons de vos{" "}
            <span className="text-primary">analytics business</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Notre équipe est prête à vous accompagner dans l&apos;optimisation
            de vos performances financières. Découvrez comment Chaff.ch peut
            améliorer votre business.
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
              Contactez nous
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
                  Merci de nous avoir contactés. Notre équipe d&apos;experts
                  Chaff.ch vous répondra dans les plus brefs délais pour
                  discuter de vos besoins en analytics business.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  className="bg-primary hover:bg-primary/90"
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
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
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
                  <Label htmlFor="employees">Taille de l&apos;entreprise</Label>
                  <select
                    id="employees"
                    name="employees"
                    value={formState.employees}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  >
                    <option value="" disabled>
                      Sélectionnez la taille
                    </option>
                    <option value="1-10">1-10 employés</option>
                    <option value="11-50">11-50 employés</option>
                    <option value="51-250">51-250 employés</option>
                    <option value="251-1000">251-1000 employés</option>
                    <option value="1000+">Plus de 1000 employés</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Votre projet</Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Décrivez vos besoins en analytics business, vos objectifs de performance, ou toute question sur Chaff.ch..."
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  ></textarea>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="privacy"
                      name="privacy"
                      type="checkbox"
                      required
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="privacy" className="text-gray-600">
                      J&apos;accepte que mes données soient traitées
                      conformément à la{" "}
                      <a
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        politique de confidentialité
                      </a>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary hover:bg-primary/90"
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
                      Discuter de mon projet
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
                A propos
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-primary mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <a
                      href="mailto:perrottet.guillaume.97@gmail.com"
                      className="text-gray-600 hover:text-primary"
                    >
                      perrottet.guillaume.97@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-primary mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Téléphone</p>
                    <a
                      href="tel:+41793414074"
                      className="text-gray-600 hover:text-primary"
                    >
                      +41 79 341 40 74
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Site web</p>
                    <span className="text-gray-400 italic">www.webbing.ch</span>
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
                        <MapPin className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <span className="text-gray-600">{office.address}</span>
                      </div>
                      <div className="flex items-start">
                        <Phone className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <a
                          href={`tel:${office.phone}`}
                          className="text-gray-600 hover:text-primary"
                        >
                          {office.phone}
                        </a>
                      </div>
                      <div className="flex items-start">
                        <Mail className="w-4 h-4 text-primary mt-0.5 mr-2" />
                        <a
                          href={`mailto:${office.email}`}
                          className="text-gray-600 hover:text-primary"
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
            Vous avez des questions sur Chaff.ch ? Consultez notre FAQ ou
            contactez-nous directement.
          </p>
        </motion.div>

        <div className="space-y-6">
          {[
            {
              question: "Comment Chaff.ch peut-il s'adapter à mon entreprise ?",
              answer:
                "Chaff.ch propose différentes formules adaptées à tous types d'entreprises, de la TPE au grand groupe. Notre solution d'analytics business est entièrement personnalisable pour répondre à vos besoins spécifiques en gestion financière.",
            },
            {
              question:
                "Quels types de données puis-je analyser avec Chaff.ch ?",
              answer:
                "Vous pouvez analyser votre chiffre d'affaires, votre masse salariale, vos ratios de rentabilité, et bien plus. Notre plateforme s'intègre facilement avec vos systèmes existants pour centraliser toutes vos données financières.",
            },
            {
              question: "Mes données sont-elles sécurisées ?",
              answer:
                "Absolument. Toutes vos données sont chiffrées et stockées sur des serveurs sécurisés en Europe, conformément au RGPD. Nous appliquons les plus hauts standards de sécurité pour protéger vos informations financières.",
            },
            {
              question: "Proposez-vous des formations pour mon équipe ?",
              answer:
                "Oui, nous proposons des sessions de formation personnalisées pour votre équipe. Notre interface intuitive permet une prise en main rapide, et notre équipe support est disponible pour vous accompagner.",
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
        >
          <p className="text-muted-foreground">
            Une autre question ? Contactez-nous directement à{" "}
            <a
              href="mailto:perrottet.guillaume.97@gmail.com"
              className="text-primary hover:underline font-medium"
            >
              perrottet.guillaume.97@gmail.com
            </a>
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-lg">
                <BarChart3 />
              </div>
              <span className="text-xl font-bold text-primary">Chaff.ch</span>
            </div>
            <p className="text-muted-foreground">
              La solution d&apos;analytics business pour optimiser votre
              rentabilité
            </p>
            <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
              <Link href="/#features" className="hover:text-primary">
                Fonctionnalités
              </Link>
              <Link href="/#pricing" className="hover:text-primary">
                Tarifs
              </Link>
              <Link href="/contact" className="hover:text-primary">
                Support
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 Chaff.ch. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
