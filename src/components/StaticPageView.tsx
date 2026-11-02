"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Locale, getDictionary } from "@/translations";
import { getWhatsAppInquiryUrl, siteConfig } from "@/config/site-config";
import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";
import MobileActionBar from "./MobileActionBar";
import BespokeInquiryModal from "./BespokeInquiryModal";
import { ChevronRight, ChevronLeft, ShieldCheck, Compass, MessageCircle, AlertCircle } from "lucide-react";
import { getPublicPageBySlugAction } from "@/lib/server/cms-actions";
import type { Database } from "@/lib/supabase/database.types";

type CmsPageRow = Database["public"]["Tables"]["cms_pages"]["Row"];

interface StaticPageViewProps {
  slug: string;
  locale: Locale;
  initialPage?: CmsPageRow | null;
}

export default function StaticPageView({
  slug,
  locale,
  initialPage,
}: StaticPageViewProps) {
  const dict = getDictionary(locale);
  const isRtl = locale === "ar";
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState<CmsPageRow | null>(initialPage || null);
  const [isLoading, setIsLoading] = useState(!initialPage);

  useEffect(() => {
    if (!initialPage) {
      getPublicPageBySlugAction(slug).then((res) => {
        if (res.success && res.data) {
          setPage(res.data);
        }
        setIsLoading(false);
      });
    }
  }, [slug, initialPage]);

  const title = page
    ? isRtl
      ? page.title_ar
      : page.title_en
    : isRtl
    ? "الصفحة المطلوبة"
    : "Requested Page";

  const excerpt = page
    ? isRtl
      ? page.excerpt_ar || ""
      : page.excerpt_en || ""
    : "";

  const contentHtml = page
    ? isRtl
      ? page.content_ar
      : page.content_en
    : "";

  const whatsAppUrl = getWhatsAppInquiryUrl(
    isRtl
      ? `مرحباً إم زد للسياحة قطر، لدي استفسار بخصوص صفحة (${title}).`
      : `Hello MZ Tourism Qatar, I have an inquiry regarding (${title}).`
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
              <span className="text-primary font-semibold">{title}</span>
            </div>

            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">
              {siteConfig.brand.name} — State of Qatar
            </span>
            <h1 className="font-headline text-3xl sm:text-5xl font-semibold text-on-surface max-w-3xl leading-tight">
              {title}
            </h1>
            {excerpt && (
              <p className="text-on-surface-variant text-sm sm:text-base max-w-2xl mt-4 leading-relaxed">
                {excerpt}
              </p>
            )}
          </div>
        </div>

        {/* Content Section */}
        <section className="py-16 sm:py-20 bg-surface-container-low/30">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Main Content Body */}
              <div className="lg:col-span-8">
                {isLoading ? (
                  <div className="p-12 text-center text-on-surface-variant text-sm animate-pulse">
                    {isRtl ? "جاري تحميل محتوى الصفحة..." : "Loading page content..."}
                  </div>
                ) : !page ? (
                  <div className="p-12 rounded-3xl bg-surface-container border border-outline-variant/30 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <h3 className="text-lg font-bold text-on-surface">
                      {isRtl ? "الصفحة غير متوفرة حالياً" : "Page Currently Unavailable"}
                    </h3>
                    <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                      {isRtl
                        ? "هذه الصفحة قيد الإعداد أو غير منشورة للعامة حالياً. يمكنك التواصل مع فريق الكونسيرج للاستفسار."
                        : "This page is currently being updated or has not been published. Please contact our concierge desk for assistance."}
                    </p>
                    <div className="pt-2">
                      <Link
                        href={`/${locale}`}
                        className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold"
                      >
                        {dict.nav.home}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <article
                    className="p-8 sm:p-12 rounded-3xl bg-surface-container border border-primary/20 shadow-xl space-y-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:font-headline [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-primary [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-on-surface-variant [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:mb-4 [&_ul]:space-y-2 [&_li]:text-on-surface-variant [&_li]:text-sm [&_strong]:text-on-surface [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                )}
              </div>

              {/* Sidebar Assistance Card */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-3xl bg-surface-container border border-primary/25 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2.5 text-primary">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-headline text-base font-semibold text-on-surface">
                      {isRtl ? "خدمات الكونسيرج والاستفسارات" : "VIP Concierge Desk"}
                    </h3>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {isRtl
                      ? "فريقنا المعتمد في الدوحة جاهز للإجابة على استفساراتكم وتنسيق مسارات الرحلات الخاصة على مدار الساعة."
                      : "Our Doha operations team is available 24/7 to answer questions and coordinate private Arabian itineraries."}
                  </p>

                  <div className="space-y-2 text-xs pt-2 border-t border-outline-variant/20">
                    <div className="flex justify-between py-1">
                      <span className="text-on-surface-variant">{isRtl ? "الهاتف المباشر:" : "Direct Phone:"}</span>
                      <span className="font-semibold text-on-surface">{siteConfig.contact.phone}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-on-surface-variant">{isRtl ? "البريد الإلكتروني:" : "Email:"}</span>
                      <span className="font-semibold text-primary">{siteConfig.contact.email}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-on-surface-variant">{isRtl ? "الترخيص:" : "Operator:"}</span>
                      <span className="font-semibold text-on-surface">Qatar Licensed</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[44px] px-4 rounded-xl bg-primary text-on-primary text-xs uppercase tracking-wider font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{isRtl ? "استفسار عبر واتساب" : "WhatsApp Concierge"}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs font-semibold hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Compass className="w-4 h-4 text-primary" />
                      <span>{dict.nav.bookNow}</span>
                    </button>
                  </div>
                </div>
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

      <FloatingWhatsAppButton currentLocale={locale} />

      <MobileActionBar
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
    </div>
  );
}
