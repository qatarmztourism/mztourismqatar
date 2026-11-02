"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Locale, TranslationDict } from "@/translations";
import {
  getGuestBookingStatusAction,
  uploadDepositProofAction,
  lookupBookingByRefAction,
} from "@/lib/server/booking-actions";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import { type ManualPaymentMethod } from "@/lib/validations/booking-schemas";
import {
  Shield,
  CheckCircle2,
  Clock,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Calendar,
  Building,
  Search,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Users,
  RefreshCw,
  FileText,
  Banknote,
  Receipt,
  HelpCircle,
  CreditCard,
} from "lucide-react";

interface ProofItem {
  id: string;
  fileName: string;
  fileSize: number;
  reviewStatus: string;
  rejectionReason?: string | null;
  paymentMethod?: string;
  customPaymentMethod?: string | null;
  amountSubmitted?: number;
  transactionRef?: string | null;
  paymentDate?: string | null;
  uploadedAt: string;
}

interface PaymentInstructionsSettings {
  deposit_default_percentage?: number;
  payment_bank_transfer_instructions_en?: string | null;
  payment_bank_transfer_instructions_ar?: string | null;
  payment_cash_office_instructions_en?: string | null;
  payment_cash_office_instructions_ar?: string | null;
  payment_other_instructions_en?: string | null;
  payment_other_instructions_ar?: string | null;
}

interface QatarBankConfig {
  isConfigured: boolean;
  accountHolderName: string | null;
  bankName: string | null;
  iban: string | null;
  accountNumber: string | null;
  swiftBic: string | null;
  currency: "QAR";
  paymentTypeDue: "deposit" | "full";
  depositPercentage: number;
  transferReferenceInstructionsEn: string;
  transferReferenceInstructionsAr: string;
  unconfiguredNoticeEn: string;
  unconfiguredNoticeAr: string;
}

interface CardGatewayConfig {
  isConfigured: boolean;
  provider: string;
  supportedCards: string[];
  statusMessageEn: string;
  statusMessageAr: string;
}

interface TrackingBookingData {
  id: string;
  bookingRef: string;
  serviceId: string;
  departureDate: string | null;
  paxCount?: number;
  totalPrice?: number;
  bookingStatus: string;
  paymentStatus: string;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  createdAt: string;
  proofStatus?: "pending" | "accepted" | "rejected" | "not_submitted";
  rejectionReason?: string | null;
  lastProofFileName?: string | null;
  lastProofFileSize?: number | null;
  lastProofUploadedAt?: string | null;
  proofs?: ProofItem[];
  paymentInstructions?: PaymentInstructionsSettings | null;
  qatarPaymentConfig?: QatarBankConfig | null;
  cardGatewayStatus?: CardGatewayConfig | null;
  bankTransferEnabled?: boolean;
  cardPaymentEnabled?: boolean;
  officePaymentEnabled?: boolean;
}

interface GuestBookingTrackingViewProps {
  uploadToken?: string;
  currentLocale: Locale;
  dict: TranslationDict;
}

function formatDate(dateString: string | null | undefined, locale: Locale): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-QA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Qatar",
    }).format(d);
  } catch {
    return dateString;
  }
}

export default function GuestBookingTrackingView({
  uploadToken: initialToken,
  currentLocale,
  dict,
}: GuestBookingTrackingViewProps) {
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [currentToken, setCurrentToken] = useState<string | undefined>(initialToken);
  const [loading, setLoading] = useState<boolean>(Boolean(initialToken));
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<TrackingBookingData | null>(null);

  // Lookup form state (when no token is provided)
  const [lookupRef, setLookupRef] = useState<string>("");
  const [lookupEmail, setLookupEmail] = useState<string>("");
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Manual payment submission state
  const [selectedMethod, setSelectedMethod] = useState<ManualPaymentMethod>("bank_transfer");
  const [customMethodDescription, setCustomMethodDescription] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [customerNotes, setCustomerNotes] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showReplacementForm, setShowReplacementForm] = useState<boolean>(false);
  const [activePaymentChannel, setActivePaymentChannel] = useState<"bank_transfer" | "card_payment" | "cash_office" | "other">("bank_transfer");
  const [copiedIban, setCopiedIban] = useState<boolean>(false);
  const [copiedAccNum, setCopiedAccNum] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyIban = (iban: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(iban);
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    }
  };

  const handleCopyAccNum = (acc: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(acc);
      setCopiedAccNum(true);
      setTimeout(() => setCopiedAccNum(false), 2000);
    }
  };

  const fetchStatus = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getGuestBookingStatusAction(token);
      if (res.success && res.data) {
        const data = res.data as TrackingBookingData;
        setBooking(data);
        setAmountPaid((prev) => (!prev && data.depositRequired > 0 ? data.depositRequired.toString() : prev));
      } else {
        setError(res.error || (isRtl ? "لم يتم العثور على حجز بهذا الرمز." : "Unable to locate booking with this tracking token."));
      }
    } catch (err) {
      console.error("[Fetch Status Error]", err);
      setError(isRtl ? "حدث خطأ غير متوقع أثناء تحميل بيانات الحجز." : "An unexpected error occurred while loading booking details.");
    } finally {
      setLoading(false);
    }
  }, [isRtl]);

  useEffect(() => {
    if (currentToken) {
      fetchStatus(currentToken);
    }
  }, [currentToken, fetchStatus]);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupLoading(true);

    try {
      const res = await lookupBookingByRefAction(lookupRef.trim(), lookupEmail.trim());
      if (res.success && res.data?.uploadToken) {
        setCurrentToken(res.data.uploadToken);
      } else {
        setLookupError(
          res.error || (isRtl ? "لم يتطابق أي حجز مع الرمز والبريد المدخلين." : "No booking matched that reference and email address combination.")
        );
      }
    } catch (err) {
      console.error("[Lookup Error]", err);
      setLookupError(isRtl ? "تعذر الاستعلام عن الحجز. يرجى المحاولة لاحقاً." : "Unable to query booking reference. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 10 MB client boundary check
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        isRtl
          ? "حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت)."
          : "File size exceeds maximum permitted 10 MB."
      );
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setUploadError(
        isRtl
          ? "صيغة الملف غير مدعومة. يُرجى اختيار صورة JPG أو PNG أو WebP أو مستند PDF."
          : "Invalid file format. Only JPEG, PNG, WebP images, or PDF documents are accepted."
      );
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
  };

  const handleUploadDeposit = async () => {
    if (!selectedFile || !currentToken) {
      setUploadError(isRtl ? "يرجى اختيار ملف الإيصال أولاً." : "Please select a payment receipt file first.");
      return;
    }

    if (selectedMethod === "other" && !customMethodDescription.trim()) {
      setUploadError(isRtl ? "يرجى كتابة وصف طريقة الدفع اليدوية المستخدمة." : "Please describe your custom payment method.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("uploadToken", currentToken);
      formData.append("file", selectedFile);
      formData.append("paymentMethod", selectedMethod);
      if (selectedMethod === "other" && customMethodDescription.trim()) {
        formData.append("customPaymentMethod", customMethodDescription.trim());
      }
      if (amountPaid) {
        formData.append("amountPaid", amountPaid);
      }
      if (transactionRef.trim()) {
        formData.append("transactionReference", transactionRef.trim());
      }
      if (paymentDate) {
        formData.append("paymentDate", paymentDate);
      }
      if (customerNotes.trim()) {
        formData.append("customerNotes", customerNotes.trim());
      }

      const res = await uploadDepositProofAction(formData);

      if (!res.success) {
        throw new Error(
          res.error || (isRtl ? "فشل رفع الإيصال." : "Failed to upload deposit receipt.")
        );
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      setShowReplacementForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Re-fetch booking details to display updated verification state and history
      await fetchStatus(currentToken);
    } catch (err: unknown) {
      console.error("[Deposit Upload Error]", err);
      const msg =
        err instanceof Error
          ? err.message
          : isRtl
          ? "فشل معالجة رفع الإيصال."
          : "Failed to process receipt upload.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const matchedService = booking
    ? dict.services.find((s) => s.id === booking.serviceId)
    : null;

  const tourDisplayName = matchedService ? matchedService.title : booking?.serviceId || "Tour";

  const whatsAppMessage = booking
    ? isRtl
      ? `مرحباً إم زد للسياحة قطر، أود الاستفسار بشأن حجز مرجعي: ${booking.bookingRef}`
      : `Hello MZ Tourism Qatar, I am inquiring regarding booking reference: ${booking.bookingRef}`
    : `Hello MZ Tourism Qatar, I would like to inquire about my booking.`;

  const whatsAppUrl = getWhatsAppInquiryUrl(whatsAppMessage);

  const bankInquiryWhatsAppMessage = booking
    ? isRtl
      ? `مرحباً إم زد للسياحة قطر، أود الحصول على تفاصيل الحساب البنكي المعتمد لسداد عربون الحجز: ${booking.bookingRef} (المبلغ المطلوب: ${booking.depositRequired.toLocaleString("en-US")} ر.ق).`
      : `Hello MZ Tourism Qatar, I would like to receive verified bank transfer coordinates to settle the deposit for booking ${booking.bookingRef} (Amount due: ${booking.depositRequired.toLocaleString("en-US")} QAR).`
    : whatsAppMessage;

  const bankInquiryWhatsAppUrl = getWhatsAppInquiryUrl(bankInquiryWhatsAppMessage);

  const cardInquiryWhatsAppMessage = booking
    ? isRtl
      ? `مرحباً إم زد للسياحة قطر، أود الاستفسار عن سداد الحجز ${booking.bookingRef} بالبطاقة البنكية أو جهاز نقطة البيع المحمول (المبلغ: ${booking.depositRequired.toLocaleString("en-US")} ر.ق).`
      : `Hello MZ Tourism Qatar, I would like to pay by card for booking reference ${booking.bookingRef} (Amount: ${booking.depositRequired.toLocaleString("en-US")} QAR). Can you arrange a mobile POS card terminal upon greeting?`
    : whatsAppMessage;

  const cardInquiryWhatsAppUrl = getWhatsAppInquiryUrl(cardInquiryWhatsAppMessage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          label: isRtl ? "مؤكد • رحلة خاصة معتمدة" : "Confirmed • Private Departure",
          color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          icon: CheckCircle2,
        };
      case "deposit_under_review":
      case "deposit_pending":
        return {
          label: isRtl ? "قيد تدقيق إيصال العربون" : "Deposit Under Review",
          color: "bg-primary/20 text-primary border-primary/40",
          icon: Clock,
        };
      case "completed":
        return {
          label: isRtl ? "مكتمل بنجاح" : "Experience Completed",
          color: "bg-blue-500/20 text-blue-400 border-blue-500/40",
          icon: CheckCircle2,
        };
      case "cancelled":
        return {
          label: isRtl ? "ملغي" : "Cancelled",
          color: "bg-red-500/20 text-red-400 border-red-500/40",
          icon: AlertCircle,
        };
      case "awaiting_deposit":
      default:
        return {
          label: isRtl ? "بانتظار إيداع العربون" : "Awaiting Deposit Confirmation",
          color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: Clock,
        };
    }
  };

  // Resolve method instructions from CMS settings or configured defaults
  const getMethodInstructions = (method: ManualPaymentMethod): string => {
    const inst = booking?.paymentInstructions;
    switch (method) {
      case "bank_transfer":
        return isRtl
          ? inst?.payment_bank_transfer_instructions_ar || "يرجى تحويل مبلغ العربون عبر التحويل المصرفي المباشر لحسابنا في بنك قطر. يرجى تدوين رمز الحجز في خانة ملاحظات التحويل ورفع إيصال التحويل البنكي."
          : inst?.payment_bank_transfer_instructions_en || "Please initiate your bank transfer from any Qatar bank. Mandatory: Quote your booking reference in the transfer remarks and upload your official transfer receipt.";
      case "cash_office":
        return isRtl
          ? inst?.payment_cash_office_instructions_ar || "نرحب بالسداد النقدي في مقر الكونسيرج بمنطقة الخليج الغربي الدبلوماسية بالدوحة. سيقوم موظف المالية بتسليمكم سند قبض معتمد ومختوم."
          : inst?.payment_cash_office_instructions_en || "Cash settlements are welcomed at our concierge headquarters in West Bay Diplomatic District, Doha. Our finance officer will issue a stamped official voucher upon receipt.";
      case "other":
        return isRtl
          ? inst?.payment_other_instructions_ar || "لترتيبات الدفع الخاصة أو المؤسسية أو عبر أطراف أخرى، يرجى التنسيق مع إدارة العمليات وتقديم كافة وثائق السداد المعتمدة."
          : inst?.payment_other_instructions_en || "For custom, corporate or third-party payment arrangements, coordinate directly with our operations desk and provide full settlement documentation.";
    }
  };

  const totalBookingAmount = booking ? (booking.totalPrice ?? (booking.depositRequired + booking.balanceDue)) : 0;

  return (
    <div className="min-h-screen bg-surface-container-lowest pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <Link
            href={`/${currentLocale}`}
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Arrow className="w-3.5 h-3.5 rotate-180" />
            <span>{dict.nav.home}</span>
          </Link>
          <span className="text-[11px] uppercase tracking-wider text-primary font-mono font-semibold">
            {isRtl ? "بوابة تتبع الحجوزات والسداد اليدوي" : "Manual Deposit & Reservation Tracking"}
          </span>
        </div>

        {/* VIEW 1: Token Lookup Form (If no active token loaded) */}
        {!currentToken && (
          <div className="bg-surface-container rounded-3xl border border-primary/30 p-6 sm:p-10 shadow-2xl max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary mx-auto flex items-center justify-center border border-primary/30">
                <Search className="w-6 h-6" />
              </div>
              <h1 className="font-headline text-2xl text-on-surface font-semibold">
                {isRtl ? "تتبع حجزك الخاص" : "Track Your Private Reservation"}
              </h1>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                {isRtl
                  ? "أدخل الرقم المرجعي لحجزك (مثال MZ-1A2B3C4D) والبريد الإلكتروني للوصول إلى تفاصيل رحلتك ورفع إيصال العربون."
                  : "Enter your Booking Reference (e.g. MZ-1A2B3C4D) and email address to view reservation status and submit deposit documentation."}
              </p>
            </div>

            {lookupError && (
              <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            <form onSubmit={handleLookupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface mb-1">
                  {isRtl ? "رقم الحجز المرجعي" : "Booking Reference"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="MZ-XXXXXXXX"
                  value={lookupRef}
                  onChange={(e) => setLookupRef(e.target.value.toUpperCase())}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface mb-1">
                  {isRtl ? "البريد الإلكتروني المستخدم في الحجز" : "Reservation Email Address"}
                </label>
                <input
                  type="email"
                  required
                  placeholder="guest@example.com"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full min-h-[44px] rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {lookupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isRtl ? "جارٍ التحقق..." : "Verifying Dossier..."}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{isRtl ? "عرض ملف الحجز" : "Locate Reservation"}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <a
                href={getWhatsAppInquiryUrl("Hello MZ Concierge, I need assistance finding my booking.")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
                <span>{isRtl ? "المساعدة عبر واتساب" : "Contact Concierge on WhatsApp"}</span>
              </a>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-on-surface-variant font-mono">
              {isRtl ? "جارٍ جلب تفاصيل الحجز المشفرة..." : "Retrieving secure booking dossier..."}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-surface-container border border-error/30 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-error/20 text-error mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-lg text-on-surface font-semibold">
              {isRtl ? "تعذر العثور على الحجز" : "Reservation Not Located"}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setCurrentToken(undefined);
                  setError(null);
                }}
                className="px-4 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface hover:bg-surface-container transition-colors"
              >
                {isRtl ? "بحث برقم الحجز" : "Search by Reference"}
              </button>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{isRtl ? "تواصل مع الكونسيرج" : "WhatsApp Concierge"}</span>
              </a>
            </div>
          </div>
        )}

        {/* VIEW 2: Complete 10-Field Payment Summary & Manual Deposit Confirmation Workflow */}
        {!loading && booking && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-surface-container rounded-3xl border border-primary/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-outline-variant/20 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-primary font-bold">
                      MZ TOURISM QATAR
                    </span>
                    <span className="text-on-surface-variant">•</span>
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                      {isRtl ? "ملف الحجز والسداد اليدوي" : "Manual Settlement Dossier"}
                    </span>
                  </div>
                  <h1 className="font-headline text-2xl sm:text-3xl text-on-surface font-semibold">
                    {tourDisplayName}
                  </h1>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const badge = getStatusBadge(booking.bookingStatus);
                    const Icon = badge.icon;
                    return (
                      <div
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${badge.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </div>
                    );
                  })()}

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono capitalize border ${
                      booking.paymentStatus === "fully_paid"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : booking.paymentStatus === "deposit_confirmed"
                        ? "bg-primary/20 text-primary border-primary/40"
                        : booking.paymentStatus === "deposit_rejected"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                    }`}
                  >
                    {booking.paymentStatus.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* SECTION 1: THE EXACT 10-FIELD PAYMENT SUMMARY GRID */}
              <div className="pt-6">
                <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-primary mb-3.5 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  <span>{isRtl ? "ملخص الحجز والدفعة المالية الكامل (10 عناصر)" : "Comprehensive Reservation & Payment Summary"}</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* 1. Booking Reference */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant block">
                      1. {isRtl ? "رمز الحجز" : "Booking Reference"}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm sm:text-base font-bold text-primary tracking-wider">
                        {booking.bookingRef}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(booking.bookingRef);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-1 rounded text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Copy reference"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Tour Name */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant block">
                      2. {isRtl ? "اسم التجربة" : "Tour Name"}
                    </span>
                    <span className="text-xs font-semibold text-on-surface truncate block" title={tourDisplayName}>
                      {tourDisplayName}
                    </span>
                  </div>

                  {/* 3. Departure Date */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant block">
                      3. {isRtl ? "تاريخ الرحلة" : "Departure Date"}
                    </span>
                    <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{booking.departureDate || (isRtl ? "قيد التنسيق" : "Coordinating")}</span>
                    </span>
                  </div>

                  {/* 4. Number of Guests */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant block">
                      4. {isRtl ? "عدد الضيوف" : "Number of Guests"}
                    </span>
                    <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{booking.paxCount || 2} {isRtl ? "ضيوف" : "Guests"}</span>
                    </span>
                  </div>

                  {/* 5. Total Booking Amount */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant block">
                      5. {isRtl ? "إجمالي الحجز" : "Total Booking Amount"}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-on-surface font-mono">
                      {totalBookingAmount.toLocaleString("en-US")} {booking.currency}
                    </span>
                  </div>

                  {/* 6. Required Deposit Amount */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-primary/30 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-primary block">
                      6. {isRtl ? "العربون المطلوب" : "Deposit Required"}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-primary font-mono">
                      {booking.depositRequired.toLocaleString("en-US")} {booking.currency}
                    </span>
                  </div>

                  {/* 7. Deposit Already Paid */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block">
                      7. {isRtl ? "العربون المدفوع" : "Deposit Paid"}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                      {booking.depositPaid.toLocaleString("en-US")} {booking.currency}
                    </span>
                  </div>

                  {/* 8. Remaining Balance Due */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 block">
                      8. {isRtl ? "الرصيد المتبقي" : "Remaining Balance Due"}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono">
                      {booking.balanceDue.toLocaleString("en-US")} {booking.currency}
                    </span>
                  </div>

                  {/* 9. Booking Status */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant block">
                      9. {isRtl ? "حالة الحجز" : "Booking Status"}
                    </span>
                    <span className="text-xs font-semibold text-on-surface capitalize truncate block">
                      {booking.bookingStatus.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* 10. Payment Status */}
                  <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant block">
                      10. {isRtl ? "حالة السداد" : "Payment Status"}
                    </span>
                    <span className="text-xs font-semibold text-primary capitalize truncate block">
                      {booking.paymentStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmed State Callout */}
            {booking.bookingStatus === "confirmed" && (
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-emerald-300">
                      {isRtl ? "تم تأكيد حجز رحلتكم رسمياً" : "Your Expedition is Officially Confirmed"}
                    </h4>
                    <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                      {isRtl
                        ? `تم اعتماد إيداع العربون وتخصيص الأسطول الخاص والمرشد السياحي لرحلتكم. الرصيد المتبقي المستحق عند بدء الرحلة: ${booking.balanceDue.toLocaleString("en-US")} ${booking.currency}.`
                        : `Your deposit has been verified and your private vehicle and guide are secured. Remaining balance due upon departure: ${booking.balanceDue.toLocaleString("en-US")} ${booking.currency}.`}
                    </p>
                  </div>
                </div>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 transition-colors inline-flex items-center gap-2 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isRtl ? "تنسيق نقطة الانطلاق" : "Coordinate Chauffeur"}</span>
                </a>
              </div>
            )}

            {/* SECTION 2 & 3: MANUAL PAYMENT METHODS & PROOF SUBMISSION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN: QATAR PAYMENT METHOD SELECTION & CLEAR INSTRUCTIONS */}
              <div className="bg-surface-container rounded-3xl border border-primary/20 p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-primary text-xs font-bold uppercase tracking-wider">
                    <Building className="w-4 h-4" />
                    <span>{isRtl ? "خيارات وسداد الدفعات المعتمدة في قطر" : "Qatar Settlement Methods & Instructions"}</span>
                  </div>

                  {/* Payment Channel Selector Tabs */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePaymentChannel("bank_transfer");
                        setSelectedMethod("bank_transfer");
                      }}
                      className={`p-3 rounded-2xl text-xs border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                        activePaymentChannel === "bank_transfer"
                          ? "bg-primary text-on-primary border-primary shadow-lg font-bold"
                          : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border-outline-variant/30"
                      }`}
                    >
                      <Building className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{isRtl ? "تحويل بنكي (قطر)" : "Bank Transfer (Qatar)"}</div>
                        <div className="text-[10px] opacity-80 truncate">{isRtl ? "حساب بنكي محلي" : "Direct IBAN Transfer"}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActivePaymentChannel("card_payment");
                      }}
                      className={`p-3 rounded-2xl text-xs border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                        activePaymentChannel === "card_payment"
                          ? "bg-primary text-on-primary border-primary shadow-lg font-bold"
                          : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border-outline-variant/30"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{isRtl ? "بطاقة دفع إلكترونية" : "Online Card Payment"}</div>
                        <div className="text-[10px] opacity-80 truncate">{isRtl ? "كيو باي / بطاقات بنكية" : "QPay Debit / Credit"}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActivePaymentChannel("cash_office");
                        setSelectedMethod("cash_office");
                      }}
                      className={`p-3 rounded-2xl text-xs border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                        activePaymentChannel === "cash_office"
                          ? "bg-primary text-on-primary border-primary shadow-lg font-bold"
                          : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border-outline-variant/30"
                      }`}
                    >
                      <Banknote className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{isRtl ? "نقداً بمقر الشركة" : "Cash at Office"}</div>
                        <div className="text-[10px] opacity-80 truncate">{isRtl ? "الخليج الغربي، الدوحة" : "West Bay, Doha"}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActivePaymentChannel("other");
                        setSelectedMethod("other");
                      }}
                      className={`p-3 rounded-2xl text-xs border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                        activePaymentChannel === "other"
                          ? "bg-primary text-on-primary border-primary shadow-lg font-bold"
                          : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border-outline-variant/30"
                      }`}
                    >
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{isRtl ? "ترتيبات خاصة" : "Custom Settlement"}</div>
                        <div className="text-[10px] opacity-80 truncate">{isRtl ? "دفع مؤسسي / خاص" : "Corporate / Concierge"}</div>
                      </div>
                    </button>
                  </div>

                  {/* TAB 1: BANK TRANSFER (QATAR) */}
                  {activePaymentChannel === "bank_transfer" && (
                    <div className="space-y-3">
                      {booking.qatarPaymentConfig?.isConfigured ? (
                        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-primary/20 space-y-4">
                          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2.5 text-xs">
                            <span className="font-bold text-primary flex items-center gap-2">
                              <Building className="w-4 h-4 text-primary" />
                              <span>{isRtl ? "بيانات الحساب البنكي المعتمد (دولة قطر)" : "Verified Business Bank Coordinates (State of Qatar)"}</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                              QAR • ر.ق
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20">
                              <div className="text-[10px] uppercase font-mono text-on-surface-variant font-semibold">
                                {isRtl ? "اسم المستفيد / الشركة" : "Beneficiary / Account Name"}
                              </div>
                              <div className="font-bold text-on-surface mt-1">
                                {booking.qatarPaymentConfig.accountHolderName}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20">
                              <div className="text-[10px] uppercase font-mono text-on-surface-variant font-semibold">
                                {isRtl ? "اسم البنك" : "Bank Name"}
                              </div>
                              <div className="font-bold text-on-surface mt-1">
                                {booking.qatarPaymentConfig.bankName}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 sm:col-span-2 flex items-center justify-between">
                              <div>
                                <div className="text-[10px] uppercase font-mono text-on-surface-variant font-semibold">
                                  {isRtl ? "رقم الآيبان (IBAN)" : "IBAN"}
                                </div>
                                <div className="font-mono font-bold text-primary text-sm sm:text-base tracking-wider mt-1">
                                  {booking.qatarPaymentConfig.iban}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyIban(booking.qatarPaymentConfig!.iban!)}
                                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-highest text-primary border border-primary/30 transition-colors cursor-pointer"
                                title="Copy IBAN"
                              >
                                {copiedIban ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>

                            {booking.qatarPaymentConfig.accountNumber && (
                              <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between">
                                <div>
                                  <div className="text-[10px] uppercase font-mono text-on-surface-variant font-semibold">
                                    {isRtl ? "رقم الحساب" : "Account Number"}
                                  </div>
                                  <div className="font-mono font-bold text-on-surface mt-1">
                                    {booking.qatarPaymentConfig.accountNumber}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyAccNum(booking.qatarPaymentConfig!.accountNumber!)}
                                  className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-highest text-primary border border-primary/30 transition-colors cursor-pointer"
                                >
                                  {copiedAccNum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}

                            {booking.qatarPaymentConfig.swiftBic && (
                              <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20">
                                <div className="text-[10px] uppercase font-mono text-on-surface-variant font-semibold">
                                  SWIFT / BIC
                                </div>
                                <div className="font-mono font-bold text-on-surface mt-1">
                                  {booking.qatarPaymentConfig.swiftBic}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 text-xs text-on-surface space-y-1">
                            <div className="font-bold text-primary flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 shrink-0" />
                              <span>{isRtl ? "ملاحظة التحويل الإلزامية:" : "Mandatory Transfer Memo / Remark:"}</span>
                            </div>
                            <p className="font-mono text-xs">
                              {isRtl ? "يرجى كتابة رمز الحجز التالي في خانة الملاحظات: " : "Quote this exact booking reference in transfer remarks: "}
                              <strong className="text-primary font-bold text-sm tracking-wider">{booking.bookingRef}</strong>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-amber-500/30 space-y-3">
                          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{isRtl ? "إعداد التحويل البنكي قيد التهيئة" : "Bank Transfer Setup Pending"}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            {isRtl
                              ? (booking.qatarPaymentConfig?.unconfiguredNoticeAr ||
                                 "تفاصيل الحساب المصرفي المعتمد لشركة إم زد للسياحة قطر قيد الاعتماد النهائي مع مصرفنا المحلي. يرجى التواصل مباشرة مع الكونسيرج عبر واتساب للحصول على تفاصيل السداد المعتمدة أو ترتيب السداد نقداً بمكتبنا.")
                              : (booking.qatarPaymentConfig?.unconfiguredNoticeEn ||
                                 "Our corporate Qatar bank coordinates are currently being finalized with our local financial institution. Please contact our concierge team directly via WhatsApp to receive direct verified payment instructions or arrange office settlement.")}
                          </p>
                          <a
                            href={bankInquiryWhatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors mt-1"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{isRtl ? "طلب تفاصيل الحساب البنكي عبر واتساب" : "Request Bank Details via WhatsApp"}</span>
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: ONLINE CARD PAYMENT */}
                  {activePaymentChannel === "card_payment" && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2 text-xs">
                        <span className="font-bold text-primary flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" />
                          <span>{isRtl ? "الدفع الإلكتروني بالبطاقات البنكية" : "Online Card Payment (Debit / Credit)"}</span>
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          QPay • Visa • MasterCard
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{isRtl ? "بوابة الدفع الإلكتروني قيد التهيئة / قريباً" : "Online Card Payment Setup Pending / Coming Soon"}</span>
                      </div>

                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {isRtl
                          ? "خدمة الدفع المباشر بالبطاقات البنكية (شبكة كيو باي الوطنية وبطاقات فيزا وماستركارد) قيد استكمال التفعيل الرسمي مع البنوك القطرية الشريكة. للتأكيد الفوري، يرجى سداد العربون عبر التحويل البنكي أو طلب جهاز نقطة البيع المحمول (POS) عند استقبالكم في الدوحة."
                          : "Online card settlement via QPay National Debit Switch and international credit cards is currently undergoing final merchant activation with Qatar banking partners. For immediate confirmation, please proceed via Bank Transfer (Qatar) or request a mobile POS terminal upon chauffeur greeting."}
                      </p>

                      <div className="pt-2">
                        <a
                          href={cardInquiryWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container border border-primary/30 text-primary text-xs font-semibold shadow-md transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{isRtl ? "طلب الدفع بالبطاقة عبر الكونسيرج" : "Inquire Regarding Card / POS Settlement"}</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CASH AT OFFICE */}
                  {activePaymentChannel === "cash_office" && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-primary/20 space-y-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2 text-xs">
                        <span className="font-bold text-primary flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-primary" />
                          <span>{isRtl ? "السداد النقدي بمقر الشركة بالدوحة" : "Cash Settlement at Concierge Headquarters"}</span>
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">Doha, Qatar</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {getMethodInstructions("cash_office")}
                      </p>
                      <div className="text-[11px] font-mono text-primary pt-1">
                        {isRtl ? "الموقع: منطقة الخليج الغربي الدبلوماسية، الدوحة، دولة قطر" : "Location: West Bay Diplomatic District, Doha, State of Qatar"}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: OTHER MANUAL */}
                  {activePaymentChannel === "other" && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-primary/20 space-y-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2 text-xs">
                        <span className="font-bold text-primary flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-primary" />
                          <span>{isRtl ? "ترتيبات سداد خاصة ومؤسسية" : "Custom / Corporate Settlement"}</span>
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {getMethodInstructions("other")}
                      </p>
                    </div>
                  )}

                  {/* MANDATORY DISCLAIMER */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span>{isRtl ? "إشعار سياسة التحقق المالي الهامة:" : "Manual Verification Policy Disclaimer:"}</span>
                    </div>
                    <p className="leading-relaxed">
                      {isRtl
                        ? "تقديم إيصال السداد لا يؤكد الحجز تلقائياً. تخضع جميع التحويلات للتدقيق والمطابقة اليدوية من قبل موظف المالية المختص قبل إصدار التأكيد النهائي للرحلة."
                        : "Submitting payment proof does NOT automatically confirm a booking. All submissions require formal manual verification and bank reconciliation by an authorized finance officer before reservation confirmation."}
                    </p>
                  </div>
                </div>

                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] rounded-xl bg-surface-container-high hover:bg-surface-container border border-primary/30 text-primary text-xs font-semibold transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isRtl ? "استفسار مباشر مع الكونسيرج عبر واتساب" : "Direct Inquiry with Concierge via WhatsApp"}</span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              </div>

              {/* RIGHT COLUMN: PAYMENT PROOF SUBMISSION FORM & AUDIT TIMELINE */}
              <div className="bg-surface-container rounded-3xl border border-primary/20 p-6 sm:p-7 space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                      <UploadCloud className="w-4 h-4" />
                      <span>{isRtl ? "رفع وتدقيق إيصال الدفعة" : "Submit Payment Proof"}</span>
                    </div>

                    {booking.proofStatus && (
                      <span
                        className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                          booking.proofStatus === "accepted"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : booking.proofStatus === "rejected"
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : booking.proofStatus === "pending"
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                        }`}
                      >
                        {booking.proofStatus.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>

                  {/* STATE 1: PENDING REVIEW */}
                  {booking.proofStatus === "pending" && !showReplacementForm && (
                    <div className="p-4 rounded-2xl bg-primary/15 border border-primary/30 text-on-surface space-y-2.5">
                      <div className="flex items-center gap-2 text-primary font-semibold text-xs sm:text-sm">
                        <Clock className="w-5 h-5 shrink-0 animate-pulse" />
                        <span>
                          {isRtl ? "الإيصال قيد المراجعة والمطابقة البنكية" : "Deposit Receipt Under Review"}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {isRtl
                          ? "تم استلام صورة الإشعار بنجاح وهي قيد التدقيق لدى مكتب المحاسبة. سيتم تحديث حالة الحجز إلى مؤكد فور اكتمال المطابقة."
                          : "Your payment proof has been securely recorded and is undergoing manual review by our finance team. Official confirmation will update here."}
                      </p>
                      {booking.lastProofFileName && (
                        <div className="pt-2 border-t border-primary/20 text-[11px] font-mono text-primary flex items-center justify-between">
                          <span className="flex items-center gap-1.5 truncate">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{booking.lastProofFileName}</span>
                          </span>
                          {booking.lastProofUploadedAt && (
                            <span className="text-on-surface-variant text-[10px] shrink-0">
                              {formatDate(booking.lastProofUploadedAt, currentLocale)}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setShowReplacementForm(true)}
                          className="text-xs text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{isRtl ? "رفع إشعار بديل أو تكميلي" : "Submit replacement or updated receipt"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STATE 2: REJECTED NOTICE WITH EXPLICIT REASON & REPLACEMENT PROMPT */}
                  {booking.proofStatus === "rejected" && (
                    <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 space-y-2.5">
                      <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-rose-300">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>
                          {isRtl ? "تعذر اعتماد إيصال الدفعة السابق" : "Deposit Receipt Declined by Finance"}
                        </span>
                      </div>
                      {booking.rejectionReason && (
                        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs font-mono text-rose-200">
                          <strong className="block text-[10px] uppercase font-sans tracking-wider text-rose-400 mb-0.5">
                            {isRtl ? "سبب الرفض المسجل:" : "Mandatory Review Reason:"}
                          </strong>
                          <span>{booking.rejectionReason}</span>
                        </div>
                      )}
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {isRtl
                          ? "يرجى رفع إيصال بديل موثق أدناه بدون قلق؛ حيث يتم الاحتفاظ بكافة السجلات السابقة للأغراض التدقيقية."
                          : "Please submit a replacement payment receipt below. Previous submission history is preserved in the audit log."}
                      </p>
                    </div>
                  )}

                  {/* SUBMISSION FORM: Available when awaiting deposit, rejected, not submitted, or replacement requested */}
                  {(booking.bookingStatus === "awaiting_deposit" ||
                    booking.proofStatus === "rejected" ||
                    booking.proofStatus === "not_submitted" ||
                    showReplacementForm ||
                    !booking.proofStatus) && (
                    <div className="space-y-3.5">
                      {uploadSuccess && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            {isRtl ? "تم إرسال إيصال الدفع بنجاح وهو قيد المراجعة." : "Receipt uploaded successfully and queued for finance audit."}
                          </span>
                        </div>
                      )}

                      {uploadError && (
                        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Amount Paid Field */}
                        <div>
                          <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                            {isRtl ? "المبلغ المدفوع (ريال قطري)" : "Amount Paid (QAR)"} *
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            required
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder={booking.depositRequired.toString()}
                            className="w-full min-h-[38px] px-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Payment Date Field */}
                        <div>
                          <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                            {isRtl ? "تاريخ السداد" : "Payment Date"} *
                          </label>
                          <input
                            type="date"
                            required
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full min-h-[38px] px-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Transaction Reference / ID Field */}
                        <div className={selectedMethod === "other" ? "" : "sm:col-span-2"}>
                          <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                            {isRtl ? "رقم الحوالة / المعاملة (TID / Ref No.)" : "Transaction Reference / TID (Optional)"}
                          </label>
                          <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g. TXN-9842104 / TID-876123"
                            className="w-full min-h-[38px] px-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Custom Method Field if 'other' */}
                        {selectedMethod === "other" && (
                          <div>
                            <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                              {isRtl ? "وصف طريقة الدفع" : "Describe Payment Method"} *
                            </label>
                            <input
                              type="text"
                              required
                              value={customMethodDescription}
                              onChange={(e) => setCustomMethodDescription(e.target.value)}
                              placeholder="e.g. Corporate Cheque / Wire from KSA"
                              className="w-full min-h-[38px] px-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        )}
                      </div>

                      {/* Customer Notes */}
                      <div>
                        <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                          {isRtl ? "ملاحظات إضافية (اختياري)" : "Customer Notes (Optional)"}
                        </label>
                        <textarea
                          rows={2}
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          placeholder={isRtl ? "أي تفاصيل إضافية عن التحويل..." : "Any additional notes for the finance desk..."}
                          className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                      </div>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {/* Interactive File Drop Area */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl p-5 text-center cursor-pointer transition-colors bg-surface-container-high/30 hover:bg-surface-container-high/50 space-y-1.5"
                      >
                        <UploadCloud className="w-7 h-7 text-primary mx-auto" />
                        <div className="text-xs text-on-surface font-semibold">
                          {selectedFile
                            ? selectedFile.name
                            : isRtl
                            ? "انقر لاختيار إيصال التحويل (صورة أو مستند PDF)"
                            : "Click to select payment receipt (screenshot or PDF)"}
                        </div>
                        <span className="text-[11px] text-on-surface-variant block font-mono">
                          {selectedFile
                            ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • ${selectedFile.type}`
                            : "JPG, PNG, WebP, PDF • Max 10 MB"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleUploadDeposit}
                        disabled={!selectedFile || isUploading}
                        className="w-full min-h-[46px] rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{isRtl ? "جارٍ التشفير والرفع..." : "Uploading & Submitting Proof..."}</span>
                          </>
                        ) : (
                          <>
                            <FileCheck className="w-4 h-4" />
                            <span>
                              {booking.proofStatus === "rejected"
                                ? (isRtl ? "إرسال الإيصال البديل للاعتماد" : "Submit Replacement Payment Proof")
                                : (isRtl ? "إرسال الإيصال للاعتماد المالي" : "Submit Payment Proof for Verification")}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Submission History / Audit Timeline */}
                  {booking.proofs && booking.proofs.length > 0 && (
                    <div className="pt-3 border-t border-outline-variant/15 space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block">
                        {isRtl ? "سجل إشعارات الدفع المقدمة:" : "Submitted Proofs History:"}
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {booking.proofs.map((p) => (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-xl bg-surface-container-high/40 border border-outline-variant/15 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface truncate">
                                <FileText className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">{p.fileName}</span>
                              </div>
                              <div className="text-[10px] text-on-surface-variant flex items-center gap-2">
                                <span>{p.paymentMethod?.replace(/_/g, " ")}</span>
                                {p.amountSubmitted ? <span>• {p.amountSubmitted} QAR</span> : null}
                                <span>• {formatDate(p.uploadedAt, currentLocale)}</span>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                                p.reviewStatus === "accepted"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : p.reviewStatus === "rejected"
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                  : "bg-primary/20 text-primary border-primary/30"
                              }`}
                            >
                              {p.reviewStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[10px] font-mono text-outline uppercase tracking-wider">
                    {isRtl ? "حماية الخصوصية • خادم تخزين خاص ومشفر 256-Bit" : "Protected Private Bucket • 256-Bit Encrypted"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
