"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Locale, getDictionary } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";
import MobileActionBar from "./MobileActionBar";
import BespokeInquiryModal from "./BespokeInquiryModal";
import { Shield, MessageCircle, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";

interface AboutPageViewProps {
  locale: Locale;
}

export default function AboutPageView({ locale }: AboutPageViewProps) {
  const dict = getDictionary(locale);
  const isRtl = locale === "ar";
  const [modalOpen, setModalOpen] = useState(false);

  const whatsAppUrl = getWhatsAppInquiryUrl(
    isRtl
      ? "مرحباً إم زد للسياحة قطر، أود معرفة المزيد عن خدماتكم وتنسيق رحلة خاصة."
      : "Hello MZ Tourism Qatar, I would like to learn more about your private concierge services."
  );

  return (
    <div
      dir={dict.dir}
      lang={locale}
      className={`min-h-screen bg-surface-container-lowest text-on-surface selection:bg-primary selection:text-on-primary ${
        isRtl ? "font-arabic" : "font-body"
      }`}
    >
      <Header
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => setModalOpen(true)}
      />

      <main className="w-full pt-28 pb-20">
        {/* Page Hero */}
        <div className="relative py-16 sm:py-24 bg-surface border-b border-primary/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-container-high/40 via-surface to-surface-container-lowest" />
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-6 font-medium">
              <Link href={`/${locale}`} className="hover:text-primary transition-colors">
                {dict.nav.home}
              </Link>
              {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="text-primary font-semibold">{dict.nav.about}</span>
            </div>

            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">
              {dict.aboutPage.subtitle}
            </span>
            <h1 className="font-headline text-3xl sm:text-5xl font-semibold text-on-surface max-w-3xl leading-tight">
              {dict.aboutPage.title}
            </h1>
          </div>
        </div>

        {/* Philosophy Section */}
        <section className="py-16 bg-surface-container-low/60 border-b border-outline-variant/15">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs uppercase tracking-widest text-primary font-semibold block">
                  {dict.brand.tagline}
                </span>
                <h2 className="font-headline text-2xl sm:text-4xl text-on-surface font-semibold">
                  {dict.aboutPage.philosophyTitle}
                </h2>
                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                  {dict.aboutPage.philosophyText}
                </p>

                <div className="p-4 rounded-2xl bg-surface-container border border-primary/20 flex items-start gap-3 text-xs text-on-surface-variant">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-on-surface block mb-1">
                      {dict.brand.licensedBadge}
                    </span>
                    <span>
                      {isRtl
                        ? "جميع رحلاتنا ومساراتنا مرخصة ومتوافقة مع أعلى معايير السلامة والضيافة في دولة قطر."
                        : "All departures comply with the rigorous safety, training, and guest comfort standards established in the State of Qatar."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] border border-primary/25 shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80"
                    alt="MZ Tourism Qatar Luxury Hospitality"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute bottom-5 left-5 right-5 text-on-surface">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                      {isRtl ? "الضيافة القطرية الأصيلة" : "Authentic Arabian Hospitality"}
                    </span>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Doha • Khor Al Adaid • Al Zubarah • GCC
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Distinction Standards */}
        <section className="py-16 bg-surface">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-2">
                {isRtl ? "الجودة والتفرد" : "Pillars of Distinction"}
              </span>
              <h2 className="font-headline text-2xl sm:text-4xl text-on-surface font-semibold">
                {dict.aboutPage.standardsTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dict.aboutPage.standards.map((std, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-surface-container border border-primary/20 shadow-xl hover:border-primary/45 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-primary/30 text-primary flex items-center justify-center font-bold text-sm mb-4">
                    0{idx + 1}
                  </div>
                  <h3 className="font-headline text-base sm:text-lg font-semibold text-on-surface mb-2">
                    {std.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {std.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Client Placeholder Notice */}
            <div className="mt-12 p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/30 text-center max-w-2xl mx-auto flex items-center justify-center gap-2 text-xs text-primary/80">
              <AlertCircle className="w-4 h-4 text-primary shrink-0" />
              <span>{dict.aboutPage.placeholderNotice}</span>
            </div>
          </div>
        </section>

        {/* Action Banner */}
        <section className="py-12 bg-surface-container-lowest">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
            <div className="p-8 sm:p-12 rounded-3xl bg-surface-container border border-primary/30 max-w-3xl mx-auto space-y-4">
              <h3 className="font-headline text-xl sm:text-3xl text-on-surface font-semibold">
                {isRtl ? "هل ترغب في تخطيط رحلتك القادمة؟" : "Plan Your Next Qatar Journey"}
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto">
                {isRtl
                  ? "تواصل مباشرة مع فريق الكونسيرج لمناقشة الترتيبات وحجز المركبات الخاصة."
                  : "Connect directly with our private travel liaison to discuss bespoke arrangements and private fleet reservations."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto min-h-[46px] px-6 rounded-xl bg-primary text-on-primary text-xs uppercase tracking-wider font-semibold hover:bg-primary-container flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{dict.nav.whatsAppVip}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full sm:w-auto min-h-[46px] px-6 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs uppercase tracking-wider font-semibold border border-outline-variant/30 transition-colors"
                >
                  {dict.nav.bookNow}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => setModalOpen(true)}
      />

      <BespokeInquiryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dict={dict}
        currentLocale={locale}
      />

      <FloatingWhatsAppButton currentLocale={locale} />
      <MobileActionBar
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => setModalOpen(true)}
      />
    </div>
  );
}
