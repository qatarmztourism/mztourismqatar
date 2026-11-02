import { Metadata } from "next";
import AccountOverviewView from "@/components/account/AccountOverviewView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "نظرة عامة على المحفظة | إم زد للسياحة قطر",
  description: "استعراض الحجوزات النشطة، تفاصيل خط سير الرحلات، وحالة الودائع.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPageAr() {
  const dict = getDictionary("ar");
  return <AccountOverviewView locale="ar" dict={dict} />;
}
