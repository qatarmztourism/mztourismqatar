import { Metadata } from "next";
import CustomerAccountShell from "@/components/account/CustomerAccountShell";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: {
    template: "%s | MZ Tourism Qatar",
    default: "VIP Client Portfolio | MZ Tourism Qatar",
  },
  description: "Manage your private Qatar expeditions, deposit receipts, and bespoke itineraries.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayoutEn({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = getDictionary("en");
  return (
    <CustomerAccountShell locale="en" dict={dict}>
      {children}
    </CustomerAccountShell>
  );
}
