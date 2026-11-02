import { Metadata } from "next";
import GuestBookingTrackingView from "@/components/GuestBookingTrackingView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "ملف الحجز الخاص | إم زد للسياحة قطر",
  description: "متابعة تفاصيل الرحلة ورفع إيصال إيداع العربون للاعتماد.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function BookingTokenPageAr({ params }: PageProps) {
  const { token } = await params;
  const dict = getDictionary("ar");
  return <GuestBookingTrackingView uploadToken={token} currentLocale="ar" dict={dict} />;
}
