"use client";

import { Locale, TranslationDict } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import { MessageCircle, Sparkles } from "lucide-react";

interface MobileActionBarProps {
  dict: TranslationDict;
  currentLocale: Locale;
  onOpenInquiryModal: () => void;
}

export default function MobileActionBar({
  dict,
  currentLocale,
  onOpenInquiryModal,
}: MobileActionBarProps) {
  const defaultMessage =
    currentLocale === "ar"
      ? "مرحباً إم زد للسياحة قطر، أود الاستفسار عن حجز تجربة سياحية خاصة."
      : "Hello MZ Tourism Qatar, I would like to inquire about a private luxury tourism experience.";

  const whatsAppUrl = getWhatsAppInquiryUrl(defaultMessage);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-primary/20 px-4 py-3 flex items-center gap-3 shadow-[0_-8px_20px_rgba(0,0,0,0.7)]">
      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-surface-container-high border border-primary/30 text-on-surface hover:text-primary text-xs font-semibold transition-colors"
      >
        <MessageCircle className="w-4 h-4 text-primary" />
        <span>{dict.nav.whatsAppVip}</span>
      </a>

      <button
        type="button"
        onClick={onOpenInquiryModal}
        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(236,193,90,0.3)] hover:bg-primary-container transition-all"
      >
        <Sparkles className="w-4 h-4" />
        <span>{dict.nav.bookNow}</span>
      </button>
    </div>
  );
}
