"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Locale, TranslationDict } from "@/translations";
import {
  getPublicProposalByTokenAction,
  customerAcceptProposalAction,
  customerDeclineProposalAction,
  customerRequestProposalRevisionAction,
  type PublicProposalData,
} from "@/lib/server/proposal-actions";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  Sparkles,
  Clock,
  MapPin,
  Car,
  Hotel,
  Utensils,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageCircle,
  Printer,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface CustomerProposalViewProps {
  guestToken: string;
  currentLocale: Locale;
  dict: TranslationDict;
}

export default function CustomerProposalView({
  guestToken,
  currentLocale,
  dict: _dict,
}: CustomerProposalViewProps) {
  void _dict;
  const isRtl = currentLocale === "ar";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<PublicProposalData | null>(null);

  // Expanded itinerary days state
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 1: true });

  // Action Modals State
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptNotes, setAcceptNotes] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);

  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isDeclining, setIsDeclining] = useState(false);

  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicProposalByTokenAction(guestToken);
      if (res.success && res.data) {
        setProposal(res.data);
        // Expand all days by default
        const allExpanded: Record<number, boolean> = {};
        res.data.itineraryDays.forEach((_, idx) => {
          allExpanded[idx + 1] = true;
        });
        setExpandedDays(allExpanded);
      } else {
        setError(res.error || "Unable to load bespoke proposal.");
      }
    } catch (err) {
      console.error("[Proposal Load Error]", err);
      setError("An unexpected error occurred while loading your proposal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestToken]);

  const toggleDay = (dayNum: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }));
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await customerAcceptProposalAction(guestToken, acceptNotes);
      if (res.success) {
        setAcceptModalOpen(false);
        setActionSuccessMsg(
          isRtl
            ? "شكراً لكم! تم اعتماد البرنامج بنجاح. سيقوم فريق الكونسيرج بالتنسيق معكم فوراً."
            : "Thank you! Your itinerary proposal has been accepted. Our concierge desk will contact you shortly."
        );
        fetchProposal();
      } else {
        alert(res.error || "Failed to accept proposal.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionFeedback.trim() || revisionFeedback.trim().length < 3) {
      alert(isRtl ? "يرجى توضيح التعديلات المطلوبة (3 أحرف على الأقل)." : "Please enter your requested modifications.");
      return;
    }
    setIsRequestingRevision(true);
    try {
      const res = await customerRequestProposalRevisionAction(guestToken, revisionFeedback);
      if (res.success) {
        setRevisionModalOpen(false);
        setActionSuccessMsg(
          isRtl
            ? "تم إرسال طلب التعديل بنجاح إلى فريق الكونسيرج. سنوافيكم بالنسخة المحدثة قريباً."
            : "Your revision request has been delivered to our concierge team. We will update your itinerary shortly."
        );
        fetchProposal();
      } else {
        alert(res.error || "Failed to submit revision request.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setIsRequestingRevision(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const res = await customerDeclineProposalAction(guestToken, declineReason);
      if (res.success) {
        setDeclineModalOpen(false);
        setActionSuccessMsg(
          isRtl
            ? "تم تسجيل اعتذاركم عن العرض. نتطلع دائماً لخدمتكم في رحلاتكم القادمة."
            : "Your response has been noted. We hope to welcome you on a future journey in Qatar."
        );
        fetchProposal();
      } else {
        alert(res.error || "Failed to decline proposal.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setIsDeclining(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-headline text-on-surface">
            {isRtl ? "جاري تحميل تفاصيل برنامج الرحلة الخاصة..." : "Loading your bespoke Qatar itinerary..."}
          </p>
        </div>
      </main>
    );
  }

  if (error || !proposal) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-container rounded-3xl border border-outline-variant/30 p-8 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-error/10 border border-error/30 text-error mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-headline text-xl text-on-surface font-semibold">
            {isRtl ? "تعذر عرض البرنامج" : "Proposal Unavailable"}
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {error || (isRtl ? "الرابط غير صالح أو انتهت صلاحيته." : "This proposal link is invalid or has expired.")}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={getWhatsAppInquiryUrl("Hello MZ Tourism Qatar, I need assistance with my bespoke proposal link.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isRtl ? "تواصل مع الكونسيرج عبر واتساب" : "Contact Concierge via WhatsApp"}</span>
            </a>
            <Link
              href={`/${currentLocale}`}
              className="text-xs text-on-surface-variant hover:text-on-surface py-1 font-medium transition-colors"
            >
              {isRtl ? "العودة للرئيسية" : "Return to Homepage"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const title = isRtl ? proposal.titleAr : proposal.titleEn;
  const summary = isRtl ? proposal.summaryAr || proposal.summaryEn : proposal.summaryEn;
  const whatsAppMessage = `Hello MZ Tourism Qatar, I am reviewing proposal ${proposal.proposalRef} (${title}).`;
  const whatsAppUrl = getWhatsAppInquiryUrl(whatsAppMessage);

  const canTakeAction = proposal.status === "published" || proposal.status === "revision_requested";

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28 pt-8">
      {/* Top Banner & Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-6 flex items-center justify-between">
        <Link
          href={`/${currentLocale}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="font-mono text-primary font-bold tracking-widest uppercase">MZ TOURISM QATAR</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer print:hidden"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span>{isRtl ? "طباعة البرنامج" : "Print Proposal"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Success Action Notification */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{actionSuccessMsg}</span>
          </div>
        )}

        {/* Header Hero Card */}
        <div className="bg-surface-container rounded-3xl border border-outline-variant/30 p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-outline-variant/20 pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary tracking-widest uppercase px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                  {proposal.proposalRef}
                </span>
                <span className="text-xs text-on-surface-variant font-mono">
                  {isRtl ? `النسخة ${proposal.version}` : `Revision v${proposal.version}`}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase font-mono border ${
                    proposal.status === "accepted"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : proposal.status === "declined"
                      ? "bg-error/10 border-error/30 text-error"
                      : "bg-primary/10 border-primary/30 text-primary"
                  }`}
                >
                  {proposal.status.replace("_", " ")}
                </span>
              </div>

              <h1 className="font-headline text-2xl sm:text-4xl text-on-surface font-semibold tracking-tight">
                {title}
              </h1>

              {summary && (
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {summary}
                </p>
              )}
            </div>

            {/* Price Snapshot Box */}
            <div className="bg-surface-container-high/60 rounded-2xl border border-primary/30 p-5 text-right sm:min-w-[220px] shrink-0 space-y-1">
              <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                {isRtl ? "القيمة الإجمالية المتفق عليها" : "Total Agreed Investment"}
              </span>
              <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
                {proposal.totalPrice.toLocaleString("en-US")}{" "}
                <span className="text-sm font-normal text-on-surface-variant">{proposal.currency}</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/15 text-[11px] text-on-surface-variant space-y-0.5">
                <div className="flex justify-between">
                  <span>{isRtl ? "عربون التأكيد:" : "Required Deposit:"}</span>
                  <span className="font-semibold text-on-surface">
                    {proposal.depositRequired.toLocaleString("en-US")} {proposal.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isRtl ? "الرصيد المتبقي:" : "Balance Due:"}</span>
                  <span className="font-semibold text-on-surface">
                    {proposal.balanceDue.toLocaleString("en-US")} {proposal.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div>
              <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                {isRtl ? "الضيف الكريم" : "Distinguished Guest"}
              </span>
              <span className="text-on-surface font-semibold">{proposal.inquiry.guestName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                {isRtl ? "عدد الضيوف" : "Party Size"}
              </span>
              <span className="text-on-surface font-semibold">{proposal.inquiry.partySize}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                {isRtl ? "الوجهات المعتمدة" : "Destinations Scope"}
              </span>
              <span className="text-on-surface font-semibold truncate block">
                {proposal.inquiry.destinations.join(", ")}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                {isRtl ? "تاريخ سريان العرض" : "Offer Valid Until"}
              </span>
              <span className={`font-semibold font-mono ${proposal.isValidUntilPassed ? "text-error" : "text-primary"}`}>
                {proposal.validUntil} {proposal.isValidUntilPassed && "(Expired)"}
              </span>
            </div>
          </div>
        </div>

        {/* Accepted or Converted Banner */}
        {proposal.status === "accepted" && (
          <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-headline text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{isRtl ? "تم اعتماد هذا البرنامج بنجاح" : "Proposal Accepted & Locked"}</span>
              </h3>
              <p className="text-xs text-on-surface-variant">
                {isRtl
                  ? "يجري الآن إعداد ملف الحجز المسبق وترتيبات السائق الخاص والتصاريح. سنتواصل معكم لتأكيد الإيداع."
                  : "Our executive operations team is finalizing chauffeur reservations and permits. We will contact you regarding deposit settlement."}
              </p>
            </div>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs inline-flex items-center gap-2 self-start sm:self-auto hover:bg-emerald-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isRtl ? "تنسيق عاجل عبر واتساب" : "WhatsApp Concierge"}</span>
            </a>
          </div>
        )}

        {/* Day by Day Itinerary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg sm:text-xl text-on-surface font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>{isRtl ? "جدول الرحلة يوماً بيوم" : "Day-by-Day Expedition Itinerary"}</span>
              <span className="text-xs text-on-surface-variant font-mono font-normal">
                ({proposal.itineraryDays.length} {isRtl ? "أيام" : "Days"})
              </span>
            </h2>

            <button
              type="button"
              onClick={() => {
                const areAllExpanded = Object.values(expandedDays).every(Boolean);
                const nextState: Record<number, boolean> = {};
                proposal.itineraryDays.forEach((_, idx) => {
                  nextState[idx + 1] = !areAllExpanded;
                });
                setExpandedDays(nextState);
              }}
              className="text-xs text-primary hover:underline font-mono"
            >
              {Object.values(expandedDays).every(Boolean)
                ? isRtl
                  ? "طي الكل"
                  : "Collapse All"
                : isRtl
                ? "توسيع الكل"
                : "Expand All"}
            </button>
          </div>

          <div className="space-y-4">
            {proposal.itineraryDays.map((rawDay, idx) => {
              const day = rawDay as {
                dayNumber?: number;
                titleEn?: string;
                titleAr?: string;
                descriptionEn?: string;
                descriptionAr?: string;
                date?: string;
                activities?: {
                  titleEn?: string;
                  titleAr?: string;
                  startTime?: string;
                  endTime?: string;
                  location?: string;
                  transport?: string;
                  hotel?: string;
                  meals?: string;
                  isOptional?: boolean;
                  notesCustomer?: string;
                }[];
              };

              const dayNum = day.dayNumber || idx + 1;
              const isExpanded = Boolean(expandedDays[dayNum]);
              const dayTitle = isRtl ? day.titleAr || day.titleEn : day.titleEn;
              const dayDesc = isRtl ? day.descriptionAr || day.descriptionEn : day.descriptionEn;

              return (
                <div
                  key={dayNum}
                  className="bg-surface-container rounded-3xl border border-outline-variant/25 shadow-xl overflow-hidden transition-all"
                >
                  {/* Day Header Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleDay(dayNum)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center font-headline font-bold text-sm shrink-0">
                        D{dayNum}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono text-primary font-bold">
                            {isRtl ? `اليوم ${dayNum}` : `Day ${dayNum}`}
                          </span>
                          {day.date && (
                            <span className="text-xs text-on-surface-variant font-mono">
                              • {day.date}
                            </span>
                          )}
                        </div>
                        <h3 className="font-headline text-base sm:text-lg text-on-surface font-semibold">
                          {dayTitle || `Expedition Program Day ${dayNum}`}
                        </h3>
                      </div>
                    </div>

                    <div className="text-on-surface-variant">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {/* Day Content */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-outline-variant/15 space-y-4">
                      {dayDesc && (
                        <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                          {dayDesc}
                        </p>
                      )}

                      {/* Activities Timeline */}
                      {day.activities && day.activities.length > 0 && (
                        <div className="space-y-3 pt-2">
                          {day.activities.map((act, actIdx) => {
                            const actTitle = isRtl ? act.titleAr || act.titleEn : act.titleEn;

                            return (
                              <div
                                key={actIdx}
                                className="p-4 rounded-2xl bg-surface-container-high/50 border border-outline-variant/20 space-y-2.5"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-2">
                                    {(act.startTime || act.endTime) && (
                                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary px-2 py-0.5 rounded-lg bg-primary/10">
                                        <Clock className="w-3 h-3" />
                                        {act.startTime}
                                        {act.endTime ? ` - ${act.endTime}` : ""}
                                      </span>
                                    )}
                                    <h4 className="font-headline text-sm font-semibold text-on-surface">
                                      {actTitle}
                                    </h4>
                                  </div>

                                  {act.isOptional && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25 self-start sm:self-auto">
                                      {isRtl ? "اختياري" : "Optional"}
                                    </span>
                                  )}
                                </div>

                                {/* Logistics Pills */}
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                                  {act.location && (
                                    <span className="inline-flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-primary" />
                                      {act.location}
                                    </span>
                                  )}
                                  {act.transport && (
                                    <span className="inline-flex items-center gap-1">
                                      <Car className="w-3.5 h-3.5 text-primary" />
                                      {act.transport}
                                    </span>
                                  )}
                                  {act.hotel && (
                                    <span className="inline-flex items-center gap-1">
                                      <Hotel className="w-3.5 h-3.5 text-primary" />
                                      {act.hotel}
                                    </span>
                                  )}
                                  {act.meals && (
                                    <span className="inline-flex items-center gap-1">
                                      <Utensils className="w-3.5 h-3.5 text-primary" />
                                      {act.meals}
                                    </span>
                                  )}
                                </div>

                                {act.notesCustomer && (
                                  <p className="text-[11px] text-on-surface-variant/90 italic pt-1 border-t border-outline-variant/10">
                                    {act.notesCustomer}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inclusions and Exclusions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inclusions */}
          <div className="bg-surface-container rounded-3xl border border-outline-variant/30 p-6 space-y-4 shadow-xl">
            <h3 className="font-headline text-base font-semibold text-on-surface flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{isRtl ? "الخدمات المشمولة في العرض" : "Curated Inclusions"}</span>
            </h3>

            {(isRtl ? proposal.inclusionsAr : proposal.inclusionsEn).length === 0 ? (
              <p className="text-xs text-on-surface-variant font-mono">
                {isRtl ? "تشمل جميع ترتيبات النقل والأنشطة الموضحة أعلاه." : "All experiences and transport detailed in the itinerary."}
              </p>
            ) : (
              <ul className="space-y-2 text-xs text-on-surface">
                {(isRtl ? proposal.inclusionsAr : proposal.inclusionsEn).map((inc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Exclusions */}
          <div className="bg-surface-container rounded-3xl border border-outline-variant/30 p-6 space-y-4 shadow-xl">
            <h3 className="font-headline text-base font-semibold text-on-surface flex items-center gap-2">
              <XCircle className="w-5 h-5 text-on-surface-variant" />
              <span>{isRtl ? "الخدمات غير المشمولة" : "Exclusions & Direct Expenses"}</span>
            </h3>

            {(isRtl ? proposal.exclusionsAr : proposal.exclusionsEn).length === 0 ? (
              <p className="text-xs text-on-surface-variant font-mono">
                {isRtl ? "المصاريف الشخصية وتذاكر الطيران الدولي غير مشمولة." : "International flights and personal incidental expenses."}
              </p>
            ) : (
              <ul className="space-y-2 text-xs text-on-surface-variant">
                {(isRtl ? proposal.exclusionsAr : proposal.exclusionsEn).map((exc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mt-0.5" />
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Terms & Policies */}
        {(proposal.termsEn || proposal.termsAr) && (
          <div className="bg-surface-container rounded-3xl border border-outline-variant/30 p-6 space-y-3 shadow-xl">
            <h3 className="font-headline text-base font-semibold text-on-surface flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>{isRtl ? "الشروط وسياسة الحجز" : "Terms & Booking Policies"}</span>
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line font-mono">
              {isRtl ? proposal.termsAr || proposal.termsEn : proposal.termsEn}
            </p>
          </div>
        )}

        {/* Customer Feedback Note if provided */}
        {proposal.customerFeedback && (
          <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface space-y-1">
            <span className="font-mono text-[10px] uppercase text-primary font-bold block">
              {isRtl ? "ملاحظاتكم المسجلة:" : "Your Stored Comments / Requests:"}
            </span>
            <p className="italic font-mono">{proposal.customerFeedback}</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Dock */}
      {canTakeAction && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container/95 backdrop-blur-md border-t border-outline-variant/30 p-4 shadow-2xl print:hidden">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                {isRtl ? "العرض سارٍ وقابل للاعتماد الفوري" : "Proposal Active & Awaiting Your Confirmation"}
              </span>
              <span className="font-headline text-sm font-semibold text-primary">
                {proposal.totalPrice.toLocaleString("en-US")} {proposal.currency}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setRevisionModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold transition-colors cursor-pointer"
              >
                {isRtl ? "طلب تعديلات" : "Request Changes"}
              </button>

              <button
                type="button"
                onClick={() => setDeclineModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-error/20 border border-outline-variant/30 text-error text-xs font-semibold transition-colors cursor-pointer"
              >
                {isRtl ? "اعتذار" : "Decline"}
              </button>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container border border-primary/40 text-primary text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{isRtl ? "استشارة الكونسيرج" : "WhatsApp"}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <button
                type="button"
                onClick={() => setAcceptModalOpen(true)}
                className="px-6 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/25 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? "اعتماد البرنامج رسمياً" : "Accept Proposal"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ACCEPT PROPOSAL
          ========================================================================= */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-primary/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline text-lg font-semibold text-on-surface flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{isRtl ? "تأكيد اعتماد برنامج الرحلة" : "Confirm Itinerary Acceptance"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isRtl
                ? `باعتمادكم لعرض الرحلة [${proposal.proposalRef}]، يتم قفل التسعير عند ${proposal.totalPrice.toLocaleString("en-US")} ر.ق. سيتواصل معكم الكونسيرج التنفيذي لترتيب تحويل العربون المطلوب وتثبيت الأسطول.`
                : `By accepting proposal [${proposal.proposalRef}], you confirm your agreement with the itinerary and agreed quotation of ${proposal.totalPrice.toLocaleString("en-US")} QAR. Our team will coordinate deposit settlement.`}
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-on-surface-variant block">
                {isRtl ? "ملاحظات إضافية أو تفضيلات خاصة (اختياري):" : "Additional Instructions (Optional):"}
              </label>
              <textarea
                value={acceptNotes}
                onChange={(e) => setAcceptNotes(e.target.value)}
                placeholder={isRtl ? "مثل: تفاصيل الرحلة الجوية، طلب مقاعد أطفال، تفضيلات وجبات..." : "e.g. Flight arrival details, dietary preferences, child seats..."}
                rows={3}
                className="w-full p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface font-semibold transition-colors cursor-pointer"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isAccepting}
                onClick={handleAccept}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{isRtl ? "تأكيد الاعتماد" : "Confirm & Accept"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: REQUEST CHANGES
          ========================================================================= */}
      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline text-lg font-semibold text-on-surface flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>{isRtl ? "طلب تعديلات على البرنامج" : "Request Itinerary Modifications"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isRtl
                ? "يسعدنا تعديل أي تفاصيل، أوقات، وجهات أو خيارات إقامة لتناسب تطلعاتكم تماماً. يرجى توضيح التغييرات المطلوبة."
                : "We are pleased to customize any timing, destinations, or hospitality options to match your vision perfectly."}
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-on-surface-variant block">
                {isRtl ? "التعديلات المطلوبة (مطلوب):" : "Requested Changes (Required):"}
              </label>
              <textarea
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder={isRtl ? "يرجى كتابة التعديل المرغوب..." : "Please describe your preferred adjustments..."}
                rows={4}
                className="w-full p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface font-semibold transition-colors cursor-pointer"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isRequestingRevision}
                onClick={handleRequestRevision}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isRequestingRevision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isRtl ? "إرسال طلب التعديل" : "Send Revision Request"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: DECLINE PROPOSAL
          ========================================================================= */}
      {declineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-error/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline text-lg font-semibold text-error flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>{isRtl ? "الاعتذار عن البرنامج" : "Decline Proposal"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeclineModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isRtl
                ? "نأسف لعدم مناسبة هذا العرض لخططكم. هل يمكنكم مشاركة سبب الاعتذار لمساعدتنا في تحسين خدماتنا؟"
                : "We appreciate your consideration. If you wish, please share your reason to assist us in improving our services."}
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-on-surface-variant block">
                {isRtl ? "السبب (اختياري):" : "Reason (Optional):"}
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder={isRtl ? "تغيير الموعد، الميزانية، إلغاء السفر..." : "Date change, budget consideration, postponed travel..."}
                rows={3}
                className="w-full p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-error"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface font-semibold transition-colors cursor-pointer"
              >
                {isRtl ? "تراجع" : "Go Back"}
              </button>
              <button
                type="button"
                disabled={isDeclining}
                onClick={handleDecline}
                className="px-5 py-2 rounded-xl bg-error text-on-error text-xs font-semibold hover:bg-error/90 transition-colors shadow-lg shadow-error/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeclining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{isRtl ? "تأكيد الاعتذار" : "Confirm Decline"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
