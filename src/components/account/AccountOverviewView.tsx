"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Locale, TranslationDict } from "@/translations";
import { getCustomerBookingsAction, linkGuestBookingToAccountAction } from "@/lib/server/booking-actions";
import { getCustomerPaymentsAction, CustomerPaymentsSummary } from "@/lib/server/customer-actions";
import { getCurrentUserAction } from "@/lib/server/auth-actions";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  formatDate,
  formatCurrency,
  getServiceName,
  getBookingStatusBadge,
  getPaymentStatusBadge,
} from "./account-utils";
import {
  Compass,
  Calendar,
  Clock,
  CheckCircle2,
  Receipt,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MessageCircle,
  Plus,
  Loader2,
  Shield,
  Layers,
} from "lucide-react";

interface AccountOverviewViewProps {
  locale: Locale;
  dict: TranslationDict;
}

interface BookingSummaryItem {
  id: string;
  bookingRef: string;
  serviceId: string;
  departureDate: string | null;
  timeWindow: string | null;
  paxCount: number;
  bookingStatus: string;
  paymentStatus: string;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  uploadToken: string;
  createdAt: string;
}

export default function AccountOverviewView({
  locale,
  dict,
}: AccountOverviewViewProps) {
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [bookings, setBookings] = useState<BookingSummaryItem[]>([]);
  const [payments, setPayments] = useState<CustomerPaymentsSummary | null>(null);

  // Link booking modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkRef, setLinkRef] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [userRes, bookingsRes, paymentsRes] = await Promise.all([
        getCurrentUserAction(),
        getCustomerBookingsAction(),
        getCustomerPaymentsAction(),
      ]);

      if (userRes.success && userRes.data?.user) {
        setUserName(userRes.data.user.fullName);
      }
      if (bookingsRes.success && bookingsRes.data) {
        setBookings(bookingsRes.data as BookingSummaryItem[]);
      }
      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data);
      }
    } catch (err) {
      console.error("[Account Overview Load Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
        await loadData();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400">
        <Loader2 className="w-8 h-8 text-[#C29B38] animate-spin" />
      </div>
    );
  }

  // Calculate high-level stats
  const totalBookings = bookings.length;
  const awaitingDeposits = bookings.filter(
    (b) => b.bookingStatus === "awaiting_deposit" || b.paymentStatus === "deposit_pending"
  ).length;
  const confirmedBookings = bookings.filter((b) => b.bookingStatus === "confirmed").length;
  const totalBalanceDue = payments?.totalBalanceDue || 0;
  const totalPaid = payments?.totalPaid || 0;

  // Find nearest upcoming trip (departureDate in future or pending)
  const upcomingTrip = bookings.find(
    (b) => b.bookingStatus !== "cancelled" && b.bookingStatus !== "completed"
  );

  const recentBookings = bookings.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* WELCOME BANNER                                                 */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F1115] via-[#1A181B] to-[#72132B]/30 border border-[#C29B38]/30 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#C29B38] text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? "محفظة كبار الشخصيات الحصرية" : "VIP Concierge Portfolio"}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#F3ECE1] font-bold">
              {isRtl
                ? `مرحباً بك، ${userName || "ضيفنا الكريم"}`
                : `Welcome, ${userName || "Discerning Traveler"}`}
            </h1>
            <p className="text-sm text-stone-300 max-w-xl">
              {isRtl
                ? "تابع حجوزات رحلاتك الفاخرة في الدوحة، إيصالات الدفع البنكي، وتواصل مباشرة مع فريق الكونسيرج الخاص بك."
                : "Manage your private Qatar itineraries, upload bank deposit receipts, and liaise directly with your dedicated 24/7 concierge."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowLinkModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 border border-stone-600/50 text-[#F3ECE1] text-xs font-medium transition-all shadow-md"
            >
              <Plus className="w-4 h-4 text-[#C29B38]" />
              <span>{isRtl ? "ربط حجز سابق" : "Link Past Reservation"}</span>
            </button>
            <Link
              href={`/${locale}/services`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#C29B38] to-[#9E7B27] text-stone-950 text-xs font-semibold hover:brightness-110 transition-all shadow-md shadow-[#C29B38]/20"
            >
              <Compass className="w-4 h-4" />
              <span>{isRtl ? "استكشاف التجارب" : "Explore Experiences"}</span>
            </Link>
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-[#C29B38]/10 blur-3xl pointer-events-none" />
      </div>

      {/* ============================================================== */}
      {/* METRIC CARDS                                                   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 relative overflow-hidden group hover:border-[#C29B38]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">
              {isRtl ? "إجمالي الحجوزات" : "Total Bookings"}
            </span>
            <Layers className="w-4 h-4 text-stone-500 group-hover:text-[#C29B38] transition-colors" />
          </div>
          <p className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-[#F3ECE1]">
            {totalBookings}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {isRtl ? "سجل الرحلات" : "Portfolio records"}
          </span>
        </div>

        {/* Confirmed Bookings */}
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">
              {isRtl ? "حجوزات مؤكدة" : "Confirmed Trips"}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-emerald-400">
            {confirmedBookings}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {isRtl ? "جاهزة للانطلاق" : "Guaranteed itinerary"}
          </span>
        </div>

        {/* Awaiting Deposits */}
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">
              {isRtl ? "بانتظار العربون" : "Awaiting Deposit"}
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-amber-400">
            {awaitingDeposits}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {isRtl ? "تحتاج لإيداع إيصال" : "Action required"}
          </span>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 relative overflow-hidden group hover:border-[#C29B38]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">
              {isRtl ? "الرصيد المتبقي" : "Balance Due"}
            </span>
            <Receipt className="w-4 h-4 text-[#C29B38]" />
          </div>
          <p className="mt-3 font-serif text-xl sm:text-2xl font-bold text-[#C29B38]">
            {formatCurrency(totalBalanceDue, "QAR")}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {isRtl
              ? `المسدد: ${formatCurrency(totalPaid, "QAR")}`
              : `Paid: ${formatCurrency(totalPaid, "QAR")}`}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* UPCOMING EXPEDITION SPOTLIGHT                                  */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#F3ECE1] font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#C29B38]" />
            <span>{isRtl ? "الرحلة القادمة المجدولة" : "Next Scheduled Expedition"}</span>
          </h2>
          <Link
            href={`/${locale}/account/bookings`}
            className="text-xs text-[#C29B38] hover:underline flex items-center gap-1 font-medium"
          >
            <span>{isRtl ? "عرض كل الحجوزات" : "View All Bookings"}</span>
            <Arrow className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingTrip ? (
          <div className="bg-[#0F1115] border border-[#C29B38]/30 rounded-2xl p-6 relative overflow-hidden shadow-xl hover:border-[#C29B38]/50 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#C29B38]/15 border border-[#C29B38]/30 font-mono text-xs font-semibold text-[#C29B38]">
                    {upcomingTrip.bookingRef}
                  </span>
                  {(() => {
                    const bBadge = getBookingStatusBadge(upcomingTrip.bookingStatus, locale);
                    return (
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-medium ${bBadge.bg}`}>
                        {bBadge.label}
                      </span>
                    );
                  })()}
                  {(() => {
                    const pBadge = getPaymentStatusBadge(upcomingTrip.paymentStatus, locale);
                    return (
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-medium ${pBadge.bg}`}>
                        {pBadge.label}
                      </span>
                    );
                  })()}
                </div>

                <h3 className="font-serif text-xl sm:text-2xl text-[#F3ECE1] font-bold">
                  {getServiceName(upcomingTrip.serviceId, dict)}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs text-stone-300">
                  <div>
                    <span className="text-stone-500 block uppercase tracking-wider text-[10px]">
                      {isRtl ? "تاريخ الرحلة" : "Travel Date"}
                    </span>
                    <span className="font-medium text-stone-200 mt-0.5 block">
                      {formatDate(upcomingTrip.departureDate, locale)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase tracking-wider text-[10px]">
                      {isRtl ? "الفترة الزمنية" : "Time Window"}
                    </span>
                    <span className="font-medium text-stone-200 mt-0.5 block">
                      {upcomingTrip.timeWindow || (isRtl ? "مرن" : "Flexible")}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase tracking-wider text-[10px]">
                      {isRtl ? "عدد المسافرين" : "Party Size"}
                    </span>
                    <span className="font-medium text-stone-200 mt-0.5 block">
                      {upcomingTrip.paxCount} {isRtl ? "مسافر" : "Guests"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  href={`/${locale}/account/bookings/${upcomingTrip.bookingRef}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-[#C29B38] to-[#9E7B27] text-stone-950 font-semibold text-xs hover:brightness-110 transition-all shadow-lg shadow-[#C29B38]/10"
                >
                  <span>{isRtl ? "تفاصيل الحجز ورفع الإيصال" : "View Dossier & Upload Proof"}</span>
                  <Arrow className="w-4 h-4" />
                </Link>

                <a
                  href={getWhatsAppInquiryUrl(
                    `Hello MZ Tourism Qatar, inquiry regarding reservation ${upcomingTrip.bookingRef}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-emerald-300 hover:bg-emerald-900/40 text-xs font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>{isRtl ? "استفسار كونسيرج للرحلة" : "Concierge Liaison"}</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0F1115] border border-stone-800 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-stone-800/80 border border-stone-700 mx-auto flex items-center justify-center text-stone-400">
              <Compass className="w-6 h-6 text-[#C29B38]" />
            </div>
            <div className="space-y-1">
              <p className="font-serif text-lg text-stone-200 font-medium">
                {isRtl ? "لا توجد رحلات قادمة مجدولة حالياً" : "No upcoming expeditions scheduled"}
              </p>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                {isRtl
                  ? "ابدأ بتنسيق رحلتك القادمة في دولة قطر برفقة مرشدين محترفين وسيارات فاخرة مخصصة."
                  : "Begin curating your next bespoke Qatar experience with private luxury 4x4s, desert majlis dinners, and cultural excursions."}
              </p>
            </div>
            <Link
              href={`/${locale}/services`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C29B38] text-stone-950 font-semibold text-xs hover:bg-[#A8842E] transition-colors"
            >
              <span>{isRtl ? "استعراض جميع الباقات" : "Browse Qatar Experiences"}</span>
              <Arrow className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* RECENT RESERVATIONS & QUICK LIAISON                            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reservations List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-[#F3ECE1] font-semibold">
              {isRtl ? "أحدث الحجوزات" : "Recent Reservations"}
            </h2>
            <Link
              href={`/${locale}/account/bookings`}
              className="text-xs text-stone-400 hover:text-[#C29B38] flex items-center gap-1"
            >
              <span>{isRtl ? "عرض السجل كاملاً" : "View All History"}</span>
              <Arrow className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentBookings.length > 0 ? (
              recentBookings.map((b) => {
                const bBadge = getBookingStatusBadge(b.bookingStatus, locale);
                const pBadge = getPaymentStatusBadge(b.paymentStatus, locale);
                return (
                  <Link
                    key={b.id}
                    href={`/${locale}/account/bookings/${b.bookingRef}`}
                    className="block bg-[#0F1115] border border-stone-800/90 rounded-xl p-4 hover:border-[#C29B38]/40 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#C29B38]">
                            {b.bookingRef}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${bBadge.bg}`}>
                            {bBadge.label}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-stone-200 group-hover:text-[#F3ECE1] truncate">
                          {getServiceName(b.serviceId, dict)}
                        </h4>
                        <p className="text-xs text-stone-400">
                          {formatDate(b.departureDate, locale)} • {b.paxCount} {isRtl ? "مسافرين" : "Guests"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded border block mb-1 ${pBadge.bg}`}>
                          {pBadge.label}
                        </span>
                        <span className="text-xs text-stone-400">
                          {formatCurrency(b.balanceDue, "QAR")}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-xs text-stone-500 py-6 text-center">
                {isRtl ? "لا توجد حجوزات مسجلة بعد." : "No reservations found."}
              </p>
            )}
          </div>
        </div>

        {/* VIP Concierge Desk (1 col) */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg text-[#F3ECE1] font-semibold">
            {isRtl ? "مكتب الكونسيرج الخاص" : "VIP Concierge Desk"}
          </h2>

          <div className="bg-gradient-to-br from-[#0F1115] to-[#16141A] border border-[#72132B]/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#72132B]/30 border border-[#72132B]/60 flex items-center justify-center text-[#C29B38]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-stone-100">
                  {isRtl ? "خدمة العملاء المتميزة 24/7" : "24/7 Dedicated Liaison"}
                </h4>
                <p className="text-xs text-stone-400">
                  {isRtl ? "الدوحة، دولة قطر" : "Doha, State of Qatar"}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {isRtl
                ? "لأي تعديل على توقيت الرحلات، طلب مرشد بلغة معينة، أو تنظيم فعاليات خاصة، يرجى التواصل مع فريق الكونسيرج."
                : "For schedule adjustments, language guides, VIP airport tarmac transfers, or bespoke dune setups, connect directly with our private desk."}
            </p>

            <a
              href={getWhatsAppInquiryUrl("Hello MZ Tourism Qatar, VIP client requesting concierge liaison.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-semibold text-xs transition-colors shadow-md shadow-emerald-900/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isRtl ? "محادثة فورية عبر واتساب" : "WhatsApp Concierge Desk"}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LINK GUEST BOOKING MODAL                                       */}
      {/* ============================================================== */}
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
