"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Locale, getDictionary } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";
import MobileActionBar from "./MobileActionBar";
import BespokeInquiryModal from "./BespokeInquiryModal";
import {
  ChevronDown,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Compass,
} from "lucide-react";
import { getPublicFaqsAction } from "@/lib/server/cms-actions";
import type { Database } from "@/lib/supabase/database.types";

type CmsFaqRow = Database["public"]["Tables"]["cms_faqs"]["Row"];

interface FaqPageViewProps {
  locale: Locale;
  initialFaqs?: CmsFaqRow[];
}

export default function FaqPageView({ locale, initialFaqs }: FaqPageViewProps) {
  const dict = getDictionary(locale);
  const isRtl = locale === "ar";
  const [modalOpen, setModalOpen] = useState(false);
  const [liveFaqs, setLiveFaqs] = useState<CmsFaqRow[]>(initialFaqs || []);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "cat-0-0": true,
    "cat-1-0": true,
  });

  useEffect(() => {
    if (!initialFaqs || initialFaqs.length === 0) {
      getPublicFaqsAction().then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setLiveFaqs(res.data);
        }
      });
    }
  }, [initialFaqs]);

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const whatsAppUrl = getWhatsAppInquiryUrl(
    isRtl
      ? "مرحباً إم زد للسياحة قطر، لدي استفسار خاص لم أجده في دليل الأسئلة الشائعة."
      : "Hello MZ Tourism Qatar, I have a specific travel question not covered in the FAQ."
  );

  const categoriesToRender =
    liveFaqs.length > 0
      ? (() => {
          const catMap = new Map<string, { q: string; a: string }[]>();
          for (const item of liveFaqs) {
            const list = catMap.get(item.category) || [];
            list.push({
              q: isRtl ? item.question_ar : item.question_en,
              a: isRtl ? item.answer_ar : item.answer_en,
            });
            catMap.set(item.category, list);
          }
          return Array.from(catMap.entries()).map(([catKey, items]) => {
            const catName =
              catKey === "bookings"
                ? isRtl ? "الحجوزات والمدفوعات" : "Bookings & Payments"
                : catKey === "safari"
                ? isRtl ? "الرحلات الصحراوية" : "Desert Expeditions"
                : catKey === "charters"
                ? isRtl ? "اليخوت والطيران الخاص" : "Yacht & Aviation Charters"
                : isRtl ? "الدليل الإرشادي العام" : "General Travel Advisory";
            return { name: catName, items };
          });
        })()
      : dict.faqPage.categories;

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
          <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-6 font-medium">
              <Link href={`/${locale}`} className="hover:text-primary transition-colors">
                {dict.nav.home}
              </Link>
              {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="text-primary font-semibold">{dict.nav.advisory}</span>
            </div>

            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">
              {dict.faqPage.subtitle}
            </span>
            <h1 className="font-headline text-3xl sm:text-5xl font-semibold text-on-surface max-w-3xl leading-tight">
              {dict.faqPage.title}
            </h1>
          </div>
        </div>

        {/* Categories Section */}
        <section className="py-16 bg-surface-container-low/40">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Quick Navigation / Help card */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-3xl bg-surface-container border border-primary/25 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2.5 text-primary">
                    <Compass className="w-5 h-5" />
                    <h3 className="font-headline text-base font-semibold text-on-surface">
                      {isRtl ? "أقسام الدليل الإرشادي" : "Guide Categories"}
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-on-surface-variant">
                    {categoriesToRender.map((cat, idx) => (
                      <li key={idx}>
                        <a
                          href={`#cat-${idx}`}
                          className="hover:text-primary transition-colors flex items-center justify-between py-1 border-b border-outline-variant/15"
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-primary font-bold">
                            {cat.items.length}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[44px] px-4 rounded-xl bg-primary text-on-primary text-xs uppercase tracking-wider font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{isRtl ? "سؤال مخصص للكونسيرج" : "Ask Concierge Directly"}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Categorized Accordions */}
              <div className="lg:col-span-8 space-y-10">
                {categoriesToRender.map((cat, catIdx) => (
                  <div key={catIdx} id={`cat-${catIdx}`} className="space-y-3.5 scroll-mt-28">
                    <h3 className="font-headline text-lg sm:text-xl font-semibold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span>{cat.name}</span>
                    </h3>

                    <div className="space-y-2.5">
                      {cat.items.map((item, itemIdx) => {
                        const key = `cat-${catIdx}-${itemIdx}`;
                        const isOpen = !!openItems[key];

                        return (
                          <div
                            key={itemIdx}
                            className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-sm transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => toggleItem(key)}
                              aria-expanded={isOpen}
                              className="w-full px-5 py-4 text-left flex items-center justify-between text-on-surface hover:text-primary transition-colors focus:outline-none"
                              style={{ textAlign: isRtl ? "right" : "left" }}
                            >
                              <span className="font-headline text-xs sm:text-sm font-semibold pr-4">
                                {item.q}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-primary shrink-0 transition-transform duration-300 ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            {isOpen && (
                              <div className="px-5 pb-4 pt-1 text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/15 bg-surface-container/40">
                                <p>{item.a}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
