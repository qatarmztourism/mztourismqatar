import type { Metadata } from "next";
import StaticPageView from "@/components/StaticPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `Terms & Conditions of Service | ${siteConfig.brand.name}`,
  description: "Terms and conditions governing luxury travel reservations, bespoke itineraries, and concierge services with MZ Tourism Qatar.",
};

export default function TermsConditionsEnglishPage() {
  return <StaticPageView slug="terms-conditions" locale="en" />;
}
