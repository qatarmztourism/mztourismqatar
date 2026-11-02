import type { Metadata } from "next";
import StaticPageView from "@/components/StaticPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `سياسة الإلغاء والاسترداد | ${siteConfig.brand.nameAr}`,
  description: "ضوابط الإلغاء وتعديل المواعيد واسترداد الدفعات المقدمة للحجوزات لدى إم زد للسياحة قطر.",
};

export default function CancellationPolicyArabicPage() {
  return <StaticPageView slug="cancellation-policy" locale="ar" />;
}
