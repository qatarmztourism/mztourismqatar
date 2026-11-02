"use client";

import { Locale } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppButtonProps {
  currentLocale: Locale;
}

export default function FloatingWhatsAppButton({
  currentLocale,
}: FloatingWhatsAppButtonProps) {
  const isRtl = currentLocale === "ar";
  const message =
    currentLocale === "ar"
      ? "مرحباً إم زد للسياحة قطر، أود التحدث مع كونسيرج كبار الشخصيات VIP بخصوص حجز رحلة خاصة."
      : "Hello MZ Tourism Qatar, I would like to speak with the VIP concierge regarding private bookings.";

  const whatsAppUrl = getWhatsAppInquiryUrl(message);

  return (
    <div
      className={`fixed bottom-6 z-40 hidden md:block ${
        isRtl ? "left-6" : "right-6"
      }`}
    >
      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with MZ Tourism Qatar VIP Concierge"
        className="relative w-14 h-14 rounded-full bg-surface-container-highest border border-primary text-primary flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.85)] hover:scale-105 transition-transform group"
      >
        <MessageCircle className="w-7 h-7 text-primary group-hover:text-primary-fixed transition-colors" />

        {/* Live Concierge Ping Ring */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-on-primary text-[9px] font-bold items-center justify-center">
            VIP
          </span>
        </span>
      </a>
    </div>
  );
}
