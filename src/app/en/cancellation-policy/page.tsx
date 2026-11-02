import type { Metadata } from "next";
import StaticPageView from "@/components/StaticPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `Cancellation & Refund Policy | ${siteConfig.brand.name}`,
  description: "Transparent cancellation guidelines, deposit refunds, and rescheduling policies for MZ Tourism Qatar itineraries.",
};

export default function CancellationPolicyEnglishPage() {
  return <StaticPageView slug="cancellation-policy" locale="en" />;
}
