"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Locale, getDictionary } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";
import MobileActionBar from "./MobileActionBar";
import BespokeInquiryModal from "./BespokeInquiryModal";
import { createGuestBookingAction } from "@/lib/server/booking-actions";
import type { DetailedCatalogServiceItem } from "@/lib/validations/service-schemas";
import {
  Clock,
  Car,
  Shield,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Receipt,
  Loader2,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  Compass,
  Users,
  User,
  Minus,
  Plus,
  HelpCircle,
  FileText,
  Info,
  ChevronDown,
  Images,
  X,
  Sparkles,
} from "lucide-react";

interface SingleServicePageViewProps {
  serviceId?: string;
  service?: DetailedCatalogServiceItem;
  locale: Locale;
}

export default function SingleServicePageView({
  serviceId,
  service: passedService,
  locale,
}: SingleServicePageViewProps) {
  const dict = getDictionary(locale);
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const [modalOpen, setModalOpen] = useState(false);

  // Resolve service data: either passed directly or from dictionary fallback
  const fallbackDictItem =
    dict.services.find((s) => s.id === (passedService?.id || serviceId)) ||
    dict.services[0];

  const currentService: DetailedCatalogServiceItem = useMemo(() => {
    if (passedService) return passedService;
    return {
      id: fallbackDictItem.id,
      title: fallbackDictItem.title,
      subtitle: fallbackDictItem.subtitle,
      category: fallbackDictItem.category,
      categoryLabel: fallbackDictItem.category.toUpperCase(),
      duration: fallbackDictItem.duration,
      indicativePrice: fallbackDictItem.indicativePrice,
      priceNote: fallbackDictItem.priceNote,
      description: fallbackDictItem.description,
      image: fallbackDictItem.image,
      highlights: fallbackDictItem.highlights,
      inquiryMessage: fallbackDictItem.inquiryMessage,
      vehicleType: fallbackDictItem.vehicleType,
      suitability: fallbackDictItem.suitability,
      isActive: true,
      createdAt: new Date().toISOString(),
      inclusions: fallbackDictItem.inclusions,
      exclusions: fallbackDictItem.exclusions,
      itinerary: fallbackDictItem.itinerary,
      whatToBring: fallbackDictItem.whatToBring,
    };
  }, [passedService, fallbackDictItem]);

  const galleryImages = useMemo(() => {
    if (currentService.galleryImages && currentService.galleryImages.length > 0) {
      return currentService.galleryImages;
    }
    return [currentService.image];
  }, [currentService]);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [paxCount, setPaxCount] = useState<number>(1);
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");

  const maxPax = currentService.maxParticipants || 6;

  // Strict Per-Person Pricing: Total Price = Price Per Person × Number of People
  const unitRate = currentService.totalPrice || 450;
  const computedTotal = unitRate * paxCount;
  const depositPct = currentService.depositValue || 30;
  const computedDeposit =
    currentService.depositType === "fixed"
      ? Math.min(computedTotal, (currentService.depositValue || 150) * paxCount)
      : Math.round((computedTotal * depositPct) / 100);
  const computedBalance = Math.max(0, computedTotal - computedDeposit);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    bookingRef: string;
    uploadToken: string;
    depositRequired: number;
    balanceDue: number;
    totalPrice: number;
    currency: string;
    departureDate?: string | null;
    paxCount: number;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const directWhatsAppUrl = getWhatsAppInquiryUrl(currentService.inquiryMessage);

  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleSelectDepartureDate = (dateStr: string) => {
    setTravelDate(dateStr);
    const bookingSection = document.getElementById("book-tour");
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Submit real guest booking to Supabase server action
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        customerName: guestName.trim(),
        customerEmail: guestEmail.trim(),
        customerPhone: guestPhone.trim(),
        serviceId: currentService.id,
        departureDate: travelDate || undefined,
        paxCount,
        adults: paxCount,
        children: 0,
        pickupLocation: pickupLocation.trim() || undefined,
        preferredLocale: locale,
        notes: notes.trim() || undefined,
      };

      const res = await createGuestBookingAction(payload);

      if (!res.success || !res.data) {
        setSubmissionError(
          res.error ||
            (isRtl
              ? "تعذر إرسال الحجز حالياً. يرجى مراجعة الحقول أو التواصل مع الكونسيرج."
              : "Unable to record booking. Please review your entries or contact our concierge.")
        );
        setIsSubmitting(false);
        return;
      }

      setBookingResult({
        bookingRef: res.data.bookingRef,
        uploadToken: res.data.uploadToken,
        depositRequired: res.data.depositRequired,
        balanceDue: res.data.balanceDue,
        totalPrice: computedTotal,
        currency: res.data.currency,
        departureDate: res.data.departureDate,
        paxCount: res.data.paxCount,
      });

      // Prepare WhatsApp liaison message with real booking ref
      const fullMessage =
        locale === "ar"
          ? `طلب حجز مؤكد [رقم المرجع: ${res.data.bookingRef}] - إم زد للسياحة قطر:
• الخدمة: ${currentService.title}
• تاريخ الرحلة: ${travelDate || "قيد التنسيق"}
• عدد المسافرين: ${paxCount} ${paxCount === 1 ? "شخص" : "أشخاص"}
• اسم الضيف: ${guestName}
• الهاتف / واتساب: ${guestPhone}
• البريد: ${guestEmail}
• نقطة الاستقبال: ${pickupLocation || "حسب الاتفاق"}
• إجمالي الحجز: ${computedTotal} ر.ق (${unitRate} ر.ق / للشخص)
• العربون المطلوب: ${res.data.depositRequired} ر.ق
• ملاحظات: ${notes || "لا توجد"}

تم تسجيل الحجز في النظام. يرجى توفير إرشادات الدفع اليدوي لإيداع العربون.`
          : `Confirmed Booking Request [Ref: ${res.data.bookingRef}] - MZ Tourism Qatar:
• Service: ${currentService.title}
• Travel Date: ${travelDate || "Pending Coordination"}
• People / Guests: ${paxCount} ${paxCount === 1 ? "Person" : "People"}
• Guest Name: ${guestName}
• Phone / WhatsApp: ${guestPhone}
• Email: ${guestEmail}
• Pickup: ${pickupLocation || "To be coordinated"}
• Total Amount: ${computedTotal} QAR (${unitRate} QAR / person)
• Deposit Required: ${res.data.depositRequired} QAR
• Special Requests: ${notes || "None"}

Booking dossier recorded. Awaiting manual payment proof submission.`;

      const sendUrl = getWhatsAppInquiryUrl(fullMessage);
      window.open(sendUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setSubmissionError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherServices = dict.services
    .filter((s) => s.id !== currentService.id)
    .slice(0, 3);

  const departuresList = (currentService.departures || []).slice(0, 8);

  return (
    <div
      dir={dict.dir}
      lang={locale}
      className={`min-h-screen bg-[#0F1115] text-[#F3ECE1] selection:bg-[#C29B38] selection:text-[#0F1115] ${
        isRtl ? "font-arabic" : "font-body"
      }`}
    >
      <Header
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => setModalOpen(true)}
      />

      <main className="w-full pt-28 pb-20">
        {/* 1. Cinematic Hero Section */}
        <div className="relative w-full h-[52vh] sm:h-[62vh] min-h-[420px] bg-[#14171E] overflow-hidden">
          <Image
            src={currentService.image}
            alt={currentService.title}
            fill
            priority
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/75 to-black/40" />

          <div className="relative z-10 max-w-[1440px] h-full mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-end pb-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#F3ECE1]/65 mb-4 font-medium">
              <Link href={`/${locale}`} className="hover:text-[#C29B38] transition-colors">
                {dict.nav.home}
              </Link>
              {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Link href={`/${locale}/services`} className="hover:text-[#C29B38] transition-colors">
                {dict.nav.services}
              </Link>
              {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="text-[#C29B38] font-semibold truncate max-w-[200px] sm:max-w-none">
                {currentService.title}
              </span>
            </div>

            {/* Badges Ribbon */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#72132B]/85 text-[#F3ECE1] text-xs font-semibold uppercase tracking-wider border border-[#72132B]">
                {currentService.categoryLabel}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#16191F]/90 text-[#C29B38] text-xs font-semibold flex items-center gap-1.5 border border-[#C29B38]/30">
                <Clock className="w-3.5 h-3.5 text-[#C29B38]" />
                <span>{currentService.duration}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-[#16191F]/90 text-[#F3ECE1]/90 text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                <Compass className="w-3.5 h-3.5 text-[#C29B38]" />
                <span className="capitalize">
                  {currentService.difficultyLevel
                    ? isRtl
                      ? currentService.difficultyLevel === "easy"
                        ? "سهل ومريح"
                        : currentService.difficultyLevel === "moderate"
                        ? "متوسط"
                        : "مغامرة متقدمة"
                      : `${currentService.difficultyLevel} difficulty`
                    : isRtl
                    ? "سهل ومناسب للجميع"
                    : "Easy Level"}
                </span>
              </span>
              <span className="px-3 py-1 rounded-full bg-[#16191F]/90 text-[#F3ECE1]/90 text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                <Users className="w-3.5 h-3.5 text-[#C29B38]" />
                <span>
                  {currentService.minParticipants || 1} - {currentService.maxParticipants || 6}{" "}
                  {isRtl ? "ضيوف" : "Guests"}
                </span>
              </span>
            </div>

            <h1 className="font-headline text-2xl sm:text-4xl lg:text-5xl font-semibold text-[#F3ECE1] max-w-4xl leading-tight">
              {currentService.title}
            </h1>
            <p className="text-sm sm:text-base text-[#C29B38] font-medium mt-1.5 max-w-3xl">
              {currentService.subtitle}
            </p>

            {/* Gallery Thumbnail Preview Trigger */}
            {galleryImages.length > 1 && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#14171E]/80 hover:bg-[#1A1E27] text-xs font-semibold text-[#F3ECE1] border border-[#C29B38]/30 transition-all backdrop-blur-sm shadow-md"
                >
                  <Images className="w-4 h-4 text-[#C29B38]" />
                  <span>
                    {dict.servicesSection.galleryTitle} ({galleryImages.length})
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Key Specifications Bar */}
        <section className="bg-[#14171E] border-y border-[#C29B38]/15 py-4">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C29B38]/10 border border-[#C29B38]/25 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#C29B38]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#F3ECE1]/60 block font-medium">
                    {isRtl ? "مدة التجربة" : "Duration"}
                  </span>
                  <span className="font-semibold text-[#F3ECE1]">{currentService.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C29B38]/10 border border-[#C29B38]/25 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4 text-[#C29B38]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#F3ECE1]/60 block font-medium">
                    {isRtl ? "أسطول المركبات" : "Fleet Specification"}
                  </span>
                  <span className="font-semibold text-[#F3ECE1] truncate max-w-[180px] block">
                    {currentService.vehicleType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C29B38]/10 border border-[#C29B38]/25 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#C29B38]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#F3ECE1]/60 block font-medium">
                    {dict.servicesSection.pickupPointLabel}
                  </span>
                  <span className="font-semibold text-[#F3ECE1] truncate max-w-[180px] block">
                    {currentService.destinations?.[0] || (isRtl ? "الدوحة ومطار حمد" : "Doha & Hamad Airport")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C29B38]/10 border border-[#C29B38]/25 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-[#C29B38]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#F3ECE1]/60 block font-medium">
                    {dict.servicesSection.capacityLabel}
                  </span>
                  <span className="font-semibold text-[#F3ECE1]">
                    {currentService.minParticipants || 1} - {currentService.maxParticipants || 6}{" "}
                    {isRtl ? "مسافرين" : "Travellers"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Main Content Body Grid */}
        <section className="py-8 sm:py-10 bg-[#0F1115]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column (8 cols): Information Architecture */}
              <div className="lg:col-span-8 space-y-8">
                {/* Photo Gallery Grid */}
                {galleryImages.length > 1 && (
                  <div className="space-y-3">
                    <h2 className="font-headline text-lg sm:text-xl font-semibold text-[#F3ECE1] flex items-center gap-2">
                      <Images className="w-5 h-5 text-[#C29B38]" />
                      <span>{dict.servicesSection.galleryTitle}</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {galleryImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="relative h-28 sm:h-36 rounded-2xl overflow-hidden group border border-[#C29B38]/20 hover:border-[#C29B38] transition-all"
                        >
                          <Image
                            src={imgUrl}
                            alt={`${currentService.title} preview ${idx + 1}`}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Overview */}
                <div className="p-6 sm:p-8 rounded-3xl bg-[#14171E] border border-[#C29B38]/20 space-y-4 shadow-xl">
                  <h2 className="font-headline text-xl sm:text-2xl font-semibold text-[#F3ECE1]">
                    {isRtl ? "نظرة عامة على التجربة" : "Experience Overview"}
                  </h2>
                  <p className="text-sm sm:text-base text-[#F3ECE1]/80 leading-relaxed">
                    {currentService.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Car className="w-4 h-4 text-[#C29B38] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#F3ECE1] block">
                          {isRtl ? "الأسطول المخصص:" : "Vehicle Specification:"}
                        </span>
                        <span className="text-[#F3ECE1]/70">{currentService.vehicleType}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Shield className="w-4 h-4 text-[#C29B38] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#F3ECE1] block">
                          {isRtl ? "الملائمة والخصوصية:" : "Suitability & Privacy:"}
                        </span>
                        <span className="text-[#F3ECE1]/70">{currentService.suitability}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                {currentService.highlights && currentService.highlights.length > 0 && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#14171E] border border-[#C29B38]/20 shadow-xl space-y-4">
                    <h3 className="font-headline text-lg font-semibold text-[#F3ECE1] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C29B38]" />
                      <span>{isRtl ? "أبرز مميزات الرحلة" : "Experience Highlights"}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentService.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs text-[#F3ECE1]/85">
                          <CheckCircle2 className="w-4 h-4 text-[#C29B38] shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Departure Dates & Capacity Section */}
                {departuresList.length > 0 && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#14171E] border border-[#C29B38]/25 shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-headline text-lg font-semibold text-[#F3ECE1] flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#C29B38]" />
                          <span>{dict.servicesSection.departuresTitle}</span>
                        </h3>
                        <p className="text-xs text-[#F3ECE1]/65 mt-0.5">
                          {isRtl
                            ? "اختر موعد الانطلاق المفضل لديك لحجزه مباشرة في النموذج."
                            : "Select your preferred departure slot to book directly in the reservation form."}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#C29B38] bg-[#C29B38]/10 px-2.5 py-1 rounded-full border border-[#C29B38]/20 self-start sm:self-auto">
                        {isRtl ? "أسطول حصري مؤكد" : "Guaranteed Private Dispatch"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {departuresList.map((dep) => {
                        const isOpen = dep.status === "open";
                        const isSelected = travelDate === dep.departureDate;
                        return (
                          <div
                            key={dep.id}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-[#C29B38]/15 border-[#C29B38] ring-1 ring-[#C29B38]"
                                : "bg-[#16191F] border-white/10 hover:border-[#C29B38]/40"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="font-headline text-sm font-semibold text-[#F3ECE1] block">
                                {dep.departureDate}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-[#F3ECE1]/70">
                                <span>{dep.startTime} {dep.endTime ? `- ${dep.endTime}` : ""}</span>
                                <span>•</span>
                                <span className={isOpen ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                                  {isOpen
                                    ? `${dep.availableSeats} ${dict.servicesSection.seatsAvailable}`
                                    : dict.servicesSection.soldOut}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectDepartureDate(dep.departureDate)}
                              disabled={!isOpen}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                                isSelected
                                  ? "bg-[#C29B38] text-[#0F1115]"
                                  : isOpen
                                  ? "bg-white/10 hover:bg-[#C29B38] hover:text-[#0F1115] text-[#F3ECE1]"
                                  : "bg-white/5 text-white/30 cursor-not-allowed"
                              }`}
                            >
                              {isSelected ? (isRtl ? "تم الاختيار" : "Selected") : dict.servicesSection.selectDate}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Day-by-Day or Detailed Timeline Itinerary */}
                {currentService.itinerary && currentService.itinerary.length > 0 && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#14171E] border border-[#C29B38]/20 shadow-xl space-y-6">
                    <div>
                      <h3 className="font-headline text-xl font-semibold text-[#F3ECE1]">
                        {isRtl ? "مسار الرحلة وجدول الأوقات" : "Estimated Itinerary Timeline"}
                      </h3>
                      <p className="text-xs text-[#F3ECE1]/70 mt-1">
                        {isRtl
                          ? "جميع المواعيد قابلة للتعديل بحسب مواعيد رحلات الطيران ومقر إقامتكم."
                          : "All departure timings are fully flexible and can be customized to your flight arrivals and hotel preferences."}
                      </p>
                    </div>

                    <div className="relative border-l-2 border-[#C29B38]/30 ml-4 pl-5 space-y-6 py-2">
                      {currentService.itinerary.map((step, idx) => (
                        <div key={idx} className="relative group">
                          <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-[#C29B38] border-2 border-[#14171E] group-hover:scale-125 transition-transform" />
                          <span className="text-[11px] font-bold text-[#C29B38] tracking-wider uppercase block">
                            {step.day ? `${isRtl ? "اليوم" : "Day"} ${step.day} • ` : ""}
                            {step.time}
                          </span>
                          <h4 className="font-headline text-sm font-semibold text-[#F3ECE1] mt-0.5">
                            {step.title}
                          </h4>
                          <p className="text-xs text-[#F3ECE1]/70 mt-1 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inclusions & Exclusions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-[#14171E] border border-[#C29B38]/25 shadow-md space-y-3">
                    <h3 className="font-headline text-base font-semibold text-[#F3ECE1] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#C29B38]" />
                      <span>{isRtl ? "ما تشمله الخدمة" : "Included in Service"}</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-[#F3ECE1]/80">
                      {currentService.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C29B38] shrink-0 mt-1.5" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 rounded-3xl bg-[#14171E] border border-white/10 shadow-md space-y-3">
                    <h3 className="font-headline text-base font-semibold text-[#F3ECE1] flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-[#F3ECE1]/50" />
                      <span>{isRtl ? "ما لا تشمله الخدمة" : "Not Included"}</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-[#F3ECE1]/70">
                      {currentService.exclusions.map((exc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0 mt-1.5" />
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>

                    {currentService.whatToBring && currentService.whatToBring.length > 0 && (
                      <div className="pt-3 border-t border-white/10">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C29B38] block mb-1">
                          {isRtl ? "ما يُنصح باصطحابه" : "Recommended Attire / Essentials"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentService.whatToBring.map((item, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-[#16191F] text-[#F3ECE1]/80 text-[11px] border border-white/5"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* FAQs Accordion Section */}
                {currentService.faqs && currentService.faqs.length > 0 && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#14171E] border border-[#C29B38]/20 shadow-xl space-y-4">
                    <h3 className="font-headline text-lg font-semibold text-[#F3ECE1] flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[#C29B38]" />
                      <span>{dict.servicesSection.faqsTitle}</span>
                    </h3>
                    <div className="divide-y divide-white/10">
                      {currentService.faqs.map((faq, idx) => {
                        const isExpanded = activeFaq === idx;
                        return (
                          <div key={idx} className="py-3.5">
                            <button
                              type="button"
                              onClick={() => setActiveFaq(isExpanded ? null : idx)}
                              className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-[#F3ECE1] hover:text-[#C29B38] transition-colors gap-3"
                            >
                              <span>{faq.question}</span>
                              <ChevronDown
                                className={`w-4 h-4 text-[#C29B38] shrink-0 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            {isExpanded && (
                              <p className="mt-2.5 text-xs text-[#F3ECE1]/70 leading-relaxed">
                                {faq.answer}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cancellation Policy & Important Information */}
                <div className="p-6 sm:p-8 rounded-3xl bg-[#14171E] border border-[#C29B38]/20 shadow-xl space-y-5">
                  <div className="space-y-2">
                    <h3 className="font-headline text-base font-semibold text-[#F3ECE1] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#C29B38]" />
                      <span>{dict.servicesSection.cancellationTitle}</span>
                    </h3>
                    <p className="text-xs text-[#F3ECE1]/75 leading-relaxed">
                      {currentService.cancellationPolicy ||
                        (isRtl
                          ? "إلغاء مجاني واسترداد كامل للعربون حتى 48 ساعة قبل موعد الانطلاق المجدول."
                          : "Complimentary cancellation and full deposit refund up to 48 hours prior to scheduled departure.")}
                    </p>
                  </div>

                  {currentService.importantInfo && (
                    <div className="p-3.5 rounded-2xl bg-[#16191F] border border-[#C29B38]/20 flex items-start gap-2.5 text-xs text-[#F3ECE1]/80">
                      <Info className="w-4 h-4 text-[#C29B38] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#F3ECE1] block mb-0.5">
                          {dict.servicesSection.importantInfoTitle}
                        </span>
                        <span>{currentService.importantInfo}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (4 cols): Sticky Desktop Booking Card & Interactive Engine */}
              <div className="lg:col-span-4 space-y-6">
                <div
                  id="book-tour"
                  className="sticky top-28 p-6 rounded-3xl bg-[#14171E] border border-[#C29B38]/30 shadow-2xl space-y-5"
                >
                  {/* Pricing Header */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#F3ECE1]/60 block font-medium">
                      {dict.servicesSection.priceFrom}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline text-3xl font-bold text-[#C29B38]">
                        {currentService.indicativePrice}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#C29B38]/90 block mt-1 font-medium">
                      {currentService.priceNote}
                    </span>
                  </div>

                  {/* One-Tap WhatsApp Liaison (Secondary CTA) */}
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] rounded-xl bg-[#16191F] hover:bg-[#1A1E27] text-[#F3ECE1] border border-[#C29B38]/30 text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 text-[#C29B38]" />
                    <span>{dict.servicesSection.btnBookTour}</span>
                  </a>

                  <div className="h-px bg-white/10" />

                  {/* Real Booking Form or Booking Result Screen */}
                  {bookingResult ? (
                    <div className="py-4 space-y-4 rounded-2xl bg-[#16191F] p-4 border border-[#C29B38]/40">
                      <div className="w-12 h-12 rounded-full bg-[#C29B38]/20 text-[#C29B38] mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="font-headline text-base font-semibold text-[#F3ECE1]">
                          {isRtl ? "تم تسجيل الحجز بنجاح" : "Booking Successfully Recorded"}
                        </h4>
                        <p className="text-xs text-[#F3ECE1]/70">
                          {isRtl
                            ? "تم إنشاء ملف الحجز في النظام. الخطوة التالية: تقديم إيصال العربون."
                            : "Your reservation dossier is recorded. Next step: Upload your deposit receipt."}
                        </p>
                      </div>

                      {/* Official 10-Field Summary Box */}
                      <div className="p-3.5 rounded-xl bg-[#0F1115] border border-[#C29B38]/25 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <span className="text-[11px] text-[#F3ECE1]/60 uppercase tracking-wider">
                            {isRtl ? "رمز الحجز:" : "Booking Ref:"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyRef(bookingResult.bookingRef)}
                            className="font-mono font-bold text-[#C29B38] flex items-center gap-1.5 hover:underline"
                          >
                            <span>{bookingResult.bookingRef}</span>
                            {copiedRef ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-[#C29B38]" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#F3ECE1]/80">
                          <span>{isRtl ? "الخدمة / الجولة:" : "Experience:"}</span>
                          <span className="font-semibold text-[#F3ECE1] truncate max-w-[170px]">
                            {currentService.title}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#F3ECE1]/80">
                          <span>{isRtl ? "تاريخ الرحلة:" : "Travel Date:"}</span>
                          <span className="font-semibold text-[#F3ECE1]">
                            {bookingResult.departureDate || (isRtl ? "قيد التنسيق" : "Pending Coordination")}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#F3ECE1]/80">
                          <span>{isRtl ? "عدد الضيوف:" : "Travellers:"}</span>
                          <span className="font-semibold text-[#F3ECE1]">
                            {bookingResult.paxCount} {isRtl ? "مسافرين" : "Guests"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#F3ECE1]/80 border-t border-white/5 pt-1.5">
                          <span>{dict.servicesSection.totalPriceLabel}:</span>
                          <span className="font-semibold text-[#F3ECE1]">
                            {bookingResult.totalPrice.toLocaleString("en-US")} {bookingResult.currency}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#F3ECE1]/80">
                          <span>{dict.servicesSection.depositRequiredLabel}:</span>
                          <span className="font-semibold text-[#C29B38]">
                            {bookingResult.depositRequired.toLocaleString("en-US")} {bookingResult.currency}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#F3ECE1]/80">
                          <span>{dict.servicesSection.balanceDueLabel}:</span>
                          <span className="font-semibold text-[#F3ECE1]">
                            {bookingResult.balanceDue.toLocaleString("en-US")} {bookingResult.currency}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#F3ECE1]/80 border-t border-white/5 pt-1.5">
                          <span>{isRtl ? "حالة الحجز:" : "Booking Status:"}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold">
                            {isRtl ? "في انتظار العربون" : "Awaiting Deposit"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#F3ECE1]/80">
                          <span>{isRtl ? "حالة الدفع:" : "Payment Status:"}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-semibold">
                            {isRtl ? "قيد إرسال الإيصال" : "Deposit Pending"}
                          </span>
                        </div>
                      </div>

                      {/* Primary Next-Step Action: Proceed to Payment Proof Upload & Account Tracking */}
                      <div className="space-y-2">
                        <Link
                          href={`/${locale}/booking/${encodeURIComponent(bookingResult.uploadToken)}`}
                          className="w-full min-h-[46px] rounded-xl bg-[#C29B38] hover:bg-[#ECC15A] text-[#0F1115] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#C29B38]/20"
                        >
                          <Receipt className="w-4 h-4 text-[#0F1115]" />
                          <span>{dict.servicesSection.uploadProofAction}</span>
                          <Arrow className="w-3.5 h-3.5 text-[#0F1115]" />
                        </Link>
                        <Link
                          href={`/${locale}/account/bookings`}
                          className="w-full min-h-[42px] rounded-xl bg-[#0F1115] hover:bg-stone-900 border border-[#C29B38]/30 text-[#F3ECE1] hover:text-[#C29B38] text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                          <User className="w-4 h-4 text-[#C29B38]" />
                          <span>{isRtl ? "متابعة الحجز في حسابي الشخصي" : "Track in Customer Account"}</span>
                        </Link>
                      </div>

                      <p className="text-[10px] text-[#F3ECE1]/60 text-center">
                        {isRtl
                          ? "تم حفظ الحجز رسمياً. يرجى المتابعة لرفع إيصال السداد أو التواصل عبر واتساب لتأكيد الاستلام."
                          : "Your reservation is saved. Please proceed to upload proof or contact our concierge via WhatsApp."}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#C29B38] block">
                          {isRtl ? "حجز الرحلة المباشر" : "Direct Reservation"}
                        </span>
                        <span className="text-[11px] text-[#F3ECE1]/60">
                          {isRtl ? "لا يتم الدفع عبر الموقع" : "Manual Deposit Only"}
                        </span>
                      </div>

                      {submissionError && (
                        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                          <span>{submissionError}</span>
                        </div>
                      )}

                      {/* Departure Date */}
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-[#F3ECE1]/70 block mb-1 font-semibold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#C29B38]" />
                          <span>{isRtl ? "تاريخ الرحلة المطلوب *" : "Departure Date *"}</span>
                        </label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split("T")[0]}
                          value={travelDate}
                          onChange={(e) => setTravelDate(e.target.value)}
                          className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#16191F] border border-[#C29B38]/25 text-[#F3ECE1] text-xs focus:outline-none focus:border-[#C29B38] [color-scheme:dark]"
                        />
                      </div>

                      {/* Number of People Stepper (Per-Person Pricing) */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-wider text-[#F3ECE1]/70 block font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#C29B38]" />
                            <span>{isRtl ? "عدد الأشخاص *" : "Number of People *"}</span>
                          </span>
                          <span className="text-[10px] text-[#C29B38] font-normal">
                            {unitRate} {isRtl ? "ر.ق / للشخص" : "QAR / person"}
                          </span>
                        </label>
                        <div className="flex items-center gap-3 bg-[#16191F] border border-[#C29B38]/30 rounded-xl p-1.5 px-3">
                          <button
                            type="button"
                            onClick={() => setPaxCount((prev) => Math.max(1, prev - 1))}
                            disabled={paxCount <= 1}
                            className="w-8 h-8 rounded-lg bg-[#0F1115] text-[#F3ECE1] hover:text-[#C29B38] border border-white/10 flex items-center justify-center font-bold text-base disabled:opacity-40 transition-colors"
                            aria-label={isRtl ? "إنقاص عدد الأشخاص" : "Decrease passenger count"}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1 text-center font-semibold text-sm text-[#F3ECE1]">
                            <span>{paxCount}</span>{" "}
                            <span className="text-xs text-[#F3ECE1]/70 font-normal">
                              {paxCount === 1 ? (isRtl ? "شخص واحد" : "Person") : (isRtl ? "أشخاص" : "People")}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaxCount((prev) => Math.min(maxPax, prev + 1))}
                            disabled={paxCount >= maxPax}
                            className="w-8 h-8 rounded-lg bg-[#0F1115] text-[#F3ECE1] hover:text-[#C29B38] border border-white/10 flex items-center justify-center font-bold text-base disabled:opacity-40 transition-colors"
                            aria-label={isRtl ? "زيادة عدد الأشخاص" : "Increase passenger count"}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lead Traveller Name */}
                      <div>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder={isRtl ? "الاسم الكامل للمسافر الرئيسي *" : "Lead Traveller Full Name *"}
                          className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#16191F] border border-white/10 text-[#F3ECE1] text-xs focus:outline-none focus:border-[#C29B38]"
                        />
                      </div>

                      {/* Contact Phone & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder={isRtl ? "رقم الهاتف / واتساب *" : "Phone / WhatsApp *"}
                          className="w-full min-h-[42px] px-3 rounded-xl bg-[#16191F] border border-white/10 text-[#F3ECE1] text-xs focus:outline-none focus:border-[#C29B38]"
                        />
                        <input
                          type="email"
                          required
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder={isRtl ? "البريد الإلكتروني *" : "Email Address *"}
                          className="w-full min-h-[42px] px-3 rounded-xl bg-[#16191F] border border-white/10 text-[#F3ECE1] text-xs focus:outline-none focus:border-[#C29B38]"
                        />
                      </div>

                      {/* Pickup Location */}
                      <div>
                        <input
                          type="text"
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          placeholder={
                            isRtl
                              ? "نقطة الاستقبال (فندق، مقر الإقامة، مطار حمد)..."
                              : "Pickup Location (Hotel, Hamad Airport, Villa)..."
                          }
                          className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#16191F] border border-white/10 text-[#F3ECE1] text-xs focus:outline-none focus:border-[#C29B38]"
                        />
                      </div>

                      {/* Special Requests */}
                      <div>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={
                            isRtl
                              ? "أي طلبات خاصة أو متطلبات غذائية أو مقاعد أطفال..."
                              : "Special dietary requests, child car seats, VIP preferences..."
                          }
                          className="w-full p-3 rounded-xl bg-[#16191F] border border-white/10 text-[#F3ECE1] text-xs focus:outline-none focus:border-[#C29B38] resize-none"
                        />
                      </div>

                      {/* Live Pricing Breakdown Card */}
                      <div className="p-3.5 rounded-xl bg-[#0F1115] border border-[#C29B38]/20 space-y-2 text-xs">
                        <span className="text-[11px] font-semibold text-[#C29B38] uppercase tracking-wider block">
                          {dict.servicesSection.pricingBreakdown}
                        </span>
                        <div className="flex items-center justify-between text-[#F3ECE1]/75">
                          <span>
                            {unitRate} QAR × {paxCount} {paxCount === 1 ? (isRtl ? "شخص" : "Person") : (isRtl ? "أشخاص" : "People")}
                          </span>
                          <span className="font-semibold text-[#F3ECE1]">
                            {computedTotal.toLocaleString("en-US")} QAR
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#F3ECE1]/75">
                          <span>{dict.servicesSection.depositRequiredLabel} ({depositPct}%):</span>
                          <span className="font-semibold text-[#C29B38]">
                            {computedDeposit.toLocaleString("en-US")} QAR
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#F3ECE1]/75 border-t border-white/10 pt-1.5">
                          <span>{dict.servicesSection.balanceDueLabel}:</span>
                          <span className="font-semibold text-[#F3ECE1]">
                            {computedBalance.toLocaleString("en-US")} QAR
                          </span>
                        </div>
                      </div>

                      {/* Primary Submit Button: Book This Tour / Reserve Your Place */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full min-h-[48px] rounded-xl bg-[#C29B38] hover:bg-[#ECC15A] text-[#0F1115] text-xs uppercase tracking-wider font-semibold transition-all shadow-lg shadow-[#C29B38]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#0F1115]" />
                            <span>{isRtl ? "جاري تسجيل الحجز..." : "Recording Reservation..."}</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 text-[#0F1115]" />
                            <span>{dict.servicesSection.btnReserveNow}</span>
                            <Arrow className="w-3.5 h-3.5 text-[#0F1115]" />
                          </>
                        )}
                      </button>

                      <p className="text-[10px] text-[#F3ECE1]/60 text-center leading-relaxed">
                        <Shield className="w-3.5 h-3.5 text-[#C29B38] inline mr-1 ml-1" />
                        {isRtl
                          ? "حجز آمن • لا يتم خصم أي مبالغ إلكترونياً • يتم تأكيد الحجز بعد مراجعة إيصال العربون"
                          : "Zero automated card charging • All bookings confirmed via verified manual deposit review"}
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Other Signature Experiences */}
        <section className="py-12 bg-[#14171E] border-t border-[#C29B38]/20">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-[#F3ECE1] mb-6">
              {isRtl ? "تجارب قطرية حصرية أخرى" : "More Signature Qatar Experiences"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherServices.map((s) => (
                <Link
                  key={s.id}
                  href={`/${locale}/services/${s.id}`}
                  className="group rounded-3xl bg-[#0F1115] border border-white/10 hover:border-[#C29B38]/50 overflow-hidden transition-all shadow-lg flex flex-col"
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    <Image
                      src={s.image}
                      alt={s.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-transparent to-transparent" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-headline text-base font-semibold text-[#F3ECE1] group-hover:text-[#C29B38] transition-colors">
                        {s.title}
                      </h4>
                      <p className="text-xs text-[#F3ECE1]/70 mt-1 line-clamp-2">
                        {s.subtitle}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-[#C29B38]">
                      <span>{s.indicativePrice}</span>
                      <span className="flex items-center gap-1">
                        {dict.servicesSection.btnDetails}
                        <Arrow className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() =>
              setLightboxIndex((prev) =>
                prev === null ? null : (prev - 1 + galleryImages.length) % galleryImages.length
              )
            }
            className="absolute left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl max-h-[80vh] w-full h-[70vh] rounded-2xl overflow-hidden">
            <Image
              src={galleryImages[lightboxIndex]}
              alt={`Full preview ${lightboxIndex + 1}`}
              fill
              unoptimized
              className="object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setLightboxIndex((prev) =>
                prev === null ? null : (prev + 1) % galleryImages.length
              )
            }
            className="absolute right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Floating WhatsApp Liaison */}
      <FloatingWhatsAppButton currentLocale={locale} />

      {/* Mobile Sticky Action Bar */}
      <MobileActionBar
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => {
          const bookingSection = document.getElementById("book-tour");
          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: "smooth" });
          } else {
            setModalOpen(true);
          }
        }}
      />

      {/* Bespoke Inquiry Modal */}
      <BespokeInquiryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dict={dict}
        currentLocale={locale}
        initialServiceId={currentService.id}
      />

      <Footer
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => setModalOpen(true)}
      />
    </div>
  );
}
