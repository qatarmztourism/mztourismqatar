import type { Metadata } from "next";
import StaticPageView from "@/components/StaticPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `الشروط والأحكام العامة للخدمة | ${siteConfig.brand.nameAr}`,
  description: "الشروط والأحكام المنظمة للحجوزات والرحلات السياحية الخاصة وخدمات الكونسيرج مع إم زد للسياحة قطر.",
};

export default function TermsConditionsArabicPage() {
  return <StaticPageView slug="terms-conditions" locale="ar" />;
}
