import { Locale, TranslationDict } from "@/translations";

export interface UserSessionInfo {
  id: string;
  email?: string;
  fullName: string;
  phone?: string;
  preferredLocale?: "en" | "ar";
  isAdmin?: boolean;
}

export function formatDate(dateString: string | null | undefined, locale: Locale): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-QA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Qatar",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined, locale: Locale): string {
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

export function formatCurrency(amount: number, currency: string = "QAR"): string {
  const formatted = Math.max(0, amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatted} ${currency}`;
}

export function getServiceName(serviceId: string, dict: TranslationDict): string {
  const service = dict.services.find((s) => s.id === serviceId);
  if (service) return service.title;

  // Pretty fallback
  return serviceId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getBookingStatusBadge(status: string, locale: Locale) {
  const isAr = locale === "ar";
  switch (status) {
    case "confirmed":
      return {
        label: isAr ? "مؤكد" : "Confirmed",
        bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      };
    case "deposit_under_review":
      return {
        label: isAr ? "قيد مراجعة الدفعة" : "Deposit Under Review",
        bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      };
    case "awaiting_deposit":
      return {
        label: isAr ? "بانتظار إيداع العربون" : "Awaiting Deposit",
        bg: "bg-sky-500/10 border-sky-500/30 text-sky-400",
      };
    case "completed":
      return {
        label: isAr ? "مكتمل" : "Completed",
        bg: "bg-stone-500/10 border-stone-500/30 text-stone-300",
      };
    case "cancelled":
      return {
        label: isAr ? "ملغي" : "Cancelled",
        bg: "bg-[#72132B]/20 border-[#72132B]/40 text-red-300",
      };
    default:
      return {
        label: status,
        bg: "bg-stone-800 border-stone-700 text-stone-300",
      };
  }
}

export function getPaymentStatusBadge(status: string, locale: Locale) {
  const isAr = locale === "ar";
  switch (status) {
    case "paid_in_full":
      return {
        label: isAr ? "مدفوع بالكامل" : "Paid in Full",
        bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      };
    case "deposit_received":
      return {
        label: isAr ? "تم استلام العربون" : "Deposit Confirmed",
        bg: "bg-[#C29B38]/10 border-[#C29B38]/30 text-[#C29B38]",
      };
    case "deposit_pending":
      return {
        label: isAr ? "العربون معلق" : "Deposit Pending",
        bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      };
    case "refunded":
      return {
        label: isAr ? "مسترجع" : "Refunded",
        bg: "bg-stone-500/10 border-stone-500/30 text-stone-300",
      };
    default:
      return {
        label: status,
        bg: "bg-stone-800 border-stone-700 text-stone-300",
      };
  }
}

export function getProofStatusBadge(status: string, locale: Locale) {
  const isAr = locale === "ar";
  switch (status) {
    case "approved":
      return {
        label: isAr ? "معتمد" : "Approved",
        bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      };
    case "rejected":
      return {
        label: isAr ? "مرفوض" : "Rejected",
        bg: "bg-[#72132B]/25 border-[#72132B]/50 text-red-300",
      };
    case "pending_review":
    default:
      return {
        label: isAr ? "قيد المراجعة" : "Under Review",
        bg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
      };
  }
}
