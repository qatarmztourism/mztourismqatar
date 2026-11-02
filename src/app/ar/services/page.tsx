import type { Metadata } from "next";
import ServicesCatalogView from "@/components/ServicesCatalogView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `دليل الجولات والتجارب السياحية الفاخرة | ${siteConfig.brand.nameAr}`,
  description:
    "استكشف دليل الخدمات والجولات السياحية الفاخرة في دولة قطر مع إم زد للسياحة: سفاري خور العديد، جولات الدوحة الثقافية، مواصلات المطار الفارهة، منتجعات الجزر، وركوب الخيل العربي الأصيل.",
  alternates: {
    canonical: "/ar/services",
    languages: {
      en: "/en/services",
      ar: "/ar/services",
    },
  },
  openGraph: {
    title: `دليل الجولات والتجارب السياحية الفاخرة | ${siteConfig.brand.nameAr}`,
    description:
      "استكشف باقة الرحلات والتجارب السياحية الفاخرة مع إم زد للسياحة قطر مع مرشدين معتمدين وسيارات خاصة فارهة.",
    url: "/ar/services",
    type: "website",
  },
};

interface PageProps {
  searchParams?: Promise<{ category?: string; q?: string }>;
}

export default async function ArabicServicesCatalogPage({ searchParams }: PageProps) {
  const resolved = searchParams ? await searchParams : {};
  return <ServicesCatalogView locale="ar" initialCategory={resolved.category || "all"} />;
}
