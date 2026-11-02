import type { Metadata } from "next";
import AboutPageView from "@/components/AboutPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `About Us | ${siteConfig.brand.name} - Luxury Tourism in Qatar`,
  description:
    "Learn about MZ Tourism Qatar, our commitment to royal Arabian hospitality, licensed private fleet standards, and bespoke travel across Doha and the Arabian Gulf.",
};

export default function AboutEnglishPage() {
  return <AboutPageView locale="en" />;
}
