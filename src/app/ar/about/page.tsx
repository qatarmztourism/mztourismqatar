import type { Metadata } from "next";
import AboutPageView from "@/components/AboutPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `من نحن | ${siteConfig.brand.nameAr} - السياحة الفاخرة في دولة قطر`,
  description:
    "تعرف على إم زد للسياحة قطر، معايير أسطولنا الخاص، مرشدونا المرخصون رسمياً، وفلسفتنا الراسخة في أصالة الضيافة القطرية.",
};

export default function AboutArabicPage() {
  return <AboutPageView locale="ar" />;
}
