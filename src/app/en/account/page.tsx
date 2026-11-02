import { Metadata } from "next";
import AccountOverviewView from "@/components/account/AccountOverviewView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Portfolio Overview | MZ Tourism Qatar",
  description: "View your active reservations, itinerary details, and deposit status.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPageEn() {
  const dict = getDictionary("en");
  return <AccountOverviewView locale="en" dict={dict} />;
}
