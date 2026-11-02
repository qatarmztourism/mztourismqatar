import type { Metadata } from "next";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `${siteConfig.brand.nameAr} | جولات فاخرة وخدمات الضيافة القطرية الراقية`,
  description:
    "رحلات سفاري صحراوية خاصة لخور العديد، جولات تراثية بالدوحة، استقبال كبار الشخصيات بمطار حمد الدولي، إقامات المنتجعات الفاخرة، وسفريات برية خاصة لدول الخليج.",
  alternates: {
    canonical: "/ar",
    languages: {
      en: "/en",
      ar: "/ar",
      "x-default": "/en",
    },
  },
  openGraph: {
    title: `${siteConfig.brand.nameAr} | جولات فاخرة وكونسيرج خاص في قطر`,
    description:
      "رحلات سفاري صحراوية خاصة لخور العديد، جولات تراثية بالدوحة، استقبال كبار الشخصيات بمطار حمد الدولي، إقامات المنتجعات الفاخرة، وسفريات برية خاصة لدول الخليج.",
    url: "/ar",
    siteName: siteConfig.brand.nameAr,
    locale: "ar_QA",
    type: "website",
  },
};

export default function ArabicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="ar" dir="rtl" className="font-arabic">
      {children}
    </div>
  );
}
