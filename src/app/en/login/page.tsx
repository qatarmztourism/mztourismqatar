import { Metadata } from "next";
import AuthView from "@/components/AuthView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Guest Sign In | MZ Tourism Qatar",
  description: "Sign in to access your luxury Qatar reservations and account portfolio.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPageEn() {
  const dict = getDictionary("en");
  return <AuthView currentLocale="en" dict={dict} initialMode="signin" />;
}
