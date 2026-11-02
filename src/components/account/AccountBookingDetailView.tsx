"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Locale, TranslationDict } from "@/translations";
import {
  getCustomerBookingByRefAction,
  type CustomerBookingDossier,
} from "@/lib/server/customer-actions";
import { uploadDepositProofAction } from "@/lib/server/booking-actions";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  getServiceName,
  getBookingStatusBadge,
  getPaymentStatusBadge,
  getProofStatusBadge,
} from "./account-utils";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  Upload,
  AlertCircle,
  Loader2,
  MessageCircle,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  History,
} from "lucide-react";

interface AccountBookingDetailViewProps {
  bookingRef: string;
  locale: Locale;
  dict: TranslationDict;
}

export default function AccountBookingDetailView({
  bookingRef,
  locale,
  dict,
}: AccountBookingDetailViewProps) {
  const isRtl = locale === "ar";
  const isAr = isRtl;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState<CustomerBookingDossier | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [payMethod, setPayMethod] = useState<"bank_transfer" | "cash_office" | "other">("bank_transfer");
  const [customMethodDesc, setCustomMethodDesc] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [txnRefInput, setTxnRefInput] = useState("");
  const [payDateInput, setPayDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [notesInput, setNotesInput] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await getCustomerBookingByRefAction(bookingRef);
        if (!mounted) return;
        if (res.success && res.data) {
          setDossier(res.data);
        } else {
          setErrorMsg(res.error || (isRtl ? "لم يتم العثور على الحجز." : "Reservation not found."));
        }
      } catch (err) {
        console.error("[Booking Detail Load Error]", err);
        if (mounted) {
          setErrorMsg(isRtl ? "حدث خطأ أثناء تحميل الحجز." : "Error loading reservation details.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [bookingRef, isRtl]);

  const reloadDossier = async () => {
    try {
      const res = await getCustomerBookingByRefAction(bookingRef);
      if (res.success && res.data) {
        setDossier(res.data);
      }
    } catch (err) {
      console.error("[Reload Dossier Error]", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dossier) return;

    // Validate size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadMsg({
        type: "error",
        text: isRtl
          ? "حجم الملف يتجاوز الحد المسموح (10 ميجابايت)."
          : "File size exceeds maximum allowed limit (10 MB).",
      });
      return;
    }

    // Validate format
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadMsg({
        type: "error",
        text: isRtl
          ? "يرجى رفع ملف بصيغة مدعومة (JPEG, PNG, WebP, PDF)."
          : "Please upload a supported format (JPEG, PNG, WebP, PDF).",
      });
      return;
    }

    if (payMethod === "other" && !customMethodDesc.trim()) {
      setUploadMsg({
        type: "error",
        text: isRtl ? "يرجى تحديد وصف طريقة الدفع المخصصة." : "Please describe your custom payment method.",
      });
      return;
    }

    setUploading(true);
    setUploadMsg(null);

    try {
      const formData = new FormData();
      formData.append("uploadToken", dossier.uploadToken);
      formData.append("file", file);
      formData.append("paymentMethod", payMethod);
      if (payMethod === "other" && customMethodDesc.trim()) {
        formData.append("customPaymentMethod", customMethodDesc.trim());
      }
      formData.append("amountPaid", amountInput || dossier.depositRequired.toString());
      if (txnRefInput.trim()) {
        formData.append("transactionReference", txnRefInput.trim());
      }
      if (payDateInput) {
        formData.append("paymentDate", payDateInput);
      }
      if (notesInput.trim()) {
        formData.append("customerNotes", notesInput.trim());
      }

      const res = await uploadDepositProofAction(formData);
      if (res.success) {
        setUploadMsg({
          type: "success",
          text: isRtl
            ? "تم رفع إيصال الدفع بنجاح. سيتم مراجعته وتدقيقه يدوياً من موظف المالية."
            : "Deposit proof uploaded successfully and queued for concierge finance verification.",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        await reloadDossier();
      } else {
        setUploadMsg({
          type: "error",
          text: res.error || (isRtl ? "فشل رفع الإيصال." : "Failed to upload deposit proof."),
        });
      }
    } catch {
      setUploadMsg({
        type: "error",
        text: isRtl ? "حدث خطأ غير متوقع أثناء الرفع." : "An unexpected error occurred during upload.",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-stone-400">
        <Loader2 className="w-8 h-8 text-[#C29B38] animate-spin" />
      </div>
    );
  }

  if (errorMsg || !dossier) {
    return (
      <div className="bg-[#0F1115] border border-stone-800 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-[#72132B]/30 border border-[#72132B]/60 mx-auto flex items-center justify-center text-red-300">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-stone-100">
          {isRtl ? "تعذر الوصول إلى الحجز" : "Reservation Inaccessible"}
        </h2>
        <p className="text-xs text-stone-400">{errorMsg}</p>
        <div className="pt-2">
          <Link
            href={`/${locale}/account/bookings`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            <span>{isRtl ? "العودة إلى حجوزاتي" : "Return to My Reservations"}</span>
          </Link>
        </div>
      </div>
    );
  }

  const bBadge = getBookingStatusBadge(dossier.bookingStatus, locale);
  const pBadge = getPaymentStatusBadge(dossier.paymentStatus, locale);

  const canUploadProof =
    dossier.bookingStatus === "awaiting_deposit" ||
    dossier.bookingStatus === "deposit_under_review";

  const latestRejectedProof = dossier.proofs.find(
    (p) => p.reviewStatus === "rejected" && p.rejectionReason
  );

  const whatsappMessage = isRtl
    ? `مرحباً إم زد للسياحة قطر، أود الاستفسار بخصوص الحجز رقم (${dossier.bookingRef}) - رحلة ${getServiceName(dossier.serviceId, dict)}.`
    : `Hello MZ Tourism Qatar, inquiry regarding reservation (${dossier.bookingRef}) for ${getServiceName(dossier.serviceId, dict)}.`;

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          href={`/${locale}/account/bookings`}
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-[#C29B38] transition-colors mb-3"
        >
          <BackArrow className="w-3.5 h-3.5" />
          <span>{isRtl ? "العودة إلى قائمة الحجوزات" : "Back to All Reservations"}</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#C29B38]">
                {dossier.bookingRef}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded border font-medium ${bBadge.bg}`}>
                {bBadge.label}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded border font-medium ${pBadge.bg}`}>
                {pBadge.label}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3ECE1]">
              {getServiceName(dossier.serviceId, dict)}
            </h1>
          </div>

          {/* Concierge Inquiry Button */}
          <a
            href={getWhatsAppInquiryUrl(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-emerald-300 hover:bg-emerald-900/40 text-xs font-medium self-start sm:self-auto transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? "محادثة الكونسيرج للرحلة" : "Concierge Liaison"}</span>
          </a>
        </div>
      </div>

      {/* Cancellation Banner Alert */}
      {dossier.bookingStatus === "cancelled" && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2 font-semibold text-rose-300">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{isRtl ? "تم إلغاء هذا الحجز" : "Reservation Cancelled"}</span>
          </div>
          {dossier.cancellationReason && (
            <p className="text-rose-200/90 text-[11px] leading-relaxed">
              <strong>{isAr ? "سبب الإلغاء:" : "Cancellation Reason:"}</strong> {dossier.cancellationReason}
            </p>
          )}
          <p className="text-stone-300 text-[10px] pt-1">
            {isRtl
              ? "إذا كانت لديكم أية استفسارات بخصوص الاسترداد أو حجز رحلة بديلة، يرجى التواصل مع مكتب الكونسيرج الخاص بنا."
              : "For questions regarding refunds or rescheduling, our VIP concierge team remains at your full disposal."}
          </p>
        </div>
      )}

      {/* Completion Banner */}
      {dossier.bookingStatus === "completed" && (
        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/40 text-xs text-sky-200 space-y-1 shadow-lg">
          <div className="flex items-center gap-2 font-semibold text-sky-300">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{isRtl ? "اكتملت الرحلة السياحية بنجاح" : "Expedition Successfully Completed"}</span>
          </div>
          <p className="text-sky-200/90 text-[11px] leading-relaxed">
            {isRtl
              ? "شكراً لاختياركم إم زد للسياحة قطر. نتطلع دائماً لخدمتكم واستضافتكم في تجاربنا السياحية القادمة."
              : "Thank you for traveling with MZ Tourism Qatar. We look forward to welcoming you on your next luxury Qatar journey."}
          </p>
        </div>
      )}

      {/* Visual Booking Progression Stepper */}
      <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4 font-mono">
          {isRtl ? "مراحل مسار الحجز والتأكيد" : "Reservation Lifecycle Progression"}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Step 1: Placed */}
          <div className="p-3 rounded-lg bg-stone-900/80 border border-emerald-500/30 text-stone-200 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{isRtl ? "1. تقديم الحجز" : "1. Request Placed"}</span>
            </div>
            <p className="text-[10px] text-stone-400">{isRtl ? "تم استلام الطلب بنجاح" : "Booking submitted"}</p>
          </div>

          {/* Step 2: Deposit */}
          <div
            className={`p-3 rounded-lg border text-xs space-y-1 ${
              dossier.depositPaid > 0 || dossier.bookingStatus === "confirmed" || dossier.bookingStatus === "completed"
                ? "bg-stone-900/80 border-emerald-500/30 text-stone-200"
                : dossier.paymentStatus === "deposit_submitted"
                ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                : dossier.paymentStatus === "deposit_rejected"
                ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                : "bg-stone-900/40 border-stone-800 text-stone-500"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
              {dossier.depositPaid > 0 || dossier.bookingStatus === "confirmed" || dossier.bookingStatus === "completed" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : dossier.paymentStatus === "deposit_submitted" ? (
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              ) : dossier.paymentStatus === "deposit_rejected" ? (
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-stone-600 shrink-0" />
              )}
              <span>{isRtl ? "2. إيداع العربون" : "2. Deposit Review"}</span>
            </div>
            <p className="text-[10px] text-stone-400">
              {dossier.depositPaid > 0 || dossier.bookingStatus === "confirmed" || dossier.bookingStatus === "completed"
                ? isRtl
                  ? "تم اعتماد العربون"
                  : "Deposit credited"
                : dossier.paymentStatus === "deposit_submitted"
                ? isRtl
                  ? "قيد مراجعة المالية"
                  : "Under review"
                : dossier.paymentStatus === "deposit_rejected"
                ? isRtl
                  ? "مرفوض - يرجى الرفع مجدداً"
                  : "Declined - re-upload"
                : isRtl
                ? "بانتظار إشعار التحويل"
                : "Awaiting transfer"}
            </p>
          </div>

          {/* Step 3: Confirmed */}
          <div
            className={`p-3 rounded-lg border text-xs space-y-1 ${
              dossier.bookingStatus === "confirmed" || dossier.bookingStatus === "completed"
                ? "bg-stone-900/80 border-emerald-500/30 text-stone-200"
                : "bg-stone-900/40 border-stone-800 text-stone-500"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
              {dossier.bookingStatus === "confirmed" || dossier.bookingStatus === "completed" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-stone-600 shrink-0" />
              )}
              <span>{isRtl ? "3. تأكيد الرحلة" : "3. Confirmation"}</span>
            </div>
            <p className="text-[10px] text-stone-400">
              {dossier.bookingStatus === "confirmed" || dossier.bookingStatus === "completed"
                ? isRtl
                  ? "المقاعد مؤكدة رسمياً"
                  : "Confirmed"
                : isRtl
                ? "بانتظار تأكيد العربون"
                : "Pending deposit"}
            </p>
          </div>

          {/* Step 4: Completed or Cancelled */}
          <div
            className={`p-3 rounded-lg border text-xs space-y-1 ${
              dossier.bookingStatus === "completed"
                ? "bg-stone-900/80 border-sky-500/30 text-stone-200"
                : dossier.bookingStatus === "cancelled"
                ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                : "bg-stone-900/40 border-stone-800 text-stone-500"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
              {dossier.bookingStatus === "completed" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              ) : dossier.bookingStatus === "cancelled" ? (
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-stone-600 shrink-0" />
              )}
              <span>{dossier.bookingStatus === "cancelled" ? (isRtl ? "4. ملغي" : "4. Cancelled") : (isRtl ? "4. اكتمال الرحلة" : "4. Expedition Done")}</span>
            </div>
            <p className="text-[10px] text-stone-400">
              {dossier.bookingStatus === "completed"
                ? isRtl
                  ? "تمت الرحلة بنجاح"
                  : "Successfully concluded"
                : dossier.bookingStatus === "cancelled"
                ? isRtl
                  ? "الحجز ملغي"
                  : "Cancelled"
                : isRtl
                ? "بعد الانتهاء من الجولة"
                : "After tour departure"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Participants */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expedition Details Card */}
          <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h2 className="font-serif text-lg font-semibold text-[#F3ECE1] flex items-center gap-2 border-b border-stone-800 pb-3">
              <Calendar className="w-4 h-4 text-[#C29B38]" />
              <span>{isRtl ? "تفاصيل الرحلة والجدول الزمني" : "Expedition Itinerary Details"}</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-stone-300">
              <div>
                <span className="text-stone-500 uppercase tracking-wider text-[10px] block">
                  {isRtl ? "تاريخ الرحلة" : "Travel Date"}
                </span>
                <span className="font-medium text-stone-100 mt-1 block">
                  {formatDate(dossier.departureDate, locale)}
                </span>
              </div>

              <div>
                <span className="text-stone-500 uppercase tracking-wider text-[10px] block">
                  {isRtl ? "الفترة الزمنية" : "Time Window"}
                </span>
                <span className="font-medium text-stone-100 mt-1 block">
                  {dossier.timeWindow || (isRtl ? "مرن" : "Flexible")}
                </span>
              </div>

              <div>
                <span className="text-stone-500 uppercase tracking-wider text-[10px] block">
                  {isRtl ? "عدد المسافرين" : "Party Size"}
                </span>
                <span className="font-medium text-stone-100 mt-1 block">
                  {dossier.paxCount} {isRtl ? "مسافرين" : "Guests"}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-3">
                <span className="text-stone-500 uppercase tracking-wider text-[10px] block">
                  {isRtl ? "موقع الاستقبال والعودة" : "Pick-up & Drop-off Location"}
                </span>
                <span className="font-medium text-stone-200 mt-1 block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C29B38] shrink-0" />
                  <span>{dossier.pickupLocation || (isRtl ? "يحدد لاحقاً مع الكونسيرج" : "To be coordinated with concierge")}</span>
                </span>
              </div>

              {dossier.notes && (
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-stone-800/80">
                  <span className="text-stone-500 uppercase tracking-wider text-[10px] block">
                    {isRtl ? "ملاحظات وتفضيلات الضيف" : "Guest Notes & Requests"}
                  </span>
                  <p className="text-stone-300 mt-1 italic leading-relaxed">
                    &ldquo;{dossier.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Travelers / Participants Card */}
          <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h2 className="font-serif text-lg font-semibold text-[#F3ECE1] flex items-center gap-2 border-b border-stone-800 pb-3">
              <Users className="w-4 h-4 text-[#C29B38]" />
              <span>{isRtl ? "قائمة المسافرين المعتمدين" : "Registered Travelers & Guests"}</span>
            </h2>

            {dossier.participants && dossier.participants.length > 0 ? (
              <div className="space-y-3">
                {dossier.participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-stone-900/60 border border-stone-800 text-xs gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-mono text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-100">{p.fullName}</p>
                        {p.passportOrQatarId && (
                          <p className="text-[11px] text-stone-400">
                            {isRtl ? "الرقم التعريفي / الجواز: " : "ID / Passport: "}
                            {p.passportOrQatarId}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {p.isChild ? (
                        <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-600/30 text-sky-300 text-[10px]">
                          {isRtl ? "طفل" : "Child"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px]">
                          {isRtl ? "بالغ" : "Adult"}
                        </span>
                      )}
                      {p.specialDietary && (
                        <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-600/30 text-amber-300 text-[10px]">
                          {p.specialDietary}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-stone-900/40 border border-stone-800/80 text-xs text-stone-400">
                <p>
                  {isRtl
                    ? `المسافر الرئيسي: ${dossier.customerName} (${dossier.paxCount} ضيوف مسجلين).`
                    : `Lead Traveler: ${dossier.customerName} (${dossier.paxCount} total registered guests).`}
                </p>
              </div>
            )}
          </div>

          {/* Verified Payment History Card (if any payments recorded) */}
          {dossier.payments && dossier.payments.length > 0 && (
            <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 sm:p-6 space-y-4">
              <h2 className="font-serif text-lg font-semibold text-[#F3ECE1] flex items-center gap-2 border-b border-stone-800 pb-3">
                <CreditCard className="w-4 h-4 text-[#C29B38]" />
                <span>{isRtl ? "سجل الدفعات والإيصالات المعتمدة" : "Verified Payment History"}</span>
              </h2>

              <div className="space-y-2.5">
                {dossier.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-stone-900/60 border border-stone-800 text-xs gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-100 capitalize">
                          {p.paymentType === "deposit"
                            ? isRtl ? "دفعة العربون" : "Deposit Payment"
                            : isRtl ? "دفعة الرصيد" : "Balance Payment"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono capitalize">
                          {p.paymentMethod.replace(/_/g, " ")}
                        </span>
                      </div>
                      {p.transactionReference && (
                        <p className="text-[11px] font-mono text-stone-400 mt-0.5">
                          {isRtl ? "المرجع: " : "Ref: "}
                          {p.transactionReference}
                        </p>
                      )}
                    </div>

                    <div className="text-right sm:text-right font-mono">
                      <span className="font-bold text-emerald-400 block">
                        +{formatCurrency(p.amount, p.currency)}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {formatDateTime(p.recordedAt, locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Lifecycle History & Timeline Card (if any timeline events) */}
          {dossier.timeline && dossier.timeline.length > 0 && (
            <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 sm:p-6 space-y-4">
              <h2 className="font-serif text-lg font-semibold text-[#F3ECE1] flex items-center gap-2 border-b border-stone-800 pb-3">
                <History className="w-4 h-4 text-[#C29B38]" />
                <span>{isRtl ? "سجل مراحل وتحديثات الحجز" : "Reservation Timeline & Milestones"}</span>
              </h2>

              <div className="space-y-3">
                {dossier.timeline.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-stone-900/50 border border-stone-800/80 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-stone-200">
                        {isRtl ? item.titleAr : item.titleEn}
                      </p>
                      {(item.descriptionEn || item.descriptionAr) && (
                        <p className="text-[11px] text-stone-400 leading-relaxed">
                          {isRtl ? item.descriptionAr || item.descriptionEn : item.descriptionEn || item.descriptionAr}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono shrink-0">
                      {formatDateTime(item.createdAt, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Financials & Deposit Proof Upload */}
        <div className="space-y-6">
          {/* Financial Breakdown Card */}
          <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 sm:p-6 space-y-4">
            <h2 className="font-serif text-lg font-semibold text-[#F3ECE1] flex items-center gap-2 border-b border-stone-800 pb-3">
              <Receipt className="w-4 h-4 text-[#C29B38]" />
              <span>{isRtl ? "الملخص المالي" : "Financial Breakdown"}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-stone-400">
                <span>{isRtl ? "إجمالي قيمة الرحلة" : "Total Tour Value"}</span>
                <span className="font-semibold text-stone-100 font-mono">
                  {formatCurrency(dossier.totalPrice ?? (dossier.depositRequired + dossier.balanceDue), dossier.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-400">
                <span>{isRtl ? "مبلغ العربون المطلوب" : "Deposit Required"}</span>
                <span className="font-medium text-stone-200 font-mono">
                  {formatCurrency(dossier.depositRequired, dossier.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-400">
                <span>{isRtl ? "المدفوع المستلم المعتمد" : "Deposit Received"}</span>
                <span className="font-medium text-emerald-400 font-mono">
                  {formatCurrency(dossier.depositPaid, dossier.currency)}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                <span className="font-medium text-stone-200">
                  {isRtl ? "الرصيد المتبقي للاكتمال" : "Remaining Balance Due"}
                </span>
                <span className="font-serif text-lg font-bold text-[#C29B38] font-mono">
                  {formatCurrency(dossier.balanceDue, dossier.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Deposit Proof Upload & History Card */}
          <div className="bg-[#0F1115] border border-[#C29B38]/30 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h2 className="font-serif text-base font-semibold text-[#F3ECE1] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#C29B38]" />
                <span>{isRtl ? "إيصالات إيداع الدفعة" : "Deposit Payment Proofs"}</span>
              </h2>
            </div>

            {/* Rejection Alert Banner if applicable */}
            {latestRejectedProof && (
              <div className="p-3.5 rounded-lg bg-[#72132B]/20 border border-[#72132B]/50 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-red-300 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{isRtl ? "تم رفض الإيصال السابق" : "Previous Receipt Rejected"}</span>
                </div>
                <p className="text-red-200/90 text-[11px] leading-relaxed">
                  {latestRejectedProof.rejectionReason}
                </p>
                <p className="text-stone-300 text-[10px] pt-1">
                  {isRtl
                    ? "يرجى رفع إيصال واضح يوضح رقم التحويل وقيمة المبلغ."
                    : "Please upload a clear replacement receipt showing transfer reference and amount."}
                </p>
              </div>
            )}

            {/* Upload Message Feedback */}
            {uploadMsg && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  uploadMsg.type === "success"
                    ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                    : "bg-[#72132B]/30 border border-[#72132B]/60 text-red-300"
                }`}
              >
                {uploadMsg.text}
              </div>
            )}

            {/* Upload Form Dropzone */}
            {canUploadProof && (
              <div className="space-y-3">
                <label className="block text-xs text-stone-300 font-medium">
                  {isRtl ? "بيانات وطريقة السداد اليدوي" : "Manual Payment Details & Receipt"}
                </label>

                {/* Method selector */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPayMethod("bank_transfer")}
                    className={`p-2 rounded-lg border text-start transition-colors ${
                      payMethod === "bank_transfer"
                        ? "bg-[#C29B38]/20 border-[#C29B38] text-[#F3ECE1] font-semibold"
                        : "bg-stone-900/50 border-stone-800 text-stone-400"
                    }`}
                  >
                    {isRtl ? "تحويل بنكي (قطر)" : "Bank Transfer (Qatar)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("cash_office")}
                    className={`p-2 rounded-lg border text-start transition-colors ${
                      payMethod === "cash_office"
                        ? "bg-[#C29B38]/20 border-[#C29B38] text-[#F3ECE1] font-semibold"
                        : "bg-stone-900/50 border-stone-800 text-stone-400"
                    }`}
                  >
                    {isRtl ? "نقداً بمقر الشركة" : "Cash at Office"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("other")}
                    className={`col-span-2 p-2 rounded-lg border text-start transition-colors ${
                      payMethod === "other"
                        ? "bg-[#C29B38]/20 border-[#C29B38] text-[#F3ECE1] font-semibold"
                        : "bg-stone-900/50 border-stone-800 text-stone-400"
                    }`}
                  >
                    {isRtl ? "ترتيبات خاصة أخرى" : "Other Custom Arrangement"}
                  </button>
                </div>

                {payMethod === "other" && (
                  <input
                    type="text"
                    value={customMethodDesc}
                    onChange={(e) => setCustomMethodDesc(e.target.value)}
                    placeholder={isRtl ? "صف طريقة الدفع المستخدمة..." : "Describe manual payment method..."}
                    className="w-full min-h-[36px] px-3 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-[#C29B38]"
                  />
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">
                      {isRtl ? "المبلغ (ر.ق)" : "Amount (QAR)"}
                    </label>
                    <input
                      type="number"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      placeholder={dossier.depositRequired.toString()}
                      className="w-full min-h-[34px] px-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">
                      {isRtl ? "رقم المرجع / TID" : "Ref / TID"}
                    </label>
                    <input
                      type="text"
                      value={txnRefInput}
                      onChange={(e) => setTxnRefInput(e.target.value)}
                      placeholder="e.g. TXN-123456"
                      className="w-full min-h-[34px] px-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">
                      {isRtl ? "تاريخ التحويل" : "Payment Date"}
                    </label>
                    <input
                      type="date"
                      value={payDateInput}
                      onChange={(e) => setPayDateInput(e.target.value)}
                      className="w-full min-h-[34px] px-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">
                      {isRtl ? "ملاحظات إضافية" : "Customer Notes"}
                    </label>
                    <input
                      type="text"
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder={isRtl ? "أي تفاصيل إضافية..." : "Optional notes..."}
                      className="w-full min-h-[34px] px-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 text-xs"
                    />
                  </div>
                </div>

                {/* Explicit Disclaimer */}
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-200/90 leading-relaxed">
                  {isRtl
                    ? "تنبيه: تقديم إيصال السداد لا يؤكد الحجز فوراً؛ يتطلب الأمر تدقيقاً يدوياً من موظف المالية."
                    : "Notice: Submitting proof does not automatically confirm the booking; manual finance review is required."}
                </div>

                <div className="relative border-2 border-dashed border-stone-700 hover:border-[#C29B38]/60 rounded-xl p-5 text-center transition-colors bg-stone-900/30">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="space-y-2 pointer-events-none">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-[#C29B38] animate-spin mx-auto" />
                    ) : (
                      <Upload className="w-6 h-6 text-[#C29B38] mx-auto" />
                    )}
                    <p className="text-xs text-stone-200 font-medium">
                      {uploading
                        ? isRtl
                          ? "جارٍ رفع الإيصال..."
                          : "Uploading receipt..."
                        : isRtl
                        ? "اضغط لاختيار الإيصال أو اسحبه هنا"
                        : "Click to select or drag receipt here"}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      JPEG, PNG, WebP, PDF (Max 10 MB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Uploaded Proofs List */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] text-stone-400 block uppercase tracking-wider font-medium">
                {isRtl ? "سجل الإيصالات المرفوعة" : "Submitted Receipts History"}
              </span>

              {dossier.proofs && dossier.proofs.length > 0 ? (
                <div className="space-y-2">
                  {dossier.proofs.map((proof) => {
                    const badge = getProofStatusBadge(proof.reviewStatus, locale);
                    return (
                      <div
                        key={proof.id}
                        className="p-3 rounded-lg bg-stone-900/70 border border-stone-800 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-stone-200 truncate text-[11px]">
                              {proof.fileName}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-0.5">
                              {formatDateTime(proof.uploadedAt, locale)}
                            </p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        {proof.signedUrl && (
                          <div className="pt-1 flex justify-end">
                            <a
                              href={proof.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#C29B38] hover:underline"
                            >
                              <Download className="w-3 h-3" />
                              <span>{isRtl ? "معاينة الإيصال (رابط مؤقت)" : "View Receipt (Secure Link)"}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic py-2 text-center">
                  {isRtl ? "لم يتم رفع أية إيصالات بعد." : "No receipts submitted yet."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
