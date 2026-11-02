import { Metadata } from "next";
import AccountPaymentsView from "@/components/account/AccountPaymentsView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Payments & Receipts | MZ Tourism Qatar",
  description: "Track your deposit payments, balances, and official bank transfer receipts.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPaymentsPageEn() {
  const dict = getDictionary("en");
  return <AccountPaymentsView locale="en" dict={dict} />;
}
