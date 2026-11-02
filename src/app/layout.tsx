/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import { siteConfig, getBaseUrl } from "@/config/site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: `${siteConfig.brand.name} | ${siteConfig.brand.slogan}`,
  description:
    "Curated desert safaris to Khor Al Adaid, private dhow dinners across West Bay, Hamad Airport VIP chauffeur transfers, luxury resort stays, and cross-border GCC travel.",
  keywords: [
    "MZ Tourism Qatar",
    "Qatar luxury tourism",
    "Doha private desert safari",
    "Khor Al Adaid Inland Sea",
    "Hamad Airport VIP transfers",
    "Luxury dhow cruise Doha",
    "GCC travel Saudi Arabia Bahrain",
    "Arabian horse riding Qatar",
    "Desert camp glamping Qatar",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "MZ Tourism Qatar",
    alternateName: "إم زد للسياحة قطر",
    url: baseUrl,
    telephone: "+974 7038 6705",
    email: "qatarmztourism@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Doha",
      addressCountry: "QA",
    },
    areaServed: ["Qatar", "Doha", "GCC"],
    description:
      "Bespoke private luxury tours, Khor Al Adaid desert safaris, Doha heritage cultural excursions, Hamad Airport VIP chauffeur transfers, and luxury hospitality in Qatar.",
    priceRange: "$$$$",
    currenciesAccepted: "QAR",
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-surface-container-lowest text-on-surface antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
