"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { TranslationDict, Locale } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  X,
  Clock,
  Car,
  CheckCircle2,
  XCircle,
  Shield,
  MessageCircle,
  Sparkles,
  Send,
} from "lucide-react";

interface ServiceDetailModalProps {
  serviceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  dict: TranslationDict;
  currentLocale: Locale;
}

export default function ServiceDetailModal({
  serviceId,
  isOpen,
  onClose,
  dict,
  currentLocale,
}: ServiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary" | "inquire">("overview");
  const isRtl = currentLocale === "ar";

  // Inquiry form states
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [guestCount, setGuestCount] = useState("2 Guests");
  const [specialNotes, setSpecialNotes] = useState("");
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [generatedRef, setGeneratedRef] = useState("");

  const service = dict.services.find((s) => s.id === serviceId) || dict.services[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset tab on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setInquirySubmitted(false);
    }
  }, [isOpen, serviceId]);

  if (!isOpen || !service) return null;

  const directWhatsAppUrl = getWhatsAppInquiryUrl(service.inquiryMessage);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refCode = "MZ-" + Math.floor(100000 + Math.random() * 900000);
    setGeneratedRef(refCode);
    setInquirySubmitted(true);

    const fullMessage =
      currentLocale === "ar"
        ? `طلب استفسار خاص [مرجع: ${refCode}] - إم زد للسياحة قطر:
• الخدمة: ${service.title}
• تاريخ الرحلة: ${travelDate || "مرن / قيد التحديد"}
• عدد الضيوف: ${guestCount}
• اسم الضيف: ${guestName}
• هاتف / واتساب: ${guestContact}
• طلبات خاصة: ${specialNotes || "لا توجد"}

يرجى مراجعة التوافر وموافاتنا بعرض السعر الرسمي.`
        : `Private Tour Inquiry [Ref: ${refCode}] - MZ Tourism Qatar:
• Service: ${service.title}
• Preferred Date: ${travelDate || "Flexible / Pending"}
• Guests: ${guestCount}
• Primary Guest: ${guestName}
• Phone / WhatsApp: ${guestContact}
• Special Requests: ${specialNotes || "None"}

Please verify vehicle dispatch & guide availability and share the bespoke proposal.`;

    const sendUrl = getWhatsAppInquiryUrl(fullMessage);
    window.open(sendUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-container-lowest/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-surface-container rounded-3xl border border-primary/30 shadow-2xl shadow-black/90 max-h-[92vh] overflow-y-auto z-10 flex flex-col">
        {/* Header Hero Image & Close */}
        <div className="relative w-full h-52 sm:h-64 bg-surface-container-high shrink-0 overflow-hidden">
          <Image
            src={service.image}
            alt={service.title}
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/50 to-black/40" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-lowest/80 text-on-surface hover:text-primary backdrop-blur-md flex items-center justify-center border border-outline-variant/30 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header metadata */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1 text-on-surface">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/90 text-secondary-fixed text-[10px] font-semibold uppercase tracking-wider">
                {service.category.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high/90 text-primary text-[10px] font-semibold flex items-center gap-1 border border-primary/20">
                <Clock className="w-3 h-3 text-primary" />
                <span>{service.duration}</span>
              </span>
            </div>
            <h2 className="font-headline text-lg sm:text-2xl font-semibold leading-tight text-on-surface">
              {service.title}
            </h2>
            <p className="text-xs text-primary font-medium">{service.subtitle}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/20 bg-surface-container-high/50 px-4 sm:px-6 sticky top-0 z-20 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {isRtl ? "نظرة عامة والمزايا" : "Overview & Inclusions"}
          </button>
          <button
            onClick={() => setActiveTab("itinerary")}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "itinerary"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {isRtl ? "مسار الرحلة بالتوقيت" : "Itinerary Schedule"}
          </button>
          <button
            onClick={() => setActiveTab("inquire")}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "inquire"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {isRtl ? "طلب استفسار عبر واتساب" : "Inquire / Quote"}
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="p-5 sm:p-7 space-y-6">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
                {isRtl ? "عن التجربة" : "Experience Summary"}
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 text-xs">
              <div className="flex items-start gap-2.5">
                <Car className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-on-surface block">
                    {isRtl ? "نوع المركبة والأسطول:" : "Vehicle Specification:"}
                  </span>
                  <span className="text-on-surface-variant">{service.vehicleType}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-on-surface block">
                    {isRtl ? "الملائمة والخصوصية:" : "Suitability & Privacy:"}
                  </span>
                  <span className="text-on-surface-variant">{service.suitability}</span>
                </div>
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{isRtl ? "ما تشمله الخدمة" : "Included in Experience"}</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-on-surface-variant">
                  {service.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-outline" />
                  <span>{isRtl ? "ما لا تشمله الخدمة" : "Not Included"}</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-on-surface-variant">
                  {service.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline shrink-0 mt-1.5" />
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>

                {/* What to bring */}
                <div className="pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
                    {isRtl ? "ما يُنصح باصطحابه" : "Recommended Attire / Essentials"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {service.whatToBring.map((item, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[11px]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Note & Action Footer */}
            <div className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-on-surface-variant block">
                  {isRtl ? "التسعير المبدئي:" : "Indicative Pricing:"}
                </span>
                <span className="font-headline text-lg font-bold text-primary">
                  {service.indicativePrice}
                </span>
                <span className="text-[10px] text-on-surface-variant/70 block mt-0.5">
                  {service.priceNote}
                </span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <a
                  href={directWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isRtl ? "استفسار سريع بالواتساب" : "WhatsApp Inquiry"}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveTab("inquire")}
                  className="flex-1 sm:flex-none min-h-[44px] px-4 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/30 transition-colors"
                >
                  {isRtl ? "طلب مخصص" : "Custom Itinerary"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Itinerary Flow */}
        {activeTab === "itinerary" && (
          <div className="p-5 sm:p-7 space-y-6">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
                {isRtl ? "الجدول الزمني للرحلة" : "Estimated Timeline"}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {isRtl
                  ? "كافة المواعيد مرنة ويمكن تعديلها بالكامل لتناسب جدولكم الخاص ومواعيد وصول رحلاتكم."
                  : "All departure timings are fully flexible and can be adapted to your personal schedule and flight arrivals."}
              </p>
            </div>

            {/* Timeline Stacking */}
            <div className="relative border-l-2 border-primary/30 ml-4 pl-5 space-y-6 py-2">
              {service.itinerary.map((step, idx) => (
                <div key={idx} className="relative group">
                  {/* Pin Dot */}
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface-container group-hover:scale-125 transition-transform" />
                  <span className="text-[11px] font-bold text-primary tracking-wider uppercase block">
                    {step.time}
                  </span>
                  <h4 className="font-headline text-sm font-semibold text-on-surface mt-0.5">
                    {step.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-high/60 border border-primary/20 text-xs text-on-surface-variant flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                {isRtl
                  ? "هل لديك جدول ترانزيت محدد؟ يمكن لفريقنا إعداد مسار خاص محسوب بالدقائق من وإلى مطار حمد الدولي."
                  : "Have a specific flight layover window? Our team can construct a minute-by-minute itinerary tailored to Hamad International Airport transit schedules."}
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab("inquire")}
                className="min-h-[44px] px-6 rounded-xl bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary-container transition-all"
              >
                {isRtl ? "طلب هذا المسار" : "Request This Itinerary"}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Custom Inquiry Form */}
        {activeTab === "inquire" && (
          <div className="p-5 sm:p-7 space-y-5">
            {inquirySubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-headline text-xl text-on-surface font-semibold">
                  {isRtl ? "تم تحويل استفسارك إلى الكونسيرج" : "Inquiry Prepared & Handed to Concierge"}
                </h3>
                <p className="text-xs text-primary font-mono font-bold">
                  {isRtl ? `الرقم المرجعي: ${generatedRef}` : `Reference: ${generatedRef}`}
                </p>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                  {isRtl
                    ? "تم فتح رسالة الطلب عبر تطبيق واتساب. سيقوم مسؤول الكونسيرج بمراجعة التوافر والأوقات وإرسال قسيمة التأكيد المعتمدة. لا يتم خصم أي مبالغ إلكترونية."
                    : "Your itinerary request was transferred to WhatsApp with your reference. Our concierge in Doha will review vehicle dispatches and confirm availability directly. No payment is charged online."}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
                >
                  {isRtl ? "إغلاق النافذة" : "Close Window"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
                    {isRtl ? "طلب استفسار مخصص" : "Bespoke Service Inquiry"}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {isRtl
                      ? "أدخل بياناتك للحصول على عرض سعر رسمي وتأكيد مباشر للمركبة عبر واتساب."
                      : "Enter your preferences to receive a tailored quotation and real-time availability via WhatsApp."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-medium">
                      {isRtl ? "الاسم الكامل *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder={isRtl ? "سعادة / الأستاذ..." : "e.g. Lord Alexander Wright"}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-medium">
                      {isRtl ? "رقم الواتساب / الهاتف *" : "WhatsApp / Phone *"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestContact}
                      onChange={(e) => setGuestContact(e.target.value)}
                      placeholder="+974 ..."
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-medium">
                      {isRtl ? "التاريخ المفضل" : "Preferred Travel Date"}
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-medium">
                      {isRtl ? "عدد الضيوف" : "Number of Guests"}
                    </label>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="1 Guest">1 Guest • Executive Chauffeur</option>
                      <option value="2 Guests">2 Guests • Private 4x4 / Sedan</option>
                      <option value="4 Guests">4 Guests • Luxury Fleet</option>
                      <option value="6 Guests">6 Guests • Family VIP Sprinter</option>
                      <option value="VIP Delegation">VIP Delegation (7+ Guests)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1 font-medium">
                    {isRtl ? "ملاحظات إضافية أو طلبات خاصة" : "Special Requests or Dietary Requirements"}
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={
                      isRtl
                        ? "مثال: مقعد أطفال، مرشد يتحدث الفرنسية، استقبال ترانزيت بالمطار..."
                        : "e.g., Infant seat, French guide preference, Hamad Airport transit pickup..."
                    }
                    className="w-full p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    className="w-full min-h-[48px] rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs uppercase tracking-wider font-semibold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isRtl ? "إرسال وتأكيد الطلب بالواتساب" : "Send Inquiry via WhatsApp"}</span>
                  </button>

                  <p className="text-[11px] text-on-surface-variant/80 text-center flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {isRtl
                        ? "لا يتم سحب أي مبالغ من الموقع • كافة الحجوزات تؤكد مباشرة مع الكونسيرج"
                        : "No automated charges on this website • All arrangements confirmed with concierge"}
                    </span>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
