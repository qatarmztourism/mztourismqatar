import type { Metadata } from "next";
import BlogListingView from "@/components/BlogListingView";
import { getDictionary } from "@/translations";
import { getPublicArticlesAction } from "@/lib/server/blog-actions";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `دليل قطر السياحي ومقالات السفر الفاخرة | ${siteConfig.brand.nameAr}`,
  description:
    "أدلة سياحية موثقة لاستكشاف رمال خور العديد، معالم الدوحة التراثية، وإرشادات السفر الفاخر وضيافة كبار الشخصيات في قطر.",
  alternates: {
    canonical: "https://mztourismqatar.qa/ar/blog",
    languages: {
      en: "https://mztourismqatar.qa/en/blog",
      ar: "https://mztourismqatar.qa/ar/blog",
      "x-default": "https://mztourismqatar.qa/en/blog",
    },
  },
  openGraph: {
    title: `دليل قطر السياحي ومقالات السفر الفاخرة | ${siteConfig.brand.nameAr}`,
    description:
      "أدلة سياحية موثقة لاستكشاف رمال خور العديد، معالم الدوحة التراثية، وإرشادات السفر الفاخر وضيافة كبار الشخصيات في قطر.",
    url: "https://mztourismqatar.qa/ar/blog",
    siteName: siteConfig.brand.nameAr,
    locale: "ar_QA",
    type: "website",
  },
};

export default async function BlogListingPageAr() {
  const dict = getDictionary("ar");
  const res = await getPublicArticlesAction("ar");
  const articles = res.success && res.data ? res.data : [];

  return <BlogListingView initialArticles={articles} locale="ar" dict={dict} />;
}
