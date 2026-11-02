import type { Metadata } from "next";
import ContactPageView from "@/components/ContactPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `اتصل بنا | مكتب كونسيرج ${siteConfig.brand.nameAr} - الدوحة، قطر`,
  description:
    "تواصل مع مكتب الاستقبال والكونسيرج الخاص في الدوحة للاستفسارات الفورية عبر الواتساب وتنسيق الرحلات الخاصة والأسطول الفاره.",
};

export default function ContactArabicPage() {
  return <ContactPageView locale="ar" />;
}
