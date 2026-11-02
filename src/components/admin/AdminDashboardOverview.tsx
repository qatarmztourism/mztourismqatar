"use client";

import { useState, useEffect, useCallback } from "react";
import { Locale } from "@/translations";
import {
  getAdminDashboardSummaryAction,
  type AdminDashboardData,
  type AdminDashboardFilterOptions,
} from "@/lib/server/admin-actions";
import {
  formatQAR,
  formatQatarDate,
  formatQatarDateTime,
  getAdminBookingStatusBadge,
} from "./admin-utils";
import AdminRevenueCharts from "./AdminRevenueCharts";
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Receipt,
  Shield,
  RefreshCw,
  Compass,
  ArrowRight,
  ArrowLeft,
  Users,
  Info,
  DollarSign,
  TrendingUp,
  Sparkles,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
} from "lucide-react";

interface AdminDashboardOverviewProps {
  locale: Locale;
  onNavigateTab: (tabId: string, param?: string) => void;
}

export default function AdminDashboardOverview({
  locale,
  onNavigateTab,
}: AdminDashboardOverviewProps) {
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>("30d");
  const [activityTab, setActivityTab] = useState<
    "bookings" | "proofs" | "confirmed" | "departures" | "cancellations"
  >("bookings");

  const loadData = useCallback(
    async (rangePreset = selectedRange) => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await getAdminDashboardSummaryAction({
          dateRangePreset: rangePreset as AdminDashboardFilterOptions["dateRangePreset"],
        });

        if (res.success && res.data) {
          setData(res.data);
        } else {
          setErrorMsg(
            res.error ||
              (isAr
                ? "تعذر تحميل بيانات لوحة الإدارة."
                : "Failed to load dashboard data.")
          );
        }
      } catch (err) {
        console.error("[Admin Dashboard Load Error]", err);
        setErrorMsg(
          isAr ? "حدث خطأ غير متوقع." : "An unexpected error occurred loading dashboard."
        );
      } finally {
        setLoading(false);
      }
    },
    [isAr, selectedRange]
  );

  useEffect(() => {
    loadData(selectedRange);
  }, [loadData, selectedRange]);

  const handleRangeChange = (newRange: string) => {
    setSelectedRange(newRange);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-[#C29B38]/30 flex items-center justify-center shadow-lg shadow-[#C29B38]/10">
          <Loader2 className="w-7 h-7 text-[#C29B38] animate-spin" />
        </div>
        <p className="text-xs uppercase font-mono tracking-widest text-[#C29B38] font-bold">
          {isAr
            ? "جارٍ تدقيق وتجميع المؤشرات التشغيلية والمالية..."
            : "Auditing Operational & Financial Records..."}
        </p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-8 sm:p-10 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-headline text-lg sm:text-xl font-bold text-stone-100">
          {isAr ? "تعذر عرض لوحة الإدارة" : "Dashboard Unavailable"}
        </h3>
        <p className="text-xs text-stone-400 leading-relaxed">{errorMsg}</p>
        <button
          onClick={() => loadData(selectedRange)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C29B38] to-[#ECC15A] text-[#0F1115] font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-[#C29B38]/20 cursor-pointer"
        >
          {isAr ? "إعادة المحاولة" : "Retry Audit"}
        </button>
      </div>
    );
  }

  const {
    summaryCards: s,
    financialBreakdown: f,
    dailyAnalytics,
    monthlyAnalytics,
    yearlyAnalytics,
    recentBookings,
    latestDepositSubmissions,
    recentlyConfirmedBookings,
    upcomingDepartures,
    recentCancellations,
    userRole,
  } = data;

  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* 1. TOP EXECUTIVE HEADER BANNER                                */}
      {/* ============================================================== */}
      <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 end-0 w-96 h-96 bg-[#C29B38]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-80 h-80 bg-[#72132B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#ECC15A] text-[11px] font-mono font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? "لوحة الإدارة التنفيذية المعتمدة"
                  : "Executive Operations & Financial Audit"}
              </span>
            </div>

            <h1 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F3ECE1] tracking-tight">
              {isAr
                ? "نظرة عامة على عمليات قطر الفاخرة"
                : "Qatar Luxury Operations Dashboard"}
            </h1>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              {isAr
                ? "سجلات تشغيلية ومطابقة مالية مدققة ومطابقة بالكامل مع قاعدة بيانات سوبابيز الرسمية ومكتب كونسيرج الدوحة."
                : "Live database-audited metrics • Asia/Qatar timezone • Qatari Riyal (QAR) settlement standard."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-stone-300 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-stone-400">
                {isAr ? "حالة النظام:" : "System:"}
              </span>
              <span className="font-bold text-[#ECC15A]">
                {isAr ? "متصل ومطابق" : "Live Reconciled"}
              </span>
            </div>

            <button
              onClick={() => loadData(selectedRange)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] hover:border-[#C29B38]/40 text-stone-200 text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#ECC15A] ${
                  loading ? "animate-spin" : ""
                }`}
              />
              <span>{isAr ? "تحديث السجلات" : "Refresh Audit"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. THE 10 SUMMARY METRIC CARDS (ACTUAL DATABASE DATA)          */}
      {/* ============================================================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg sm:text-xl font-bold text-[#F3ECE1] flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#ECC15A]" />
            <span>
              {isAr
                ? "مؤشرات الحجوزات والعمليات الميدانية"
                : "Core Operational & Financial Metrics"}
            </span>
          </h2>
          <span className="text-[11px] font-mono text-stone-500">
            {isAr ? "10 مؤشرات معتمدة" : "10 Live Metrics"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Bookings */}
          <div
            onClick={() => onNavigateTab("bookings")}
            className="rounded-2xl bg-[#14171F] border border-white/[0.08] hover:border-[#C29B38]/50 p-5 space-y-3 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#C29B38]/5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-stone-400 font-semibold">
                {isAr ? "1. إجمالي الحجوزات" : "1. Total Bookings"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#ECC15A] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold font-headline text-[#F3ECE1] group-hover:text-[#ECC15A] transition-colors block">
                {s.totalBookings}
              </span>
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                {isAr ? "إجمالي الحجوزات المسجلة" : "Registered records"}
              </span>
            </div>
          </div>

          {/* Card 2: Awaiting Deposit */}
          <div
            onClick={() => onNavigateTab("bookings", "awaiting_deposit")}
            className="rounded-2xl bg-[#14171F] border border-white/[0.08] hover:border-sky-500/50 p-5 space-y-3 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-sky-500/5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-sky-400 font-semibold">
                {isAr ? "2. بانتظار العربون" : "2. Awaiting Deposit"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold font-headline text-sky-300 block">
                {s.awaitingDeposit}
              </span>
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                {isAr ? "بانتظار التحويل البنكي" : "Pending remittance"}
              </span>
            </div>
          </div>

          {/* Card 3: Deposit Under Review */}
          <div
            onClick={() => onNavigateTab("proofs")}
            className="rounded-2xl bg-[#14171F] border border-white/[0.08] hover:border-amber-500/50 p-5 space-y-3 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-amber-500/5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                {isAr ? "3. قيد التدقيق" : "3. Under Review"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold font-headline text-amber-300 block">
                {s.depositUnderReview}
              </span>
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                {isAr ? "مراجعة إيصال التحويل" : "Receipt verification"}
              </span>
            </div>
          </div>

          {/* Card 4: Confirmed Bookings */}
          <div
            onClick={() => onNavigateTab("bookings", "confirmed")}
            className="rounded-2xl bg-[#14171F] border border-white/[0.08] hover:border-emerald-500/50 p-5 space-y-3 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-emerald-500/5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">
                {isAr ? "4. حجوزات مؤكدة" : "4. Confirmed Trips"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold font-headline text-emerald-300 block">
                {s.confirmedBookings}
              </span>
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                {isAr ? "تم تخصيص الأسطول والمرشد" : "Vehicles allocated"}
              </span>
            </div>
          </div>

          {/* Card 5: Completed Bookings */}
          <div
            onClick={() => onNavigateTab("bookings", "completed")}
            className="rounded-2xl bg-[#14171F] border border-white/[0.08] hover:border-stone-500 p-5 space-y-3 cursor-pointer transition-all duration-200 shadow-lg group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-stone-300 font-semibold">
                {isAr ? "5. رحلات مكتملة" : "5. Completed Trips"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-stone-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold font-headline text-stone-200 block">
                {s.completedBookings}
              </span>
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                {isAr ? "رحلات فاخرة تم تنفيذها" : "Fulfilled luxury tours"}
              </span>
            </div>
          </div>

          {/* Card 6: Cancelled Bookings */}
          <div
            onClick={() => onNavigateTab("bookings", "cancelled")}
            className="rounded-2xl bg-[#14171F] border border-white/[0.08] hover:border-rose-800 p-5 space-y-3 cursor-pointer transition-all duration-200 shadow-lg group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-rose-400 font-semibold">
                {isAr ? "6. رحلات ملغاة" : "6. Cancelled Trips"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold font-headline text-rose-300 block">
                {s.cancelledBookings}
              </span>
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                {isAr ? "سجلات محجوبة من الإيرادات" : "Quarantined records"}
              </span>
            </div>
          </div>

          {/* Card 7: Total Collected Revenue (Hero Metric) */}
          <div className="rounded-2xl bg-gradient-to-br from-[#161922] via-[#14171F] to-[#72132B]/15 border border-[#C29B38]/40 hover:border-[#C29B38] p-5 space-y-3 transition-all duration-200 shadow-xl group sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-[#ECC15A] font-bold">
                {isAr ? "7. الإيرادات المحصلة" : "7. Collected Revenue"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#C29B38]/20 border border-[#C29B38]/40 text-[#ECC15A] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-bold font-headline text-emerald-400 block tracking-tight">
                {formatQAR(s.totalCollectedRevenue, locale)}
              </span>
              <span className="text-[11px] text-emerald-400/80 font-mono block mt-1">
                {isAr ? "أموال مودعة في الحساب" : "Verified bank funds"}
              </span>
            </div>
          </div>

          {/* Card 8: Deposit Amount Collected */}
          <div className="rounded-2xl bg-[#14171F] border border-white/[0.08] hover:border-[#C29B38]/40 p-5 space-y-3 transition-all duration-200 shadow-lg group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-stone-300 font-semibold">
                {isAr ? "8. العربون المحصل" : "8. Deposits Received"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#ECC15A] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-bold font-headline text-[#ECC15A] block tracking-tight">
                {formatQAR(s.depositAmountCollected, locale)}
              </span>
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                {isAr ? "إجمالي مبالغ العربون" : "Total gross deposits"}
              </span>
            </div>
          </div>

          {/* Card 9: Balance Due */}
          <div className="rounded-2xl bg-[#14171F] border border-white/[0.08] hover:border-amber-500/40 p-5 space-y-3 transition-all duration-200 shadow-lg group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                {isAr ? "9. الرصيد المتبقي" : "9. Balance Due"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-bold font-headline text-amber-300 block tracking-tight">
                {formatQAR(s.balanceDue, locale)}
              </span>
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                {isAr ? "مستحقات قبل الانطلاق" : "Active receivables"}
              </span>
            </div>
          </div>

          {/* Card 10: Upcoming Departures */}
          <div
            onClick={() => onNavigateTab("departures")}
            className="rounded-2xl bg-[#14171F] border border-white/[0.08] hover:border-[#C29B38]/50 p-5 space-y-3 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#C29B38]/5 group sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono tracking-wider text-[#ECC15A] font-bold">
                {isAr ? "10. الانطلاقات القادمة" : "10. Upcoming Departures"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#C29B38]/20 border border-[#C29B38]/40 text-[#ECC15A] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold font-headline text-[#F3ECE1] group-hover:text-[#ECC15A] transition-colors block">
                {s.upcomingDeparturesCount}
              </span>
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                {isAr ? "خلال الثلاثين يوماً القادمة" : "Next 30 days schedule"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. FINANCIAL ACCURACY & RECONCILIATION BREAKDOWN               */}
      {/* ============================================================== */}
      <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle accent border */}
        <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-transparent via-[#C29B38]/60 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#ECC15A] flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="font-headline text-lg sm:text-xl font-bold text-[#F3ECE1]">
                {isAr
                  ? "المطابقة المالية وتدقيق الإيرادات المعتمدة"
                  : "Audited Financial Reconciliation & Revenue Ledger"}
              </h3>
            </div>
            <p className="text-xs text-stone-400">
              {isAr
                ? "فصل دقيق بين القيمة الإجمالية للعقود، الإيداعات المعتمدة، والأرصدة المعلقة غير المحصلة."
                : "Strict audit separation: Contracted booking value vs. verified collected bank funds vs. pending receivables."}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAr ? "صفر احتساب مزدوج" : "Zero Double-Counting Enforced"}</span>
          </div>
        </div>

        {/* Financial Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Total Booking Value */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block font-semibold">
              {isAr ? "قيمة الحجوزات الإجمالية" : "Total Booking Value"}
            </span>
            <span className="text-lg sm:text-xl font-headline font-bold text-[#F3ECE1] block">
              {formatQAR(f.totalBookingValue, locale)}
            </span>
            <span className="text-[10px] text-stone-500 font-mono block">
              Gross active bookings
            </span>
          </div>

          {/* Confirmed Deposit Collections */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block font-bold">
              {isAr ? "إيداعات العربون المعتمدة" : "Confirmed Deposits"}
            </span>
            <span className="text-lg sm:text-xl font-headline font-bold text-emerald-300 block">
              {formatQAR(f.confirmedDepositCollections, locale)}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono block">
              Verified in bank account
            </span>
          </div>

          {/* Other Recorded Payments */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block font-semibold">
              {isAr ? "دفعات أخرى مسجلة" : "Other Recorded Payments"}
            </span>
            <span className="text-lg sm:text-xl font-headline font-bold text-stone-200 block">
              {formatQAR(f.otherRecordedPayments, locale)}
            </span>
            <span className="text-[10px] text-stone-500 font-mono block">
              Balance settlements
            </span>
          </div>

          {/* Total Collected Amount */}
          <div className="p-4 rounded-2xl bg-[#C29B38]/10 border border-[#C29B38]/30 space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#ECC15A] block font-bold">
              {isAr ? "إجمالي المبالغ المحصلة" : "Total Collected Cash"}
            </span>
            <span className="text-lg sm:text-xl font-headline font-bold text-[#ECC15A] block">
              {formatQAR(f.totalCollectedAmount, locale)}
            </span>
            <span className="text-[10px] text-stone-400 font-mono block">
              Reconciled funds
            </span>
          </div>

          {/* Outstanding Customer Balance */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block font-semibold">
              {isAr ? "الرصيد المتبقي على العملاء" : "Customer Balance Due"}
            </span>
            <span className="text-lg sm:text-xl font-headline font-bold text-amber-300 block">
              {formatQAR(f.outstandingCustomerBalance, locale)}
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono block">
              Receivable pre-departure
            </span>
          </div>

          {/* Cancelled Booking Amounts */}
          <div className="p-4 rounded-2xl bg-[#72132B]/20 border border-[#72132B]/40 space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 block font-semibold">
              {isAr ? "مبالغ الحجوزات الملغاة" : "Cancelled Booking Value"}
            </span>
            <span className="text-lg sm:text-xl font-headline font-bold text-rose-300 block">
              {formatQAR(f.cancelledBookingAmounts, locale)}
            </span>
            <span className="text-[10px] text-stone-500 font-mono block">
              Quarantined / voided
            </span>
          </div>
        </div>

        {/* Unverified Quarantined Deposit Notice */}
        {f.unverifiedDepositAmount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-xs text-amber-200">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 font-mono uppercase text-[11px] tracking-wider">
                {isAr
                  ? "إيداعات قيد المراجعة محجوبة عن الإيرادات المحصلة:"
                  : "Pending deposits strictly quarantined:"}
              </p>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                {isAr
                  ? `هناك مبلغ (${formatQAR(
                      f.unverifiedDepositAmount,
                      locale
                    )}) لحجوزات بانتظار التدقيق أو الدفع. لا يتم احتساب هذا المبلغ كإيراد فعلي حتى يتم التحقق من الإيصال البنكي واعتماد الحجز.`
                  : `A total of (${formatQAR(
                      f.unverifiedDepositAmount,
                      locale
                    )}) in pending deposits is currently undergoing audit. In accordance with Qatar auditing standards, this amount is NOT recorded as earned revenue until bank reconciliation.`}
              </p>
            </div>
          </div>
        )}

        {/* Database Limitation Disclosure */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-stone-400 space-y-1.5">
          <div className="flex items-center gap-2 text-stone-300 font-semibold font-mono text-[11px] uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-[#ECC15A]" />
            <span>
              {isAr
                ? "ملاحظة تدقيق معمارية قاعدة البيانات:"
                : "Database Financial Architecture Disclosure:"}
            </span>
          </div>
          <p className="leading-relaxed text-[11px] text-stone-400">
            {f.databaseLimitationNote}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. REVENUE VELOCITY & INTERACTIVE CHARTS                       */}
      {/* ============================================================== */}
      <AdminRevenueCharts
        dailySeries={dailyAnalytics}
        monthlySeries={monthlyAnalytics}
        yearlySeries={yearlyAnalytics}
        locale={locale}
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
      />

      {/* ============================================================== */}
      {/* 5. UPCOMING DEPARTURES EXPEDITION MANIFEST                     */}
      {/* ============================================================== */}
      <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <h3 className="font-headline text-lg sm:text-xl font-bold text-[#F3ECE1] flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#ECC15A]" />
              <span>
                {isAr
                  ? "جدول انطلاق الرحلات القادمة (مانيفست العمليات)"
                  : "Upcoming Scheduled Departures Manifest"}
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              {isAr
                ? "الانطلاقات الميدانية المجدولة، عدد المسافرين المؤكد، وسعة المركبات المخصصة."
                : "Scheduled field expeditions, confirmed passenger rosters, and luxury fleet allocations."}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab("departures")}
            className="text-xs font-semibold text-[#ECC15A] hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>
              {isAr ? "عرض جدول العمليات كاملاً" : "View Full Operations Schedule"}
            </span>
            <Arrow className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingDepartures.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-white/[0.03] text-stone-400 uppercase tracking-wider text-[10px] font-mono border-b border-white/[0.08]">
                <tr>
                  <th className="px-5 py-3.5">{isAr ? "رقم الحجز" : "Reference"}</th>
                  <th className="px-5 py-3.5">{isAr ? "الرحلة / التجربة" : "Tour / Service"}</th>
                  <th className="px-5 py-3.5">{isAr ? "تاريخ الانطلاق" : "Departure Date"}</th>
                  <th className="px-5 py-3.5">{isAr ? "الضيف الرئيسي" : "Lead Guest"}</th>
                  <th className="px-5 py-3.5">{isAr ? "المسافرون" : "Pax"}</th>
                  <th className="px-5 py-3.5">{isAr ? "تخصيص الأسطول" : "Fleet Allocation"}</th>
                  <th className="px-5 py-3.5">{isAr ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {upcomingDepartures.map((dep) => {
                  const bBadge = getAdminBookingStatusBadge(dep.status, locale);
                  return (
                    <tr
                      key={dep.bookingId}
                      onClick={() => onNavigateTab("bookings", dep.bookingRef)}
                      className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-[#ECC15A] whitespace-nowrap">
                        {dep.bookingRef}
                      </td>
                      <td className="px-5 py-4 font-medium text-stone-200 max-w-xs truncate">
                        {dep.serviceId}
                      </td>
                      <td className="px-5 py-4 text-stone-300 whitespace-nowrap">
                        {formatQatarDate(dep.departureDate, locale)}
                        {dep.timeWindow && (
                          <span className="text-[10px] text-stone-500 block font-mono">
                            {dep.timeWindow}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-stone-200 whitespace-nowrap">
                        <div className="font-semibold">{dep.customerName}</div>
                        <span className="text-[10px] text-stone-500 font-mono block">
                          {dep.customerPhone}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-200">
                        {dep.paxCount} {isAr ? "ركاب" : "Guests"}
                      </td>
                      <td className="px-5 py-4 text-stone-400 text-[11px] whitespace-nowrap">
                        {dep.availableSeats > 0 ? (
                          <span>
                            {isAr ? "سعة: " : "Cap: "}
                            {dep.paxCount}/{dep.maxSeats} ({dep.availableSeats}{" "}
                            {isAr ? "مقاعد إضافية" : "avail"})
                          </span>
                        ) : (
                          <span className="text-[#ECC15A] font-medium">
                            {isAr ? "مقصورة خاصة بالكامل" : "Private Charter Assigned"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full border font-mono font-semibold ${bBadge.badgeClass}`}
                        >
                          {bBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-stone-500">
            {isAr
              ? "لا توجد انطلاقات مؤكدة مجدولة في الفترة القادمة."
              : "No upcoming departures scheduled in the immediate horizon."}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. CATEGORIZED RECENT ACTIVITY STREAMS                         */}
      {/* ============================================================== */}
      <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <h3 className="font-headline text-lg sm:text-xl font-bold text-[#F3ECE1]">
              {isAr
                ? "سجل العمليات والأنشطة الإدارية الأخيرة"
                : "Live Operational Activity Feeds"}
            </h3>
            <p className="text-xs text-stone-400">
              {isAr
                ? "متابعة الحجوزات الجديدة، إيصالات الدفع المرفوعة، والرحلات المؤكدة."
                : "Audit streams for registrations, proof submissions, and status changes."}
            </p>
          </div>

          {/* Activity Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.08] text-xs">
            {[
              { id: "bookings", label: isAr ? "أحدث الحجوزات" : "Recent Bookings" },
              { id: "proofs", label: isAr ? "الإيصالات المرفوعة" : "Deposit Proofs" },
              { id: "confirmed", label: isAr ? "المؤكدة مؤخراً" : "Confirmed Trips" },
              { id: "cancellations", label: isAr ? "الملغاة" : "Cancellations" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivityTab(tab.id as typeof activityTab)}
                className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  activityTab === tab.id
                    ? "bg-[#C29B38] text-[#0F1115] font-bold shadow-md shadow-[#C29B38]/20"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feed Content */}
        <div className="space-y-3">
          {activityTab === "bookings" &&
            (recentBookings.length > 0 ? (
              recentBookings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab("bookings", item.bookingRef)}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#C29B38]/40 flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-[#ECC15A]">
                        {item.bookingRef}
                      </span>
                      <span className="text-xs text-stone-200 font-semibold truncate">
                        {item.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 truncate">
                      {item.serviceId} • {item.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-[#F3ECE1] block">
                      {formatQAR(item.amount || 0, locale)}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formatQatarDateTime(item.timestamp, locale)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 text-center py-8">
                {isAr ? "لا توجد حجوزات مسجلة." : "No bookings registered."}
              </p>
            ))}

          {activityTab === "proofs" &&
            (latestDepositSubmissions.length > 0 ? (
              latestDepositSubmissions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab("proofs")}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/40 flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {item.bookingRef}
                      </span>
                      <span className="text-xs text-stone-200 font-semibold">
                        {item.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 truncate">
                      {item.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/30 text-amber-300 bg-amber-500/15 font-mono uppercase font-bold block mb-1">
                      {item.status}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formatQatarDateTime(item.timestamp, locale)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 text-center py-8">
                {isAr ? "لا توجد إيصالات مرفوعة حديثاً." : "No recent deposit proofs."}
              </p>
            ))}

          {activityTab === "confirmed" &&
            (recentlyConfirmedBookings.length > 0 ? (
              recentlyConfirmedBookings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab("bookings", item.bookingRef)}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/40 flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {item.bookingRef}
                      </span>
                      <span className="text-xs text-stone-200 font-semibold">
                        {item.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 truncate">
                      {item.serviceId} • {item.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      {formatQAR(item.amount || 0, locale)}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formatQatarDateTime(item.timestamp, locale)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 text-center py-8">
                {isAr
                  ? "لا توجد حجوزات مؤكدة حديثاً."
                  : "No recently confirmed bookings."}
              </p>
            ))}

          {activityTab === "cancellations" &&
            (recentCancellations.length > 0 ? (
              recentCancellations.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab("bookings", item.bookingRef)}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-rose-600/40 flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-rose-400">
                        {item.bookingRef}
                      </span>
                      <span className="text-xs text-stone-200 font-semibold">
                        {item.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 truncate">
                      {item.serviceId} • {item.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-rose-500/30 text-rose-300 bg-rose-500/15 font-mono uppercase font-bold block mb-1">
                      Cancelled
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formatQatarDateTime(item.timestamp, locale)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-500 text-center py-8">
                {isAr ? "لا توجد حجوزات ملغاة." : "Zero cancellations recorded."}
              </p>
            ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 7. ROLE-BASED QUICK ACTIONS SHORTCUTS                          */}
      {/* ============================================================== */}
      <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <h3 className="font-headline text-lg font-bold text-[#F3ECE1]">
          {isAr ? "إجراءات الوصول السريع للعمليات" : "Role-Authorized Quick Operations"}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <button
            onClick={() => onNavigateTab("bookings")}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[#C29B38]/40 text-left rtl:text-right transition-all group cursor-pointer"
          >
            <Compass className="w-5 h-5 text-[#ECC15A] mb-2.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-stone-200 block truncate">
              {isAr ? "إدارة الحجوزات" : "All Bookings"}
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              {s.totalBookings} dossiers
            </span>
          </button>

          <button
            onClick={() => onNavigateTab("proofs")}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-amber-500/40 text-left rtl:text-right transition-all group cursor-pointer"
          >
            <Receipt className="w-5 h-5 text-amber-400 mb-2.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-stone-200 block truncate">
              {isAr ? "تدقيق الإيصالات" : "Deposit Proofs"}
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-semibold">
              {s.depositUnderReview} in review
            </span>
          </button>

          <button
            onClick={() => onNavigateTab("departures")}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[#C29B38]/40 text-left rtl:text-right transition-all group cursor-pointer"
          >
            <Calendar className="w-5 h-5 text-[#ECC15A] mb-2.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-stone-200 block truncate">
              {isAr ? "الانطلاقات الميدانية" : "Departures"}
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              {s.upcomingDeparturesCount} scheduled
            </span>
          </button>

          <button
            onClick={() => onNavigateTab("custom_trips")}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[#C29B38]/40 text-left rtl:text-right transition-all group cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-[#ECC15A] mb-2.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-stone-200 block truncate">
              {isAr ? "طلبات الرحلات الخاصة" : "Custom Briefs"}
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              VIP Bespoke CRM
            </span>
          </button>

          <button
            onClick={() => onNavigateTab("reports")}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-emerald-500/40 text-left rtl:text-right transition-all group cursor-pointer"
          >
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-2.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-stone-200 block truncate">
              {isAr ? "التقارير المالية" : "Financial Reports"}
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              CSV Export & Ledger
            </span>
          </button>

          {/* Staff Management (Super Admin Only) */}
          {userRole === "super_admin" ? (
            <button
              onClick={() => onNavigateTab("staff")}
              className="p-4 rounded-2xl bg-[#72132B]/20 hover:bg-[#72132B]/30 border border-[#72132B]/40 hover:border-[#72132B] text-left rtl:text-right transition-all group cursor-pointer"
            >
              <Users className="w-5 h-5 text-rose-300 mb-2.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-rose-200 block truncate">
                {isAr ? "إدارة الصلاحيات" : "Staff & Roles"}
              </span>
              <span className="text-[10px] font-mono text-rose-300/80">
                Super Admin
              </span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-left rtl:text-right opacity-40 cursor-not-allowed">
              <Shield className="w-5 h-5 text-stone-600 mb-2.5" />
              <span className="text-xs font-bold text-stone-500 block truncate">
                {isAr ? "إدارة الصلاحيات" : "Staff Access"}
              </span>
              <span className="text-[10px] font-mono text-stone-600">
                Restricted
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
