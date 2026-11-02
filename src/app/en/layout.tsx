import type { Metadata } from "next";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `${siteConfig.brand.name} | Luxury Qatar Tours & Bespoke Concierge`,
  description:
    "Private desert safaris to Khor Al Adaid Inland Sea, Doha cultural tours, VIP Hamad airport transfers, luxury resort stays, and bespoke GCC journeys.",
  alternates: {
    canonical: "/en",
    languages: {
      en: "/en",
      ar: "/ar",
      "x-default": "/en",
    },
  },
  openGraph: {
    title: `${siteConfig.brand.name} | Luxury Qatar Tours`,
    description:
      "Private desert safaris to Khor Al Adaid Inland Sea, Doha cultural tours, VIP Hamad airport transfers, luxury resort stays, and bespoke GCC journeys.",
    url: "/en",
    siteName: siteConfig.brand.name,
    locale: "en_US",
    type: "website",
  },
};

export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div lang="en" dir="ltr">{children}</div>;
}
