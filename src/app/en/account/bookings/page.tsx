import { Metadata } from "next";
import AccountBookingsView from "@/components/account/AccountBookingsView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "My Reservations | MZ Tourism Qatar",
  description: "Review and manage all your luxury Qatar expeditions and bookings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountBookingsPageEn() {
  const dict = getDictionary("en");
  return <AccountBookingsView locale="en" dict={dict} />;
}
