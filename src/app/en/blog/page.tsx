import type { Metadata } from "next";
import BlogListingView from "@/components/BlogListingView";
import { getDictionary } from "@/translations";
import { getPublicArticlesAction } from "@/lib/server/blog-actions";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `Luxury Qatar Travel Guides & Editorial | ${siteConfig.brand.name}`,
  description:
    "Curated travel guides and insider perspectives on Khor Al Adaid desert safaris, Doha heritage cultural landmarks, and luxury hospitality in Qatar.",
  alternates: {
    canonical: "https://mztourismqatar.qa/en/blog",
    languages: {
      en: "https://mztourismqatar.qa/en/blog",
      ar: "https://mztourismqatar.qa/ar/blog",
      "x-default": "https://mztourismqatar.qa/en/blog",
    },
  },
  openGraph: {
    title: `Luxury Qatar Travel Guides | ${siteConfig.brand.name}`,
    description:
      "Curated travel guides and insider perspectives on Khor Al Adaid desert safaris, Doha heritage cultural landmarks, and luxury hospitality in Qatar.",
    url: "https://mztourismqatar.qa/en/blog",
    siteName: siteConfig.brand.name,
    locale: "en_US",
    type: "website",
  },
};

export default async function BlogListingPageEn() {
  const dict = getDictionary("en");
  const res = await getPublicArticlesAction("en");
  const articles = res.success && res.data ? res.data : [];

  return <BlogListingView initialArticles={articles} locale="en" dict={dict} />;
}
