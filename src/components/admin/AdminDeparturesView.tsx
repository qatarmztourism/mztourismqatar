"use client";

import { useState, useEffect } from "react";
import { Locale } from "@/translations";
import {
  getAdminDashboardSummaryAction,
  type AdminUpcomingDepartureItem,
} from "@/lib/server/admin-actions";
import {
  formatQatarDate,
  getAdminBookingStatusBadge,
  getAdminPaymentStatusBadge,
} from "./admin-utils";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  Search,
  MapPin,
  MessageCircle,
  Loader2,
  Shield,
  Compass,
} from "lucide-react";

interface AdminDeparturesViewProps {
  locale: Locale;
  onSelectBooking: (bookingRef: string) => void;
}

export default function AdminDeparturesView({
  locale,
  onSelectBooking,
}: AdminDeparturesViewProps) {
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [departures, setDepartures] = useState<AdminUpcomingDepartureItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadDepartures() {
      try {
        setLoading(true);
        const res = await getAdminDashboardSummaryAction({ dateRangePreset: "all" });
        if (res.success && res.data) {
          setDepartures(res.data.upcomingDepartures);
        }
      } catch (err) {
        console.error("[Departures Load Error]", err);
      } finally {
        setLoading(false);
      }
    }
    loadDepartures();
  }, []);

  const filtered = departures.filter((dep) => {
    if (filterStatus !== "all" && dep.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const refMatch = dep.bookingRef.toLowerCase().includes(q);
      const guestMatch = dep.customerName.toLowerCase().includes(q);
      const tourMatch = dep.serviceId.toLowerCase().includes(q);
      const phoneMatch = dep.customerPhone.includes(q);
      return refMatch || guestMatch || tourMatch || phoneMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-[#14171F] p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#ECC15A] text-[10px] font-mono font-semibold tracking-wider uppercase mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? "جدول العمليات الميدانية" : "Expeditions Manifest"}</span>
          </div>
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#F3ECE1]">
            {isAr ? "إدارة الانطلاقات والعمليات الميدانية" : "Expeditions & Field Operations Manifest"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {isAr
              ? "متابعة مسارات الرحلات اليومية، أسطول المركبات المخصصة، وتوجيه السائقين المعتمدين في الدوحة."
              : "Track scheduled expedition departures, assigned VIP fleet allocations, and chauffeur coordinates."}
          </p>
        </div>
      </div>

      {/* Fleet Allocation Architecture Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-stone-300 flex items-start gap-3.5 shadow-lg">
        <Shield className="w-4 h-4 text-[#ECC15A] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#F3ECE1] font-mono uppercase text-[11px] tracking-wider">
            {isAr ? "معايير تخصيص الأسطول السياحي الفاخر:" : "Luxury Private Fleet Allocation Protocol:"}
          </p>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            {isAr
              ? "جميع رحلات إم زد للسياحة قطر خاصة بالكامل. لا يتم تسيير رحلات بنظام المقاعد المشتركة. كل حجز يحصل على مركبة دفع رباعي مخصصة (سعة 6 ركاب) أو يخت خاص أو سيارة فاخرة مستقلة."
              : "All MZ Tourism Qatar experiences are 100% private charters. Passenger counts are assigned to dedicated private luxury 4x4 Land Cruisers (up to 6 pax), private Dhows (up to 30 pax), or VIP vans with zero public seat pooling."}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute top-1/2 -translate-y-1/2 left-3.5 rtl:left-auto rtl:right-3.5" />
          <input
            type="text"
            placeholder={isAr ? "بحث برقم الحجز، الضيف، الهاتف..." : "Search ref, guest name, phone, tour..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.1] text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#C29B38]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.08] text-xs font-mono">
          {[
            { id: "all", label: isAr ? "الكل" : "All" },
            { id: "confirmed", label: isAr ? "مؤكد" : "Confirmed" },
            { id: "deposit_under_review", label: isAr ? "قيد التدقيق" : "Under Review" },
            { id: "awaiting_deposit", label: isAr ? "بانتظار العربون" : "Awaiting Deposit" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-[#C29B38] text-[#0F1115] font-bold shadow-md shadow-[#C29B38]/20"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Departures Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-[#C29B38]/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#ECC15A] animate-spin" />
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-[#14171F] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-white/[0.03] text-stone-400 uppercase tracking-wider text-[10px] font-mono border-b border-white/[0.08]">
                <tr>
                  <th className="px-5 py-4">{isAr ? "رقم المرجع" : "Ref"}</th>
                  <th className="px-5 py-4">{isAr ? "التاريخ والتوقيت" : "Date & Window"}</th>
                  <th className="px-5 py-4">{isAr ? "التجربة" : "Experience"}</th>
                  <th className="px-5 py-4">{isAr ? "المسافرون" : "Guests"}</th>
                  <th className="px-5 py-4">{isAr ? "موقع الاستقبال" : "Pickup Location"}</th>
                  <th className="px-5 py-4">{isAr ? "الحالة" : "Status"}</th>
                  <th className="px-5 py-4 text-right rtl:text-left">{isAr ? "الإجراء" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((dep) => {
                  const bBadge = getAdminBookingStatusBadge(dep.status, locale);
                  const pBadge = getAdminPaymentStatusBadge(dep.paymentStatus, locale);
                  return (
                    <tr key={dep.bookingId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#ECC15A] whitespace-nowrap">
                        <button
                          onClick={() => onSelectBooking(dep.bookingRef)}
                          className="hover:underline text-left rtl:text-right cursor-pointer"
                        >
                          {dep.bookingRef}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-stone-300 whitespace-nowrap">
                        <span className="font-semibold text-stone-100 block">
                          {formatQatarDate(dep.departureDate, locale)}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {dep.timeWindow || (isAr ? "مرن" : "Flexible")}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-stone-200 max-w-xs truncate">
                        {dep.serviceId}
                      </td>
                      <td className="px-5 py-4 text-stone-300 whitespace-nowrap">
                        <span className="font-semibold text-stone-100 block">
                          {dep.paxCount} {isAr ? "ضيوف" : "Guests"}
                        </span>
                        <span className="text-[10px] text-[#ECC15A] font-mono">
                          {isAr ? "أسطول خاص" : "Private Fleet"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-stone-300 max-w-xs truncate">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#ECC15A] shrink-0" />
                          <span>{dep.pickupLocation || (isAr ? "يحدد لاحقاً" : "TBD with Concierge")}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap space-y-1">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border block text-center font-mono font-semibold ${bBadge.badgeClass}`}>
                          {bBadge.label}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border block text-center font-mono ${pBadge.badgeClass}`}>
                          {pBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right rtl:text-left whitespace-nowrap">
                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                          <button
                            onClick={() => onSelectBooking(dep.bookingRef)}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-stone-200 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            {isAr ? "الملف" : "Dossier"}
                          </button>
                          <a
                            href={getWhatsAppInquiryUrl(`Hello, regarding departure ${dep.bookingRef}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                            title="Concierge WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-16 rounded-3xl bg-[#14171F] border border-white/[0.08] text-center text-xs text-stone-500 shadow-xl">
          {isAr
            ? "لم يتم العثور على أية انطلاقات تطابق معايير البحث الحالية."
            : "No scheduled departures match the current filter or search criteria."}
        </div>
      )}
    </div>
  );
}
