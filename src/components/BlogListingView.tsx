"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Locale, TranslationDict } from "@/translations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BespokeInquiryModal from "@/components/BespokeInquiryModal";
import type { ArticleItem } from "@/lib/data/curated-articles";
import {
  Compass,
  Search,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface BlogListingViewProps {
  initialArticles: ArticleItem[];
  locale: Locale;
  dict: TranslationDict;
}

export default function BlogListingView({
  initialArticles,
  locale,
  dict,
}: BlogListingViewProps) {
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories: { id: string; labelEn: string; labelAr: string }[] = [
    { id: "all", labelEn: "All Guides", labelAr: "كافة الأدلة" },
    { id: "desert_expeditions", labelEn: "Desert Expeditions", labelAr: "رحلات الصحراء" },
    { id: "culture_heritage", labelEn: "Culture & Heritage", labelAr: "التراث والثقافة" },
    { id: "travel_advisory", labelEn: "Travel Advisory", labelAr: "إرشادات السفر" },
    { id: "vip_transfers", labelEn: "VIP Chauffeur", labelAr: "تنقل كبار الشخصيات" },
    { id: "luxury_stays", labelEn: "Luxury Stays", labelAr: "الإقامات الفاخرة" },
  ];

  const filteredArticles = initialArticles.filter((article) => {
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      article.title.toLowerCase().includes(q) ||
      article.excerpt.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col">
      <Header
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => setInquiryModalOpen(true)}
      />

      <main className="flex-1 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header Banner */}
          <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-primary/30 text-primary text-xs font-mono uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>{isRtl ? "دليل قطر السياحي الحصري" : "Curated Qatar Travel Guides"}</span>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl text-on-surface font-semibold tracking-tight">
              {isRtl ? "مقالات واستكشافات كونسيرج قطر" : "Inspiration for the Discerning Traveler"}
            </h1>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              {isRtl
                ? "مقالات موثقة وأدلة عملية لاستكشاف أسرار دولة قطر، من خبايا خور العديد إلى كنوز الفن الإسلامي وإرشادات بروتوكول كبار الشخصيات."
                : "Authoritative insights, cultural etiquette protocols, and curated perspectives across the singing sands of Khor Al Adaid and the architectural marvels of Doha."}
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === c.id
                        ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/30"
                    }`}
                  >
                    {isRtl ? c.labelAr : c.labelEn}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isRtl ? "بحث في الأدلة..." : "Search travel guides..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          {filteredArticles.length === 0 ? (
            <div className="bg-surface-container rounded-3xl border border-primary/20 p-12 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-primary mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-headline text-lg text-on-surface font-semibold">
                {isRtl ? "لا توجد نتائج مطابقة" : "No Matching Guides Found"}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {isRtl
                  ? "جرب البحث بكلمات أخرى أو اختر فئة مختلفة من القائمة أعلاه."
                  : "Try clearing your search query or selecting a different editorial category."}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
              >
                {isRtl ? "إعادة تعيين الفلاتر" : "Reset Filters"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => {
                const categoryObj = categories.find((c) => c.id === article.category);
                const categoryLabel = categoryObj
                  ? isRtl
                    ? categoryObj.labelAr
                    : categoryObj.labelEn
                  : article.category;

                return (
                  <article
                    key={article.id}
                    className="group bg-surface-container rounded-3xl border border-outline-variant/30 hover:border-primary/50 transition-all duration-300 overflow-hidden shadow-xl flex flex-col"
                  >
                    {/* Cover Image */}
                    {article.coverImage && (
                      <div className="relative h-56 w-full overflow-hidden bg-surface-container-high">
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 z-10">
                          <span className="px-3 py-1 rounded-full bg-surface/85 backdrop-blur-md text-[11px] font-mono text-primary font-semibold border border-primary/30">
                            {categoryLabel}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Content Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[11px] text-on-surface-variant font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>
                              {article.readingTimeMinutes}{" "}
                              {isRtl ? "دقائق قراءة" : "min read"}
                            </span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>
                              {article.publishedAt
                                ? new Intl.DateTimeFormat(locale === "ar" ? "ar-QA" : "en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    timeZone: "Asia/Qatar",
                                  }).format(new Date(article.publishedAt))
                                : "Featured"}
                            </span>
                          </span>
                        </div>

                        <h2 className="font-headline text-xl text-on-surface font-semibold group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          <Link href={`/${locale}/blog/${article.slug}`}>
                            {article.title}
                          </Link>
                        </h2>

                        <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                        <span className="text-[11px] text-on-surface-variant font-mono">
                          {article.authorName}
                        </span>

                        <Link
                          href={`/${locale}/blog/${article.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                        >
                          <span>{isRtl ? "قراءة الدليل" : "Read Guide"}</span>
                          <Arrow className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Concierge Conversion Banner */}
          <div className="bg-gradient-to-br from-surface-container to-surface-container-high border border-primary/30 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary font-headline text-xl font-bold mx-auto flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2 max-w-xl mx-auto">
              <h3 className="font-headline text-2xl sm:text-3xl text-on-surface font-semibold">
                {isRtl ? "حول إلهام رحلتك إلى واقع استثنائي" : "Transform Inspiration into Reality"}
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {isRtl
                  ? "فريق كونسيرج إم زد للسياحة قطر جاهز لتصميم مسارك الخاص بدقة لا تضاهى، بما يناسب تطلعاتك وخصوصيتك الكاملة."
                  : "Connect with our Qatar luxury travel concierge to curate a bespoke expedition tailored precisely to your private schedule and preferences."}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setInquiryModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all shadow-xl shadow-primary/20 cursor-pointer"
              >
                {dict.nav.bookNow}
              </button>
            </div>
          </div>
        </div>
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
