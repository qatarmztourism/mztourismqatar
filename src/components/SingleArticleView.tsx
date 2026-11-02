"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Locale, TranslationDict } from "@/translations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BespokeInquiryModal from "@/components/BespokeInquiryModal";
import type { ArticleItem } from "@/lib/data/curated-articles";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  Compass,
  Clock,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  Share2,
  Check,
} from "lucide-react";

interface SingleArticleViewProps {
  article: ArticleItem;
  relatedArticles: ArticleItem[];
  locale: Locale;
  dict: TranslationDict;
}

export default function SingleArticleView({
  article,
  relatedArticles,
  locale,
  dict,
}: SingleArticleViewProps) {
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const whatsAppUrl = getWhatsAppInquiryUrl(
    `Hello MZ Tourism Qatar, I was inspired by your guide: "${article.title}". I would like to arrange a private itinerary.`
  );

  const handleShare = async () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Split content by paragraphs safely (zero raw/unsafe HTML rendering)
  const paragraphs = article.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col">
      <Header
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => setInquiryModalOpen(true)}
      />

      <main className="flex-1 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto space-y-10">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <Link
              href={`/${locale}/blog`}
              className="hover:text-primary transition-colors flex items-center gap-1.5 font-semibold"
            >
              <Arrow className="w-3.5 h-3.5 rotate-180" />
              <span>{isRtl ? "العودة إلى الأدلة السياحية" : "Back to Travel Guides"}</span>
            </Link>

            <span className="text-[11px] uppercase tracking-wider text-primary font-mono">
              {article.category.replace(/_/g, " ")}
            </span>
          </div>

          {/* Article Header */}
          <header className="space-y-6">
            <div className="space-y-3">
              <span className="px-3.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-mono font-semibold border border-primary/30 inline-block uppercase tracking-wider">
                {article.category.replace(/_/g, " ")}
              </span>

              <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl text-on-surface font-semibold leading-tight">
                {article.title}
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
                {article.excerpt}
              </p>
            </div>

            {/* Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-outline-variant/20 text-xs text-on-surface-variant font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-on-surface font-medium">{article.authorName}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    {article.publishedAt
                      ? new Intl.DateTimeFormat(locale === "ar" ? "ar-QA" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "Asia/Qatar",
                        }).format(new Date(article.publishedAt))
                      : "Editorial"}
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>
                    {article.readingTimeMinutes} {isRtl ? "دقائق قراءة" : "min read"}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs font-sans transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-mono text-[11px]">
                        {isRtl ? "تم النسخ" : "Copied"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? "مشاركة" : "Share"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Hero Cover Image */}
          {article.coverImage && (
            <div className="relative h-[340px] sm:h-[480px] w-full rounded-3xl overflow-hidden bg-surface-container-high shadow-2xl border border-outline-variant/30">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* Article Text Content (Sanitized, Structured Paragraphs) */}
          <div className="space-y-6 text-on-surface/90 text-sm sm:text-base leading-relaxed sm:leading-loose">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="first:text-base sm:first:text-lg first:font-medium">
                {p}
              </p>
            ))}
          </div>

          {/* Concierge Liaison Box */}
          <div className="bg-surface-container rounded-3xl border border-primary/30 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                <h3 className="font-headline text-lg sm:text-xl text-on-surface font-semibold">
                  {isRtl ? "هل ترغب في تنسيق هذه التجربة الخاصة؟" : "Curate this Experience with Us"}
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isRtl
                  ? "تواصل مباشرة مع مستشاري كونسيرج إم زد للسياحة قطر عبر واتساب لترتيب خطة سير مخصصة بأدق التفاصيل."
                  : "Connect directly with our VIP concierge team on WhatsApp to arrange a bespoke journey based on this guide."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isRtl ? "محادثة واتساب مباشرة" : "Chat on WhatsApp"}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-75" />
              </a>

              <button
                onClick={() => setInquiryModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold transition-colors"
              >
                {dict.nav.bookNow}
              </button>
            </div>
          </div>

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && (
            <div className="pt-10 border-t border-outline-variant/20 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-xl sm:text-2xl text-on-surface font-semibold">
                  {isRtl ? "مقالات وأدلة سياحية مقترحة" : "Recommended Travel Guides"}
                </h3>
                <Link
                  href={`/${locale}/blog`}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>{isRtl ? "عرض كافة الأدلة" : "View All Guides"}</span>
                  <Arrow className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/${locale}/blog/${rel.slug}`}
                    className="group bg-surface-container rounded-2xl border border-outline-variant/30 hover:border-primary/50 transition-all p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono text-primary font-bold">
                        {rel.category.replace(/_/g, " ")}
                      </span>
                      <h4 className="font-headline text-sm font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant line-clamp-2">
                        {rel.excerpt}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                      <span>{rel.readingTimeMinutes} min read</span>
                      <Arrow className="w-3 h-3 text-primary group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => setInquiryModalOpen(true)}
      />

      <BespokeInquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        dict={dict}
        currentLocale={locale}
      />
    </div>
  );
}
