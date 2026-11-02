import { Metadata } from "next";
import GuestBookingTrackingView from "@/components/GuestBookingTrackingView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "تتبع الحجز الخاص | إم زد للسياحة قطر",
  description: "متابعة حالة حجز الرحلات الخاصة في قطر ورفع إيصالات التحويل البنكي للعربون.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingLookupPageAr() {
  const dict = getDictionary("ar");
  return <GuestBookingTrackingView currentLocale="ar" dict={dict} />;
}
