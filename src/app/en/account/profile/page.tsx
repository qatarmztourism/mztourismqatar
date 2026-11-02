import { Metadata } from "next";
import AccountProfileView from "@/components/account/AccountProfileView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Profile & Security | MZ Tourism Qatar",
  description: "Manage your contact details, concierge preferences, and account security.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountProfilePageEn() {
  const dict = getDictionary("en");
  return <AccountProfileView locale="en" dict={dict} />;
}
