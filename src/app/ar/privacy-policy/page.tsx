import type { Metadata } from "next";
import StaticPageView from "@/components/StaticPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `سياسة الخصوصية وحماية البيانات | ${siteConfig.brand.nameAr}`,
  description: "اطلع على سياسة الخصوصية وحماية بيانات الضيوف والعملاء لدى إم زد للسياحة قطر وفق أعلى معايير السرية.",
};

export default function PrivacyPolicyArabicPage() {
  return <StaticPageView slug="privacy-policy" locale="ar" />;
}
