"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Locale } from "@/translations";
import {
  getAdminBookingsAction,
  getAdminBookingDetailAction,
  recordBalancePaymentAction,
  cancelAdminBookingAction,
  completeAdminBookingAction,
  reviewAdminDepositProofAction,
  getAdminSignedProofUrlAction,
  updateAdminBookingAction,
  exportBookingsCsvAction,
  type GetAdminBookingsOptions,
} from "@/lib/server/admin-actions";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import { formatQAR } from "./admin-utils";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/validations/booking-schemas";
import {
  Search,
  Calendar,
  MapPin,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MessageCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  History,
  Loader2,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";

interface AdminBookingsViewProps {
  locale: Locale;
  adminUserRole?: string | null;
}

interface BookingRecordItem {
  id: string;
  bookingRef: string;
  customerId: string | null;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  departureDate: string | null;
  timeWindow: string | null;
  paxCount: number;
  pickupLocation: string | null;
  notes: string | null;
  bookingStatus: "awaiting_deposit" | "deposit_under_review" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "deposit_pending" | "deposit_submitted" | "deposit_confirmed" | "deposit_rejected" | "fully_paid";
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  totalPrice: number;
  currency: string;
  adminNotes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  uploadToken: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingPaymentItem {
  id: string;
  bookingId: string;
  paymentType: "deposit" | "balance" | "full" | "refund";
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionReference: string | null;
  proofId: string | null;
  notes: string | null;
  recordedBy: string | null;
  recordedAt: string;
}

interface BookingTimelineItem {
  id: string;
  bookingId: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  actorId: string | null;
  actorRole: string | null;
  metadata: unknown;
  createdAt: string;
}

interface BookingDossierDetailed {
  booking: BookingRecordItem;
  proofs: {
    id: string;
    storage_path: string;
    file_name: string;
    mime_type: string;
    file_size: number;
    review_status: string;
    rejection_reason: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    uploaded_at: string;
  }[];
  payments: BookingPaymentItem[];
  timeline: BookingTimelineItem[];
  notifications: {
    id: string;
    notification_type: string;
    channel: string;
    recipient: string;
    status: string;
    subject: string | null;
    created_at: string;
  }[];
}

export default function AdminBookingsView({ locale, adminUserRole }: AdminBookingsViewProps) {
  const isAr = locale === "ar";

  // Data states
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRecordItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [departureDateFilter, setDepartureDateFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [sortBy, setSortBy] = useState<GetAdminBookingsOptions["sortBy"]>("newest");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Dossier inspection modal state
  const [selectedDossier, setSelectedDossier] = useState<BookingDossierDetailed | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [dossierMemo, setDossierMemo] = useState("");
  const [savingMemo, setSavingMemo] = useState(false);

  // Balance payment recording state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Completion state
  const [completing, setCompleting] = useState(false);

  // Deposit Proof Review State
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);
  const [inspectingProof, setInspectingProof] = useState(false);
  const [rejectingProofId, setRejectingProofId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewingProof, setReviewingProof] = useState(false);

  // CSV Export state
  const [exportingCsv, setExportingCsv] = useState(false);

  // Role permissions helpers
  const canManageFinance = adminUserRole === "super_admin" || adminUserRole === "finance";
  const canManageOperations = adminUserRole === "super_admin" || adminUserRole === "tour_manager";

  // Load Bookings Data
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminBookingsAction({
        search,
        filterStatus: statusFilter,
        filterPaymentStatus: paymentStatusFilter,
        serviceId: serviceFilter,
        departureDate: departureDateFilter,
        startDate: startDateFilter,
        endDate: endDateFilter,
        sortBy,
        page,
        limit,
      });

      if (res.success && res.data) {
        setBookings(res.data as BookingRecordItem[]);
        setTotalCount(res.totalCount || res.data.length);
      } else {
        console.error("[Load Bookings Error]", res.error);
      }
    } catch (err) {
      console.error("[Load Bookings Unexpected Error]", err);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    paymentStatusFilter,
    serviceFilter,
    departureDateFilter,
    startDateFilter,
    endDateFilter,
    sortBy,
    page,
    limit,
  ]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Open full booking dossier
  const handleOpenDossier = async (bookingId: string) => {
    try {
      setLoadingDossier(true);
      setPaymentError(null);
      setCancelError(null);
      setShowPaymentForm(false);
      setShowCancelModal(false);
      setRejectingProofId(null);

      const res = await getAdminBookingDetailAction(bookingId);
      if (res.success && res.data) {
        const dossierData = res.data as BookingDossierDetailed;
        setSelectedDossier(dossierData);
        setDossierMemo(dossierData.booking.adminNotes || "");
        setPayAmount(dossierData.booking.balanceDue);
      } else {
        alert(res.error || "Failed to load booking dossier.");
      }
    } catch (err) {
      console.error("[Open Dossier Error]", err);
      alert("Error retrieving reservation dossier.");
    } finally {
      setLoadingDossier(false);
    }
  };

  // Reload current open dossier
  const reloadSelectedDossier = async (bookingId: string) => {
    try {
      const res = await getAdminBookingDetailAction(bookingId);
      if (res.success && res.data) {
        const dossierData = res.data as BookingDossierDetailed;
        setSelectedDossier(dossierData);
        setDossierMemo(dossierData.booking.adminNotes || "");
        setPayAmount(dossierData.booking.balanceDue);
      }
      await loadBookings();
    } catch (err) {
      console.error("[Reload Dossier Error]", err);
    }
  };

  // Save Operations Memo
  const handleSaveMemo = async () => {
    if (!selectedDossier) return;
    try {
      setSavingMemo(true);
      const res = await updateAdminBookingAction({
        bookingId: selectedDossier.booking.id,
        bookingStatus: selectedDossier.booking.bookingStatus,
        paymentStatus: selectedDossier.booking.paymentStatus,
        adminNotes: dossierMemo.trim() || null,
      });

      if (res.success) {
        setSelectedDossier({
          ...selectedDossier,
          booking: {
            ...selectedDossier.booking,
            adminNotes: dossierMemo.trim() || null,
          },
        });
        await loadBookings();
      } else {
        alert(res.error || "Failed to save memo.");
      }
    } catch (err) {
      console.error("[Save Memo Error]", err);
    } finally {
      setSavingMemo(false);
    }
  };

  // Record verified balance payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    if (payAmount <= 0) {
      setPaymentError(isAr ? "يرجى إدخال مبلغ صحيح أكبر من الصفر." : "Payment amount must be greater than zero.");
      return;
    }

    if (payAmount > selectedDossier.booking.balanceDue) {
      setPaymentError(
        isAr
          ? `المبلغ المدخل (${payAmount} ر.ق) يتجاوز الرصيد المتبقي (${selectedDossier.booking.balanceDue} ر.ق).`
          : `Amount (${payAmount} QAR) exceeds remaining balance due (${selectedDossier.booking.balanceDue} QAR).`
      );
      return;
    }

    try {
      setRecordingPayment(true);
      setPaymentError(null);

      const res = await recordBalancePaymentAction({
        bookingId: selectedDossier.booking.id,
        amount: payAmount,
        currency: "QAR",
        paymentMethod: payMethod,
        transactionReference: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined,
      });

      if (res.success) {
        setShowPaymentForm(false);
        setPayRef("");
        setPayNotes("");
        await reloadSelectedDossier(selectedDossier.booking.id);
      } else {
        setPaymentError(res.error || "Failed to record balance payment.");
      }
    } catch (err) {
      console.error("[Record Payment Error]", err);
      setPaymentError((err as Error).message);
    } finally {
      setRecordingPayment(false);
    }
  };

  // Complete Booking
  const handleCompleteBooking = async () => {
    if (!selectedDossier) return;
    if (selectedDossier.booking.bookingStatus !== "confirmed") {
      alert(isAr ? "يمكن فقط إتمام الحجوزات المؤكدة." : "Only confirmed reservations can be marked as completed.");
      return;
    }

    const confirmed = window.confirm(
      isAr
        ? "هل أنت متأكد من اكتمال الرحلة السياحية بنجاح؟ سيتم إشعار الضيف وتحديث السجل."
        : "Confirm that this luxury expedition has concluded successfully? The guest will be notified."
    );
    if (!confirmed) return;

    try {
      setCompleting(true);
      const res = await completeAdminBookingAction({
        bookingId: selectedDossier.booking.id,
        notes: "Expedition concluded successfully by concierge operations.",
      });

      if (res.success) {
        await reloadSelectedDossier(selectedDossier.booking.id);
      } else {
        alert(res.error || "Failed to mark booking as completed.");
      }
    } catch (err) {
      console.error("[Complete Booking Error]", err);
      alert((err as Error).message);
    } finally {
      setCompleting(false);
    }
  };

  // Cancel Booking
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    if (!cancelReason || cancelReason.trim().length < 3) {
      setCancelError(
        isAr
          ? "يجب تقديم سبب إلغاء واضح (لا يقل عن 3 أحرف)."
          : "A clear cancellation reason (at least 3 characters) is required."
      );
      return;
    }

    try {
      setCancelling(true);
      setCancelError(null);

      const res = await cancelAdminBookingAction({
        bookingId: selectedDossier.booking.id,
        reason: cancelReason.trim(),
      });

      if (res.success) {
        setShowCancelModal(false);
        setCancelReason("");
        await reloadSelectedDossier(selectedDossier.booking.id);
      } else {
        setCancelError(res.error || "Failed to cancel reservation.");
      }
    } catch (err) {
      console.error("[Cancel Booking Error]", err);
      setCancelError((err as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  // Inspect deposit proof in secure viewer
  const handleInspectProof = async (storagePath: string) => {
    try {
      setInspectingProof(true);
      const res = await getAdminSignedProofUrlAction(storagePath);
      if (res.success && res.signedUrl) {
        setActiveProofUrl(res.signedUrl);
      } else {
        alert(res.error || "Failed to generate secure receipt link.");
      }
    } catch (err) {
      console.error("[Inspect Proof Error]", err);
    } finally {
      setInspectingProof(false);
    }
  };

  // Review deposit proof (Accept / Reject)
  const handleReviewProof = async (proofId: string, status: "accepted" | "rejected", reason?: string, confirmedAmount?: number) => {
    if (!selectedDossier) return;
    try {
      setReviewingProof(true);
      const res = await reviewAdminDepositProofAction({
        proofId,
        bookingId: selectedDossier.booking.id,
        reviewStatus: status,
        confirmedAmount,
        rejectionReason: reason || null,
      });

      if (res.success) {
        setRejectingProofId(null);
        setRejectReason("");
        await reloadSelectedDossier(selectedDossier.booking.id);
      } else {
        alert(res.error || "Failed to update proof review.");
      }
    } catch (err) {
      console.error("[Review Proof Error]", err);
      alert((err as Error).message);
    } finally {
      setReviewingProof(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const res = await exportBookingsCsvAction({
        search,
        filterStatus: statusFilter,
        filterPaymentStatus: paymentStatusFilter,
        serviceId: serviceFilter,
        departureDate: departureDateFilter,
        startDate: startDateFilter,
        endDate: endDateFilter,
        sortBy,
      });

      if (res.success && res.csvContent) {
        const blob = new Blob(["\uFEFF" + res.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", res.filename || `mz_tourism_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(res.error || "Failed to generate CSV export.");
      }
    } catch (err) {
      console.error("[Export CSV Error]", err);
      alert("Error generating export file.");
    } finally {
      setExportingCsv(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const isFilterActive =
    search !== "" ||
    statusFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    serviceFilter !== "all" ||
    departureDateFilter !== "" ||
    startDateFilter !== "" ||
    endDateFilter !== "" ||
    sortBy !== "newest";

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setServiceFilter("all");
    setDepartureDateFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CSV EXPORT */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container p-5 rounded-2xl border border-outline-variant/20 shadow-md">
        <div>
          <h2 className="font-serif text-xl font-bold text-on-surface flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>{isAr ? "إدارة الحجوزات والعمليات السياحية" : "Expedition Reservations & Operations"}</span>
          </h2>
          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
            {isAr
              ? `إجمالي الحجوزات: ${totalCount} حجز • العملة المعتمدة: ريال قطري (QAR)`
              : `Total Records: ${totalCount} Reservations • Operating Currency: QAR (ر.ق)`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exportingCsv || bookings.length === 0}
            className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary border border-primary/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {exportingCsv ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span>{isAr ? "تصدير CSV" : "Export Filtered CSV"}</span>
          </button>

          <button
            type="button"
            onClick={loadBookings}
            disabled={loading}
            className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-outline-variant/30 text-xs transition-colors cursor-pointer"
            title="Refresh bookings list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ADVANCED SEARCH & MULTI-PARAMETER FILTER TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/20 space-y-3 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Keyword Search */}
          <div className="relative">
            <Search className={`absolute ${isAr ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant`} />
            <input
              type="text"
              placeholder={isAr ? "بحث بالرمز، الضيف، الهاتف، البريد..." : "Search ref, guest name, phone, email..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`w-full min-h-[38px] ${isAr ? "pr-8 pl-3" : "pl-8 pr-3"} bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary`}
            />
          </div>

          {/* Booking Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-[38px] bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">{isAr ? "كافة حالات الحجز" : "All Booking Statuses"}</option>
            <option value="awaiting_deposit">{isAr ? "بانتظار العربون" : "Awaiting Deposit"}</option>
            <option value="deposit_under_review">{isAr ? "العربون قيد المراجعة" : "Deposit Under Review"}</option>
            <option value="confirmed">{isAr ? "مؤكد" : "Confirmed"}</option>
            <option value="completed">{isAr ? "مكتمل بنجاح" : "Completed"}</option>
            <option value="cancelled">{isAr ? "ملغي" : "Cancelled"}</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-[38px] bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">{isAr ? "كافة حالات الدفع" : "All Payment Statuses"}</option>
            <option value="deposit_pending">{isAr ? "العربون معلق" : "Deposit Pending"}</option>
            <option value="deposit_submitted">{isAr ? "تم رفع الإشعار" : "Deposit Submitted"}</option>
            <option value="deposit_confirmed">{isAr ? "تم اعتماد العربون" : "Deposit Confirmed"}</option>
            <option value="deposit_rejected">{isAr ? "تم رفض الإيصال" : "Deposit Rejected"}</option>
            <option value="fully_paid">{isAr ? "مدفوع بالكامل" : "Fully Paid"}</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as GetAdminBookingsOptions["sortBy"]);
              setPage(1);
            }}
            className="min-h-[38px] bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="newest">{isAr ? "الأحدث تسجيلاً" : "Sort: Newest Created"}</option>
            <option value="oldest">{isAr ? "الأقدم تسجيلاً" : "Sort: Oldest Created"}</option>
            <option value="departure_asc">{isAr ? "تاريخ الرحلة (الأقرب أولاً)" : "Sort: Departure (Soonest)"}</option>
            <option value="departure_desc">{isAr ? "تاريخ الرحلة (الأبعد أولاً)" : "Sort: Departure (Latest)"}</option>
            <option value="amount_desc">{isAr ? "المبلغ الأعلى أولاً" : "Sort: Amount (High to Low)"}</option>
            <option value="amount_asc">{isAr ? "المبلغ الأقل أولاً" : "Sort: Amount (Low to High)"}</option>
          </select>
        </div>

        {/* Date Ranges & Clear Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-outline-variant/15 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-on-surface-variant font-mono">
              {isAr ? "نطاق تاريخ المغادرة:" : "Departure Range:"}
            </span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setPage(1);
              }}
              title="Start departure date"
              className="bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            />
            <span className="text-on-surface-variant">→</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setPage(1);
              }}
              title="End departure date"
              className="bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            />
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold border border-outline-variant/20 transition-colors cursor-pointer"
            >
              {isAr ? "إعادة ضبط الفلاتر" : "Reset Filters"}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOOKINGS LIST CARDS */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="p-16 text-center text-xs text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>{isAr ? "جارٍ تحميل سجلات الحجوزات..." : "Loading luxury reservations ledger..."}</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-16 text-center text-xs text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/20 space-y-2">
          <Calendar className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
          <p className="font-medium text-sm text-on-surface">
            {isAr ? "لم يتم العثور على أية حجوزات مطابقة للفلاتر." : "No reservations matching the selected filter criteria."}
          </p>
          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-primary hover:underline text-xs"
            >
              {isAr ? "إلغاء تفعيل الفلاتر" : "Clear active filters"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* ========================================================================= */}
          {/* DESKTOP 14-COLUMN DATA TABLE (Comprehensive Bookings & Payment Ledger)   */}
          {/* ========================================================================= */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container shadow-xl">
            <table className="w-full text-start text-xs">
              <thead className="bg-surface-container-high/90 text-[10px] uppercase font-mono tracking-wider text-on-surface-variant border-b border-outline-variant/20">
                <tr>
                  <th className="px-3.5 py-3.5 whitespace-nowrap">Ref</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap">{isAr ? "اسم العميل" : "Customer Name"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap">{isAr ? "البريد الإلكتروني" : "Customer Email"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap">{isAr ? "الهاتف / واتساب" : "Phone / WhatsApp"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap">{isAr ? "اسم التجربة" : "Tour Name"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap">{isAr ? "تاريخ الرحلة" : "Departure Date"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap text-center">{isAr ? "عدد الضيوف" : "Guests"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap text-end">{isAr ? "الإجمالي" : "Total Amount"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap text-end text-primary">{isAr ? "العربون المطلوب" : "Deposit Required"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap text-end text-emerald-400">{isAr ? "العربون المدفوع" : "Deposit Paid"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap text-end text-amber-300">{isAr ? "الرصيد المتبقي" : "Balance Due"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap text-center">{isAr ? "حالة الدفع" : "Payment Status"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap text-center">{isAr ? "حالة الحجز" : "Booking Status"}</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap text-center">{isAr ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-sans">
                {bookings.map((b) => {
                  const whatsAppMsg = `Hello ${b.customerName}, this is MZ Tourism Qatar concierge regarding your reservation ${b.bookingRef}.`;
                  const whatsAppUrl = getWhatsAppInquiryUrl(whatsAppMsg);
                  const totalAmt = b.totalPrice || (b.depositRequired + b.balanceDue);

                  return (
                    <tr key={`table-${b.id}`} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-3.5 py-3 whitespace-nowrap font-mono font-bold text-primary">
                        {b.bookingRef}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap font-medium text-on-surface">
                        {b.customerName}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap font-mono text-on-surface-variant text-[11px]">
                        {b.customerEmail}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap font-mono text-on-surface-variant text-[11px]">
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          <span>{b.customerPhone}</span>
                        </a>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-on-surface capitalize max-w-[150px] truncate" title={b.serviceId}>
                        {b.serviceId.replace(/-/g, " ")}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-on-surface-variant">
                        {b.departureDate || "—"}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-center font-mono">
                        {b.paxCount}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-end font-mono font-semibold text-on-surface">
                        {formatQAR(totalAmt)}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-end font-mono font-semibold text-primary">
                        {formatQAR(b.depositRequired)}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-end font-mono font-semibold text-emerald-400">
                        {formatQAR(b.depositPaid)}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-end font-mono font-semibold text-amber-300">
                        {formatQAR(b.balanceDue)}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize border ${
                            b.paymentStatus === "fully_paid"
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                              : b.paymentStatus === "deposit_confirmed"
                              ? "bg-primary/15 text-primary border-primary/30"
                              : b.paymentStatus === "deposit_rejected"
                              ? "bg-rose-950/60 text-rose-400 border-rose-500/30"
                              : "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                          }`}
                        >
                          {b.paymentStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize border ${
                            b.bookingStatus === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : b.bookingStatus === "deposit_under_review"
                              ? "bg-primary/20 text-primary border-primary/30"
                              : b.bookingStatus === "completed"
                              ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                              : b.bookingStatus === "cancelled"
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {b.bookingStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDossier(b.id)}
                            disabled={loadingDossier}
                            className="px-2.5 py-1 rounded bg-primary hover:bg-primary-container text-on-primary text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                            title={isAr ? "عرض الملف الكامل والتدقيق المالي" : "View Details & Financial Ledger"}
                          >
                            <FileText className="w-3 h-3" />
                            <span>{isAr ? "الملف" : "Details"}</span>
                          </button>

                          {b.uploadToken && (
                            <Link
                              href={`/${locale}/booking/${b.uploadToken}`}
                              target="_blank"
                              className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface text-[11px] transition-colors"
                              title={isAr ? "عرض بوابة الضيف" : "Guest View"}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE / TABLET RESPONSIVE CARDS VIEW                                     */}
          {/* ========================================================================= */}
          <div className="block lg:hidden space-y-3.5">
          {bookings.map((b) => {
            const whatsAppMsg = `Hello ${b.customerName}, this is MZ Tourism Qatar concierge regarding your reservation ${b.bookingRef}.`;
            const whatsAppUrl = getWhatsAppInquiryUrl(whatsAppMsg);

            return (
              <div
                key={b.id}
                className="bg-surface-container rounded-2xl border border-outline-variant/25 hover:border-primary/40 p-5 shadow-lg transition-all space-y-3.5"
              >
                {/* Header row: Reference, Guest, Statuses */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-outline-variant/15 gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-primary tracking-wider px-2 py-0.5 rounded bg-primary/10 border border-primary/25">
                      {b.bookingRef}
                    </span>
                    <span className="text-xs font-semibold text-on-surface">
                      {b.customerName}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      {b.customerPhone}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Booking Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono capitalize border ${
                        b.bookingStatus === "confirmed"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : b.bookingStatus === "deposit_under_review"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : b.bookingStatus === "completed"
                          ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                          : b.bookingStatus === "cancelled"
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {b.bookingStatus.replace(/_/g, " ")}
                    </span>

                    {/* Payment Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono capitalize border ${
                        b.paymentStatus === "fully_paid"
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                          : b.paymentStatus === "deposit_confirmed"
                          ? "bg-primary/15 text-primary border-primary/30"
                          : b.paymentStatus === "deposit_rejected"
                          ? "bg-rose-950/60 text-rose-400 border-rose-500/30"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                      }`}
                    >
                      {b.paymentStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                      {isAr ? "التجربة السياحية" : "Expedition & Party"}
                    </span>
                    <span className="text-on-surface font-medium capitalize block truncate">
                      {b.serviceId.replace(/-/g, " ")} ({b.paxCount} {isAr ? "ضيوف" : "Guests"})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                      {isAr ? "تاريخ الرحلة" : "Travel Date & Window"}
                    </span>
                    <span className="text-on-surface font-medium block">
                      {b.departureDate || (isAr ? "مرن" : "Flexible")}{" "}
                      {b.timeWindow ? `• ${b.timeWindow.split(" ")[0]}` : ""}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                      {isAr ? "العربون المدفوع / المطلوب" : "Deposit Paid / Required"}
                    </span>
                    <span className="text-primary font-mono font-semibold block">
                      {formatQAR(b.depositPaid)} / {formatQAR(b.depositRequired)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                      {isAr ? "الرصيد المتبقي" : "Outstanding Balance"}
                    </span>
                    <span className={`font-mono font-semibold block ${b.balanceDue > 0 ? "text-amber-300" : "text-emerald-400"}`}>
                      {formatQAR(b.balanceDue)}
                    </span>
                  </div>
                </div>

                {/* Pickup Hotel indicator */}
                {b.pickupLocation && (
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      <strong className="text-on-surface">{isAr ? "نقطة الاستقبال:" : "Pickup Hotel:"}</strong>{" "}
                      {b.pickupLocation}
                    </span>
                  </div>
                )}

                {/* Cancellation alert indicator */}
                {b.bookingStatus === "cancelled" && b.cancellationReason && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-[11px] text-rose-300 border border-rose-500/20 font-mono">
                    <strong>{isAr ? "سبب الإلغاء:" : "Cancellation Reason:"}</strong> {b.cancellationReason}
                  </div>
                )}

                {/* Admin Memo indicator */}
                {b.adminNotes && (
                  <div className="p-2.5 rounded-xl bg-primary/10 text-[11px] text-primary border border-primary/20 font-mono">
                    <strong>{isAr ? "ملاحظة العمليات:" : "Operations Memo:"}</strong> {b.adminNotes}
                  </div>
                )}

                {/* Action Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/15">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDossier(b.id)}
                      disabled={loadingDossier}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isAr ? "عرض الملف الكامل" : "View Full Dossier"}</span>
                    </button>

                    {b.uploadToken && (
                      <Link
                        href={`/${locale}/booking/${b.uploadToken}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
                      >
                        <span>{isAr ? "بوابة الضيف" : "Guest View"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-outline-variant/20 text-xs">
              <span className="text-on-surface-variant font-mono">
                {isAr
                  ? `صفحة ${page} من ${totalPages} (${totalCount} حجز مسجل)`
                  : `Page ${page} of ${totalPages} (${totalCount} total reservations)`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{isAr ? "السابق" : "Previous"}</span>
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAr ? "التالي" : "Next"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: FULL RESERVATION DOSSIER & LIFECYCLE MANAGEMENT */}
      {/* ========================================================================= */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-surface-container border border-primary/40 rounded-3xl p-5 sm:p-7 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-bold text-primary">
                  {selectedDossier.booking.bookingRef}
                </span>
                <span className="text-on-surface-variant">•</span>
                <span className="text-xs font-semibold text-on-surface">
                  {isAr ? "ملف الحجز والعمليات التنفيذية" : "Reservation Dossier & Operations"}
                </span>
              </div>
              <button
                onClick={() => setSelectedDossier(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-surface-container-high/60 p-4 rounded-2xl border border-outline-variant/20">
              <div>
                <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                  {isAr ? "حالة الحجز" : "Booking Status"}
                </span>
                <span className="font-semibold text-primary capitalize">
                  {selectedDossier.booking.bookingStatus.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                  {isAr ? "حالة الدفع" : "Payment Status"}
                </span>
                <span className="font-semibold text-on-surface capitalize">
                  {selectedDossier.booking.paymentStatus.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                  {isAr ? "تاريخ الرحلة" : "Departure"}
                </span>
                <span className="text-on-surface font-medium">
                  {selectedDossier.booking.departureDate || (isAr ? "مرن" : "Flexible")}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                  {isAr ? "عدد الضيوف" : "Party Size"}
                </span>
                <span className="text-on-surface font-medium">
                  {selectedDossier.booking.paxCount} {isAr ? "ضيوف" : "Guests"}
                </span>
              </div>
            </div>

            {/* Primary Guest Contact */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-primary uppercase text-[11px] tracking-wider font-mono">
                {isAr ? "بيانات الضيف الرئيسي" : "Primary Guest Contact"}
              </h4>
              <div className="p-3.5 rounded-xl bg-surface-container-high/40 border border-outline-variant/15 space-y-2">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{isAr ? "الاسم الكامل:" : "Full Name:"}</span>
                  <span className="font-semibold text-on-surface">{selectedDossier.booking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{isAr ? "رقم الهاتف:" : "Phone:"}</span>
                  <span className="font-mono text-on-surface">{selectedDossier.booking.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>
                  <span className="font-mono text-on-surface">{selectedDossier.booking.customerEmail}</span>
                </div>
                {selectedDossier.booking.pickupLocation && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">{isAr ? "فندق الاستقبال:" : "Pickup Location:"}</span>
                    <span className="text-on-surface font-medium">{selectedDossier.booking.pickupLocation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Balance Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-primary uppercase text-[11px] tracking-wider font-mono">
                  {isAr ? "الموقف المالي للحجز" : "Financial Reconciliation"}
                </h4>
                {canManageFinance && selectedDossier.booking.balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(!showPaymentForm);
                      setPaymentError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>{showPaymentForm ? (isAr ? "إلغاء النموذج" : "Hide Payment Form") : (isAr ? "تسجيل دفعة رصيد" : "Record Balance Payment")}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-surface-container-high/40 border border-outline-variant/15 font-mono text-center">
                <div>
                  <span className="text-[10px] uppercase text-on-surface-variant block">
                    {isAr ? "إجمالي الرحلة" : "Total Price"}
                  </span>
                  <span className="font-bold text-on-surface">
                    {formatQAR(selectedDossier.booking.totalPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-on-surface-variant block">
                    {isAr ? "العربون المطلوب" : "Deposit Required"}
                  </span>
                  <span className="font-bold text-on-surface">
                    {formatQAR(selectedDossier.booking.depositRequired)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-emerald-400 block">
                    {isAr ? "المحصل المعتمد" : "Total Verified"}
                  </span>
                  <span className="font-bold text-emerald-400">
                    {formatQAR(selectedDossier.booking.depositPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-amber-300 block">
                    {isAr ? "الرصيد المتبقي" : "Balance Due"}
                  </span>
                  <span className="font-bold text-amber-300">
                    {formatQAR(selectedDossier.booking.balanceDue)}
                  </span>
                </div>
              </div>

              {/* Record Balance Payment Form Drawer */}
              {showPaymentForm && canManageFinance && (
                <form
                  onSubmit={handleRecordPayment}
                  className="p-4 rounded-xl bg-surface-container-high border border-primary/40 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                    <span className="font-semibold text-primary text-xs">
                      {isAr ? "تسجيل دفعة رصيد معتمدة (دفتر القيود المالية)" : "Record Verified Balance Payment (Financial Ledger)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="text-on-surface-variant hover:text-on-surface"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {paymentError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                      {paymentError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-medium text-on-surface-variant block mb-1">
                        {isAr ? "المبلغ (ريال قطري QAR)" : "Payment Amount (QAR)"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={selectedDossier.booking.balanceDue}
                        value={payAmount}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-on-surface-variant block mb-1">
                        {isAr ? "طريقة الدفع" : "Payment Method"}
                      </label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface cursor-pointer"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-on-surface-variant block mb-1">
                        {isAr ? "رقم المعاملة / المرجع البنكي" : "Transaction / Bank Reference"}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. QNB-TR-9948271"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-on-surface-variant block mb-1">
                        {isAr ? "ملاحظات الدفعة" : "Financial Notes"}
                      </label>
                      <input
                        type="text"
                        placeholder={isAr ? "دفعة الرصيد عبر التحويل البنكي أو بطاقة الائتمان" : "Settlement notes or receipt details"}
                        value={payNotes}
                        onChange={(e) => setPayNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-surface-container text-xs text-on-surface-variant"
                    >
                      {isAr ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={recordingPayment}
                      className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-50"
                    >
                      {recordingPayment ? (isAr ? "جارٍ التسجيل..." : "Recording...") : (isAr ? "تأكيد تسجيل الدفعة" : "Confirm Payment Ledger Entry")}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Verified Payment Ledger Table */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-primary uppercase text-[11px] tracking-wider font-mono">
                {isAr
                  ? `سجل المدفوعات المعتمدة (${selectedDossier.payments.length})`
                  : `Verified Financial Ledger (${selectedDossier.payments.length})`}
              </h4>
              {selectedDossier.payments.length === 0 ? (
                <p className="text-on-surface-variant text-[11px] italic p-3 rounded-xl bg-surface-container-high/30 border border-outline-variant/15">
                  {isAr ? "لا توجد أية دفعات معتمدة مسجلة حتى الآن." : "No verified payments recorded in ledger yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDossier.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface capitalize">
                            {p.paymentType} Payment
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                            {p.paymentMethod.replace(/_/g, " ")}
                          </span>
                        </div>
                        {p.transactionReference && (
                          <div className="text-[11px] font-mono text-on-surface-variant">
                            Ref: {p.transactionReference}
                          </div>
                        )}
                        {p.notes && (
                          <div className="text-[11px] text-on-surface-variant italic">
                            &ldquo;{p.notes}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="text-right font-mono">
                        <span className="font-bold text-emerald-400 block">
                          +{formatQAR(p.amount)}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          {new Date(p.recordedAt).toLocaleString(locale === "ar" ? "ar-QA" : "en-US")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deposit Proofs Review Queue */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-primary uppercase text-[11px] tracking-wider font-mono">
                {isAr
                  ? `إيصالات التحويل المرفوعة (${selectedDossier.proofs.length})`
                  : `Uploaded Deposit Receipts (${selectedDossier.proofs.length})`}
              </h4>
              {selectedDossier.proofs.length === 0 ? (
                <p className="text-on-surface-variant text-[11px] italic p-3 rounded-xl bg-surface-container-high/30 border border-outline-variant/15">
                  {isAr ? "لم يرفع الضيف أية إيصالات بعد." : "No deposit receipts uploaded for this booking yet."}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {selectedDossier.proofs.map((proof) => (
                    <div
                      key={proof.id}
                      className="p-3.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-on-surface">{proof.file_name}</div>
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            {(proof.file_size / 1024 / 1024).toFixed(2)} MB • {proof.mime_type} •{" "}
                            {new Date(proof.uploaded_at).toLocaleString(locale === "ar" ? "ar-QA" : "en-US")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize border ${
                              proof.review_status === "accepted"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : proof.review_status === "rejected"
                                ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {proof.review_status}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleInspectProof(proof.storage_path)}
                            disabled={inspectingProof}
                            className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-lowest text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isAr ? "معاينة" : "Inspect"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Review Actions if Pending & User is Authorized */}
                      {proof.review_status === "pending" && canManageFinance && (
                        <div className="pt-2 border-t border-outline-variant/15 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={reviewingProof}
                            onClick={() => handleReviewProof(proof.id, "accepted")}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? "اعتماد العربون وتأكيد الحجز" : "Approve Deposit & Confirm"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={reviewingProof}
                            onClick={() => {
                              setRejectingProofId(proof.id);
                              setRejectReason("");
                            }}
                            className="px-3 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isAr ? "رفض الإيصال" : "Decline Proof"}</span>
                          </button>
                        </div>
                      )}

                      {/* Rejection reason drawer */}
                      {rejectingProofId === proof.id && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-2">
                          <label className="text-[11px] font-medium text-rose-300 block">
                            {isAr ? "سبب رفض الإيصال (إلزامي للضيف):" : "Mandatory Rejection Reason:"}
                          </label>
                          <textarea
                            rows={2}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={isAr ? "الإيصال غير واضح أو المبلغ لا يطابق المطلوب..." : "Receipt unclear or amount does not match required deposit..."}
                            className="w-full p-2 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setRejectingProofId(null)}
                              className="px-3 py-1 rounded text-xs text-on-surface-variant"
                            >
                              {isAr ? "إلغاء" : "Cancel"}
                            </button>
                            <button
                              type="button"
                              disabled={reviewingProof || rejectReason.trim().length < 3}
                              onClick={() => handleReviewProof(proof.id, "rejected", rejectReason.trim())}
                              className="px-3 py-1 rounded bg-rose-600 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              {reviewingProof ? (isAr ? "جارٍ الحفظ..." : "Submitting...") : (isAr ? "تأكيد الرفض" : "Confirm Rejection")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lifecycle Status Progression & Management Actions */}
            <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 space-y-3">
              <h4 className="font-semibold text-primary uppercase text-[11px] tracking-wider font-mono">
                {isAr ? "إجراءات دورة حياة الحجز" : "Reservation Lifecycle Operations"}
              </h4>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Complete Tour Button */}
                {selectedDossier.booking.bookingStatus === "confirmed" && canManageOperations && (
                  <button
                    type="button"
                    disabled={completing}
                    onClick={handleCompleteBooking}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{completing ? (isAr ? "جارٍ الإتمام..." : "Completing...") : (isAr ? "إتمام الرحلة السياحية بنجاح" : "Mark Expedition as Completed")}</span>
                  </button>
                )}

                {/* Cancel Booking Button */}
                {selectedDossier.booking.bookingStatus !== "cancelled" &&
                  selectedDossier.booking.bookingStatus !== "completed" &&
                  canManageOperations && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCancelModal(true);
                        setCancelError(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isAr ? "إلغاء الحجز" : "Cancel Reservation"}</span>
                    </button>
                  )}
              </div>

              {/* Cancellation Reason Modal Drawer */}
              {showCancelModal && (
                <form
                  onSubmit={handleConfirmCancel}
                  className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-3 mt-3"
                >
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                    <span className="font-semibold text-rose-300 text-xs">
                      {isAr ? "إلغاء الحجز (يتطلب سبباً إلزامياً موضحاً للعميل)" : "Cancel Reservation (Mandatory Audit Reason)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(false)}
                      className="text-on-surface-variant hover:text-on-surface"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {cancelError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-200 text-xs">
                      {cancelError}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-medium text-rose-300 block mb-1">
                      {isAr ? "سبب الإلغاء (يتم تسجيله وإرساله للضيف):" : "Cancellation Reason (Sent to guest & recorded in audit log):"}
                    </label>
                    <textarea
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder={isAr ? "طلب الضيف الإلغاء / تغير مواعيد الطيران / ظروف جوية طارئة..." : "Guest requested cancellation / schedule change / operational..."}
                      className="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-surface-container text-xs text-on-surface-variant"
                    >
                      {isAr ? "تراجع" : "Go Back"}
                    </button>
                    <button
                      type="submit"
                      disabled={cancelling || cancelReason.trim().length < 3}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {cancelling ? (isAr ? "جارٍ الإلغاء..." : "Cancelling...") : (isAr ? "تأكيد الإلغاء النهائي" : "Confirm Cancellation")}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Booking Audit Timeline */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-primary uppercase text-[11px] tracking-wider font-mono flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>{isAr ? `سجل التغييرات والتدقيق (${selectedDossier.timeline.length})` : `Audit Timeline & Lifecycle (${selectedDossier.timeline.length})`}</span>
              </h4>

              {selectedDossier.timeline.length === 0 ? (
                <p className="text-on-surface-variant text-[11px] italic p-3 rounded-xl bg-surface-container-high/30 border border-outline-variant/15">
                  {isAr ? "لا توجد أية أحداث تدقيق مسجلة حتى الآن." : "No timeline events recorded yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDossier.timeline.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/15 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-on-surface text-xs">
                          {isAr ? ev.titleAr : ev.titleEn}
                        </div>
                        {(ev.descriptionEn || ev.descriptionAr) && (
                          <div className="text-[11px] text-on-surface-variant">
                            {isAr ? ev.descriptionAr || ev.descriptionEn : ev.descriptionEn || ev.descriptionAr}
                          </div>
                        )}
                        {ev.actorRole && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-mono">
                            Role: {ev.actorRole}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-on-surface-variant font-mono shrink-0">
                        {new Date(ev.createdAt).toLocaleString(locale === "ar" ? "ar-QA" : "en-US")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Concierge Memo */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-primary uppercase text-[11px] tracking-wider font-mono">
                {isAr ? "ملاحظات العمليات والتنسيق الداخلي" : "Internal Operations Notes"}
              </h4>
              <textarea
                rows={3}
                value={dossierMemo}
                onChange={(e) => setDossierMemo(e.target.value)}
                placeholder={isAr ? "سجل السائق المعين، تفاصيل رحلة الطيران، بروتوكولات VIP..." : "Record chauffeur assignments, flight coordinates, VIP protocol notes..."}
                className="w-full p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingMemo}
                  onClick={handleSaveMemo}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {savingMemo ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ ملاحظات العمليات" : "Save Memo Updates")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: SECURE SIGNED DEPOSIT PROOF VIEWER */}
      {/* ========================================================================= */}
      {activeProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container border border-primary/40 rounded-3xl p-5 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div>
                <span className="font-headline text-sm font-semibold text-primary block">
                  {isAr ? "معاينة إيصال التحويل البنكي (تخزين محمي)" : "Secure Deposit Receipt Preview (Private Storage)"}
                </span>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  {isAr ? "رابط مشفر مؤقت • صالح لمدة 15 دقيقة فقط" : "Temporary signed URL • Expires in 15 minutes"}
                </span>
              </div>
              <button
                onClick={() => setActiveProofUrl(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-auto flex-1 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeProofUrl}
                alt="Deposit Receipt"
                className="max-h-[65vh] object-contain rounded-xl border border-outline-variant/30"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <a
                href={activeProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>{isAr ? "فتح بحجم كامل" : "Open Full Size"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
