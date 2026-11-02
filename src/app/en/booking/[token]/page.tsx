import { Metadata } from "next";
import GuestBookingTrackingView from "@/components/GuestBookingTrackingView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "Reservation Dossier | MZ Tourism Qatar",
  description: "View reservation details and upload deposit verification receipts.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function BookingTokenPage({ params }: PageProps) {
  const { token } = await params;
  const dict = getDictionary("en");
  return <GuestBookingTrackingView uploadToken={token} currentLocale="en" dict={dict} />;
}
