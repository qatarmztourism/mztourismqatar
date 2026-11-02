"use client";

import { TranslationDict, Locale } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import { MessageCircle, Sparkles } from "lucide-react";

interface ConciergeBannerProps {
  dict: TranslationDict;
  currentLocale: Locale;
  onOpenInquiryModal: () => void;
}

export default function ConciergeBanner({
  dict,
  currentLocale,
  onOpenInquiryModal,
}: ConciergeBannerProps) {
  const conciergeMessage =
    currentLocale === "ar"
      ? "مرحباً إم زد للسياحة قطر، أود التواصل مع مكتب الكونسيرج لتصميم جدول رحلة مخصص."
      : "Hello MZ Tourism Qatar, I would like to consult the private concierge to design a custom itinerary.";

  const whatsAppUrl = getWhatsAppInquiryUrl(conciergeMessage);

  return (
    <section id="contact" className="w-full py-16 bg-surface relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="relative rounded-3xl bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high border border-primary/25 p-8 sm:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs text-primary uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span>{dict.conciergeBanner.kicker}</span>
            </span>

            <h2 className="font-headline text-2xl sm:text-4xl text-on-surface font-semibold">
              {dict.conciergeBanner.title}
            </h2>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              {dict.conciergeBanner.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={onOpenInquiryModal}
              className="min-h-[50px] px-8 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm uppercase tracking-wider font-semibold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{dict.conciergeBanner.btnOpenModal}</span>
            </button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[50px] px-6 rounded-xl bg-surface-container-highest text-on-surface hover:text-primary text-xs sm:text-sm uppercase tracking-wider font-semibold border border-primary/20 flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-primary" />
              <span>{dict.conciergeBanner.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
