import type { Metadata } from "next";
import FaqPageView from "@/components/FaqPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `الأسئلة الشائعة ودليل السفر | ${siteConfig.brand.nameAr} - إرشادات زوار قطر`,
  description:
    "إجابات وافية حول رحلات السفاري، اللباس الموصى به، جولات الترانزيت بمطار حمد، والسفر البري للسعودية والبحرين.",
};

export default function FaqArabicPage() {
  return <FaqPageView locale="ar" />;
}
