import { Metadata } from "next";
import CustomerAccountShell from "@/components/account/CustomerAccountShell";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: {
    template: "%s | إم زد للسياحة قطر",
    default: "محفظة كبار الشخصيات | إم زد للسياحة قطر",
  },
  description: "إدارة رحلاتك الفاخرة في قطر، إيصالات الدفع، ومتابعة الحجوزات الخاصة.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayoutAr({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = getDictionary("ar");
  return (
    <CustomerAccountShell locale="ar" dict={dict}>
      {children}
    </CustomerAccountShell>
  );
}
