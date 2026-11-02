import type { Metadata } from "next";
import StaticPageView from "@/components/StaticPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `Privacy & Data Protection Policy | ${siteConfig.brand.name}`,
  description: "Read our privacy and confidential data protection policy for guests and clients of MZ Tourism Qatar.",
};

export default function PrivacyPolicyEnglishPage() {
  return <StaticPageView slug="privacy-policy" locale="en" />;
}
