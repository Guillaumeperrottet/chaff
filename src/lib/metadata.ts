// src/lib/metadata.ts
import { Metadata } from "next";

const siteUrl = "https://plannikeeper.ch";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PlanniKeeper - Gestion Immobilière Simplifiée",
    template: "%s | PlanniKeeper",
  },
  description:
    "PlanniKeeper est la solution tout-en-un pour la gestion de vos projets immobiliers. Organisez vos propriétés, planifiez vos tâches et maximisez votre efficacité.",
  keywords: [
    "plannikeeper",
    "planikeeper",
    "plankeeper",
    "planikeeper",
    "gestion immobilière",
    "logiciel immobilier",
    "gestion de biens",
    "gestion de propriétés",
    "agence immobilière",
    "gestion locative",
    "syndic de copropriété",
    "maintenance immobilière",
    "planning immobilier",
    "organisation immobilière",
  ],
  authors: [{ name: "PlanniKeeper" }],
  creator: "PlanniKeeper",
  publisher: "PlanniKeeper",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "PlanniKeeper",
    title: "PlanniKeeper - Gestion Immobilière Simplifiée",
    description:
      "Simplifiez la gestion de vos projets immobiliers avec notre solution tout-en-un.",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "PlanniKeeper - Gestion Immobilière",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlanniKeeper - Gestion Immobilière Simplifiée",
    description: "Simplifiez la gestion de vos projets immobiliers",
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
