import { Metadata } from "next";
import LandingPageClient from "@/app/landing-page-client";
import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title:
    "PlanniKeeper - Gestion Immobilière Simplifiée | Organisez, Planifiez, Maîtrisez",
  description:
    "PlanniKeeper est la solution tout-en-un pour la gestion de vos projets immobiliers. Organisez vos propriétés, planifiez vos tâches et maximisez votre efficacité avec notre interface intuitive.",
  keywords:
    "PlanniKeeper, gestion immobilière, gestion de propriétés, organisation immobilière, planification immobilière, tâches immobilières, logiciel immobilier, gestion de biens, agence immobilière, gestion locative",
  authors: [{ name: "PlanniKeeper" }],
  creator: "PlanniKeeper",
  publisher: "PlanniKeeper",
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    title: "PlanniKeeper - Gestion Immobilière Simplifiée",
    description:
      "Simplifiez la gestion de vos projets immobiliers avec notre solution tout-en-un.",
    url: "https://plannikeeper.ch",
    siteName: "PlanniKeeper",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "PlanniKeeper - Gestion Immobilière Simplifiée",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlanniKeeper - Gestion Immobilière Simplifiée",
    description:
      "Organisez, planifiez et maîtrisez vos projets immobiliers avec PlanniKeeper.",
    images: ["/images/logo.png"],
  },
  alternates: {
    canonical: "https://plannikeeper.ch",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "n6Fs9Kd4TRf83FadX1gRcQucUvEGYRBfI-qRnlMfbMQ",
  },
};

// This needs to be a Server Component - make the check async
export default async function Page() {
  // Check if user is authenticated - this must be within the component function
  const user = await getUser();

  // If authenticated, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "PlanniKeeper",
            description:
              "Simplifiez la gestion de vos projets immobiliers avec notre solution tout-en-un.",
            url: "https://plannikeeper.ch",
            logo: "https://plannikeeper.ch/logo.png",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web Browser",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              reviewCount: "150",
            },
            offers: [
              {
                "@type": "Offer",
                name: "Essentiel",
                price: "29",
                priceCurrency: "EUR",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Professionnel",
                price: "79",
                priceCurrency: "EUR",
                availability: "https://schema.org/InStock",
              },
            ],
          }),
        }}
      />
      <LandingPageClient />
    </>
  );
}
