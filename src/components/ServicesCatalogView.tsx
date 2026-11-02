"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Locale, getDictionary } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";
import MobileActionBar from "./MobileActionBar";
import BespokeInquiryModal from "./BespokeInquiryModal";
import {
  SERVICE_CATEGORIES,
  type PublicCatalogServiceItem,
} from "@/lib/validations/service-schemas";
import { getPublicServicesAction } from "@/lib/server/service-actions";
import {
  Search,
  Clock,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  X,
  SlidersHorizontal,
  Compass,
  Calendar,
} from "lucide-react";

interface ServicesCatalogViewProps {
  locale: Locale;
  initialCategory?: string;
}

export default function ServicesCatalogView({
  locale,
  initialCategory = "all",
}: ServicesCatalogViewProps) {
  const dict = getDictionary(locale);
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const [services, setServices] = useState<PublicCatalogServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "title" | "duration">("featured");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<string | undefined>(undefined);
  const [, startTransition] = useTransition();

  // Load services on mount
  useEffect(() => {
    let isMounted = true;
    startTransition(async () => {
      setLoading(true);
      const res = await getPublicServicesAction(locale);
      if (isMounted) {
        if (res.success && res.data) {
          setServices(res.data);
        }
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [locale]);

  // Filter & sort logic
  const filteredServices = useMemo(() => {
    let result = [...services];

    // Category filter
    if (activeCategory !== "all") {
      result = result.filter((s) => {
        if (s.id === activeCategory) return true;
        if (s.category.toLowerCase() === activeCategory.toLowerCase()) return true;

        // Cross-category matches
        if (activeCategory === "desert-safari" && (s.id === "desert-safari" || s.category === "safari")) return true;
        if (activeCategory === "doha-city-tours" && (s.id === "doha-city-tours" || s.category === "culture" || s.category === "city")) return true;
        if (activeCategory === "airport-hotel-transfers" && (s.id === "airport-hotel-transfers" || s.category === "transfers" || s.category === "logistics")) return true;
        if (activeCategory === "resort-stays" && (s.id === "resort-stays" || s.category === "luxury" || s.category === "resort")) return true;
        if (activeCategory === "celebrations-events" && (s.id === "celebrations-events" || s.category === "events")) return true;
        if (activeCategory === "horse-riding" && s.id === "horse-riding") return true;
        if (activeCategory === "gcc-travel" && (s.id === "gcc-travel" || s.category === "transfers")) return true;
        if (activeCategory === "tent-desert-camp" && (s.id === "tent-desert-camp" || s.id === "tent-desert-camps")) return true;

        return false;
      });
    }

    // Search query filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.subtitle.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.categoryLabel.toLowerCase().includes(q) ||
          s.highlights.some((h) => h.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "duration") {
      result.sort((a, b) => a.duration.localeCompare(b.duration));
    }

    return result;
  }, [services, activeCategory, searchQuery, sortBy]);

  const handleOpenBooking = (serviceId?: string) => {
    setSelectedServiceForModal(serviceId);
    setModalOpen(true);
  };

  const handleClearFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
    setSortBy("featured");
  };

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
        onOpenInquiryModal={() => handleOpenBooking()}
      />

      <main className="w-full pt-28 pb-20">
        {/* Hero Header */}
        <section className="relative w-full py-14 lg:py-20 bg-surface border-b border-primary/20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-surface to-surface-container-lowest pointer-events-none" />
          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-on-surface-variant mb-4 font-medium">
              <Link href={`/${locale}`} className="hover:text-primary transition-colors">
                {dict.nav.home}
              </Link>
              <Chevron className="w-3.5 h-3.5" />
              <span className="text-primary font-semibold">{dict.nav.services}</span>
            </nav>

            <div className="max-w-3xl">
              <span className="px-3 py-1 rounded-full bg-secondary-container/80 text-secondary-fixed text-xs font-semibold uppercase tracking-wider inline-block mb-3 border border-secondary/30">
                {isRtl ? "كتالوج التجارب الحصرية في دولة قطر" : "Exclusive Qatar Experiences & Tours"}
              </span>
              <h1 className="font-headline text-3xl sm:text-5xl font-semibold text-on-surface tracking-tight leading-tight">
                {isRtl ? "دليل الجولات والخدمات السياحية الفاخرة" : "Luxury Tours & Bespoke Tourism Catalog"}
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
                {isRtl
                  ? "استكشف باقة خدماتنا الثمانية المتميزة عبر صحراء قطر، معالم الدوحة، أسطول التوصيل الفاخر، والإقامات والفعاليات الخاصة مع مرشدين معتمدين وسيارات خاصة فارهة."
                  : "Discover our 8 signature bespoke experiences spanning desert dunes, Doha cultural landmarks, VIP airport transfers, luxury resorts, and celebrations with certified guides and private luxury fleet."}
              </p>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar Section */}
        <section className="sticky top-20 z-20 py-4 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/20 shadow-md">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-lg">
                <Search className={`absolute ${isRtl ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isRtl
                      ? "ابحث بالاسم، المعالم، الكلمات المفتاحية (سفاري، متحف، لؤلؤة...)"
                      : "Search by title, highlights, keywords (safari, museum, pearl...)"
                  }
                  className={`w-full min-h-[44px] ${
                    isRtl ? "pr-10 pl-9" : "pl-10 pr-9"
                  } rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/60`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`absolute ${isRtl ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface`}
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-on-surface-variant hidden sm:inline">
                  {isRtl ? "ترتيب:" : "Sort by:"}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "featured" | "title" | "duration")}
                  className="min-h-[40px] px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="featured">{isRtl ? "المميزة أولاً" : "Featured"}</option>
                  <option value="title">{isRtl ? "الاسم أ - ي" : "Title (A - Z)"}</option>
                  <option value="duration">{isRtl ? "المدة" : "Duration"}</option>
                </select>

                {(searchQuery || activeCategory !== "all" || sortBy !== "featured") && (
                  <button
                    onClick={handleClearFilters}
                    className="min-h-[40px] px-3 rounded-xl bg-surface-container-high hover:bg-surface-container text-xs text-primary border border-primary/20 transition-colors flex items-center gap-1 font-medium"
                  >
                    <X className="w-3 h-3" />
                    <span>{isRtl ? "إعادة الضبط" : "Reset"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills (Horizontal scrolling on small devices) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
              {SERVICE_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                const label = isRtl ? cat.labelAr : cat.labelEn;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                      isActive
                        ? "bg-primary text-on-primary border-primary shadow-sm shadow-primary/30"
                        : "bg-surface-container text-on-surface-variant border-outline-variant/20 hover:text-on-surface hover:border-primary/40"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Catalog Grid Section */}
        <section className="py-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Results count counter */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs text-on-surface-variant">
              {isRtl
                ? `عرض ${filteredServices.length} تجربة سياحية متاحة`
                : `Showing ${filteredServices.length} available experiences`}
            </p>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/20 animate-pulse flex flex-col"
                >
                  <div className="w-full aspect-[16/10] bg-surface-container-high" />
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-surface-container-high rounded w-3/4" />
                      <div className="h-3 bg-surface-container-high rounded w-1/2" />
                      <div className="h-3 bg-surface-container-high rounded w-full" />
                      <div className="h-3 bg-surface-container-high rounded w-4/5" />
                    </div>
                    <div className="h-8 bg-surface-container-high rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-6 text-center rounded-3xl bg-surface-container border border-dashed border-outline-variant/40 max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Compass className="w-7 h-7" />
              </div>
              <h3 className="font-headline text-lg font-semibold text-on-surface">
                {isRtl ? "لم يتم العثور على خدمات مطابقة" : "No Matching Services Found"}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isRtl
                  ? "جرّب تغيير كلمات البحث أو اختيار فئة أخرى من القائمة أعلاه، أو تواصل معنا مباشرة لتصميم رحلة مخصصة."
                  : "Try adjusting your search terms or clearing your category filters, or contact our private concierge directly for a custom itinerary."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleClearFilters}
                  className="min-h-[40px] px-4 rounded-xl bg-surface-container-high hover:bg-surface-container text-primary border border-primary/30 text-xs font-semibold transition-colors"
                >
                  {isRtl ? "إظهار كافة الخدمات" : "Clear All Filters"}
                </button>
                <button
                  onClick={() => handleOpenBooking()}
                  className="min-h-[40px] px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-colors shadow-sm"
                >
                  {isRtl ? "طلب رحلة مخصصة" : "Request Bespoke Tour"}
                </button>
              </div>
            </div>
          ) : (
            /* Grid of Services */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => {
                return (
                  <article
                    key={service.id}
                    className="group flex flex-col bg-surface-container rounded-2xl overflow-hidden border border-primary/15 shadow-xl shadow-black/40 hover:-translate-y-1.5 transition-all duration-300"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-container-high">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/30" />

                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-secondary-container/90 text-secondary-fixed text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm border border-secondary/20">
                        {service.categoryLabel}
                      </span>

                      {/* Duration Pill */}
                      <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-md text-primary text-[10px] font-semibold flex items-center gap-1 border border-primary/20">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{service.duration}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="font-headline text-base sm:text-lg text-on-surface font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          <Link href={`/${locale}/services/${service.id}`} className="hover:underline">
                            {service.title}
                          </Link>
                        </h2>
                        <p className="text-xs text-primary font-medium mt-1">
                          {service.subtitle}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed line-clamp-3">
                          {service.description}
                        </p>

                        {/* Highlights pills */}
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-outline-variant/15">
                          {service.highlights.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />
                              <span className="truncate max-w-[120px]">{item}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pricing & Call to Actions */}
                      <div className="pt-4 mt-4 border-t border-outline-variant/15 flex flex-col gap-3">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] uppercase text-on-surface-variant block">
                              {dict.servicesSection.priceFrom}
                            </span>
                            <span className="font-headline text-sm font-bold text-primary">
                              {service.indicativePrice}
                            </span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant/70 italic text-right max-w-[140px] truncate">
                            {service.priceNote}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${locale}/services/${service.id}#book-tour`}
                            className="flex-1 min-h-[40px] px-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-[11px] uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-primary/25"
                          >
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{dict.servicesSection.btnReserve}</span>
                          </Link>

                          <Link
                            href={`/${locale}/services/${service.id}`}
                            className="flex-1 min-h-[40px] px-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-[11px] uppercase tracking-wider font-semibold border border-outline-variant/30 transition-all flex items-center justify-center gap-1 group-hover:border-primary/40"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{dict.servicesSection.btnDetails}</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleOpenBooking(service.id)}
                            title={dict.servicesSection.btnBookTour}
                            className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container text-primary border border-outline-variant/30 flex items-center justify-center shrink-0 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Custom Tailored Tour Banner */}
        <section className="py-12 bg-surface border-t border-primary/20 mt-12">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="p-8 sm:p-10 rounded-3xl bg-surface-container border border-primary/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs uppercase tracking-widest text-primary font-semibold block">
                  {isRtl ? "خدمة كونسيرج مخصصة" : "Bespoke Concierge Service"}
                </span>
                <h3 className="font-headline text-2xl sm:text-3xl font-semibold text-on-surface">
                  {isRtl
                    ? "هل ترغب في برنامج سياحي مخصص لا يوجد في الكتالوج؟"
                    : "Need a Custom Multi-Day Itinerary or VIP Delegation Arrangement?"}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {isRtl
                    ? "فريق كونسيرج إم زد للسياحة قطر جاهز لتصميم جدول كامل يشمل الاستقبال من المطار، الإقامات الفندقية، حجز اليخوت، والجولات الخاصة عبر كافة دول مجلس التعاون الخليجي."
                    : "Our senior concierge desk coordinates custom private jets, GCC overland expeditions, private dhow charters, luxury villa reservations, and delegation logistics with white-glove precision."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenBooking()}
                  className="min-h-[46px] px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs uppercase tracking-wider font-semibold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                  <span>{dict.bookingEngine.btnOpenModal}</span>
                  <Arrow className="w-4 h-4" />
                </button>
                <a
                  href={getWhatsAppInquiryUrl(
                    locale === "ar"
                      ? "مرحباً إم زد للسياحة قطر. أود الاستفسار عن تصميم جدول سياحي خاص ومتكامل في دولة قطر."
                      : "Hello MZ Tourism Qatar. I would like to design a bespoke private itinerary in Qatar."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[46px] px-5 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs uppercase tracking-wider font-semibold border border-outline-variant/30 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span>{isRtl ? "محادثة فورية بالواتساب" : "WhatsApp Liaison"}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => handleOpenBooking()}
      />

      <BespokeInquiryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dict={dict}
        currentLocale={locale}
        initialServiceId={selectedServiceForModal}
      />

      <FloatingWhatsAppButton currentLocale={locale} />
      <MobileActionBar
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => handleOpenBooking()}
      />
    </div>
  );
}
