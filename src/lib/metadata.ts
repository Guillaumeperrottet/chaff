// src/lib/metadata.ts - Métadonnées pour Chaff.ch
import { Metadata } from "next";

const siteUrl = "https://chaff.ch";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Chaff.ch - Analytics Business & Suivi CA",
    template: "%s | Chaff.ch",
  },
  description:
    "Chaff.ch est votre plateforme d'analytics business pour visualiser votre chiffre d'affaires et optimiser votre masse salariale. Tableaux de bord intuitifs et ratios financiers en temps réel.",
  keywords: [
    "chaff",
    "chaff.ch",
    "analytics business",
    "chiffre d'affaires",
    "masse salariale",
    "dashboard",
    "ratios financiers",
    "suivi CA",
    "performance entreprise",
    "analytics",
    "business intelligence",
    "tableaux de bord",
    "gestion financière",
    "suisse",
    "switzerland",
    "rentabilité",
    "KPI",
    "métriques business",
  ],
  authors: [{ name: "Chaff.ch" }],
  creator: "Chaff.ch",
  publisher: "Chaff.ch",
  openGraph: {
    type: "website",
    locale: "fr_CH",
    url: siteUrl,
    siteName: "Chaff.ch",
    title: "Chaff.ch - Analytics Business & Suivi CA",
    description:
      "Visualisez votre chiffre d'affaires et optimisez votre masse salariale avec des tableaux de bord intuitifs et des ratios financiers en temps réel.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Chaff.ch - Analytics Business & Suivi CA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaff.ch - Analytics Business & Suivi CA",
    description: "Visualisez vos performances et optimisez votre rentabilité",
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  other: {
    "theme-color": "#3b82f6", // Couleur primaire bleue de Chaff.ch
  },
};

// Métadonnées spécifiques pour les pages
export const pageMetadata = {
  dashboard: {
    title: "Tableau de bord",
    description: "Visualisez vos KPIs et performances en temps réel",
  },
  analytics: {
    title: "Analytics",
    description: "Analyses approfondies de vos données business",
  },
  payroll: {
    title: "Masse salariale",
    description: "Gestion et optimisation de votre masse salariale",
  },
  signin: {
    title: "Connexion",
    description: "Connectez-vous à votre espace Chaff.ch",
  },
  signup: {
    title: "Inscription",
    description: "Créez votre compte Chaff.ch gratuit",
  },
};
