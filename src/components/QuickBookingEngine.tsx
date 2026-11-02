"use client";

import { useState, useMemo } from "react";
import { TranslationDict, Locale } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  Compass,
  Calendar,
  Users,
  Car,
  MapPin,
  MessageCircle,
  Sparkles,
  Shield,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface QuickBookingEngineProps {
  dict: TranslationDict;
  currentLocale: Locale;
  onOpenModalWithService: (serviceId: string) => void;
}

export default function QuickBookingEngine({
  dict,
  currentLocale,
  onOpenModalWithService,
}: QuickBookingEngineProps) {
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Experience state
  const [selectedServiceId, setSelectedServiceId] = useState<string>("desert-safari");

  // 2. Travel Date state
  const [selectedDate, setSelectedDate] = useState<string>("");

  // 3. Guests state
  const [selectedGuests, setSelectedGuests] = useState<string>("2-guests");

  // 4. Vehicle / Experience Type state (dynamically reset when service changes)
  const [selectedTier, setSelectedTier] = useState<string>("");

  // 5. Pick-up Location state
  const [selectedPickup, setSelectedPickup] = useState<string>("westbay");
  const [customPickupText, setCustomPickupText] = useState<string>("");

  // Contextual Vehicle / Experience Type tiers per experience
  const contextualTiers = useMemo(() => {
    switch (selectedServiceId) {
      case "desert-safari":
        return isRtl
          ? [
              { id: "4x4-landcruiser", label: "مركبة دفع رباعي لاندكروزر (مجهزة للكثبان)" },
              { id: "vip-dune-edition", label: "فئة كبار الشخصيات VIP (فخامة معززة)" },
              { id: "family-patrol", label: "نيسان باترول عائلية فاخرة (7 مقاعد)" },
            ]
          : [
              { id: "4x4-landcruiser", label: "Private 4x4 Land Cruiser (Dune Ready)" },
              { id: "vip-dune-edition", label: "VIP Dune Edition (Armored / Elevated)" },
              { id: "family-patrol", label: "Luxury Family Patrol (7-Seater)" },
            ];

      case "airport-hotel-transfers":
        return isRtl
          ? [
              { id: "mercedes-s-class", label: "مرسيدس الفئة S (تنفيذي فاخر)" },
              { id: "mercedes-maybach", label: "مرسيدس مايباخ / رولز رويس (VIP)" },
              { id: "range-rover", label: "رينج روفر / كاديلاك إسكاليد" },
              { id: "vip-sprinter", label: "مرسيدس سبرينتر VIP (وفود ومجموعات)" },
            ]
          : [
              { id: "mercedes-s-class", label: "Mercedes-Benz S-Class (Executive)" },
              { id: "mercedes-maybach", label: "Mercedes-Maybach / Rolls-Royce (VIP)" },
              { id: "range-rover", label: "Range Rover / Cadillac Escalade" },
              { id: "vip-sprinter", label: "Luxury Mercedes Sprinter (VIP Group)" },
            ];

      case "doha-city-tours":
        return isRtl
          ? [
              { id: "executive-suv", label: "سيارة دفع رباعي تنفيذية مع سائق خاص" },
              { id: "luxury-v-class", label: "مرسيدس V-Class عائلية فارهة" },
              { id: "curated-cultural-walk", label: "جولة خاصة مع سائق واستكشاف ثقافي" },
            ]
          : [
              { id: "executive-suv", label: "Executive Private SUV & Chauffeur" },
              { id: "luxury-v-class", label: "Luxury Mercedes V-Class Van" },
              { id: "curated-cultural-walk", label: "Private Chauffeur & Curated Walk" },
            ];

      case "resort-stays":
        return isRtl
          ? [
              { id: "speedboat-villa", label: "يخت سريع خاص وإقامة فيلا شاطئية" },
              { id: "resort-daypass-chauffeur", label: "تصريح يومي لمنتجع شاطئي فاخر مع سائق" },
              { id: "overwater-villa-package", label: "باقة فيلا فوق الماء الملكية" },
            ]
          : [
              { id: "speedboat-villa", label: "Private Speedboat Transfer & Island Villa" },
              { id: "resort-daypass-chauffeur", label: "Luxury Beach Resort Day Pass & Chauffeur" },
              { id: "overwater-villa-package", label: "Royal Overwater Villa Experience" },
            ];

      case "horse-riding":
        return isRtl
          ? [
              { id: "sunrise-stallion", label: "شروق الشمس مع خيل عربية أصيلة (الشقَب)" },
              { id: "dune-sunset-gallop", label: "عدو على الكثبان عند الغروب مع شاي صحراوي" },
              { id: "master-trainer-session", label: "جلسة تدريب خاصة مع مدرب فروسية معتمد" },
            ]
          : [
              { id: "sunrise-stallion", label: "Sunrise Purebred Arabian Stallion Ride" },
              { id: "dune-sunset-gallop", label: "Golden Dune Sunset Ride & Desert Tea" },
              { id: "master-trainer-session", label: "Private Session with Master Trainer" },
            ];

      case "tent-desert-camp":
        return isRtl
          ? [
              { id: "royal-glamping-majlis", label: "مجلس ملكي مكيف مفروش بالسجاد الفاخر" },
              { id: "inland-sea-oasis", label: "مخيم خاص منعزل على شاطئ خور العديد" },
              { id: "astronomy-majlis", label: "مخيم ليلي مع رصد النجوم بالتلسكوب" },
            ]
          : [
              { id: "royal-glamping-majlis", label: "Air-Conditioned Royal Glamping Majlis" },
              { id: "inland-sea-oasis", label: "Secluded Inland Sea Private Enclave" },
              { id: "astronomy-majlis", label: "Overnight Telescope Astronomy Camp" },
            ];

      case "gcc-travel":
        return isRtl
          ? [
              { id: "overland-convoy", label: "موكب سيارات دفع رباعي فاخر لدول الخليج" },
              { id: "saudi-bahrain-chauffeur", label: "سائق خاص مباشر إلى السعودية أو البحرين" },
              { id: "private-jet-liaison", label: "تنسيق طيران خاص واستقبال VIP في المنافذ" },
            ]
          : [
              { id: "overland-convoy", label: "Overland Luxury 4x4 / Sprinter Convoy" },
              { id: "saudi-bahrain-chauffeur", label: "Direct Chauffeur to Saudi Arabia / Bahrain" },
              { id: "private-jet-liaison", label: "Regional Private Aviation & Chauffeur" },
            ];

      case "celebrations-events":
        return isRtl
          ? [
              { id: "desert-pavilion-banquet", label: "سرادق صحراوي مخصص مع طاهٍ خاص" },
              { id: "royal-dhow-dinner", label: "عشاء بحري ملكي على محمل تراثي خاص" },
              { id: "vip-gala-production", label: "تجهيز احتفالي متكامل لكبار الشخصيات" },
            ]
          : [
              { id: "desert-pavilion-banquet", label: "Bespoke Desert Pavilion & Private Chef" },
              { id: "royal-dhow-dinner", label: "Chartered Royal Dhow Cruise & Banquet" },
              { id: "vip-gala-production", label: "Full VIP Gala Setup under Open Skies" },
            ];

      default:
        return isRtl
          ? [
              { id: "executive-tier", label: "الأسطول التنفيذي مع كونسيرج خاص" },
              { id: "vip-tier", label: "باقة كبار الشخصيات VIP" },
              { id: "custom-bespoke", label: "تجهيز مخصص حسب الطلب" },
            ]
          : [
              { id: "executive-tier", label: "Executive Fleet & Concierge" },
              { id: "vip-tier", label: "VIP Luxury Edition" },
              { id: "custom-bespoke", label: "Customized Tailored Setup" },
            ];
    }
  }, [selectedServiceId, isRtl]);

  // Guest count options
  const guestOptions = isRtl
    ? [
        { id: "1-guest", label: "ضيف واحد • سائق خاص VIP" },
        { id: "2-guests", label: "ضيفان • رحلة خاصة ثنائية" },
        { id: "4-guests", label: "3–4 ضيوف • أسطول عائلي فاخر" },
        { id: "6-guests", label: "5–6 ضيوف • سبرينتر كبار الشخصيات" },
        { id: "group", label: "7+ ضيوف • وفد رسمي / مجموعة" },
      ]
    : [
        { id: "1-guest", label: "1 Guest • Private VIP Chauffeur" },
        { id: "2-guests", label: "2 Guests • Private Couple Journey" },
        { id: "4-guests", label: "3–4 Guests • Luxury Family Fleet" },
        { id: "6-guests", label: "5–6 Guests • VIP Sprinter Fleet" },
        { id: "group", label: "7+ Guests • Royal Delegation" },
      ];

  // Pick-up location options
  const pickupOptions = isRtl
    ? [
        { id: "westbay", label: "منطقة الخليج الغربي الدبلوماسية وفنادقها" },
        { id: "pearl", label: "اللؤلؤة قطر وبورتو أرابيا" },
        { id: "lusail", label: "مدينة لوسيل ومارينا ريزيدنس" },
        { id: "airport", label: "مطار حمد الدولي (DOH) صالة كبار الشخصيات" },
        { id: "souq", label: "سوق واقف ومشيرب قلب الدوحة" },
        { id: "port", label: "محطة الرحلات البحرية الكبرى بميناء الدوحة" },
        { id: "custom", label: "فندق أو سكن خاص آخر داخل دولة قطر" },
      ]
    : [
        { id: "westbay", label: "West Bay Diplomatic District & Hotels" },
        { id: "pearl", label: "The Pearl-Qatar & Porto Arabia" },
        { id: "lusail", label: "Lusail City & Marina Residences" },
        { id: "airport", label: "Hamad International Airport (DOH) VIP Terminal" },
        { id: "souq", label: "Souq Waqif & Msheireb Downtown" },
        { id: "port", label: "Doha Port Grand Cruise Terminal" },
        { id: "custom", label: "Other Hotel / Private Residence in Qatar" },
      ];

  // Current active tier selection
  const activeTierLabel = useMemo(() => {
    const found = contextualTiers.find((t) => t.id === selectedTier);
    return found ? found.label : contextualTiers[0]?.label || "";
  }, [contextualTiers, selectedTier]);

  const handleSubmitWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();

    const matchedService = dict.services.find((s) => s.id === selectedServiceId);
    const serviceName = matchedService ? matchedService.title : selectedServiceId;

    const guestLabel = guestOptions.find((g) => g.id === selectedGuests)?.label || selectedGuests;

    const matchedPickup = pickupOptions.find((p) => p.id === selectedPickup);
    const pickupDisplay =
      selectedPickup === "custom" && customPickupText.trim()
        ? `${matchedPickup?.label || "Custom"}: ${customPickupText.trim()}`
        : matchedPickup?.label || selectedPickup;

    const message = isRtl
      ? `مرحباً إم زد للسياحة قطر، أود الاستفسار وتأكيد حجز لتجربة سياحية فاخرة:\n• التجربة المطلوبة: ${serviceName}\n• تاريخ الرحلة: ${
          selectedDate || "مرن / قيد التحديد"
        }\n• عدد الضيوف: ${guestLabel}\n• فئة المركبة / الباقة: ${activeTierLabel}\n• موقع الانطلاق / التوصيل: ${pickupDisplay}\n\nيرجى تأكيد التوافر وموافاتنا بعرض السعر المخصص وتفاصيل التأكيد.`
      : `Hello MZ Tourism Qatar, I would like to inquire about a bespoke luxury experience:\n• Experience: ${serviceName}\n• Travel Date: ${
          selectedDate || "Flexible / To be confirmed"
        }\n• Number of Guests: ${guestLabel}\n• Vehicle / Experience Tier: ${activeTierLabel}\n• Pick-up Location: ${pickupDisplay}\n\nPlease confirm availability and provide a tailored quotation.`;

    const url = getWhatsAppInquiryUrl(message);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="booking-inquiry"
      className="relative z-20 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 -mt-10 sm:-mt-14 mb-16 scroll-mt-24"
    >
      <div className="bg-[#0F1115]/90 backdrop-blur-2xl rounded-2xl p-5 sm:p-7 shadow-2xl border border-[#C29B38]/25 shadow-black/90">
        {/* 1. Header Ribbon with Singular Reassurance Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#C29B38]/15 gap-2.5">
          <div className="flex items-center gap-2 text-[#C29B38] text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-[#C29B38]" />
            <span>
              {isRtl ? "طلب حجز واستفسار الكونسيرج الفوري" : "Direct Experience Inquiry"}
            </span>
          </div>

          {/* Singular Reassurance Notice */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#F3ECE1]/80 bg-[#16191F] px-3 py-1 rounded-full border border-[#C29B38]/20">
            <Shield className="w-3.5 h-3.5 text-[#C29B38]" />
            <span>
              {isRtl
                ? "لا يلزم دفع إلكتروني · يتم تأكيد الحجوزات مباشرة عبر فريق الكونسيرج"
                : "No online payment required · Bookings confirmed through our concierge team."}
            </span>
          </div>
        </div>

        {/* 2. The ONE Unified Experience Inquiry Form */}
        <form onSubmit={handleSubmitWhatsApp} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 items-start">
            {/* Field 1: Experience */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[11px] sm:text-xs uppercase tracking-wider text-[#F3ECE1]/75 font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#C29B38]" />
                <span>{isRtl ? "التجربة السياحية" : "Experience"}</span>
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  setSelectedTier(""); // Reset tier for newly selected experience
                }}
                className="w-full min-h-[46px] px-3 rounded-lg bg-[#16191F] border border-[#C29B38]/20 text-[#F3ECE1] text-xs sm:text-sm focus:outline-none focus:border-[#C29B38] cursor-pointer transition-colors"
              >
                {dict.services.map((service) => (
                  <option key={service.id} value={service.id} className="bg-[#16191F] text-[#F3ECE1]">
                    {service.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 2: Travel Date */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[11px] sm:text-xs uppercase tracking-wider text-[#F3ECE1]/75 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C29B38]" />
                <span>{isRtl ? "تاريخ الرحلة" : "Travel Date"}</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full min-h-[46px] px-3 rounded-lg bg-[#16191F] border border-[#C29B38]/20 text-[#F3ECE1] text-xs sm:text-sm focus:outline-none focus:border-[#C29B38] cursor-pointer transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Field 3: Number of Guests */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[11px] sm:text-xs uppercase tracking-wider text-[#F3ECE1]/75 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#C29B38]" />
                <span>{isRtl ? "عدد الضيوف" : "Number of Guests"}</span>
              </label>
              <select
                value={selectedGuests}
                onChange={(e) => setSelectedGuests(e.target.value)}
                className="w-full min-h-[46px] px-3 rounded-lg bg-[#16191F] border border-[#C29B38]/20 text-[#F3ECE1] text-xs sm:text-sm focus:outline-none focus:border-[#C29B38] cursor-pointer transition-colors"
              >
                {guestOptions.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#16191F] text-[#F3ECE1]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 4: Contextual Vehicle / Experience Tier */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[11px] sm:text-xs uppercase tracking-wider text-[#C29B38] font-semibold flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#C29B38]" />
                <span>{isRtl ? "فئة المركبة / الباقة" : "Vehicle / Experience Tier"}</span>
              </label>
              <select
                value={selectedTier || contextualTiers[0]?.id || ""}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full min-h-[46px] px-3 rounded-lg bg-[#16191F] border border-[#C29B38]/30 text-[#F3ECE1] text-xs sm:text-sm focus:outline-none focus:border-[#C29B38] cursor-pointer transition-colors font-medium"
              >
                {contextualTiers.map((tier) => (
                  <option key={tier.id} value={tier.id} className="bg-[#16191F] text-[#F3ECE1]">
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 5: Pick-up Location */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[11px] sm:text-xs uppercase tracking-wider text-[#F3ECE1]/75 font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C29B38]" />
                <span>{isRtl ? "موقع الانطلاق والتوصيل" : "Pick-up Location"}</span>
              </label>
              <select
                value={selectedPickup}
                onChange={(e) => setSelectedPickup(e.target.value)}
                className="w-full min-h-[46px] px-3 rounded-lg bg-[#16191F] border border-[#C29B38]/20 text-[#F3ECE1] text-xs sm:text-sm focus:outline-none focus:border-[#C29B38] cursor-pointer transition-colors"
              >
                {pickupOptions.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#16191F] text-[#F3ECE1]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional custom location input if "custom" is selected */}
          {selectedPickup === "custom" && (
            <div className="pt-1">
              <input
                type="text"
                placeholder={
                  isRtl
                    ? "يرجى تحديد اسم الفندق أو العنوان في قطر..."
                    : "Specify hotel name or address in Qatar..."
                }
                value={customPickupText}
                onChange={(e) => setCustomPickupText(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-lg bg-[#16191F] border border-[#C29B38]/30 text-[#F3ECE1] text-xs sm:text-sm focus:outline-none focus:border-[#C29B38] transition-colors"
              />
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-[11px] sm:text-xs text-[#F3ECE1]/65 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C29B38]" />
              <span>
                {isRtl
                  ? "تواصل مباشر مع كبار مستشاري السفر بالدوحة"
                  : "Direct liaison with executive travel concierge in Doha"}
              </span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center min-h-[48px] px-8 rounded-lg bg-[#C29B38] hover:bg-[#ECC15A] text-[#0F1115] font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-xl shadow-[#C29B38]/20 active:scale-[0.98] gap-2"
            >
              <MessageCircle className="w-4 h-4 text-[#0F1115]" />
              <span>{isRtl ? "إرسال الاستفسار عبر واتساب" : "Inquire on WhatsApp"}</span>
              <Arrow className="w-3.5 h-3.5 text-[#0F1115]" />
            </button>
          </div>
        </form>

        {/* 3. Separate Service Entry Point: Custom Itinerary Builder */}
        <div className="mt-5 pt-4 border-t border-[#C29B38]/15 flex flex-col sm:flex-row items-center justify-between text-xs text-[#F3ECE1]/70 gap-3">
          <span>
            {isRtl
              ? "هل ترغب في برنامج متعدد الأيام أو رحلة برية خاصة لدول الخليج؟"
              : "Seeking a bespoke multi-day journey or cross-border GCC expedition?"}
          </span>
          <button
            type="button"
            onClick={() => onOpenModalWithService(selectedServiceId)}
            className="inline-flex items-center gap-1.5 text-[#C29B38] hover:text-[#ECC15A] font-semibold transition-colors underline underline-offset-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C29B38]" />
            <span>
              {isRtl ? "تخطيط مسار مخصص بالكامل" : "Plan a Tailor-Made Journey"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}