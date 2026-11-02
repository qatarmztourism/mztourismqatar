import { Locale } from "@/translations";

export function formatQAR(amount: number, locale: Locale = "en"): string {
  const formatted = Math.max(0, amount).toLocaleString(locale === "ar" ? "ar-QA" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return locale === "ar" ? `${formatted} ر.ق` : `${formatted} QAR`;
}

export function formatQatarDate(
  dateString: string | null | undefined,
  locale: Locale = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-QA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Qatar",
      ...options,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatQatarDateTime(
  dateString: string | null | undefined,
  locale: Locale = "en"
): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-QA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Qatar",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getRoleBadge(role: string, locale: Locale = "en") {
  const isAr = locale === "ar";
  switch (role) {
    case "super_admin":
      return {
        label: isAr ? "مدير النظام العام" : "Super Administrator",
        badgeClass: "bg-[#72132B]/30 border-[#72132B] text-rose-300",
      };
    case "tour_manager":
      return {
        label: isAr ? "مدير العمليات السياحية" : "Tour Operations Manager",
        badgeClass: "bg-[#C29B38]/20 border-[#C29B38]/50 text-[#C29B38]",
      };
    case "finance":
      return {
        label: isAr ? "مدير الحسابات المالية" : "Finance Officer",
        badgeClass: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
      };
    case "concierge_agent":
    default:
      return {
        label: isAr ? "وكيل كونسيرج كبار الشخصيات" : "VIP Concierge Agent",
        badgeClass: "bg-stone-800 border-stone-700 text-stone-300",
      };
  }
}

export function getAdminBookingStatusBadge(status: string, locale: Locale = "en") {
  const isAr = locale === "ar";
  switch (status) {
    case "confirmed":
      return {
        label: isAr ? "مؤكد" : "Confirmed",
        badgeClass: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      };
    case "deposit_under_review":
      return {
        label: isAr ? "قيد تدقيق العربون" : "Under Review",
        badgeClass: "bg-amber-500/15 border-amber-500/30 text-amber-400",
      };
    case "awaiting_deposit":
      return {
        label: isAr ? "بانتظار العربون" : "Awaiting Deposit",
        badgeClass: "bg-sky-500/15 border-sky-500/30 text-sky-400",
      };
    case "completed":
      return {
        label: isAr ? "مكتمل" : "Completed",
        badgeClass: "bg-stone-700/30 border-stone-600/40 text-stone-300",
      };
    case "cancelled":
      return {
        label: isAr ? "ملغي" : "Cancelled",
        badgeClass: "bg-[#72132B]/30 border-[#72132B]/50 text-red-300",
      };
    default:
      return {
        label: status,
        badgeClass: "bg-stone-800 border-stone-700 text-stone-300",
      };
  }
}

export function getAdminPaymentStatusBadge(status: string, locale: Locale = "en") {
  const isAr = locale === "ar";
  switch (status) {
    case "fully_paid":
    case "paid_in_full":
      return {
        label: isAr ? "مدفوع بالكامل" : "Fully Paid",
        badgeClass: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      };
    case "deposit_confirmed":
    case "deposit_received":
      return {
        label: isAr ? "تم اعتماد العربون" : "Deposit Confirmed",
        badgeClass: "bg-[#C29B38]/15 border-[#C29B38]/30 text-[#C29B38]",
      };
    case "deposit_submitted":
      return {
        label: isAr ? "تم تقديم العربون" : "Deposit Submitted",
        badgeClass: "bg-amber-500/15 border-amber-500/30 text-amber-400",
      };
    case "deposit_pending":
      return {
        label: isAr ? "العربون معلق" : "Deposit Pending",
        badgeClass: "bg-sky-500/15 border-sky-500/30 text-sky-400",
      };
    case "deposit_rejected":
      return {
        label: isAr ? "العربون مرفوض" : "Deposit Rejected",
        badgeClass: "bg-[#72132B]/30 border-[#72132B]/50 text-red-300",
      };
    default:
      return {
        label: status,
        badgeClass: "bg-stone-800 border-stone-700 text-stone-300",
      };
  }
}
