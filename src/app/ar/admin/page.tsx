import { Metadata } from "next";
import AdminPortalView from "@/components/AdminPortalView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "لوحة إدارة العمليات السياحية | إم زد للسياحة قطر",
  description: "لوحة التحكم وإدارة حجوزات الرحلات الخاصة، مراجعة إيصالات العربون، والطلبات المخصصة.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPageAr() {
  const dict = getDictionary("ar");
  return <AdminPortalView currentLocale="ar" dict={dict} />;
}
