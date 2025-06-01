"use client";

import {
  HomeIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { track } from "@vercel/analytics";
import { buttonVariants } from "@/app/components/ui/button";
import { VT323 } from "next/font/google";
import Link from "next/link";
import PremiumBurgerButton from "@/app/components/ui/BurgerButton";
import { User, Info } from "lucide-react";

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

const NAV_ITEMS = [
  { id: "hero", icon: HomeIcon, label: "Accueil" },
  { id: "features", icon: RocketLaunchIcon, label: "Fonctionnalités" },
  { id: "pricing", icon: CurrencyDollarIcon, label: "Tarifs" },
  { id: "about", icon: Info, label: "A propos", href: "/about" },
  { id: "contact", icon: User, label: "Nous contacter", href: "/contact" },
];

export default function Header() {
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const scrollPositionRef = useRef(0);

  // Transform values for the sidebar elements that will fade out
  const sideOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const sideScale = useTransform(scrollY, [0, 100], [1, 0.8]);
  const navScale = useTransform(scrollY, [0, 100], [1, 1.1]);

  // Fonctions de tracking
  const handleAboutClick = (location: string) => {
    track("about_us_clicked", {
      location: location,
      timestamp: new Date().toISOString(),
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    });
  };

  const handleContactClick = (location: string) => {
    track("contact_clicked", {
      location: location,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSignupClick = (location: string) => {
    track("signup_clicked", {
      plan: "FREE",
      location: location,
      timestamp: new Date().toISOString(),
    });
  };

  const handleLogoClick = () => {
    track("logo_clicked", {
      timestamp: new Date().toISOString(),
    });
  };

  const handleNavigationClick = (sectionId: string) => {
    track("navigation_clicked", {
      section: sectionId,
      location: "header",
      timestamp: new Date().toISOString(),
    });
  };

  // Effet pour la gestion du scroll lors de l'ouverture du menu mobile
  useEffect(() => {
    if (mobileMenuOpen) {
      // Sauvegarde la position de défilement actuelle
      scrollPositionRef.current = window.scrollY;

      // Appliquer des styles pour empêcher le défilement de façon synchrone
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = "100%";
      document.body.style.overflowY = "scroll";
    } else {
      // Réinitialiser les styles
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflowY = "";

      // Restaurer la position immédiatement après le rendu
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: "instant",
        });
      });
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflowY = "";
    };
  }, [mobileMenuOpen]);

  // Tracking scroll for active section
  useEffect(() => {
    const handleScroll = () => {
      // Update scrolled state for conditional styling
      setScrolled(window.scrollY > 60);

      // Find active section based on scroll position
      let current = "hero";
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 80) {
            current = item.id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Call once initially

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string): void => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
    setMobileMenuOpen(false); // Ferme le menu mobile après la sélection
    handleNavigationClick(id);
  };

  // Générer un effet de feedback haptique sur mobile
  const triggerHapticFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const toggleMobileMenu = () => {
    triggerHapticFeedback();
    setMobileMenuOpen(!mobileMenuOpen);

    // Tracker l'ouverture/fermeture du menu
    track("mobile_menu_toggled", {
      action: !mobileMenuOpen ? "opened" : "closed",
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 py-4 md:py-6 px-4 md:px-8 transition-all duration-300 bg-transparent`}
    >
      <div className="max-w-8xl mx-auto flex items-center justify-between">
        {/* Logo on the left */}
        <motion.div
          style={{ opacity: sideOpacity, scale: sideScale }}
          className={`text-3xl md:text-5xl font-bold ${vt323.className} text-black cursor-pointer`}
          onClick={handleLogoClick}
        >
          PlanniKeeper
        </motion.div>

        {/* Center Navigation - Desktop Only */}
        <motion.nav
          className="hidden md:block fixed left-0 right-0 top-4 mx-auto w-fit z-50"
          style={{ scale: navScale }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div
            className={`flex items-center gap-6 bg-white/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg transition-all duration-300 ${
              scrolled ? "px-8 py-3" : ""
            }`}
          >
            {NAV_ITEMS.map(({ id, icon: Icon, label, href }) =>
              href ? (
                <Link
                  key={id}
                  href={href}
                  className={`p-2 rounded-full transition duration-300 flex items-center gap-2 ${
                    activeSection === id
                      ? "bg-[#d9840d] text-white"
                      : "text-[#62605d] hover:bg-[#e8ebe0]"
                  }`}
                  onClick={() => {
                    if (id === "about") {
                      handleAboutClick("header");
                    } else if (id === "contact") {
                      handleContactClick("header");
                    }

                    track("header_link_clicked", {
                      link: id,
                      timestamp: new Date().toISOString(),
                    });
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span className={`text-sm ${scrolled ? "block" : "hidden"}`}>
                    {label}
                  </span>
                </Link>
              ) : (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`p-2 rounded-full transition duration-300 flex items-center gap-2 ${
                    activeSection === id
                      ? "bg-[#d9840d] text-white"
                      : "text-[#62605d] hover:bg-[#e8ebe0]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className={`text-sm ${scrolled ? "block" : "hidden"}`}>
                    {label}
                  </span>
                </button>
              )
            )}
          </div>
        </motion.nav>

        {/* Right side: SignIn button on desktop + Mobile menu button */}
        <div className="flex items-center gap-3">
          {/* SignIn Button - visible on both desktop and mobile */}
          <motion.div
            style={{ opacity: sideOpacity, scale: sideScale }}
            className="hidden sm:block"
          >
            <Link
              href="/dashboard"
              className={buttonVariants({
                variant: "outline",
                className: "bg-white hover:bg-[#e8ebe0] border-[#beac93]",
              })}
              onClick={() => handleSignupClick("header")}
            >
              <User className="w-4 h-4 mr-2" />
              Se connecter
            </Link>
          </motion.div>

          {/* Mobile menu burger button - always visible */}
          <PremiumBurgerButton
            isOpen={mobileMenuOpen}
            onClick={toggleMobileMenu}
            variant={scrolled ? "primary" : "light"}
            className="sm:hidden"
          />

          {/* Desktop menu button - only visible on desktop */}
          <PremiumBurgerButton
            isOpen={mobileMenuOpen}
            onClick={toggleMobileMenu}
            variant={scrolled ? "primary" : "light"}
            className="hidden sm:flex"
          />
        </div>
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
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className="fixed inset-y-0 right-0 w-full sm:w-96 max-w-sm bg-[#f9f3ec] z-50 shadow-xl sm:rounded-l-3xl border-l border-[#beac93] flex flex-col overflow-y-auto"
              style={{
                maxHeight: "100vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {/* En-tête du menu */}
              <div className="p-6 border-b border-[#beac93] flex items-center justify-between">
                <div
                  className={`text-2xl font-bold ${vt323.className} text-[#141313]`}
                >
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
                {/* Section navigation */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-[#62605d] mb-3 uppercase tracking-wider">
                    Navigation
                  </h3>
                  <nav className="flex flex-col space-y-3">
                    {NAV_ITEMS.map(({ id, icon: Icon, label, href }, index) =>
                      href ? (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.3 }}
                        >
                          <Link
                            href={href}
                            className={`w-full p-4 rounded-xl transition duration-300 flex items-center gap-3 ${
                              activeSection === id
                                ? "bg-[#d9840d] text-white shadow-md"
                                : "bg-white text-[#141313] hover:bg-[#e8ebe0] border border-[#beac93]"
                            }`}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              if (id === "about") {
                                handleAboutClick("mobile_menu");
                              } else if (id === "contact") {
                                handleContactClick("mobile_menu");
                              }

                              track("mobile_menu_link_clicked", {
                                link: id,
                                timestamp: new Date().toISOString(),
                              });
                            }}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-base font-medium">
                              {label}
                            </span>
                          </Link>
                        </motion.div>
                      ) : (
                        <motion.button
                          key={id}
                          onClick={() => scrollToSection(id)}
                          className={`w-full p-4 rounded-xl transition duration-300 flex items-center gap-3 ${
                            activeSection === id
                              ? "bg-[#d9840d] text-white shadow-md"
                              : "bg-white text-[#141313] hover:bg-[#e8ebe0] border border-[#beac93]"
                          }`}
                          whileTap={{ scale: 0.97 }}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.3 }}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-base font-medium">{label}</span>
                        </motion.button>
                      )
                    )}
                  </nav>
                </div>

                {/* Section compte */}
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
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleSignupClick("mobile_menu");
                        }}
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
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleSignupClick("mobile_menu");
                          track("mobile_menu_signup_clicked", {
                            timestamp: new Date().toISOString(),
                          });
                        }}
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

              {/* Pied du menu */}
              <div className="p-6 border-t border-[#beac93]">
                <Link
                  href="/signup?plan=FREE"
                  className="w-full justify-center flex items-center gap-2 bg-[#d9840d] hover:bg-[#c6780c] text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-md"
                  onClick={() => {
                    triggerHapticFeedback();
                    setMobileMenuOpen(false);
                    handleSignupClick("mobile_menu_cta");
                    track("mobile_menu_cta_clicked", {
                      timestamp: new Date().toISOString(),
                    });
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
    </header>
  );
}
