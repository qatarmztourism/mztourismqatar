import { Metadata } from "next";
import AccountBookingsView from "@/components/account/AccountBookingsView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "حجوزاتي والرحلات | إم زد للسياحة قطر",
  description: "مراجعة وإدارة كافة حجوزاتك للرحلات الفاخرة في دولة قطر.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountBookingsPageAr() {
  const dict = getDictionary("ar");
  return <AccountBookingsView locale="ar" dict={dict} />;
}
