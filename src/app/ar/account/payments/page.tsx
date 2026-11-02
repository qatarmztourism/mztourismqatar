import { Metadata } from "next";
import AccountPaymentsView from "@/components/account/AccountPaymentsView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "المدفوعات والإيصالات | إم زد للسياحة قطر",
  description: "متابعة دفعات العربون المحولة، الأرصدة المتبقية، وسجل إيصالات التحويل البنكي.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPaymentsPageAr() {
  const dict = getDictionary("ar");
  return <AccountPaymentsView locale="ar" dict={dict} />;
}
