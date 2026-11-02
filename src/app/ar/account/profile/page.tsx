import { Metadata } from "next";
import AccountProfileView from "@/components/account/AccountProfileView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "الملف الشخصي والأمان | إم زد للسياحة قطر",
  description: "إدارة بياناتك الشخصية، تفضيلات التواصل، وإعدادات أمان حسابك.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountProfilePageAr() {
  const dict = getDictionary("ar");
  return <AccountProfileView locale="ar" dict={dict} />;
}
