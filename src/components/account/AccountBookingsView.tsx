"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Locale, TranslationDict } from "@/translations";
import {
  getCustomerBookingsAction,
  linkGuestBookingToAccountAction,
} from "@/lib/server/booking-actions";
import {
  formatDate,
  formatCurrency,
  getServiceName,
  getBookingStatusBadge,
  getPaymentStatusBadge,
} from "./account-utils";
import {
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  Compass,
} from "lucide-react";

interface AccountBookingsViewProps {
  locale: Locale;
  dict: TranslationDict;
}

interface CustomerBookingItem {
  id: string;
  bookingRef: string;
  serviceId: string;
  departureDate: string | null;
  timeWindow: string | null;
  paxCount: number;
  totalPrice?: number;
  bookingStatus: string;
  paymentStatus: string;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  uploadToken: string;
  createdAt: string;
  proofStatus?: string;
  rejectionReason?: string | null;
  lastProofFileName?: string | null;
}

type FilterType = "all" | "awaiting_deposit" | "confirmed" | "completed" | "cancelled";

export default function AccountBookingsView({
  locale,
  dict,
}: AccountBookingsViewProps) {
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<CustomerBookingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  // Link booking modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkRef, setLinkRef] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getCustomerBookingsAction();
      if (res.success && res.data) {
        setBookings(res.data as CustomerBookingItem[]);
      }
    } catch (err) {
      console.error("[Account Bookings Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleLinkBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkRef.trim()) return;
    setLinking(true);
    setLinkMsg(null);
    try {
      const res = await linkGuestBookingToAccountAction(linkRef.trim());
      if (res.success) {
        setLinkMsg({
          type: "success",
          text: isRtl
            ? "تم ربط الحجز بنجاح مع محفظتك الشخصية."
            : "Reservation successfully linked to your portfolio.",
        });
        setLinkRef("");
        await fetchBookings();
        setTimeout(() => setShowLinkModal(false), 1800);
      } else {
        setLinkMsg({
          type: "error",
          text: res.error || (isRtl ? "تعذر ربط الحجز." : "Failed to link reservation."),
        });
      }
    } catch {
      setLinkMsg({
        type: "error",
        text: isRtl ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
      });
    } finally {
      setLinking(false);
    }
  };

  // Filter & Search Logic
  const filteredBookings = bookings.filter((b) => {
    // Filter status match
    if (selectedFilter === "awaiting_deposit") {
      if (b.bookingStatus !== "awaiting_deposit" && b.paymentStatus !== "deposit_pending") {
        return false;
      }
    } else if (selectedFilter === "confirmed") {
      if (b.bookingStatus !== "confirmed") return false;
    } else if (selectedFilter === "completed") {
      if (b.bookingStatus !== "completed") return false;
    } else if (selectedFilter === "cancelled") {
      if (b.bookingStatus !== "cancelled") return false;
    }

    // Search query match (bookingRef or service title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const refMatch = b.bookingRef.toLowerCase().includes(q);
      const serviceTitle = getServiceName(b.serviceId, dict).toLowerCase();
      const serviceMatch = serviceTitle.includes(q);
      return refMatch || serviceMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3ECE1]">
            {isRtl ? "حجوزاتي والرحلات الفاخرة" : "My Luxury Reservations"}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {isRtl
              ? "متابعة مسار الرحلات، حالة الدفع، وتحميل إيصالات الإيداع المباشرة."
              : "Track your private itineraries, payment confirmations, and upload deposit receipts."}
          </p>
        </div>

        <button
          onClick={() => setShowLinkModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-[#F3ECE1] text-xs font-medium self-start sm:self-auto transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#C29B38]" />
          <span>{isRtl ? "ربط حجز سابق" : "Link Guest Booking"}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={
              isRtl
                ? "البحث برقم الحجز (MZ-XXXXXXXX) أو اسم الرحلة..."
                : "Search reference (MZ-XXXXXXXX) or tour title..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#C29B38]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: isRtl ? "الكل" : "All" },
            { id: "awaiting_deposit", label: isRtl ? "بانتظار العربون" : "Awaiting Deposit" },
            { id: "confirmed", label: isRtl ? "مؤكد" : "Confirmed" },
            { id: "completed", label: isRtl ? "مكتمل" : "Completed" },
            { id: "cancelled", label: isRtl ? "ملغي" : "Cancelled" },
          ].map((tab) => {
            const active = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as FilterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-[#C29B38] text-stone-950 font-semibold shadow-sm"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-400">
          <Loader2 className="w-8 h-8 text-[#C29B38] animate-spin" />
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const bBadge = getBookingStatusBadge(b.bookingStatus, locale);
            const pBadge = getPaymentStatusBadge(b.paymentStatus, locale);
            return (
              <div
                key={b.id}
                className="bg-[#0F1115] border border-stone-800/90 hover:border-[#C29B38]/40 rounded-xl p-5 transition-all shadow-md group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#C29B38]">
                        {b.bookingRef}
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded border font-medium ${bBadge.bg}`}>
                        {bBadge.label}
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded border font-medium ${pBadge.bg}`}>
                        {pBadge.label}
                      </span>
                      {b.proofStatus && b.proofStatus === "approved" && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded border font-medium bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
                          {isRtl ? "إيصال معتمد" : "Receipt Approved"}
                        </span>
                      )}
                      {b.proofStatus && b.proofStatus === "pending_review" && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded border font-medium bg-amber-500/15 border-amber-500/30 text-amber-400">
                          {isRtl ? "إيصال قيد التدقيق" : "Receipt Under Review"}
                        </span>
                      )}
                      {b.proofStatus && b.proofStatus === "rejected" && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded border font-medium bg-[#72132B]/25 border-[#72132B]/50 text-red-300">
                          {isRtl ? "إيصال مرفوض" : "Receipt Rejected"}
                        </span>
                      )}
                      {(!b.proofStatus || b.proofStatus === "not_submitted") && b.paymentStatus !== "paid_in_full" && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded border font-medium bg-stone-800 border-stone-700 text-stone-400">
                          {isRtl ? "بانتظار الإيصال" : "Receipt Pending"}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-bold text-[#F3ECE1] group-hover:text-[#C29B38] transition-colors">
                      {getServiceName(b.serviceId, dict)}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs text-stone-300">
                      <div>
                        <span className="text-stone-500 block uppercase tracking-wider text-[10px]">
                          {isRtl ? "تاريخ الرحلة" : "Departure Date"}
                        </span>
                        <span className="font-medium text-stone-200 mt-0.5 block">
                          {formatDate(b.departureDate, locale)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block uppercase tracking-wider text-[10px]">
                          {isRtl ? "عدد المسافرين" : "Guests"}
                        </span>
                        <span className="font-medium text-stone-200 mt-0.5 block">
                          {b.paxCount} {isRtl ? (b.paxCount === 1 ? "شخص" : "أشخاص") : (b.paxCount === 1 ? "Person" : "People")}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block uppercase tracking-wider text-[10px]">
                          {isRtl ? "المبلغ الإجمالي" : "Total Price"}
                        </span>
                        <span className="font-semibold text-emerald-400 mt-0.5 block">
                          {formatCurrency(b.totalPrice ?? (b.depositRequired + b.balanceDue), b.currency || "QAR")}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block uppercase tracking-wider text-[10px]">
                          {isRtl ? "المتبقي للدفع" : "Balance Due"}
                        </span>
                        <span className="font-medium text-[#C29B38] mt-0.5 block">
                          {b.balanceDue > 0 ? formatCurrency(b.balanceDue, b.currency || "QAR") : (isRtl ? "مسدد بالكامل" : "Fully Paid")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                    <Link
                      href={`/${locale}/account/bookings/${b.bookingRef}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#C29B38] to-[#9E7B27] text-stone-950 font-semibold text-xs hover:brightness-110 transition-all shadow-md shadow-[#C29B38]/10"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isRtl ? "عرض التفاصيل ورفع الإيصال" : "View Details & Upload Proof"}</span>
                      <Arrow className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-stone-800 mx-auto flex items-center justify-center text-stone-400">
            <Compass className="w-6 h-6 text-[#C29B38]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-stone-200 font-semibold">
              {isRtl ? "لم يتم العثور على أية حجوزات" : "No reservations found"}
            </h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {searchQuery
                ? isRtl
                  ? "لا توجد نتائج مطابقة لبحثك. يرجى تجربة كلمات بحث أخرى."
                  : "No reservations match your current query or filter criteria."
                : isRtl
                ? "ابدأ بتنسيق رحلتك الخاصة الآن عبر كتالوج التجارب المتميزة."
                : "Explore our collection of private desert safaris, dhow dinners, and VIP transfers."}
            </p>
          </div>
          <Link
            href={`/${locale}/services`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C29B38] text-stone-950 font-semibold text-xs hover:bg-[#A8842E] transition-colors"
          >
            <span>{isRtl ? "استكشاف التجارب" : "Explore Experiences"}</span>
            <Arrow className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Link Guest Booking Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F1115] border border-[#C29B38]/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#F3ECE1]">
                {isRtl ? "ربط حجز سابق بمحفظتك" : "Link Guest Reservation"}
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-stone-400 hover:text-stone-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300">
              {isRtl
                ? "أدخل رقم الحجز الخاص بك (مثال: MZ-XXXXXXXX) الذي قمت به كضيف لربطه بحسابك المسجل."
                : "Enter the reservation reference (e.g. MZ-XXXXXXXX) created as a guest to link it to your authenticated portfolio."}
            </p>

            {linkMsg && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  linkMsg.type === "success"
                    ? "bg-emerald-950/50 border border-emerald-500/40 text-emerald-300"
                    : "bg-[#72132B]/30 border border-[#72132B]/60 text-red-300"
                }`}
              >
                {linkMsg.text}
              </div>
            )}

            <form onSubmit={handleLinkBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  {isRtl ? "رقم مرجع الحجز" : "Reservation Reference"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="MZ-XXXXXXXX"
                  value={linkRef}
                  onChange={(e) => setLinkRef(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 font-mono text-sm uppercase focus:outline-none focus:border-[#C29B38]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-stone-400 hover:bg-stone-800"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={linking || !linkRef.trim()}
                  className="px-4 py-2 rounded-lg bg-[#C29B38] text-stone-950 font-semibold text-xs hover:bg-[#A8842E] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {linking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isRtl ? "تأكيد الربط" : "Link Reservation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
