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
    title: `Reservation ${reference} | MZ Tourism Qatar`,
    description: `Trip details, passenger manifest, and deposit management for booking ${reference}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function BookingDetailPageEn({ params }: PageProps) {
  const { reference } = await params;
  const dict = getDictionary("en");
  return (
    <AccountBookingDetailView
      bookingRef={reference}
      locale="en"
      dict={dict}
    />
  );
}
