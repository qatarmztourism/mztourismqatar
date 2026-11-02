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

export default function AdminPage() {
  const dict = getDictionary("en");
  return (
    <div lang="en" dir="ltr">
      <AdminPortalView currentLocale="en" dict={dict} />
    </div>
  );
}
