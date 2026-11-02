"use client";

import { useState } from "react";
import { Locale } from "@/translations";
import { formatQAR } from "./admin-utils";
import type { RevenueDataPoint } from "@/lib/server/admin-actions";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Table,
} from "lucide-react";

interface AdminRevenueChartsProps {
  dailySeries: RevenueDataPoint[];
  monthlySeries: RevenueDataPoint[];
  yearlySeries: RevenueDataPoint[];
  locale: Locale;
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

type TimeframeType = "daily" | "monthly" | "yearly";

export default function AdminRevenueCharts({
  dailySeries,
  monthlySeries,
  yearlySeries,
  locale,
  selectedRange,
  onRangeChange,
}: AdminRevenueChartsProps) {
  const isAr = locale === "ar";
  const [timeframe, setTimeframe] = useState<TimeframeType>("daily");
  const [metricType, setMetricType] = useState<"revenue" | "bookings">("revenue");
  const [showTableView, setShowTableView] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<RevenueDataPoint | null>(null);

  const activeSeries =
    timeframe === "daily"
      ? dailySeries
      : timeframe === "monthly"
      ? monthlySeries
      : yearlySeries;

  // Max value for scaling
  const maxVal = Math.max(
    1,
    ...activeSeries.map((d) => (metricType === "revenue" ? d.revenue : d.bookingsCount))
  );

  return (
    <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#ECC15A] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-headline text-lg sm:text-xl font-bold text-[#F3ECE1]">
              {isAr ? "تحليلات الإيرادات وحركة الحجوزات" : "Revenue Velocity & Booking Volume"}
            </h3>
          </div>
          <p className="text-xs text-stone-400">
            {isAr
              ? "متابعة تدفق الإيرادات المحصلة بالريال القطري (QAR) مقابل عدد الحجوزات المسجلة."
              : "Track verified revenue inflows in QAR vs. registered reservation volumes."}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Selector */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1 text-xs">
            <button
              onClick={() => setMetricType("revenue")}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                metricType === "revenue"
                  ? "bg-[#C29B38] text-[#0F1115] font-bold shadow-md shadow-[#C29B38]/20"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {isAr ? "الإيرادات المحصلة (ر.ق)" : "Collected Revenue (QAR)"}
            </button>
            <button
              onClick={() => setMetricType("bookings")}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                metricType === "bookings"
                  ? "bg-[#C29B38] text-[#0F1115] font-bold shadow-md shadow-[#C29B38]/20"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {isAr ? "عدد الحجوزات" : "Bookings Count"}
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1 text-xs font-mono">
            {(["daily", "monthly", "yearly"] as TimeframeType[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-white/[0.1] text-[#ECC15A] font-bold shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {tf === "daily" ? (isAr ? "يومي" : "Daily") : tf === "monthly" ? (isAr ? "شهري" : "Monthly") : (isAr ? "سنوي" : "Yearly")}
              </button>
            ))}
          </div>

          {/* Date Range Preset Selector */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-2xl px-3 py-1.5 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-[#ECC15A] me-2" />
            <select
              value={selectedRange}
              onChange={(e) => onRangeChange(e.target.value)}
              className="bg-transparent text-stone-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="7d" className="bg-[#14171F] text-stone-200">
                {isAr ? "آخر 7 أيام" : "Last 7 Days"}
              </option>
              <option value="30d" className="bg-[#14171F] text-stone-200">
                {isAr ? "آخر 30 يوماً" : "Last 30 Days"}
              </option>
              <option value="90d" className="bg-[#14171F] text-stone-200">
                {isAr ? "آخر 90 يوماً" : "Last 90 Days"}
              </option>
              <option value="ytd" className="bg-[#14171F] text-stone-200">
                {isAr ? "من بداية العام الحالي" : "Year to Date"}
              </option>
              <option value="all" className="bg-[#14171F] text-stone-200">
                {isAr ? "كامل السجل" : "All Time"}
              </option>
            </select>
          </div>

          {/* Table Toggle */}
          <button
            onClick={() => setShowTableView(!showTableView)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              showTableView
                ? "bg-[#C29B38]/20 border-[#C29B38]/50 text-[#ECC15A]"
                : "bg-white/[0.03] border-white/[0.08] text-stone-400 hover:text-stone-200"
            }`}
            title="Toggle Accessible Table View"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Canvas or Table View */}
      {showTableView ? (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead className="bg-white/[0.03] text-stone-400 border-b border-white/[0.08] uppercase tracking-wider text-[10px] font-mono">
              <tr>
                <th className="px-5 py-3.5">{isAr ? "الفترة" : "Period"}</th>
                <th className="px-5 py-3.5">{isAr ? "الإيرادات المحصلة" : "Collected Revenue"}</th>
                <th className="px-5 py-3.5">{isAr ? "قيمة الحجوزات الإجمالية" : "Total Booking Value"}</th>
                <th className="px-5 py-3.5">{isAr ? "عدد الحجوزات" : "Bookings Count"}</th>
                <th className="px-5 py-3.5">{isAr ? "الإيداعات المستلمة" : "Deposits Received"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {activeSeries.length > 0 ? (
                activeSeries.map((row) => (
                  <tr key={row.date} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-stone-200 font-semibold">{row.label}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">{formatQAR(row.revenue, locale)}</td>
                    <td className="px-5 py-3.5 font-mono text-stone-300">{formatQAR(row.bookingValue, locale)}</td>
                    <td className="px-5 py-3.5 font-mono text-stone-200">{row.bookingsCount}</td>
                    <td className="px-5 py-3.5 font-mono text-stone-300">{row.depositsCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-stone-500">
                    {isAr ? "لا توجد بيانات مسجلة في هذه الفترة." : "No records found for the selected period."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : activeSeries.length > 0 ? (
        <div className="space-y-4">
          {/* SVG / CSS Interactive Bar Chart Canvas */}
          <div className="relative h-72 w-full bg-black/20 rounded-2xl p-5 border border-white/[0.06] flex items-end gap-2.5 overflow-x-auto">
            {activeSeries.map((d) => {
              const currentVal = metricType === "revenue" ? d.revenue : d.bookingsCount;
              const heightPercent = Math.max(6, Math.round((currentVal / maxVal) * 100));

              return (
                <div
                  key={d.date}
                  className="flex-1 min-w-[32px] h-full flex flex-col items-center justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Floating tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-[#0F1115] border border-[#C29B38]/40 rounded-xl px-2.5 py-1 text-[10px] font-mono whitespace-nowrap shadow-xl text-[#ECC15A]">
                    {metricType === "revenue" ? formatQAR(d.revenue, locale) : `${d.bookingsCount} bookings`}
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[40px] rounded-t-xl transition-all duration-300 ${
                      metricType === "revenue"
                        ? "bg-gradient-to-t from-[#72132B]/30 via-[#C29B38] to-[#ECC15A] group-hover:brightness-125 shadow-sm shadow-[#C29B38]/20"
                        : "bg-gradient-to-t from-sky-900/40 via-sky-600 to-sky-400 group-hover:brightness-125 shadow-sm shadow-sky-500/20"
                    }`}
                  />
                  {/* Date label */}
                  <span className="text-[10px] font-mono text-stone-500 mt-2.5 truncate max-w-full block">
                    {d.label.length > 5 ? d.label.substring(5) : d.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hovered Point Inspector */}
          {hoveredPoint ? (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C29B38]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-mono text-[#ECC15A] font-bold text-sm">{hoveredPoint.label}</span>
              <div className="flex items-center gap-6">
                <span>
                  <span className="text-stone-400">{isAr ? "الإيراد المحصل: " : "Collected Revenue: "}</span>
                  <strong className="text-emerald-400 font-mono text-sm">{formatQAR(hoveredPoint.revenue, locale)}</strong>
                </span>
                <span>
                  <span className="text-stone-400">{isAr ? "الحجوزات: " : "Bookings: "}</span>
                  <strong className="text-stone-100 font-mono text-sm">{hoveredPoint.bookingsCount}</strong>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-stone-500 text-center font-mono">
              {isAr
                ? "مرر المؤشر فوق أي عمود للاطلاع على التفاصيل المالية للفترة."
                : "Hover over any bar to inspect date, verified revenue, and booking volume."}
            </p>
          )}
        </div>
      ) : (
        <div className="h-56 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-stone-500">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-xs text-stone-300 font-semibold">
            {isAr ? "لا توجد معاملات مسجلة في هذا النطاق الزمني" : "No recorded transactions in this timeframe"}
          </p>
          <p className="text-[11px] text-stone-500 max-w-sm leading-relaxed">
            {isAr
              ? "سيتم إدراج الإيرادات والحجوزات فور تأكيد الإيداعات البنكية وحجز الرحلات."
              : "Inflows will automatically populate as customer bookings and verified bank deposits are reconciled."}
          </p>
        </div>
      )}
    </div>
  );
}
