import { Metadata } from "next";
import AdminPortalView from "@/components/AdminPortalView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Concierge Operations Portal | MZ Tourism Qatar",
  description: "Secure management dashboard for bookings, deposit verification, and bespoke briefs.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPageEn() {
  const dict = getDictionary("en");
  return <AdminPortalView currentLocale="en" dict={dict} />;
}
