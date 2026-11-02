"use client";

import { useState } from "react";
import Link from "next/link";
import { Locale, getDictionary } from "@/translations";
import { getWhatsAppInquiryUrl, siteConfig } from "@/config/site-config";
import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";
import MobileActionBar from "./MobileActionBar";
import BespokeInquiryModal from "./BespokeInquiryModal";
import { submitContactInquiryAction } from "@/lib/server/contact-actions";
import {
  MapPin,
  Clock,
  Mail,
  MessageCircle,
  Shield,
  Send,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ContactPageViewProps {
  locale: Locale;
}

export default function ContactPageView({ locale }: ContactPageViewProps) {
  const dict = getDictionary(locale);
  const isRtl = locale === "ar";
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedService, setSelectedService] = useState("desert-safari");
  const [travelDate, setTravelDate] = useState("");
  const [guestCount, setGuestCount] = useState("2-guests");
  const [specialNotes, setSpecialNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inquiryCode, setInquiryCode] = useState("");

  const defaultVipWhatsAppUrl = getWhatsAppInquiryUrl(
    isRtl
      ? "مرحباً مكتب كونسيرج إم زد للسياحة قطر، أود التواصل المباشر معكم لتنسيق رحلة خاصة."
      : "Hello MZ Tourism Qatar Concierge Desk, I would like direct assistance with planning a private experience."
  );

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      // 1. Mandatory server-side validation & rate-limiting check
      const result = await submitContactInquiryAction({
        fullName,
        phone,
        email,
        serviceId: selectedService,
        travelDate,
        guestCount,
        specialNotes,
        honeypot,
      });

      if (!result.success || !result.inquiryCode) {
        setFormError(result.error || (isRtl ? "تعذر إرسال الاستفسار. يرجى التحقق من الحقول." : "Failed to submit inquiry. Please check the fields."));
        setIsSubmitting(false);
        return;
      }

      const code = result.inquiryCode;
      setInquiryCode(code);
      setIsSubmitted(true);

      const serviceObj = dict.services.find((s) => s.id === selectedService);
      const serviceTitle = serviceObj ? serviceObj.title : selectedService;

      const guestLabel =
        dict.bookingEngine.optionsGuests.find((g) => g.id === guestCount)?.label || guestCount;

      const fullMessage =
        locale === "ar"
          ? `طلب استفسار كونسيرج رسمي [كود: ${code}] - إم زد للسياحة قطر:
• الاسم الكريم: ${fullName}
• الهاتف / واتساب: ${phone}
• البريد الإلكتروني: ${email || "غير محدد"}
• الخدمة المطلوبة: ${serviceTitle}
• تاريخ الرحلة: ${travelDate || "مرن / قيد التحديد"}
• عدد الضيوف والمركبة: ${guestLabel}
• ملاحظات إضافية: ${specialNotes || "لا توجد"}

يرجى مراجعة التوافر وموافاتنا ببرنامج الرحلة وعرض السعر المخصص.`
          : `Official Concierge Inquiry [Code: ${code}] - MZ Tourism Qatar:
• Guest Name: ${fullName}
• Phone / WhatsApp: ${phone}
• Email: ${email || "Not specified"}
• Requested Service: ${serviceTitle}
• Travel Date: ${travelDate || "Flexible / Pending"}
• Guests & Vehicle: ${guestLabel}
• Special Notes: ${specialNotes || "None"}

Please verify availability and provide the customized itinerary and quotation.`;

      const sendUrl = getWhatsAppInquiryUrl(fullMessage);
      window.open(sendUrl, "_blank", "noopener,noreferrer");
    } catch {
      setFormError(isRtl ? "حدث خطأ غير متوقع أثناء معالجة الاستفسار." : "An unexpected error occurred while processing your inquiry.");
    } finally {
      setIsSubmitting(false);
    }
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
        onOpenInquiryModal={() => setModalOpen(true)}
      />

      <main className="w-full pt-28 pb-20">
        {/* Page Hero */}
        <div className="relative py-16 sm:py-24 bg-surface border-b border-primary/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-container-high/40 via-surface to-surface-container-lowest" />
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-6 font-medium">
              <Link href={`/${locale}`} className="hover:text-primary transition-colors">
                {dict.nav.home}
              </Link>
              {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="text-primary font-semibold">{dict.nav.contact}</span>
            </div>

            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">
              {dict.contactPage.subtitle}
            </span>
            <h1 className="font-headline text-3xl sm:text-5xl font-semibold text-on-surface max-w-3xl leading-tight">
              {dict.contactPage.title}
            </h1>
          </div>
        </div>

        {/* Contact Information & Interactive Form */}
        <section className="py-16 bg-surface-container-low/40">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Direct Info Cards */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-2">
                    {dict.brand.concierge}
                  </span>
                  <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-on-surface">
                    {dict.contactPage.hqTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
                    {isRtl
                      ? "يسعدنا استقبال استفساراتكم عبر الواتساب على مدار الساعة أو عبر البريد الإلكتروني لتنسيق كافة المسارات السياحية الفاخرة."
                      : "Our private concierge desk operates 24/7 to orchestrate seamless luxury dispatches, airport meet & assists, and VIP desert expeditions."}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Address */}
                  <div className="p-5 rounded-2xl bg-surface-container border border-primary/20 flex items-start gap-3.5 shadow-md">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface block mb-1">
                        {isRtl ? "الموقع الجغرافي" : "Physical Address"}
                      </span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {dict.contactPage.hqAddress}
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="p-5 rounded-2xl bg-surface-container border border-primary/20 flex items-start gap-3.5 shadow-md">
                    <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface block mb-1">
                        {dict.contactPage.hoursTitle}
                      </span>
                      <p className="text-xs text-on-surface-variant">
                        {dict.contactPage.hoursText}
                      </p>
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="p-5 rounded-2xl bg-surface-container border border-primary/20 flex items-start gap-3.5 shadow-md">
                    <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface block">
                        {isRtl ? "البريد الإلكتروني الرسمي" : "Official Inquiries"}
                      </span>
                      <a
                        href={`mailto:${siteConfig.contact.email}`}
                        className="text-xs text-on-surface-variant font-mono hover:text-primary transition-colors block"
                      >
                        {siteConfig.contact.email}
                      </a>
                      <p className="text-xs text-primary font-mono font-semibold pt-1">
                        {siteConfig.whatsapp.displayWithNote}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instant WhatsApp Direct Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-surface-container-high to-surface-container border border-primary/30 space-y-3 shadow-xl">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span>{dict.nav.whatsAppVip}</span>
                  </div>
                  <h3 className="font-headline text-lg font-semibold text-on-surface">
                    {isRtl ? "تحدث مع رئيس الكونسيرج الآن" : "Direct WhatsApp Liaison"}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {isRtl
                      ? "للحجوزات العاجلة خلال 24 ساعة، تواصل مباشرة عبر واتساب للحصول على استجابة فورية."
                      : "For urgent inquiries within 24 hours, message our lead concierge directly for real-time fleet availability."}
                  </p>
                  <a
                    href={defaultVipWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 min-h-[46px] px-6 rounded-xl bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary-container transition-all shadow-md shadow-primary/25"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isRtl ? "فتح محادثة واتساب الفورية" : "Open Instant WhatsApp Chat"}</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Custom Inquiry Form */}
              <div className="lg:col-span-7">
                <div className="p-6 sm:p-8 rounded-3xl bg-surface-container border border-primary/25 shadow-2xl">
                  {isSubmitted ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>
                      <h3 className="font-headline text-2xl font-semibold text-on-surface">
                        {isRtl ? "تم استلام طلب الاستفسار بنجاح" : "VIP Inquiry Successfully Logged"}
                      </h3>
                      <p className="text-xs text-primary font-mono font-bold">
                        {isRtl ? `الرقم المرجعي: ${inquiryCode}` : `Reference Code: ${inquiryCode}`}
                      </p>
                      <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                        {isRtl
                          ? "تم نقل معايير رحلتك عبر واتساب إلى فريق الاستقبال بالدوحة. سنقوم بمراجعة المركبات والأوقات وتزويدكم بعرض السعر الرسمي وقسيمة الحجز. لا يتم سحب أي مبالغ مالية عبر الموقع."
                          : "Your custom tour parameters have been transferred directly to our concierge team in Doha via WhatsApp. Our team will verify vehicle dispatches and confirm your personalized proposal. No payment is charged online."}
                      </p>
                      <div className="pt-4 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsSubmitted(false)}
                          className="px-6 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors"
                        >
                          {isRtl ? "إرسال طلب جديد" : "Submit Another Request"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitInquiry} className="space-y-5">
                      {/* Honeypot field for bot deterrence (hidden from human visitors) */}
                      <div className="hidden" aria-hidden="true">
                        <label htmlFor="contact_hp_website">Website</label>
                        <input
                          id="contact_hp_website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                        />
                      </div>

                      {formError && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                          <span>{formError}</span>
                        </div>
                      )}

                      <div>
                        <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-1">
                          {dict.contactPage.directInquiryTitle}
                        </span>
                        <p className="text-xs text-on-surface-variant">
                          {dict.contactPage.directInquirySubtitle}
                        </p>
                      </div>

                      {/* Guest Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                            {dict.modal.nameLabel} *
                          </label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={dict.modal.namePlaceholder}
                            className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                            {dict.modal.phoneLabel} *
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={dict.modal.phonePlaceholder}
                            className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                          {dict.modal.emailLabel}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={dict.modal.emailPlaceholder}
                          className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Service Selection */}
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                          {dict.bookingEngine.labelExperience} *
                        </label>
                        <select
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          {dict.services.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date & Guests */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                            {dict.bookingEngine.labelDate}
                          </label>
                          <input
                            type="date"
                            value={travelDate}
                            onChange={(e) => setTravelDate(e.target.value)}
                            className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                            {dict.bookingEngine.labelGuests}
                          </label>
                          <select
                            value={guestCount}
                            onChange={(e) => setGuestCount(e.target.value)}
                            className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            {dict.bookingEngine.optionsGuests.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                          {dict.modal.notesLabel}
                        </label>
                        <textarea
                          rows={3}
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          placeholder={dict.modal.notesPlaceholder}
                          className="w-full p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                      </div>

                      {/* Submit */}
                      <div className="pt-2 space-y-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full min-h-[50px] rounded-xl bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{isRtl ? "جارٍ التحقق من الطلب..." : "Verifying Submission..."}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>{isRtl ? "إرسال الاستفسار عبر واتساب" : "Transmit Inquiry via WhatsApp"}</span>
                            </>
                          )}
                        </button>

                        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex items-start gap-2.5 text-[11px] text-on-surface-variant">
                          <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{dict.contactPage.transparencyNotice}</span>
                        </div>
                      </div>
                    </form>
                  )}
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
