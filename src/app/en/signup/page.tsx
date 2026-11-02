import { Metadata } from "next";
import AuthView from "@/components/AuthView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Create Account | MZ Tourism Qatar",
  description: "Register for your VIP concierge account and track your luxury Qatar travel experiences.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPageEn() {
  const dict = getDictionary("en");
  return <AuthView currentLocale="en" dict={dict} initialMode="signup" />;
}
