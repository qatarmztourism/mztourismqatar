"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TranslationDict, Locale } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import { createGuestBookingAction } from "@/lib/server/booking-actions";
import {
  X,
  Calendar,
  MessageCircle,
  CheckCircle2,
  Shield,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  Users,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Globe,
  AlertCircle,
} from "lucide-react";

interface BespokeInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict: TranslationDict;
  currentLocale: Locale;
  initialServiceId?: string;
  onOpenCustomPlanner?: () => void;
}

export default function BespokeInquiryModal({
  isOpen,
  onClose,
  dict,
  currentLocale,
  initialServiceId,
  onOpenCustomPlanner,
}: BespokeInquiryModalProps) {
  const isRtl = currentLocale === "ar";
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  // Multi-step tracking: 1 = Experience & Timing, 2 = Party, 3 = Guest & Language, 4 = Logistics & Notes, 5 = Review
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form fields
  const [serviceId, setServiceId] = useState<string>(initialServiceId || "desert-safari");
  const [date, setDate] = useState<string>("");
  const [timeWindow, setTimeWindow] = useState<string>("sunset");
  const [paxCount, setPaxCount] = useState<number>(2);
  const [needHalalMeal, setNeedHalalMeal] = useState<boolean>(true);
  const [languagePreference, setLanguagePreference] = useState<string>(
    isRtl ? "Arabic" : "English"
  );
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [pickupLocation, setPickupLocation] = useState<string>("West Bay / Diplomatic Area");
  const [customPickup, setCustomPickup] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submittedData, setSubmittedData] = useState<{
    bookingRef: string;
    uploadToken: string;
    whatsAppUrl: string;
    serviceTitle: string;
    departureDate: string | null;
    paxCount: number;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  useEffect(() => {
    if (initialServiceId) {
      setServiceId(initialServiceId);
    }
  }, [initialServiceId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedService =
    dict.services.find((s) => s.id === serviceId) || dict.services[0];

  const timeWindowLabels: Record<string, string> = {
    sunset: isRtl ? "فترة الغروب والساعة الذهبية (موصى بها)" : "Afternoon Golden Hour & Sunset (Recommended)",
    morning: isRtl ? "شروق الشمس الصباحي (05:00 ص)" : "Morning Sunrise (05:00 AM)",
    evening: isRtl ? "المساء وسهرة التخييم (07:00 م)" : "Nighttime Campfire & Stargazing (07:00 PM)",
    transit: isRtl ? "مواعيد ترانزيت رحلات الطيران الخاصة" : "Custom VIP Transit Layover Window",
  };

  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const validateStep = (step: number): boolean => {
    setFormError(null);
    setFieldErrors({});

    if (step === 1) {
      if (!serviceId) {
        setFormError(isRtl ? "يرجى اختيار الخدمة المطلوبة." : "Please select a service.");
        return false;
      }
      if (date) {
        const parsed = new Date(date);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (parsed < yesterday) {
          setFormError(
            isRtl
              ? "تاريخ الرحلة لا يمكن أن يكون في الماضي."
              : "Departure date must not be in the past."
          );
          return false;
        }
      }
    } else if (step === 2) {
      if (paxCount < 1) {
        setFormError(isRtl ? "يجب أن يكون هناك شخص واحد على الأقل." : "At least 1 person is required.");
        return false;
      }
      if (paxCount > 50) {
        setFormError(
          isRtl
            ? "للمجموعات التي تزيد عن 50 ضيفاً، يرجى التواصل مع مكتب الوفود الدبلوماسية."
            : "For parties larger than 50, please contact our VIP delegation desk."
        );
        return false;
      }
    } else if (step === 3) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setFormError(isRtl ? "يرجى إدخال اسم الضيف بالكامل." : "Please enter the guest full name.");
        return false;
      }
      if (!phone.trim() || phone.trim().length < 8) {
        setFormError(isRtl ? "يرجى إدخال رقم هاتف صالح للتواصل." : "Please enter a valid contact phone number.");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setFormError(
          isRtl
            ? "يرجى إدخال بريد إلكتروني صالح لاستلام ملف الحجز."
            : "Please enter a valid email address to receive your itinerary dossier."
        );
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setFormError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) {
      setCurrentStep(3);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const addons: string[] = [];
    if (needHalalMeal)
      addons.push(
        isRtl
          ? "ضيافة القهوة العربية والتمور"
          : "Arabic Gahwa & Gourmet Refreshments"
      );

    const effectivePickup =
      pickupLocation === "custom" && customPickup.trim()
        ? customPickup.trim()
        : pickupLocation;

    try {
      // 1. Secure Server-side Booking Creation Action
      const result = await createGuestBookingAction({
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        serviceId: serviceId,
        departureDate: date || undefined,
        timeWindow: timeWindowLabels[timeWindow] || timeWindow,
        adults: paxCount,
        children: 0,
        paxCount,
        pickupLocation: effectivePickup,
        preferredLocale: currentLocale,
        notes: `[Preferences: ${languagePreference} Guide, Addons: ${
          addons.join(", ") || "None"
        }] ${notes}`.trim(),
        honeypot: "",
      });

      if (!result.success || !result.data) {
        setFormError(
          result.error ||
            (isRtl
              ? "تعذر حفظ الحجز. يرجى مراجعة البيانات أو التواصل مع الكونسيرج."
              : "Unable to complete reservation. Please review inputs or contact concierge.")
        );
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setIsSubmitting(false);
        return;
      }

      const { bookingRef, uploadToken, serviceTitle, departureDate, paxCount: verifiedPax } = result.data;

      // 2. Prepare structured WhatsApp message (STRICTLY NON-SENSITIVE INFO ONLY)
      const cleanDate = departureDate || (isRtl ? "مرن / قيد التحديد" : "Flexible");
      const whatsAppMessage =
        currentLocale === "ar"
          ? `مرحباً إم زد للسياحة قطر، تم تسجيل طلب حجز كونسيرج خاص:
• الرقم المرجعي للحجز: ${bookingRef}
• التجربة المطلوبة: ${serviceTitle}
• التاريخ المحدد: ${cleanDate}
• الفترة: ${timeWindowLabels[timeWindow] || timeWindow}
• عدد الأشخاص: ${verifiedPax} ${verifiedPax === 1 ? "شخص" : "أشخاص"}
• لغة المرشد المفضلة: ${languagePreference}

يرجى تأكيد التوافر وإرسال تعليمات إيداع العربون.`
          : `Hello MZ Tourism Qatar, I have registered a private concierge reservation:
• Booking Reference: ${bookingRef}
• Experience: ${serviceTitle}
• Date: ${cleanDate}
• Time Window: ${timeWindowLabels[timeWindow] || timeWindow}
• People / Guests: ${verifiedPax} ${verifiedPax === 1 ? "Person" : "People"}
• Preferred Guide: ${languagePreference}

Please review vehicle availability and advise on deposit settlement.`;

      const whatsAppUrl = getWhatsAppInquiryUrl(whatsAppMessage);

      setSubmittedData({
        bookingRef,
        uploadToken,
        whatsAppUrl,
        serviceTitle,
        departureDate,
        paxCount,
      });
    } catch (err) {
      console.error("[Booking Submission Unexpected Error]", err);
      setFormError(
        isRtl
          ? "حدث خطأ غير متوقع أثناء معالجة الطلب. يرجى التواصل عبر واتساب مباشرة."
          : "An unexpected error occurred. Please contact our 24/7 concierge via WhatsApp."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setCurrentStep(1);
    setDate("");
    setFullName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setCustomPickup("");
    setFormError(null);
    setFieldErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-container-lowest/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface-container rounded-3xl border border-primary/30 shadow-2xl shadow-black/90 max-h-[92vh] overflow-y-auto z-10 flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-surface-container-high/90 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shadow-md shadow-primary/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg sm:text-xl text-on-surface font-semibold">
                {isRtl ? "حجز رحلة سياحية خاصة" : "Private Tour Reservation"}
              </h3>
              <span className="text-[11px] text-primary uppercase tracking-wider font-semibold">
                {isRtl
                  ? "تسجيل مباشر • لا يتم خصم مبالغ مسبقة عبر البطاقة"
                  : "Concierge Booking Engine • Manual Deposit Protocol"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Ribbon */}
        {!submittedData && (
          <div className="px-5 py-2.5 bg-surface-container-lowest flex items-center justify-between text-[11px] text-on-surface-variant border-b border-outline-variant/15 font-semibold">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`transition-colors cursor-pointer ${
                currentStep === 1 ? "text-primary font-bold" : ""
              }`}
            >
              1. {isRtl ? "الخدمة" : "Tour"}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => validateStep(1) && setCurrentStep(2)}
              className={`transition-colors cursor-pointer ${
                currentStep === 2 ? "text-primary font-bold" : ""
              }`}
            >
              2. {isRtl ? "الضيوف" : "Party"}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => validateStep(1) && validateStep(2) && setCurrentStep(3)}
              className={`transition-colors cursor-pointer ${
                currentStep === 3 ? "text-primary font-bold" : ""
              }`}
            >
              3. {isRtl ? "البيانات" : "Guest"}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() =>
                validateStep(1) && validateStep(2) && validateStep(3) && setCurrentStep(4)
              }
              className={`transition-colors cursor-pointer ${
                currentStep === 4 ? "text-primary font-bold" : ""
              }`}
            >
              4. {isRtl ? "الموقع" : "Logistics"}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() =>
                validateStep(1) &&
                validateStep(2) &&
                validateStep(3) &&
                setCurrentStep(5)
              }
              className={`transition-colors cursor-pointer ${
                currentStep === 5 ? "text-primary font-bold" : ""
              }`}
            >
              5. {isRtl ? "المراجعة" : "Review"}
            </button>
          </div>
        )}

        {/* Modal Body */}
        {submittedData ? (
          /* STEP 6: Confirmation Notice with Reference, Next Steps & WhatsApp Link */
          <div className="p-6 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary mx-auto flex items-center justify-center border border-primary/40 shadow-xl shadow-primary/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h4 className="font-headline text-2xl text-on-surface font-semibold">
                {isRtl ? "تم تسجيل طلب الحجز بنجاح" : "Reservation Registered Successfully"}
              </h4>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                {isRtl
                  ? "تم حفظ تفاصيل حجزك في قاعدة بيانات إم زد للسياحة قطر وإصدار الرقم المرجعي الموثق."
                  : "Your reservation has been securely logged with MZ Tourism Qatar. Below is your official dossier reference and next steps."}
              </p>
            </div>

            {/* Official Booking Reference Box */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-surface-container-lowest border border-primary/40 flex items-center justify-between gap-4">
              <div className="text-left" style={{ textAlign: isRtl ? "right" : "left" }}>
                <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant block">
                  {isRtl ? "الرقم المرجعي للحجز" : "Official Booking Reference"}
                </span>
                <span className="font-mono text-xl font-bold text-primary tracking-widest">
                  {submittedData.bookingRef}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyRef(submittedData.bookingRef)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container text-xs text-on-surface flex items-center gap-1.5 transition-colors border border-outline-variant/30 cursor-pointer"
              >
                {copiedRef ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary text-[11px]">
                      {isRtl ? "تم النسخ" : "Copied"}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{isRtl ? "نسخ" : "Copy"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Next Steps Guidance Card */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-surface-container-high/50 border border-outline-variant/20 text-left space-y-2 text-xs" style={{ textAlign: isRtl ? "right" : "left" }}>
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold block">
                {isRtl ? "الخطوات التالية لتأكيد رحلتك:" : "Next Steps to Finalize Your Journey:"}
              </span>
              <ul className="space-y-1.5 text-on-surface-variant text-[11px] list-disc list-inside">
                <li>
                  {isRtl
                    ? "تم وضع الحجز بحالة (بانتظار إيداع العربون) لضمان خصوصيتك دون خصومات إلكترونية آلية."
                    : "Your itinerary is placed in Awaiting Deposit status with no automatic card billing."}
                </li>
                <li>
                  {isRtl
                    ? "يمكنك استخدام رابط التتبع الآمن لرفع إشعار التحويل البنكي في أي وقت."
                    : "Use your private tracking dossier to view balance and upload your bank deposit receipt."}
                </li>
                <li>
                  {isRtl
                    ? "مكتب الكونسيرج متاح 24/7 عبر واتساب للمراجعة وتنسيق خط السير."
                    : "Our 24/7 Doha concierge is ready to coordinate custom vehicle and guide timings via WhatsApp."}
                </li>
              </ul>
            </div>

            {/* Primary Action Buttons */}
            <div className="max-w-md mx-auto space-y-3 pt-2">
              {/* WhatsApp Conduit (Non-sensitive info only) */}
              <a
                href={submittedData.whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {isRtl ? "متابعة الحجز مع الكونسيرج عبر واتساب" : "Chat with Concierge on WhatsApp"}
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Private Dossier Tracking Link */}
              {submittedData.uploadToken && (
                <Link
                  href={`/${currentLocale}/booking/${submittedData.uploadToken}`}
                  onClick={onClose}
                  className="w-full min-h-[46px] rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs sm:text-sm font-semibold transition-colors border border-outline-variant/40 flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4 text-primary" />
                  <span>
                    {isRtl
                      ? "ملف الحجز ورفع إشعار العربون"
                      : "Open Tracking Dossier & Upload Receipt"}
                  </span>
                </Link>
              )}
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer"
              >
                {isRtl ? "حجز رحلة أخرى" : "Book Another Tour"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface-variant text-xs font-semibold hover:text-on-surface transition-colors cursor-pointer"
              >
                {dict.modal.btnClose}
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Step Interactive Form */
          <form onSubmit={handleFinalSubmit} className="p-5 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
            {formError && (
              <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: Experience & Timing */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold flex items-center justify-between">
                    <span>{dict.modal.step1Title}</span>
                    <span className="text-primary font-bold font-mono">
                      {selectedService.indicativePrice}
                    </span>
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {dict.services.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      {dict.modal.step2Title}
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    />
                    <span className="text-[10px] text-on-surface-variant block">
                      {isRtl ? "يمكن ترك التاريخ فارغاً إذا كان الموعد مرناً" : "Leave blank if departure date is flexible"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      {isRtl ? "فترة الانطلاق المفضلة" : "Departure Window"}
                    </label>
                    <select
                      value={timeWindow}
                      onChange={(e) => setTimeWindow(e.target.value)}
                      className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="sunset">
                        {isRtl
                          ? "فترة الغروب والساعة الذهبية (موصى بها)"
                          : "Afternoon Golden Hour & Sunset (Recommended)"}
                      </option>
                      <option value="morning">
                        {isRtl ? "شروق الشمس الصباحي (05:00 ص)" : "Morning Sunrise (05:00 AM)"}
                      </option>
                      <option value="evening">
                        {isRtl
                          ? "المساء وسهرة التخييم (07:00 م)"
                          : "Nighttime Campfire & Stargazing (07:00 PM)"}
                      </option>
                      <option value="transit">
                        {isRtl
                          ? "مواعيد ترانزيت رحلات الطيران الخاصة"
                          : "Custom VIP Transit Layover Window"}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Direct link to custom planner if guest wants multi-destination */}
                {onOpenCustomPlanner && (
                  <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-on-surface">
                      <Sparkles className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        {isRtl
                          ? "هل تبحث عن مسار خاص يجمع عدة مدن خليجية؟"
                          : "Planning a bespoke multi-country GCC itinerary?"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCustomPlanner();
                      }}
                      className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                    >
                      {isRtl ? "فتح مصمم الرحلات" : "Custom Planner"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Passenger Breakdown */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-on-surface">
                    {isRtl ? "تحديد عدد الضيوف والمركبة" : "Party Size & Passengers"}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {isRtl
                      ? "نخصص مركبات دفع رباعي خاصة أو أسطول مرسيدس حسب عدد الركاب لضمان الراحة التامة."
                      : "We allocate private 4x4 Land Cruisers or Mercedes fleet based on your party composition."}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Single Person Stepper */}
                  <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-semibold text-on-surface block">
                          {isRtl ? "عدد الأشخاص *" : "Number of People *"}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          {isRtl ? "الحد الأدنى شخص واحد" : "Minimum 1 passenger"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPaxCount((prev) => Math.max(1, prev - 1))}
                          disabled={paxCount <= 1}
                          className="w-8 h-8 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center font-bold text-sm cursor-pointer disabled:opacity-40"
                          aria-label={isRtl ? "إنقاص عدد الأشخاص" : "Decrease passenger count"}
                        >
                          -
                        </button>
                        <span className="font-mono text-base font-bold text-primary w-8 text-center">
                          {paxCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPaxCount((prev) => Math.min(50, prev + 1))}
                          disabled={paxCount >= 50}
                          className="w-8 h-8 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center font-bold text-sm cursor-pointer disabled:opacity-40"
                          aria-label={isRtl ? "زيادة عدد الأشخاص" : "Increase passenger count"}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Pax Summary Badge */}
                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-on-surface font-semibold">
                      {isRtl ? "إجمالي عدد الركاب:" : "Total Party Size:"}
                    </span>
                  </div>
                  <span className="font-mono text-primary font-bold">
                    {paxCount} {isRtl ? "ضيوف" : paxCount === 1 ? "Guest" : "Guests"}
                  </span>
                </div>

                {/* Add-ons */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block">
                    {isRtl ? "خيارات الراحة والضيافة" : "Complimentary Hospitality Additions"}
                  </label>
                  <div className="text-xs text-on-surface">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 cursor-pointer hover:border-primary/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={needHalalMeal}
                        onChange={(e) => setNeedHalalMeal(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-0 bg-surface-container"
                      />
                      <span>
                        {isRtl
                          ? "ضيافة القهوة العربية والتمور القطرية"
                          : "Arabic Gahwa & Qatari Dates Hospitality"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Primary Guest Contact & Guide Language */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-on-surface">
                    {isRtl ? "بيانات الضيف الرئيسي ولغة المرشد" : "Lead Guest & Guide Preference"}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {isRtl
                      ? "تُستخدم هذه البيانات لإرسال ملف التأكيد والتواصل الميداني يوم الرحلة."
                      : "Used exclusively to send your itinerary dossier and coordinate on arrival."}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                      {dict.modal.nameLabel} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={dict.modal.namePlaceholder}
                      className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {fieldErrors.customerName && (
                      <span className="text-error text-[10px] mt-1 block">
                        {fieldErrors.customerName[0]}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                        {dict.modal.phoneLabel} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={dict.modal.phonePlaceholder}
                        className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {fieldErrors.customerPhone && (
                        <span className="text-error text-[10px] mt-1 block">
                          {fieldErrors.customerPhone[0]}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                        {dict.modal.emailLabel} *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={dict.modal.emailPlaceholder}
                        className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {fieldErrors.customerEmail && (
                        <span className="text-error text-[10px] mt-1 block">
                          {fieldErrors.customerEmail[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? "لغة المرشد السياحي المفضل" : "Preferred Guide Language"}</span>
                    </label>
                    <select
                      value={languagePreference}
                      onChange={(e) => setLanguagePreference(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="English">English (Certified Qatar Tourism Guide)</option>
                      <option value="Arabic">العربية (مرشد قطري متخصص في التراث الثقافي)</option>
                      <option value="French">Français (Guide Privé Francophone)</option>
                      <option value="German">Deutsch (Zertifizierter Reiseleiter)</option>
                      <option value="Mandarin">中文 (专业导游)</option>
                      <option value="Russian">Русский (Индивидуальный гид)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Logistics & Notes */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-on-surface">
                    {isRtl ? "نقطة الانطلاق والملاحظات" : "Pickup Location & Special Requests"}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {isRtl
                      ? "نوفر خدمة الاستقبال الخاصة من أي فندق أو سكن أو مطار حمد الدولي بالدوحة."
                      : "Complimentary pickup is provided across Doha hotels, residences, or Hamad International Airport."}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? "نقطة التوصيل والاستقبال" : "Pickup Location / Hotel"}</span>
                    </label>
                    <select
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="West Bay / Diplomatic Area">
                        West Bay / Diplomatic Area (Four Seasons, St. Regis, Sheraton)
                      </option>
                      <option value="The Pearl-Qatar / Porto Arabia">
                        The Pearl-Qatar / Porto Arabia / Gewan Island
                      </option>
                      <option value="Hamad International Airport (DOH)">
                        Hamad International Airport (DOH Meet & Greet)
                      </option>
                      <option value="Lusail Marina & Katara Towers">
                        Lusail Marina / Katara Towers (Raffles & Fairmont)
                      </option>
                      <option value="Doha Port Passenger Terminal">
                        Doha Port Passenger Terminal (Cruise Terminal)
                      </option>
                      <option value="custom">
                        {isRtl ? "موقع أو فندق آخر (اكتب أدناه)" : "Other Hotel / Private Residence (Specify below)"}
                      </option>
                    </select>
                  </div>

                  {pickupLocation === "custom" && (
                    <input
                      type="text"
                      value={customPickup}
                      onChange={(e) => setCustomPickup(e.target.value)}
                      placeholder={isRtl ? "اكتب اسم الفندق أو المنطقة..." : "Specify hotel name or villa address..."}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                      {dict.modal.notesLabel}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder={dict.modal.notesPlaceholder}
                      className="w-full p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Review & Confirmation Summary */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-on-surface">
                    {isRtl ? "مراجعة تفاصيل الحجز قبل التأكيد" : "Review Itinerary Dossier"}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {isRtl
                      ? "يرجى مراجعة ملخص الحجز أدناه قبل الإرسال إلى مكتب الكونسيرج."
                      : "Please inspect your itinerary parameters prior to final dispatch."}
                  </p>
                </div>

                {/* Summary Card */}
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-primary/30 space-y-3 text-xs">
                  <div className="flex justify-between items-start pb-2 border-b border-outline-variant/15">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                        {isRtl ? "التجربة السياحية" : "Selected Tour"}
                      </span>
                      <span className="text-sm font-bold text-on-surface">
                        {selectedService.title}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-primary font-bold">
                      {selectedService.indicativePrice}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                        {isRtl ? "التاريخ والفترة" : "Date & Window"}
                      </span>
                      <span className="text-on-surface font-medium">
                        {date || (isRtl ? "مرن / قيد التحديد" : "Flexible")} •{" "}
                        {timeWindowLabels[timeWindow]?.split(" ")[0]}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                        {isRtl ? "عدد المسافرين" : "Party Size"}
                      </span>
                      <span className="text-on-surface font-medium">
                        {paxCount} {isRtl ? "مسافرين" : "Guests"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                        {isRtl ? "الضيف الرئيسي" : "Primary Guest"}
                      </span>
                      <span className="text-on-surface font-medium truncate block">
                        {fullName} ({phone})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                        {isRtl ? "لغة المرشد" : "Guide Language"}
                      </span>
                      <span className="text-primary font-medium">{languagePreference}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/15 text-[11px] text-on-surface-variant">
                    <span className="font-semibold text-on-surface">
                      {isRtl ? "نقطة التوصيل: " : "Pickup: "}
                    </span>
                    <span>
                      {pickupLocation === "custom" && customPickup ? customPickup : pickupLocation}
                    </span>
                  </div>

                  {notes && (
                    <div className="text-[11px] text-on-surface-variant">
                      <span className="font-semibold text-on-surface">
                        {isRtl ? "ملاحظات: " : "Notes: "}
                      </span>
                      <span>{notes}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-surface-container-high/60 border border-primary/20 flex items-start gap-2 text-[11px] text-on-surface-variant">
                  <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {isRtl
                      ? "سيتم تسجيل الحجز فوراً بحالة (بانتظار إيداع العربون). لا يتطلب دفع أي مبالغ الآن."
                      : "Your reservation will be logged in Awaiting Deposit status. No credit card is required today."}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation & Dispatch Footer */}
            <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BackIcon className="w-3.5 h-3.5" />
                  <span>{isRtl ? "السابق" : "Back"}</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-primary/20 cursor-pointer"
                >
                  <span>{isRtl ? "التالي" : "Continue"}</span>
                  <NextIcon className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[46px] px-7 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? "جارٍ تسجيل الحجز..." : "Securing Reservation..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isRtl ? "تأكيد وتسجيل الحجز" : "Confirm Reservation"}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
