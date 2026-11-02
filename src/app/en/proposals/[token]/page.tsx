import { Metadata } from "next";
import CustomerProposalView from "@/components/proposals/CustomerProposalView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Bespoke Journey Proposal | MZ Tourism Qatar",
  description: "View and manage your private bespoke itinerary quotation with MZ Tourism Qatar.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function EnProposalTokenPage({ params }: PageProps) {
  const { token } = await params;
  const dict = getDictionary("en");
  return <CustomerProposalView guestToken={token} currentLocale="en" dict={dict} />;
}
