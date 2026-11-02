import { Metadata } from "next";
import GuestBookingTrackingView from "@/components/GuestBookingTrackingView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Track Reservation | MZ Tourism Qatar",
  description:
    "Check your bespoke Qatar itinerary reservation status and upload deposit verification receipts.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingLookupPage() {
  const dict = getDictionary("en");
  return <GuestBookingTrackingView currentLocale="en" dict={dict} />;
}
