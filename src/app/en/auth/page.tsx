import { Metadata } from "next";
import AuthView from "@/components/AuthView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Guest Sign In & Register | MZ Tourism Qatar",
  description: "Access your VIP concierge account and track your luxury Qatar reservations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthPageEn() {
  const dict = getDictionary("en");
  return <AuthView currentLocale="en" dict={dict} />;
}
