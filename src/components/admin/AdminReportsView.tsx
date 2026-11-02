"use client";

import { useState, useEffect } from "react";
import { Locale, TranslationDict } from "@/translations";
import {
  getAdminDashboardSummaryAction,
  getAdminBookingsAction,
  type AdminFinancialBreakdown,
} from "@/lib/server/admin-actions";
import { formatQAR } from "./admin-utils";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

interface AdminReportsViewProps {
  locale: Locale;
  dict?: TranslationDict;
}

export default function AdminReportsView({
  locale,
}: AdminReportsViewProps) {
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState<AdminFinancialBreakdown | null>(null);
  const [exporting, setExporting] = useState(false);
  const [datePreset, setDatePreset] = useState("30d");

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await getAdminDashboardSummaryAction({ dateRangePreset: datePreset as "7d" | "30d" | "90d" | "ytd" | "all" });
        if (res.success && res.data) {
          setFinancials(res.data.financialBreakdown);
        }
      } catch (err) {
        console.error("[Reports Load Error]", err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [datePreset]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const res = await getAdminBookingsAction({ limit: 200 });
      if (!res.success || !res.data) {
        alert(res.error || "Failed to retrieve booking data for export.");
        return;
      }

      // RFC 4180 CSV generator with UTF-8 BOM
      const headers = [
        "Booking Reference",
        "Lead Guest Name",
        "Customer Email",
        "Customer Phone",
        "Service / Tour",
        "Departure Date",
        "Pax Count",
        "Booking Status",
        "Payment Status",
        "Deposit Required (QAR)",
        "Deposit Paid (QAR)",
        "Balance Due (QAR)",
        "Registration Date",
      ];

      const escapeCSV = (val: string | number | null | undefined): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return `"${str}"`;
      };

      const rows = res.data.map((b) => [
        escapeCSV(b.bookingRef),
        escapeCSV(b.customerName),
        escapeCSV(b.customerEmail),
        escapeCSV(b.customerPhone),
        escapeCSV(b.serviceId),
        escapeCSV(b.departureDate),
        escapeCSV(b.paxCount),
        escapeCSV(b.bookingStatus),
        escapeCSV(b.paymentStatus),
        escapeCSV(b.depositRequired),
        escapeCSV(b.depositPaid),
        escapeCSV(b.balanceDue),
        escapeCSV(b.createdAt.substring(0, 10)),
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `MZ_Tourism_Qatar_Financial_Ledger_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("[Export CSV Error]", err);
      alert("Error generating CSV ledger.");
    } finally {
      setExporting(false);
    }
  };

  if (loading && !financials) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-[#C29B38]/30 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#ECC15A] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-[#14171F] p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#ECC15A] text-[10px] font-mono font-semibold tracking-wider uppercase mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isAr ? "التقارير والمطابقة" : "Financial Audit"}</span>
          </div>
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#F3ECE1]">
            {isAr ? "التقارير المالية والتسوية المحاسبية" : "Financial Audits & Settlement Reports"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {isAr
              ? "متابعة وتصدير السجلات المحاسبية الرسمية بالريال القطري المتوافقة مع معايير التدقيق المالي."
              : "Generate official QAR financial ledgers, audit velocity, and export RFC 4180 CSVs."}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#C29B38] to-[#ECC15A] text-[#0F1115] font-bold text-xs hover:brightness-110 transition-all self-start sm:self-auto disabled:opacity-50 shadow-lg shadow-[#C29B38]/20 cursor-pointer"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{isAr ? "تصدير السجل المالي (CSV)" : "Export Financial Ledger (CSV)"}</span>
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs text-stone-300 font-mono font-semibold uppercase tracking-wider">
          {isAr ? "نطاق الفترة المحاسبية:" : "Audit Accounting Timeframe:"}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.08] text-xs font-mono">
          {[
            { id: "7d", label: isAr ? "7 أيام" : "7 Days" },
            { id: "30d", label: isAr ? "30 يوماً" : "30 Days" },
            { id: "90d", label: isAr ? "90 يوماً" : "90 Days" },
            { id: "ytd", label: isAr ? "من بداية العام" : "YTD" },
            { id: "all", label: isAr ? "كامل السجل" : "All Time" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDatePreset(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                datePreset === tab.id
                  ? "bg-[#C29B38] text-[#0F1115] font-bold shadow-md shadow-[#C29B38]/20"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Financial Ledger Table */}
      {financials && (
        <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
            <h3 className="font-headline text-lg sm:text-xl font-bold text-[#F3ECE1] flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-[#ECC15A]" />
              <span>{isAr ? "الميزانية التشغيلية المستخلصة (ر.ق)" : "Audited Operational Ledger Statement (QAR)"}</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Reconciled & Verified</span>
            </span>
          </div>

          <div className="divide-y divide-white/[0.04] rounded-2xl border border-white/[0.08] overflow-hidden text-xs">
            <div className="flex items-center justify-between p-4 sm:p-5 bg-white/[0.02]">
              <span className="text-stone-300 font-medium">
                {isAr ? "1. القيمة الإجمالية للعقود والحجوزات النشطة (Gross Commitment)" : "1. Gross Contracted Value (Non-Cancelled Bookings)"}
              </span>
              <span className="font-headline text-base sm:text-lg font-bold text-[#F3ECE1]">
                {formatQAR(financials.totalBookingValue, locale)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 sm:p-5 bg-emerald-500/10">
              <span className="text-emerald-300 font-bold">
                {isAr ? "2. إجمالي إيداعات العربون المعتمدة فعلياً (Confirmed Deposits)" : "2. Verified Deposit Collections (Reconciled in Bank)"}
              </span>
              <span className="font-headline text-base sm:text-lg font-bold text-emerald-300">
                {formatQAR(financials.confirmedDepositCollections, locale)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 sm:p-5 bg-white/[0.02]">
              <span className="text-stone-300 font-medium">
                {isAr ? "3. دفعات إضافية ومبالغ مسبقة مسجلة (Other Recorded Payments)" : "3. Other Recorded Payments (Balance Settlements)"}
              </span>
              <span className="font-headline text-base sm:text-lg font-bold text-stone-200">
                {formatQAR(financials.otherRecordedPayments, locale)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 sm:p-5 bg-[#C29B38]/15">
              <span className="text-[#ECC15A] font-bold text-sm">
                {isAr ? "4. إجمالي السيولة النقدية المحصلة فعلياً (Total Collected Amount)" : "4. Total Cash Collected & Verified to Date"}
              </span>
              <span className="font-headline text-lg sm:text-xl font-bold text-[#ECC15A]">
                {formatQAR(financials.totalCollectedAmount, locale)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 sm:p-5 bg-amber-500/10">
              <span className="text-amber-300 font-medium">
                {isAr ? "5. الأرصدة المتبقية مستحقة السداد قبل الانطلاق (Outstanding Customer Balance)" : "5. Outstanding Customer Balance (Accounts Receivable)"}
              </span>
              <span className="font-headline text-base sm:text-lg font-bold text-amber-300">
                {formatQAR(financials.outstandingCustomerBalance, locale)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 sm:p-5 bg-[#72132B]/20">
              <span className="text-rose-300 font-medium">
                {isAr ? "6. قيمة الحجوزات الملغاة والمحجوبة (Cancelled Booking Quarantined Amounts)" : "6. Cancelled Reservations (Quarantined & Excluded)"}
              </span>
              <span className="font-headline text-base sm:text-lg font-bold text-rose-300">
                {formatQAR(financials.cancelledBookingAmounts, locale)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
