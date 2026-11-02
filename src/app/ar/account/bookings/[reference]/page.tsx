import { Metadata } from "next";
import AccountBookingDetailView from "@/components/account/AccountBookingDetailView";
import { getDictionary } from "@/translations";

interface PageProps {
  params: Promise<{
    reference: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { reference } = await params;
  return {
    title: `حجز ${reference} | إم زد للسياحة قطر`,
    description: `تفاصيل الرحلة، قائمة المسافرين، وإدارة إيصالات الدفع للحجز ${reference}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function BookingDetailPageAr({ params }: PageProps) {
  const { reference } = await params;
  const dict = getDictionary("ar");
  return (
    <AccountBookingDetailView
      bookingRef={reference}
      locale="ar"
      dict={dict}
    />
  );
}
