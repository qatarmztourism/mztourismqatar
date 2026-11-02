"use client";

import { useState } from "react";
import { TranslationDict, Locale } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import { ChevronDown, MessageSquare, ArrowRight, ArrowLeft } from "lucide-react";

interface AdvisorySectionProps {
  dict: TranslationDict;
  currentLocale: Locale;
}

export default function AdvisorySection({ dict, currentLocale }: AdvisorySectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const isRtl = currentLocale === "ar";

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const chiefConciergeMessage =
    currentLocale === "ar"
      ? "مرحباً إم زد للسياحة قطر، أود الاستفسار والتنسيق مع مسؤول الكونسيرج بخصوص ترتيبات خاصة لزيارة قطر."
      : "Hello MZ Tourism Qatar, I would like assistance with bespoke travel arrangements and Qatar guest advisory.";

  const whatsAppUrl = getWhatsAppInquiryUrl(chiefConciergeMessage);

  return (
    <section id="advisory" className="w-full py-12 lg:py-16 bg-surface relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Explainer Column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-2">
                {dict.advisory.kicker}
              </span>
              <h2 className="font-headline text-2xl sm:text-4xl text-on-surface font-semibold">
                {dict.advisory.title}
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed mt-3">
                {dict.advisory.subtitle}
              </p>
            </div>

            {/* Concierge Help Card */}
            <div className="p-6 rounded-2xl bg-surface-container border border-primary/20 shadow-xl space-y-3">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-headline text-base sm:text-lg text-on-surface font-semibold">
                  {isRtl ? "هل تحتاج لترتيبات خاصة؟" : "Need Tailored Assistance?"}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {isRtl
                  ? "تسافر مع أطفال، كبار السن، أو ضمن وفد دبلوماسي رفيع؟ مستشارونا متمرسون في تقديم خدمات كبار الشخصيات المخصصة بالكامل."
                  : "Traveling with infants, senior guests, or diplomatic entourages? Our private travel liaisons prepare tailored adaptations with complete discretion."}
              </p>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 pt-2 text-primary text-xs sm:text-sm font-semibold hover:text-primary-fixed transition-colors"
              >
                <span>{isRtl ? "تواصل مع رئيس الكونسيرج" : "Connect with Lead Concierge"}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </a>
            </div>
          </div>

          {/* Right Accordion Column */}
          <div className="lg:col-span-7 space-y-3.5">
            {dict.advisory.faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-md transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between text-on-surface hover:text-primary transition-colors focus:outline-none"
                    style={{ textAlign: isRtl ? "right" : "left" }}
                  >
                    <span className="font-headline text-sm sm:text-base font-semibold pr-3">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-primary shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/15 bg-surface-container/40">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
