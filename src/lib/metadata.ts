// src/lib/metadata.ts - Métadonnées pour Chaff.ch
import { Metadata } from "next";

const siteUrl = "https://chaff.ch";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Chaff.ch - Plateforme de Gestion",
    template: "%s | Chaff.ch",
  },
  description:
    "Chaff.ch est votre plateforme de gestion moderne et intuitive. Organisez, planifiez et gérez vos données efficacement.",
  keywords: [
    "chaff",
    "chaff.ch",
    "gestion",
    "plateforme",
    "dashboard",
    "organisation",
    "données",
    "management",
    "suisse",
    "switzerland",
  ],
  authors: [{ name: "Chaff.ch" }],
  creator: "Chaff.ch",
  publisher: "Chaff.ch",
  openGraph: {
    type: "website",
    locale: "fr_CH",
    url: siteUrl,
    siteName: "Chaff.ch",
    title: "Chaff.ch - Plateforme de Gestion",
    description:
      "Votre plateforme de gestion moderne et intuitive pour organiser vos données efficacement.",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "Chaff.ch - Plateforme de Gestion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaff.ch - Plateforme de Gestion",
    description: "Votre plateforme de gestion moderne et intuitive",
    images: [`${siteUrl}/logo.png`],
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
};
