"use client";

import { useState } from "react";
import {
  X,
  Send,
  Check,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Loader2,
  Copy,
  ExternalLink,
  Compass,
  MapPin,
  Hotel,
  Car,
  AlertCircle,
} from "lucide-react";
import { createCustomTripRequestAction } from "@/lib/server/booking-actions";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import { Locale } from "@/translations";

interface BespokePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocale?: Locale;
}

export default function BespokePlannerModal({
  isOpen,
  onClose,
  currentLocale = "en",
}: BespokePlannerModalProps) {
  const isRtl = currentLocale === "ar";

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [inquiryCode, setInquiryCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    destinations: ["Qatar (Doha & Inland Sea)"],
    experiences: ["Desert Safaris & Inland Sea"],
    adults: 2,
    children: 0,
    timeframe: "Next 30 Days",
    accommodationPreference: "5-Star Luxury Beach Resort (e.g. Banana Island / Waldorf)",
    transportPreference: "Private Luxury 4x4 & Executive Chauffeur Fleet",
    budget: "Luxury ($5,000 - $15,000+)",
    notes: "",
  });

  if (!isOpen) return null;

  const experienceOptions = [
    {
      id: "Desert Safaris & Inland Sea",
      en: "Desert Safaris & Khor Al Adaid (Inland Sea)",
      ar: "سفاري الصحراء وخور العديد (البحر الداخلي)",
    },
    {
      id: "Qatar City & Cultural Heritage",
      en: "Qatar City, Museums & Cultural Heritage",
      ar: "جولات الدوحة والمتاحف والتراث الثقافي",
    },
    {
      id: "VIP Chauffeur & Private Fleet",
      en: "VIP Chauffeur & Armored / Maybach Fleet",
      ar: "أسطول مرسيدس مايباخ وخدمة السائق الخاص",
    },
    {
      id: "Private Island & Overwater Villas",
      en: "Private Island & Overwater Luxury Villas",
      ar: "منتجعات الجزر الخاصة والفلل فوق الماء",
    },
    {
      id: "Royal Arabian Equestrian",
      en: "Royal Arabian Equestrian & Desert Riding",
      ar: "ركوب الخيل العربية الملكية في الكثبان",
    },
    {
      id: "Private Desert Galas & Stargazing",
      en: "Private Desert Galas & Luxury Bedouin Camps",
      ar: "حفلات العشاء الخاصة ومخيمات التخييم الفاخرة",
    },
    {
      id: "Multi-Country GCC Circuit",
      en: "Multi-Country GCC Circuit (Qatar / Saudi / UAE / Oman)",
      ar: "مسار خليجي مشترك (قطر / السعودية / الإمارات / عمان)",
    },
  ];

  const destinationOptions = [
    { id: "Qatar (Doha & Inland Sea)", en: "State of Qatar (Doha & Inland Sea)", ar: "دولة قطر (الدوحة والبحر الداخلي)" },
    { id: "Saudi Arabia (AlUla & Riyadh)", en: "Saudi Arabia (AlUla, Riyadh & Red Sea)", ar: "المملكة العربية السعودية (العلا والرياض)" },
    { id: "United Arab Emirates (Dubai & Abu Dhabi)", en: "United Arab Emirates (Dubai & Abu Dhabi)", ar: "دولة الإمارات (دبي وأبوظبي)" },
    { id: "Sultanate of Oman (Musandam & Salalah)", en: "Sultanate of Oman (Musandam Fjords & Salalah)", ar: "سلطنة عمان (مسندم وصلالة)" },
  ];

  const handleToggleExperience = (expId: string) => {
    setFormData((prev) => {
      const exists = prev.experiences.includes(expId);
      const updated = exists
        ? prev.experiences.filter((e) => e !== expId)
        : [...prev.experiences, expId];
      // Ensure at least one remains selected
      return {
        ...prev,
        experiences: updated.length > 0 ? updated : [expId],
      };
    });
  };

  const handleToggleDestination = (destId: string) => {
    setFormData((prev) => {
      const exists = prev.destinations.includes(destId);
      const updated = exists
        ? prev.destinations.filter((d) => d !== destId)
        : [...prev.destinations, destId];
      return {
        ...prev,
        destinations: updated.length > 0 ? updated : [destId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMsg(
        isRtl
          ? "يرجى تعبئة الاسم والبريد الإلكتروني ورقم الهاتف."
          : "Please complete your full name, email, and contact phone."
      );
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    const totalParty = `${formData.adults} Adults${
      formData.children > 0 ? `, ${formData.children} Children` : ""
    }`;

    try {
      const res = await createCustomTripRequestAction({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        destinations: formData.destinations,
        experiences: formData.experiences,
        adults: formData.adults,
        children: formData.children,
        partySize: totalParty,
        timeframe: formData.timeframe,
        budget: formData.budget,
        accommodationPreference: formData.accommodationPreference,
        transportPreference: formData.transportPreference,
        notes: formData.notes.trim() || undefined,
        preferredLocale: currentLocale,
        honeypot: "",
      });

      if (res.success && res.data) {
        setInquiryCode(res.data.requestRef);
        setSubmitted(true);
      } else {
        setErrorMsg(
          res.error ||
            (isRtl
              ? "تعذر حفظ طلب المسار المخصص. يرجى مراجعة البيانات."
              : "Unable to save your bespoke brief. Please try again or contact concierge.")
        );
      }
    } catch (err) {
      console.error("[Custom Brief Submit Error]", err);
      setErrorMsg(
        isRtl
          ? "حدث خطأ غير متوقع. يرجى التواصل عبر واتساب مباشرة."
          : "An unexpected error occurred. Please contact our concierge directly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setInquiryCode("");
    setFormData({
      name: "",
      email: "",
      phone: "",
      destinations: ["Qatar (Doha & Inland Sea)"],
      experiences: ["Desert Safaris & Inland Sea"],
      adults: 2,
      children: 0,
      timeframe: "Next 30 Days",
      accommodationPreference: "5-Star Luxury Beach Resort (e.g. Banana Island / Waldorf)",
      transportPreference: "Private Luxury 4x4 & Executive Chauffeur Fleet",
      budget: "Luxury ($5,000 - $15,000+)",
      notes: "",
    });
  };

  // Pre-filled WhatsApp message containing ONLY non-sensitive info
  const whatsAppMessage =
    currentLocale === "ar"
      ? `مرحباً إم زد للسياحة قطر، تم تسجيل طلب تصميم مسار رحلة مخصص:
• الرقم المرجعي للطلب: ${inquiryCode}
• النطاق الجغرافي: ${formData.destinations.join("، ")}
• التجارب المطلوبة: ${formData.experiences.join("، ")}
• عدد الضيوف: ${formData.adults} بالغين${formData.children > 0 ? `، ${formData.children} أطفال` : ""}
• الإطار الزمني: ${formData.timeframe}

يرجى مراجعة المحددات والتواصل معنا لتصميم خط السير.`
      : `Hello MZ Tourism Qatar, I have filed a custom journey brief:
• Reference: ${inquiryCode}
• Regional Scope: ${formData.destinations.join(", ")}
• Experiences: ${formData.experiences.join(", ")}
• Party Size: ${formData.adults} Adults${formData.children > 0 ? `, ${formData.children} Children` : ""}
• Timeframe: ${formData.timeframe}

Please review our parameters and connect with our journey designer.`;

  const whatsAppUrl = getWhatsAppInquiryUrl(whatsAppMessage);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-surface-container rounded-3xl border border-primary/30 shadow-2xl shadow-black/90 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="p-6 bg-surface-container-high/90 border-b border-outline-variant/20 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-primary font-bold">
                {isRtl ? "أتيليه الكونسيرج الخاص" : "Private Concierge Atelier"}
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
              {isRtl ? "تصميم رحلتك الخليجية المخصصة" : "Curate Your Bespoke Arabian Journey"}
            </h2>
            <p className="text-on-surface-variant text-xs sm:text-sm font-light">
              {isRtl
                ? "خصص كل بعد من أبعاد رحلتك عبر دولة قطر ومنطقة الخليج العربي بسرية واحترافية تامة."
                : "Tailor every dimension of your private itinerary across Qatar and the Arabian Gulf."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-on-surface">
          {submitted ? (
            /* Confirmation Screen */
            <div className="p-8 rounded-2xl border border-primary/40 bg-surface-container-lowest text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 text-primary mx-auto flex items-center justify-center shadow-lg shadow-primary/10">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-headline text-2xl font-bold text-on-surface">
                  {isRtl ? "تم تسجيل موجز رحلتك المخصصة" : "Bespoke Journey Brief Registered"}
                </h3>
                <p className="text-on-surface-variant text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                  {isRtl
                    ? `شكراً لك، ${formData.name}. تم تسجيل محددات رحلتك بنجاح لدى مكتب كونسيرج إم زد للسياحة قطر:`
                    : `Thank you, ${formData.name}. Your custom itinerary brief has been securely logged with the MZ Tourism concierge desk:`}
                </p>
              </div>

              {/* Inquiry Reference Box */}
              <div className="max-w-xs mx-auto p-3.5 rounded-xl bg-surface-container border border-primary/40 flex items-center justify-between">
                <div className="text-left font-mono" style={{ textAlign: isRtl ? "right" : "left" }}>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block">
                    {isRtl ? "رمز الاستفسار المرجعي" : "Inquiry Reference"}
                  </span>
                  <span className="text-lg font-bold text-primary tracking-wider">
                    {inquiryCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inquiryCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:text-primary border border-outline-variant/30 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <span className="text-primary text-[11px]">{isRtl ? "تم النسخ" : "Copied"}</span>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{isRtl ? "نسخ" : "Copy"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Brief Snapshot (Non-sensitive) */}
              <div className="p-4 rounded-xl bg-surface-container-high/40 border border-outline-variant/20 text-xs max-w-md mx-auto space-y-1.5 font-mono text-on-surface-variant" style={{ textAlign: isRtl ? "right" : "left" }}>
                <div>
                  <span className="text-primary font-semibold">{isRtl ? "الوجهات: " : "Destinations: "}</span>
                  {formData.destinations.join(", ")}
                </div>
                <div>
                  <span className="text-primary font-semibold">{isRtl ? "التجارب: " : "Experiences: "}</span>
                  {formData.experiences.join(", ")}
                </div>
                <div>
                  <span className="text-primary font-semibold">{isRtl ? "الضيوف والموعد: " : "Party & Window: "}</span>
                  {formData.adults} Adults{formData.children > 0 && `, ${formData.children} Children`} • {formData.timeframe}
                </div>
              </div>

              {/* Direct WhatsApp Concierge CTA */}
              <div className="pt-2 max-w-md mx-auto space-y-3">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[48px] rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {isRtl ? "مناقشة تفاصيل المسار عبر واتساب" : "Discuss Brief via WhatsApp Concierge"}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant hover:text-on-surface hover:border-primary transition-colors cursor-pointer"
                  >
                    {isRtl ? "إنشاء طلب مسار آخر" : "Create Another Brief"}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface text-xs transition-colors cursor-pointer"
                  >
                    {isRtl ? "إغلاق" : "Close"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Custom Trip Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Regional Scope & Destinations */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "1. النطاق الإقليمي والوجهات" : "1. Regional Scope & Destinations"}</span>
                  </span>
                  <span className="text-primary text-[11px] font-mono">
                    {formData.destinations.length} {isRtl ? "محددة" : "selected"}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {destinationOptions.map((dest) => {
                    const active = formData.destinations.includes(dest.id);
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => handleToggleDestination(dest.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          active
                            ? "bg-primary/15 border-primary text-on-surface"
                            : "bg-surface-container-high/60 border-outline-variant/20 text-on-surface-variant hover:border-primary/40"
                        }`}
                        style={{ textAlign: isRtl ? "right" : "left" }}
                      >
                        <span className="line-clamp-1">{isRtl ? dest.ar : dest.en}</span>
                        {active && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Experiences / Trip Style */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "2. نمط الرحلة والتجارب المطلوبة" : "2. Desired Experiences & Trip Style"}</span>
                  </span>
                  <span className="text-primary text-[11px] font-mono">
                    {formData.experiences.length} {isRtl ? "محددة" : "selected"}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {experienceOptions.map((exp) => {
                    const active = formData.experiences.includes(exp.id);
                    return (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => handleToggleExperience(exp.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          active
                            ? "bg-primary/15 border-primary text-on-surface"
                            : "bg-surface-container-high/60 border-outline-variant/20 text-on-surface-variant hover:border-primary/40"
                        }`}
                        style={{ textAlign: isRtl ? "right" : "left" }}
                      >
                        <span className="line-clamp-1">{isRtl ? exp.ar : exp.en}</span>
                        {active && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Party Size & Timeframe */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Adults & Children */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "عدد الضيوف (البالغين والأطفال)" : "Party Composition"}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <select
                        value={formData.adults}
                        onChange={(e) => setFormData({ ...formData, adults: Number(e.target.value) })}
                        className="w-full px-2.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((num) => (
                          <option key={num} value={num}>
                            {num} {isRtl ? "بالغين" : "Adults"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <select
                        value={formData.children}
                        onChange={(e) => setFormData({ ...formData, children: Number(e.target.value) })}
                        className="w-full px-2.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                          <option key={num} value={num}>
                            {num} {isRtl ? "أطفال" : "Children"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Timeframe */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "الإطار الزمني المرن" : "Travel Timeframe"}
                  </label>
                  <select
                    value={formData.timeframe}
                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="Next 7 Days (Immediate)">Next 7 Days (Immediate Departure)</option>
                    <option value="Next 30 Days">Next 30 Days</option>
                    <option value="1 - 3 Months Ahead">1 - 3 Months Ahead</option>
                    <option value="Next Season (Winter 2026/2027)">Next Season (Winter 2026/2027)</option>
                    <option value="Flexible / Undecided">Flexible / Undecided</option>
                  </select>
                </div>

                {/* Budget Range */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "الميزانية التقديرية" : "Target Budget Scope"}
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="Bespoke ($2,500 - $5,000)">Bespoke ($2,500 - $5,000)</option>
                    <option value="Luxury ($5,000 - $15,000+)">Luxury ($5,000 - $15,000+)</option>
                    <option value="Ultra-Luxe ($15,000 - $50,000)">Ultra-Luxe ($15,000 - $50,000)</option>
                    <option value="Royal / Presidential Delegation">Royal / Presidential Delegation</option>
                  </select>
                </div>
              </div>

              {/* 4. Accommodation & Transport Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1 flex items-center gap-1.5">
                    <Hotel className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "تفضيل الإقامة والمنتجعات" : "Accommodation Preference"}</span>
                  </label>
                  <select
                    value={formData.accommodationPreference}
                    onChange={(e) => setFormData({ ...formData, accommodationPreference: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="5-Star Luxury Beach Resort (e.g. Banana Island / Waldorf)">
                      5-Star Luxury Beach Resort (Banana Island / Waldorf Astoria)
                    </option>
                    <option value="Ultra-Luxe City Hotel (e.g. Raffles Doha / Mandarin Oriental)">
                      Ultra-Luxe City Hotel (Raffles Doha / Mandarin Oriental)
                    </option>
                    <option value="Private Desert Glamping & Heritage Camp">
                      Private Desert Glamping & Heritage Camp
                    </option>
                    <option value="Not Required (Transport & Tours Only)">
                      Not Required (Transport & Day Tours Only)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "تفضيل أسطول التنقل" : "Transport Preference"}</span>
                  </label>
                  <select
                    value={formData.transportPreference}
                    onChange={(e) => setFormData({ ...formData, transportPreference: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="Private Luxury 4x4 & Executive Chauffeur Fleet">
                      Private Luxury 4x4 & Executive Chauffeur Fleet
                    </option>
                    <option value="Mercedes Maybach / S-Class VIP Sedan">
                      Mercedes Maybach / S-Class VIP Sedan
                    </option>
                    <option value="Luxury Mercedes Sprinter (VIP Delegation)">
                      Luxury Mercedes Sprinter (VIP Delegation)
                    </option>
                    <option value="Helicopter Transfer / Air Charter Coordination">
                      Helicopter Transfer / Air Charter Coordination
                    </option>
                  </select>
                </div>
              </div>

              {/* 5. Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "اسم الضيف الكامل *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isRtl ? "الاسم الكريم..." : "Sheikh / Lord / Mr. / Ms."}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "البريد الإلكتروني *" : "Email Address *"}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="concierge@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "رقم الواتساب / الهاتف *" : "WhatsApp / Mobile *"}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+974 5500 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                  {isRtl
                    ? "طلبات خاصة (بروتوكول المطار، شيف خاص، متطلبات خصوصية...)"
                    : "Special Requests (Tarmac Protocol, Falconry Masterclass, Private Butler, etc.)"}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    isRtl
                      ? "شارك أي رغبات تتعلق بالخصوصية أو مسار الرحلة..."
                      : "Share any special preferences for dining, privacy, or executive logistics..."
                  }
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Submit Row */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/20">
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    {isRtl
                      ? "ضمان الخصوصية وسرية بيانات الضيوف والوفود الرسمية"
                      : "Strict Discretion & Client Non-Disclosure Honored"}
                  </span>
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? "جارٍ تسجيل الموجز..." : "Filing Brief..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isRtl ? "إرسال طلب المسار المخصص" : "Submit Custom Brief"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
