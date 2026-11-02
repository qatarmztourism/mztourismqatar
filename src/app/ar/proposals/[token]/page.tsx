import { Metadata } from "next";
import CustomerProposalView from "@/components/proposals/CustomerProposalView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "عرض الرحلة الخاصة | إم زد للسياحة قطر",
  description: "معاينة واعتماد جدول الرحلة الخاصة والأسعار المعتمدة لدى إم زد للسياحة قطر.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ArProposalTokenPage({ params }: PageProps) {
  const { token } = await params;
  const dict = getDictionary("ar");
  return <CustomerProposalView guestToken={token} currentLocale="ar" dict={dict} />;
}
