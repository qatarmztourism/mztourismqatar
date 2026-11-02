import type { Metadata } from "next";
import ContactPageView from "@/components/ContactPageView";
import { siteConfig } from "@/config/site-config";

export const metadata: Metadata = {
  title: `Contact Concierge | ${siteConfig.brand.name} - 24/7 VIP Assistance in Doha`,
  description:
    "Connect with our chief concierge in Doha for instant WhatsApp booking inquiries, private fleet dispatches, and custom Qatar travel arrangements.",
};

export default function ContactEnglishPage() {
  return <ContactPageView locale="en" />;
}
