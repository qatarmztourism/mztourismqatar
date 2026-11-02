"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Locale, TranslationDict } from "@/translations";
import {
  getCustomerPaymentsAction,
  type CustomerPaymentsSummary,
} from "@/lib/server/customer-actions";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  formatDateTime,
  formatCurrency,
  getServiceName,
  getProofStatusBadge,
  getPaymentStatusBadge,
} from "./account-utils";
import {
  Building2,
  Download,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileCheck,
} from "lucide-react";

interface AccountPaymentsViewProps {
  locale: Locale;
  dict: TranslationDict;
}

export default function AccountPaymentsView({
  locale,
  dict,
}: AccountPaymentsViewProps) {
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<CustomerPaymentsSummary | null>(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const res = await getCustomerPaymentsAction();
        if (res.success && res.data) {
          setPayments(res.data);
        }
      } catch (err) {
        console.error("[Account Payments Load Error]", err);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-stone-400">
        <Loader2 className="w-8 h-8 text-[#C29B38] animate-spin" />
      </div>
    );
  }

  const totalPaid = payments?.totalPaid || 0;
  const totalBalanceDue = payments?.totalBalanceDue || 0;
  const awaitingDepositCount = payments?.awaitingDepositCount || 0;
  const transactions = payments?.transactions || [];
  const bookingPayments = payments?.bookingPayments || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3ECE1]">
          {isRtl ? "سجل المدفوعات والإيصالات" : "Payments & Deposit Ledger"}
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          {isRtl
            ? "متابعة دفعات العربون المحولة، الأرصدة المتبقية، وسجل إيصالات التحويل البنكي المعتمدة."
            : "Review confirmed deposit transactions, outstanding balances, and official bank transfer receipts."}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Paid */}
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 relative overflow-hidden">
          <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">
            {isRtl ? "إجمالي المبالغ المدفوعة" : "Total Paid to Date"}
          </span>
          <p className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-emerald-400">
            {formatCurrency(totalPaid, "QAR")}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {isRtl ? "عربون مستلم ومؤكد" : "Verified deposit funds"}
          </span>
        </div>

        {/* Total Balance Due */}
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 relative overflow-hidden">
          <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">
            {isRtl ? "إجمالي الرصيد المتبقي" : "Outstanding Balance Due"}
          </span>
          <p className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#C29B38]">
            {formatCurrency(totalBalanceDue, "QAR")}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {isRtl ? "يسدد لاحقاً قبل انطلاق الرحلة" : "Payable prior to expedition"}
          </span>
        </div>

        {/* Awaiting Deposits Count */}
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 relative overflow-hidden">
          <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">
            {isRtl ? "حجوزات بانتظار العربون" : "Pending Deposits"}
          </span>
          <p className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-amber-400">
            {awaitingDepositCount}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {isRtl ? "تتطلب رفع إيصال التحويل" : "Requires proof upload"}
          </span>
        </div>
      </div>

      {/* Manual Payment Instructions Card */}
      <div className="bg-gradient-to-r from-[#0F1115] via-[#15131A] to-[#72132B]/20 border border-[#C29B38]/30 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C29B38]/20 border border-[#C29B38]/40 flex items-center justify-center text-[#C29B38]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F3ECE1]">
                {isRtl ? "تعليمات التحويل البنكي في دولة قطر" : "Official Qatar Bank Transfer Instructions"}
              </h3>
              <p className="text-xs text-stone-400">
                {isRtl ? "العملة المعتمدة: الريال القطري (QAR)" : "Designated Currency: Qatari Riyal (QAR)"}
              </p>
            </div>
          </div>

          <a
            href={getWhatsAppInquiryUrl("Hello MZ Tourism Qatar, inquiry regarding bank transfer details and deposit confirmation.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-950/60 border border-emerald-600/30 text-emerald-300 hover:bg-emerald-900/60 text-xs font-medium transition-colors shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? "طلب تفاصيل الحساب عبر واتساب" : "Request Wire Details via WhatsApp"}</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-300 pt-1">
          <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800">
            <p className="font-semibold text-stone-100 mb-1">
              {isRtl ? "1. التحويل المحلي / الدولي" : "1. Wire or Local Transfer"}
            </p>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              {isRtl
                ? "قم بتحويل مبلغ العربون بالريال القطري (QAR) مع ذكر رقم الحجز (MZ-XXXXXXXX) في خانة الملاحظات."
                : "Transfer designated deposit amount in QAR mentioning your reservation reference in remittance notes."}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800">
            <p className="font-semibold text-stone-100 mb-1">
              {isRtl ? "2. التقاط صورة الإيصال" : "2. Capture Clear Receipt"}
            </p>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              {isRtl
                ? "التقط صورة واضحة أو مستند PDF يوضح رقم العملية البنكية والمبلغ وتاريخ التحويل."
                : "Export or screenshot transaction confirmation showing reference number, date, and amount."}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800">
            <p className="font-semibold text-stone-100 mb-1">
              {isRtl ? "3. المراجعة والاعتماد" : "3. Concierge Verification"}
            </p>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              {isRtl
                ? "يتم مراجعة الإيصال واعتماده من فريق الحسابات وتحديث حالة الحجز إلى مؤكد فوراً."
                : "Our Doha finance desk audits submitted proofs and issues a confirmed reservation voucher."}
            </p>
          </div>
        </div>
      </div>

      {/* Submitted Receipts Ledger */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-[#F3ECE1] flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#C29B38]" />
          <span>{isRtl ? "سجل إيصالات الدفع المرفوعة" : "Submitted Deposit Receipts Ledger"}</span>
        </h2>

        {transactions.length > 0 ? (
          <div className="bg-[#0F1115] border border-stone-800 rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-stone-900/70 border-b border-stone-800 text-stone-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">{isRtl ? "تاريخ الرفع" : "Uploaded At"}</th>
                    <th className="px-4 py-3">{isRtl ? "رقم الحجز" : "Reservation Ref"}</th>
                    <th className="px-4 py-3">{isRtl ? "اسم الملف" : "File Name"}</th>
                    <th className="px-4 py-3">{isRtl ? "الحالة" : "Review Status"}</th>
                    <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? "الإجراء" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {transactions.map((tx) => {
                    const badge = getProofStatusBadge(tx.reviewStatus, locale);
                    return (
                      <tr key={tx.id} className="hover:bg-stone-900/40 transition-colors">
                        <td className="px-4 py-3 text-stone-300 whitespace-nowrap">
                          {formatDateTime(tx.uploadedAt, locale)}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-[#C29B38] whitespace-nowrap">
                          <Link
                            href={`/${locale}/account/bookings/${tx.bookingRef}`}
                            className="hover:underline"
                          >
                            {tx.bookingRef}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-stone-200 max-w-xs truncate">
                          {tx.fileName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right rtl:text-left whitespace-nowrap">
                          {tx.signedUrl ? (
                            <a
                              href={tx.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#C29B38] hover:underline font-medium text-[11px]"
                            >
                              <Download className="w-3 h-3" />
                              <span>{isRtl ? "تحميل" : "View Receipt"}</span>
                            </a>
                          ) : (
                            <span className="text-stone-500 text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-8 text-center text-xs text-stone-400">
            {isRtl
              ? "لم يتم تسجيل أية إيصالات دفع حتى الآن."
              : "No payment receipts have been uploaded yet."}
          </div>
        )}
      </div>

      {/* Active Reservations Payment Status List */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-[#F3ECE1]">
          {isRtl ? "حالة سداد الحجوزات النشطة" : "Active Reservations Payment Progress"}
        </h2>

        {bookingPayments.length > 0 ? (
          <div className="space-y-3">
            {bookingPayments.map((b) => {
              const pBadge = getPaymentStatusBadge(b.paymentStatus, locale);
              const percentPaid =
                b.depositRequired > 0
                  ? Math.min(100, Math.round((b.depositPaid / b.depositRequired) * 100))
                  : 0;

              return (
                <div
                  key={b.id}
                  className="bg-[#0F1115] border border-stone-800 rounded-xl p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#C29B38]">
                          {b.bookingRef}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${pBadge.bg}`}>
                          {pBadge.label}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-stone-200 mt-1">
                        {getServiceName(b.serviceId, dict)}
                      </h4>
                    </div>

                    <Link
                      href={`/${locale}/account/bookings/${b.bookingRef}`}
                      className="text-xs text-[#C29B38] hover:underline flex items-center gap-1 self-start sm:self-auto"
                    >
                      <span>{isRtl ? "تفاصيل الحجز ورفع الإيصال" : "View Reservation & Upload"}</span>
                      <Arrow className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#C29B38] to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>
                        {isRtl ? "المسدد: " : "Paid: "}
                        {formatCurrency(b.depositPaid, b.currency)}
                      </span>
                      <span>
                        {isRtl ? "المطلوب: " : "Required: "}
                        {formatCurrency(b.depositRequired, b.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-stone-500">
            {isRtl ? "لا توجد حجوزات نشطة." : "No active reservations."}
          </p>
        )}
      </div>
    </div>
  );
}
