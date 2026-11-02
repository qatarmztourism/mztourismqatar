import type { Metadata } from "next";
import ServicesCatalogView from "@/components/ServicesCatalogView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `Luxury Tours & Services Catalog | ${siteConfig.brand.name}`,
  description:
    "Explore MZ Tourism Qatar's complete catalog of bespoke tours: Khor Al Adaid Desert Safaris, Doha Cultural Tours, VIP Hamad Airport Transfers, Island Resorts, Equestrian Experiences, and GCC Travel.",
  alternates: {
    canonical: "/en/services",
    languages: {
      en: "/en/services",
      ar: "/ar/services",
    },
  },
  openGraph: {
    title: `Luxury Tours & Services Catalog | ${siteConfig.brand.name}`,
    description:
      "Explore MZ Tourism Qatar's complete catalog of bespoke tours with certified private guides and executive fleet.",
    url: "/en/services",
    type: "website",
  },
};

interface PageProps {
  searchParams?: Promise<{ category?: string; q?: string }>;
}

export default async function EnglishServicesCatalogPage({ searchParams }: PageProps) {
  const resolved = searchParams ? await searchParams : {};
  return <ServicesCatalogView locale="en" initialCategory={resolved.category || "all"} />;
}
