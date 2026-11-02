import type { Metadata } from "next";
import FaqPageView from "@/components/FaqPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `Travel Advisory & FAQs | ${siteConfig.brand.name} - Essential Qatar Insights`,
  description:
    "Comprehensive guidance on desert safari dress codes, airport transit layovers, cultural norms, and cross-border GCC travel from Qatar.",
};

export default function FaqEnglishPage() {
  return <FaqPageView locale="en" />;
}
