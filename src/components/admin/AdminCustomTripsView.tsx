"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Locale } from "@/translations";
import {
  getAdminCustomTripsAction,
  getAdminCustomTripDetailAction,
  assignCustomTripAction,
  updateCustomTripCrmDetailsAction,
  addCustomTripMessageAction,
  saveCustomProposalAction,
  convertProposalToBookingAction,
  getAssignableStaffAction,
  type AssignableStaffItem,
} from "@/lib/server/admin-actions";
import {
  VALID_CUSTOM_TRIP_STATUS_TRANSITIONS,
  CUSTOM_TRIP_PRIORITIES,
  calculateQuotationTotals,
  type CustomTripPriority,
  type QuotationPricingInput,
  type ItineraryDayInput,
} from "@/lib/validations/booking-schemas";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  Search,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  Send,
  Save,
  Briefcase,
  History,
} from "lucide-react";

interface AdminCustomTripsViewProps {
  locale: Locale;
  adminUserRole?: string;
  onNavigateToBookings?: () => void;
}

interface CustomTripSummaryItem {
  id: string;
  requestRef: string;
  customerId: string | null;
  guestName: string;
  email: string;
  phone: string;
  destinations: string[];
  experiences: string[];
  partySize: string;
  timeframe: string;
  budgetRange: string;
  specialRequests: string | null;
  status: string;
  priority: CustomTripPriority;
  assignedTo: string | null;
  assignedStaffName: string | null;
  assignedStaffEmail: string | null;
  assignedAt: string | null;
  followUpDate: string | null;
  preferredLocale: string;
  adults: number;
  children: number;
  accommodationPreference: string | null;
  transportPreference: string | null;
  convertedBookingId: string | null;
  convertedAt: string | null;
  lostReason: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InquiryDossierData {
  inquiry: CustomTripSummaryItem & {
    convertedBookingRef?: string | null;
    convertedBookingStatus?: string | null;
  };
  timeline: {
    id: string;
    eventType: string;
    titleEn: string;
    titleAr: string;
    descriptionEn: string | null;
    descriptionAr: string | null;
    actorRole: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }[];
  messages: {
    id: string;
    senderType: string;
    senderName: string;
    channel: string;
    message: string;
    isInternal: boolean;
    createdAt: string;
  }[];
  proposals: {
    id: string;
    proposalRef: string;
    guestToken: string;
    tokenExpiresAt: string;
    version: number;
    status: string;
    titleEn: string;
    titleAr: string;
    summaryEn: string | null;
    summaryAr: string | null;
    validUntil: string;
    currency: string;
    pricingBreakdown: Record<string, unknown>;
    totalPrice: number;
    depositRequired: number;
    balanceDue: number;
    itineraryDays: Record<string, unknown>[];
    inclusionsEn: string[];
    inclusionsAr: string[];
    exclusionsEn: string[];
    exclusionsAr: string[];
    termsEn: string | null;
    termsAr: string | null;
    customerNotes: string | null;
    internalNotes: string | null;
    customerFeedback: string | null;
    customerActionAt: string | null;
    convertedBookingId: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
}

const DEFAULT_INCLUSIONS_EN = [
  "Private VIP 4x4 Chauffeur & Executive Transfers",
  "Licensed English/Arabic Speaking Heritage Guide",
  "Luxury Bedouin Majlis & Desert Hospitality Setup",
  "Traditional Qatari Banquet & Gourmet Refreshments",
  "Inland Sea (Khor Al Adaid) Dune Permitting & Insurance",
];

const DEFAULT_INCLUSIONS_AR = [
  "أسطول دفع رباعي خاص مع سائق VIP معتمد",
  "مرشد سياحي قطري مرخص متحدث بالعربية والإنجليزية",
  "مجلس بدوي ملكي وضيافة عربية أصيلة",
  "مأدبة عشاء فاخرة ومشروبات ومقبلات قطرية",
  "تصاريح دخول محمية خور العديد والتأمين الشامل",
];

const DEFAULT_EXCLUSIONS_EN = [
  "International Airline Tickets to Doha",
  "Personal Shopping and Discretionary Gratuities",
];

const DEFAULT_EXCLUSIONS_AR = [
  "تذاكر الطيران الدولي إلى الدوحة",
  "المشتريات الشخصية والإكراميات الاختيارية",
];

export default function AdminCustomTripsView({
  locale,
  adminUserRole = "concierge_agent",
  onNavigateToBookings,
}: AdminCustomTripsViewProps) {
  void adminUserRole;
  const isRtl = locale === "ar";

  // Inquiry List State
  const [trips, setTrips] = useState<CustomTripSummaryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority_desc" | "follow_up">("newest");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  // Staff list for assignments
  const [staffList, setStaffList] = useState<AssignableStaffItem[]>([]);

  // Selected Dossier State
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<InquiryDossierData | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<"overview" | "timeline" | "itinerary" | "conversion">("overview");

  // CRM Assignment & Notes State
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<CustomTripPriority>("normal");
  const [followUpDateInput, setFollowUpDateInput] = useState<string>("");
  const [adminNotesInput, setAdminNotesInput] = useState<string>("");
  const [statusInput, setStatusInput] = useState<string>("");
  const [lostReasonInput, setLostReasonInput] = useState<string>("");
  const [savingCrm, setSavingCrm] = useState<boolean>(false);

  // Communication Message State
  const [newMessageText, setNewMessageText] = useState<string>("");
  const [messageChannel, setMessageChannel] = useState<"portal" | "email" | "whatsapp" | "internal_note">("internal_note");
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Itinerary Builder State
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [proposalTitleEn, setProposalTitleEn] = useState<string>("");
  const [proposalTitleAr, setProposalTitleAr] = useState<string>("");
  const [proposalSummaryEn, setProposalSummaryEn] = useState<string>("");
  const [proposalSummaryAr, setProposalSummaryAr] = useState<string>("");
  const [proposalValidUntil, setProposalValidUntil] = useState<string>("");
  const [pricingModel, setPricingModel] = useState<"per_person" | "fixed_group">("per_person");
  const [adultRate, setAdultRate] = useState<number>(1800);
  const [childRate, setChildRate] = useState<number>(900);
  const [accommodationCost, setAccommodationCost] = useState<number>(0);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [activityCost, setActivityCost] = useState<number>(0);
  const [optionalExtrasCost, setOptionalExtrasCost] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [depositType, setDepositType] = useState<"percentage" | "fixed">("percentage");
  const [depositValue, setDepositValue] = useState<number>(30);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDayInput[]>([]);
  const [inclusionsEn, setInclusionsEn] = useState<string[]>(DEFAULT_INCLUSIONS_EN);
  const [inclusionsAr, setInclusionsAr] = useState<string[]>(DEFAULT_INCLUSIONS_AR);
  const [exclusionsEn, setExclusionsEn] = useState<string[]>(DEFAULT_EXCLUSIONS_EN);
  const [exclusionsAr, setExclusionsAr] = useState<string[]>(DEFAULT_EXCLUSIONS_AR);
  const [customerNotesProposal, setCustomerNotesProposal] = useState<string>("");
  const [internalNotesProposal, setInternalNotesProposal] = useState<string>("");
  const [savingProposal, setSavingProposal] = useState<boolean>(false);

  // Conversion State
  const [conversionPickup, setConversionPickup] = useState<string>("");
  const [conversionNotes, setConversionNotes] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // Fetch Inquiries List
  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCustomTripsAction({
        filterStatus: statusFilter,
        priority: priorityFilter,
        assignedTo: assignedToFilter,
        search,
        sortBy,
        page,
        limit: pageSize,
      });

      if (res.success && res.data) {
        setTrips(res.data as unknown as CustomTripSummaryItem[]);
        setTotalCount(res.totalCount || 0);
      } else {
        setError(res.error || "Failed to load custom trip inquiries.");
      }
    } catch (err) {
      console.error("[Fetch Inquiries Error]", err);
      setError("An unexpected error occurred while fetching inquiries.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, assignedToFilter, search, sortBy, page, pageSize]);

  // Load Staff for Assignments
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await getAssignableStaffAction();
        if (res.success && res.data) {
          setStaffList(res.data);
        }
      } catch (err) {
        console.error("[Load Staff Error]", err);
      }
    };
    loadStaff();
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Open Dossier
  const openDossier = async (requestId: string) => {
    setSelectedInquiryId(requestId);
    setActiveDossierTab("overview");
    try {
      const res = await getAdminCustomTripDetailAction(requestId);
      if (res.success && res.data) {
        const d = res.data as unknown as InquiryDossierData;
        setDossier(d);
        setSelectedStaffId(d.inquiry.assignedTo || "");
        setSelectedPriority(d.inquiry.priority || "normal");
        setFollowUpDateInput(d.inquiry.followUpDate || "");
        setAdminNotesInput(d.inquiry.adminNotes || "");
        setStatusInput(d.inquiry.status);
        setLostReasonInput(d.inquiry.lostReason || "");

        // Initialize Itinerary Builder with active proposal or blank 2-day template
        const activeProp = d.proposals.find((p) => p.status !== "superseded") || d.proposals[0];
        if (activeProp) {
          setEditingProposalId(activeProp.id);
          setProposalTitleEn(activeProp.titleEn);
          setProposalTitleAr(activeProp.titleAr);
          setProposalSummaryEn(activeProp.summaryEn || "");
          setProposalSummaryAr(activeProp.summaryAr || "");
          setProposalValidUntil(activeProp.validUntil);
          const pb = activeProp.pricingBreakdown as Partial<QuotationPricingInput>;
          setPricingModel(pb.pricingModel || "per_person");
          setAdultRate(pb.adultRate ?? 1800);
          setChildRate(pb.childRate ?? 900);
          setAccommodationCost(pb.accommodationCost ?? 0);
          setTransportCost(pb.transportCost ?? 0);
          setActivityCost(pb.activityCost ?? 0);
          setOptionalExtrasCost(pb.optionalExtrasCost ?? 0);
          setDiscountAmount(pb.discountAmount ?? 0);
          setTaxAmount(pb.taxAmount ?? 0);
          setDepositType(pb.depositType || "percentage");
          setDepositValue(pb.depositValue ?? 30);
          setItineraryDays((activeProp.itineraryDays as unknown as ItineraryDayInput[]) || []);
          setInclusionsEn(activeProp.inclusionsEn || DEFAULT_INCLUSIONS_EN);
          setInclusionsAr(activeProp.inclusionsAr || DEFAULT_INCLUSIONS_AR);
          setExclusionsEn(activeProp.exclusionsEn || DEFAULT_EXCLUSIONS_EN);
          setExclusionsAr(activeProp.exclusionsAr || DEFAULT_EXCLUSIONS_AR);
          setCustomerNotesProposal(activeProp.customerNotes || "");
          setInternalNotesProposal(activeProp.internalNotes || "");
        } else {
          // Initialize fresh draft
          setEditingProposalId(null);
          setProposalTitleEn(`${d.inquiry.guestName} — Bespoke Qatar Journey`);
          setProposalTitleAr(`برنامج رحلة ${d.inquiry.guestName} في قطر`);
          setProposalSummaryEn("Curated private luxury expedition exploring Doha and the Inland Sea.");
          setProposalSummaryAr("برنامج سياحي خاص واستثنائي يجمع بين معالم الدوحة وسفاري خور العديد.");

          // 30 days default validity
          const validDate = new Date();
          validDate.setDate(validDate.getDate() + 30);
          setProposalValidUntil(validDate.toISOString().slice(0, 10));

          setPricingModel("per_person");
          setAdultRate(1800);
          setChildRate(900);
          setDepositType("percentage");
          setDepositValue(30);

          setItineraryDays([
            {
              dayNumber: 1,
              titleEn: "Arrival & Doha Cultural Grandeur",
              titleAr: "الوصول وجولة معالم الدوحة الثقافية",
              descriptionEn: "VIP airport reception, luxury check-in, and private tour of Souq Waqif and National Museum of Qatar.",
              descriptionAr: "استقبال VIP في المطار، تسجيل الوصول، وجولة خاصة في سوق واقف ومتحف قطر الوطني.",
              activities: [
                {
                  titleEn: "VIP Airport Meet & Assist",
                  titleAr: "استقبال كبار الشخصيات بمطار حمد",
                  startTime: "10:00",
                  endTime: "11:30",
                  location: "Hamad International Airport",
                  transport: "Mercedes-Maybach Chauffeur",
                  isOptional: false,
                },
                {
                  titleEn: "Souq Waqif & Falcon Souq Immersion",
                  titleAr: "جولة سوق واقف وسوق الصقور",
                  startTime: "16:00",
                  endTime: "19:00",
                  location: "Souq Waqif, Doha",
                  isOptional: false,
                },
              ],
            },
            {
              dayNumber: 2,
              titleEn: "Khor Al Adaid Inland Sea Private Desert Safari",
              titleAr: "سفاري صحراء خور العديد والبحر الداخلي",
              descriptionEn: "Private dune drive, camel ride, inland sea panoramic photography, and royal Bedouin dinner.",
              descriptionAr: "قيادة خاصة عبر الكثبان الرملية، ركوب الهجن، إطلالات البحر الداخلي، وعشاء بدوي فاخر.",
              activities: [
                {
                  titleEn: "Private 4x4 Dune Bashing",
                  titleAr: "سفاري الكثبان الرملية بسيارات الدفع الرباعي",
                  startTime: "14:00",
                  endTime: "18:00",
                  location: "Sealine & Khor Al Adaid",
                  transport: "Luxury Nissan Patrol 4x4",
                  isOptional: false,
                },
                {
                  titleEn: "Private Bedouin Majlis BBQ Dinner",
                  titleAr: "عشاء مشويات خاص في المجلس البدوي",
                  startTime: "18:30",
                  endTime: "21:00",
                  location: "Inland Sea Royal Camp",
                  meals: "Full Arabic Live BBQ",
                  isOptional: false,
                },
              ],
            },
          ]);
          setInclusionsEn(DEFAULT_INCLUSIONS_EN);
          setInclusionsAr(DEFAULT_INCLUSIONS_AR);
          setExclusionsEn(DEFAULT_EXCLUSIONS_EN);
          setExclusionsAr(DEFAULT_EXCLUSIONS_AR);
        }
      } else {
        alert(res.error || "Failed to load dossier details.");
      }
    } catch (err) {
      console.error("[Open Dossier Error]", err);
    }
  };

  // Close Dossier
  const closeDossier = () => {
    setSelectedInquiryId(null);
    setDossier(null);
    fetchInquiries();
  };

  // Save CRM Details (Assignment, Status, Priority, Notes)
  const handleSaveCrm = async () => {
    if (!selectedInquiryId) return;
    setSavingCrm(true);
    try {
      // 1. Assignment
      const assignRes = await assignCustomTripAction({
        inquiryId: selectedInquiryId,
        assignedToId: selectedStaffId || null,
        followUpDate: followUpDateInput || null,
        priority: selectedPriority,
      });

      if (!assignRes.success) {
        alert(assignRes.error || "Failed to update assignment.");
        setSavingCrm(false);
        return;
      }

      // 2. Status & Notes
      const detailsRes = await updateCustomTripCrmDetailsAction({
        inquiryId: selectedInquiryId,
        status: statusInput !== dossier?.inquiry.status ? statusInput : undefined,
        priority: selectedPriority,
        followUpDate: followUpDateInput || null,
        adminNotes: adminNotesInput,
        lostReason: statusInput === "lost" ? lostReasonInput : undefined,
      });

      if (!detailsRes.success) {
        alert(detailsRes.error || "Failed to update inquiry status.");
        setSavingCrm(false);
        return;
      }

      // Refresh dossier
      await openDossier(selectedInquiryId);
      alert(isRtl ? "تم حفظ تحديثات الملف بنجاح." : "CRM details updated successfully.");
    } catch (err) {
      console.error("[Save CRM Error]", err);
      alert("An unexpected error occurred.");
    } finally {
      setSavingCrm(false);
    }
  };

  // Send Message / Add Note
  const handleSendMessage = async () => {
    if (!selectedInquiryId || !newMessageText.trim()) return;
    setSendingMessage(true);
    try {
      const res = await addCustomTripMessageAction({
        inquiryId: selectedInquiryId,
        message: newMessageText.trim(),
        channel: messageChannel,
        isInternal: messageChannel === "internal_note",
      });

      if (res.success) {
        setNewMessageText("");
        // Reload dossier to show new message & timeline
        await openDossier(selectedInquiryId);
      } else {
        alert(res.error || "Failed to save message.");
      }
    } catch {
      alert("An error occurred while saving the message.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Compute live quotation numbers
  const liveCalculation = calculateQuotationTotals(
    {
      pricingModel,
      adultRate,
      childRate,
      accommodationCost,
      transportCost,
      activityCost,
      optionalExtrasCost,
      discountAmount,
      taxAmount,
      depositType,
      depositValue,
    },
    dossier?.inquiry.adults || 2,
    dossier?.inquiry.children || 0
  );

  // Save / Publish Proposal
  const handleSaveProposal = async (publish: boolean) => {
    if (!selectedInquiryId) return;
    if (!proposalTitleEn.trim() || !proposalTitleAr.trim()) {
      alert("Proposal title in both English and Arabic is required.");
      return;
    }
    if (!proposalValidUntil) {
      alert("Validity date is required.");
      return;
    }
    if (itineraryDays.length === 0) {
      alert("At least 1 itinerary day is required.");
      return;
    }

    setSavingProposal(true);
    try {
      const res = await saveCustomProposalAction({
        inquiryId: selectedInquiryId,
        proposalId: editingProposalId || undefined,
        titleEn: proposalTitleEn.trim(),
        titleAr: proposalTitleAr.trim(),
        summaryEn: proposalSummaryEn.trim() || undefined,
        summaryAr: proposalSummaryAr.trim() || undefined,
        validUntil: proposalValidUntil,
        currency: "QAR",
        pricing: {
          pricingModel,
          adultRate,
          childRate,
          accommodationCost,
          transportCost,
          activityCost,
          optionalExtrasCost,
          discountAmount,
          taxAmount,
          depositType,
          depositValue,
        },
        itineraryDays,
        inclusionsEn,
        inclusionsAr,
        exclusionsEn,
        exclusionsAr,
        customerNotes: customerNotesProposal.trim() || undefined,
        internalNotes: internalNotesProposal.trim() || undefined,
        publish,
      });

      if (res.success) {
        alert(
          publish
            ? isRtl
              ? "تم نشر العرض وإرساله للعميل بنجاح!"
              : "Proposal published and sent to customer successfully!"
            : isRtl
            ? "تم حفظ مسودة البرنامج بنجاح."
            : "Proposal draft saved successfully."
        );
        await openDossier(selectedInquiryId);
      } else {
        alert(res.error || "Failed to save proposal.");
      }
    } catch (err) {
      console.error("[Save Proposal Error]", err);
      alert("An unexpected error occurred while saving the proposal.");
    } finally {
      setSavingProposal(false);
    }
  };

  // Convert Proposal to Booking
  const handleConvertProposal = async (proposalId: string) => {
    if (!proposalId) return;
    if (!confirm(isRtl ? "هل أنت متأكد من تحويل هذا العرض إلى حجز مؤكد؟" : "Convert this proposal into a confirmed reservation?")) {
      return;
    }

    setIsConverting(true);
    try {
      const res = await convertProposalToBookingAction({
        proposalId,
        pickupLocation: conversionPickup.trim() || undefined,
        specialRequests: conversionNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        alert(
          isRtl
            ? `تم تحويل العرض إلى حجز بنجاح برقم المرجع: ${res.data.bookingRef}`
            : `Proposal successfully converted to reservation reference: ${res.data.bookingRef}`
        );
        await openDossier(selectedInquiryId!);
      } else {
        alert(res.error || "Conversion failed.");
      }
    } catch {
      alert("An unexpected error occurred during conversion.");
    } finally {
      setIsConverting(false);
    }
  };

  // Day Manager helpers
  const addDay = () => {
    const nextDayNum = itineraryDays.length + 1;
    setItineraryDays((prev) => [
      ...prev,
      {
        dayNumber: nextDayNum,
        titleEn: `Day ${nextDayNum} Itinerary`,
        titleAr: `جدول اليوم ${nextDayNum}`,
        descriptionEn: "",
        descriptionAr: "",
        activities: [],
      },
    ]);
  };

  const removeDay = (idx: number) => {
    if (itineraryDays.length <= 1) {
      alert("The itinerary must contain at least one day.");
      return;
    }
    setItineraryDays((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    });
  };

  const addActivity = (dayIdx: number) => {
    setItineraryDays((prev) => {
      const copy = [...prev];
      const targetDay = copy[dayIdx];
      if (targetDay) {
        targetDay.activities = [
          ...targetDay.activities,
          {
            titleEn: "New Activity",
            titleAr: "نشاط جديد",
            startTime: "09:00",
            endTime: "12:00",
            location: "Doha, Qatar",
            isOptional: false,
          },
        ];
      }
      return copy;
    });
  };

  const removeActivity = (dayIdx: number, actIdx: number) => {
    setItineraryDays((prev) => {
      const copy = [...prev];
      const targetDay = copy[dayIdx];
      if (targetDay) {
        targetDay.activities = targetDay.activities.filter((_, i) => i !== actIdx);
      }
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="bg-surface-container p-5 rounded-3xl border border-outline-variant/20 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-headline text-lg sm:text-xl font-semibold text-on-surface">
              {isRtl ? "إدارة طلبات الرحلات المخصصة والبرامج السياحية (CRM)" : "Custom Tour Requests & Itinerary CRM"}
            </h2>
          </div>

          <div className="text-xs text-on-surface-variant font-mono">
            {totalCount} {isRtl ? "طلباً مسجلاً" : "inquiries recorded"}
          </div>
        </div>

        {/* Filter controls grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant`} />
            <input
              type="text"
              placeholder={isRtl ? "بحث بالرمز، اسم الضيف، الهاتف، البريد..." : "Search ref, guest, email, phone..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`w-full min-h-[40px] ${isRtl ? "pr-9 pl-3" : "pl-9 pr-3"} bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-[40px] bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Inquiry</option>
            <option value="under_review">Under Review</option>
            <option value="contacted">Contacted</option>
            <option value="itinerary_in_progress">Itinerary in Progress</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="accepted">Accepted</option>
            <option value="converted">Converted to Booking</option>
            <option value="lost">Lost / Declined</option>
            <option value="archived">Archived</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-[40px] bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer capitalize"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Assigned Staff Filter */}
          <select
            value={assignedToFilter}
            onChange={(e) => {
              setAssignedToFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-[40px] bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Staff Assignments</option>
            <option value="unassigned">Unassigned Inquiries</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.role})
              </option>
            ))}
          </select>
        </div>

        {/* Sort and Clear Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/15 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono text-on-surface-variant">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface-container-high border border-outline-variant/25 text-on-surface text-xs rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority_desc">Highest Priority First</option>
              <option value="follow_up">Upcoming Follow-Up Date</option>
            </select>
          </div>

          {(statusFilter !== "all" || priorityFilter !== "all" || assignedToFilter !== "all" || search !== "") && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setAssignedToFilter("all");
                setSearch("");
                setPage(1);
              }}
              className="text-xs text-primary hover:underline font-mono"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Inquiry Cards List */}
      {loading ? (
        <div className="p-16 text-center text-on-surface-variant flex flex-col items-center gap-2 bg-surface-container rounded-3xl border border-outline-variant/20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs font-mono">Loading bespoke inquiries...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-error bg-error/10 border border-error/25 rounded-3xl text-xs">
          {error}
        </div>
      ) : trips.length === 0 ? (
        <div className="p-16 text-center text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant/20 space-y-2">
          <Briefcase className="w-8 h-8 mx-auto text-on-surface-variant/60" />
          <p className="text-sm font-headline font-semibold text-on-surface">No bespoke briefs found</p>
          <p className="text-xs text-on-surface-variant">Try adjusting your search criteria or status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const whatsAppMsg = `Hello ${trip.guestName}, this is MZ Tourism Qatar concierge regarding your bespoke journey brief ${trip.requestRef}.`;
            const whatsAppUrl = getWhatsAppInquiryUrl(whatsAppMsg);

            const priorityColor =
              trip.priority === "urgent"
                ? "bg-red-500/15 text-red-400 border-red-500/30"
                : trip.priority === "high"
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : trip.priority === "low"
                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                : "bg-surface-container-high text-on-surface-variant border-outline-variant/30";

            return (
              <div
                key={trip.id}
                className="bg-surface-container rounded-3xl border border-outline-variant/25 p-5 sm:p-6 shadow-xl space-y-4 hover:border-primary/40 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-outline-variant/15 gap-2">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary tracking-wider">
                        {trip.requestRef}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${priorityColor}`}>
                        {trip.priority}
                      </span>
                      <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface font-semibold">
                        {trip.status.replace("_", " ")}
                      </span>
                      {trip.convertedBookingId && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                          Converted to Booking
                        </span>
                      )}
                    </div>
                    <h3 className="font-headline text-base sm:text-lg text-on-surface font-semibold pt-1">
                      {trip.guestName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-on-surface-variant font-mono">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{new Date(trip.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Scope Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                      Destinations & Scope
                    </span>
                    <span className="text-on-surface font-medium truncate block">
                      {trip.destinations.join(", ") || "Qatar"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                      Party & Timeframe
                    </span>
                    <span className="text-on-surface font-medium block">
                      {trip.partySize} • {trip.timeframe}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                      Target Budget
                    </span>
                    <span className="text-primary font-mono font-semibold block">
                      {trip.budgetRange}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                      Assigned Liaison
                    </span>
                    <span className="text-on-surface font-semibold block">
                      {trip.assignedStaffName || (
                        <span className="text-on-surface-variant italic">Unassigned</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Contact info bar */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant font-mono pt-1">
                  <span>Phone: <strong className="text-on-surface">{trip.phone}</strong></span>
                  <span>Email: <strong className="text-on-surface">{trip.email}</strong></span>
                  {trip.followUpDate && (
                    <span className="text-amber-400 font-semibold">
                      Follow-up: {trip.followUpDate}
                    </span>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/15">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDossier(trip.id)}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isRtl ? "إدارة الملف والبرنامج السياحي" : "Manage Dossier & Itinerary"}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container border border-primary/30 text-primary text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Liaison</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          INQUIRY DOSSIER & ITINERARY BUILDER MODAL
          ========================================================================= */}
      {selectedInquiryId && dossier && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-surface-container border border-primary/30 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-high/40">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary tracking-widest px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/25">
                    {dossier.inquiry.requestRef}
                  </span>
                  <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold border border-outline-variant/30">
                    {dossier.inquiry.status.replace("_", " ")}
                  </span>
                  {dossier.inquiry.convertedBookingRef && (
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Booking: {dossier.inquiry.convertedBookingRef}
                    </span>
                  )}
                </div>
                <h2 className="font-headline text-lg sm:text-xl font-semibold text-on-surface">
                  {dossier.inquiry.guestName} — Bespoke Travel Dossier
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDossier}
                className="self-end sm:self-auto p-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Dossier Tabs Header */}
            <div className="flex items-center gap-1 px-6 border-b border-outline-variant/15 bg-surface-container text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveDossierTab("overview")}
                className={`py-3 px-4 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeDossierTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                1. Brief Overview & CRM
              </button>
              <button
                type="button"
                onClick={() => setActiveDossierTab("timeline")}
                className={`py-3 px-4 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeDossierTab === "timeline"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                2. Audit Timeline & Communications ({dossier.messages.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveDossierTab("itinerary")}
                className={`py-3 px-4 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeDossierTab === "itinerary"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                3. Visual Itinerary & Quotation Builder ({dossier.proposals.length} Proposals)
              </button>
              <button
                type="button"
                onClick={() => setActiveDossierTab("conversion")}
                className={`py-3 px-4 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeDossierTab === "conversion"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                4. Booking Conversion
              </button>
            </div>

            {/* Dossier Tabs Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: BRIEF OVERVIEW & CRM */}
              {activeDossierTab === "overview" && (
                <div className="space-y-6">
                  {/* Guest Logistics Grid */}
                  <div className="bg-surface-container-high/40 p-5 rounded-2xl border border-outline-variant/20 space-y-3">
                    <h3 className="font-headline text-sm font-semibold text-primary">Guest Logistics Brief</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-on-surface-variant block">Email Address</span>
                        <span className="text-on-surface font-semibold">{dossier.inquiry.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-on-surface-variant block">Phone / WhatsApp</span>
                        <span className="text-on-surface font-semibold">{dossier.inquiry.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-on-surface-variant block">Target Budget</span>
                        <span className="text-primary font-mono font-semibold">{dossier.inquiry.budgetRange}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-on-surface-variant block">Language</span>
                        <span className="text-on-surface font-semibold uppercase">{dossier.inquiry.preferredLocale}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-outline-variant/15">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-on-surface-variant block">Accommodation Preference</span>
                        <span className="text-on-surface font-medium">{dossier.inquiry.accommodationPreference || "None specified"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-on-surface-variant block">Transport Preference</span>
                        <span className="text-on-surface font-medium">{dossier.inquiry.transportPreference || "Executive Fleet"}</span>
                      </div>
                    </div>

                    {dossier.inquiry.specialRequests && (
                      <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 text-xs text-on-surface font-mono">
                        <strong className="text-primary block mb-1">Guest Notes & Special Requests:</strong>
                        {dossier.inquiry.specialRequests}
                      </div>
                    )}
                  </div>

                  {/* CRM Assignment & Progression Controls */}
                  <div className="bg-surface-container-high/40 p-5 rounded-2xl border border-outline-variant/20 space-y-4">
                    <h3 className="font-headline text-sm font-semibold text-primary">CRM Assignment & Lifecycle Controls</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Assign Staff */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-on-surface-variant">Assign Staff Liaison:</label>
                        <select
                          value={selectedStaffId}
                          onChange={(e) => setSelectedStaffId(e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {staffList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.fullName} ({s.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Priority */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-on-surface-variant">Lead Priority:</label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value as CustomTripPriority)}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer capitalize"
                        >
                          {CUSTOM_TRIP_PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Follow-up Date */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-on-surface-variant">Follow-up Date:</label>
                        <input
                          type="date"
                          value={followUpDateInput}
                          onChange={(e) => setFollowUpDateInput(e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Status Progression */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-on-surface-variant">Lifecycle Status:</label>
                        <select
                          value={statusInput}
                          onChange={(e) => setStatusInput(e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer capitalize"
                        >
                          {(VALID_CUSTOM_TRIP_STATUS_TRANSITIONS[dossier.inquiry.status] || [dossier.inquiry.status]).map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>

                      {statusInput === "lost" && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-mono uppercase text-error">Reason for Lost/Declined:</label>
                          <input
                            type="text"
                            placeholder="e.g. Budget mismatch, customer cancelled trip..."
                            value={lostReasonInput}
                            onChange={(e) => setLostReasonInput(e.target.value)}
                            className="w-full bg-surface-container border border-error/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-error"
                          />
                        </div>
                      )}
                    </div>

                    {/* Internal Admin Memo */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase text-on-surface-variant">
                        Internal Operational Memo (Visible only to authorized staff):
                      </label>
                      <textarea
                        rows={3}
                        value={adminNotesInput}
                        onChange={(e) => setAdminNotesInput(e.target.value)}
                        placeholder="Private notes on guest preferences, chauffeur dispatch, VIP requests..."
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={savingCrm}
                        onClick={handleSaveCrm}
                        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {savingCrm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Save CRM Changes</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AUDIT TIMELINE & COMMUNICATIONS */}
              {activeDossierTab === "timeline" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timeline Log */}
                  <div className="space-y-4">
                    <h3 className="font-headline text-sm font-semibold text-primary flex items-center gap-2">
                      <History className="w-4 h-4" />
                      <span>Activity Audit Trail</span>
                    </h3>

                    {dossier.timeline.length === 0 ? (
                      <p className="text-xs text-on-surface-variant font-mono">No timeline events recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {dossier.timeline.map((evt) => (
                          <div
                            key={evt.id}
                            className="p-3.5 rounded-xl bg-surface-container-high/40 border border-outline-variant/20 space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-primary">{evt.titleEn}</span>
                              <span className="font-mono text-on-surface-variant text-[10px]">
                                {new Date(evt.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {evt.descriptionEn && (
                              <p className="text-xs text-on-surface-variant font-mono">{evt.descriptionEn}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Messages Log & New Message Box */}
                  <div className="space-y-4">
                    <h3 className="font-headline text-sm font-semibold text-primary flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Communications & Notes</span>
                    </h3>

                    {/* Messages history */}
                    <div className="space-y-2.5 max-h-72 overflow-y-auto p-1">
                      {dossier.messages.length === 0 ? (
                        <p className="text-xs text-on-surface-variant font-mono">No communication records logged.</p>
                      ) : (
                        dossier.messages.map((m) => (
                          <div
                            key={m.id}
                            className={`p-3 rounded-xl border text-xs space-y-1 ${
                              m.isInternal
                                ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                                : "bg-surface-container-high/60 border-outline-variant/20 text-on-surface"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="font-bold">
                                {m.senderName} ({m.channel.toUpperCase()})
                              </span>
                              <span className="opacity-70">{new Date(m.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="whitespace-pre-line">{m.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add new communication form */}
                    <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-outline-variant/20 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono uppercase text-on-surface-variant">Log Channel:</span>
                        <select
                          value={messageChannel}
                          onChange={(e) => setMessageChannel(e.target.value as typeof messageChannel)}
                          className="bg-surface-container border border-outline-variant/30 text-xs text-on-surface rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value="internal_note">Internal Staff Note (Private)</option>
                          <option value="whatsapp">Outbound WhatsApp</option>
                          <option value="email">Outbound Email</option>
                          <option value="portal">Portal Note</option>
                        </select>
                      </div>

                      <textarea
                        rows={2}
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        placeholder="Write note or outbound communication..."
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={sendingMessage || !newMessageText.trim()}
                          onClick={handleSendMessage}
                          className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          {sendingMessage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          <span>Record Entry</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VISUAL ITINERARY & QUOTATION BUILDER */}
              {activeDossierTab === "itinerary" && (
                <div className="space-y-6">
                  {/* Proposal Versions Header */}
                  {dossier.proposals.length > 0 && (
                    <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-mono text-on-surface-variant font-bold">Existing Proposals:</span>
                        {dossier.proposals.map((p) => (
                          <div
                            key={p.id}
                            className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold border flex items-center gap-1.5 ${
                              editingProposalId === p.id
                                ? "bg-primary/20 text-primary border-primary"
                                : "bg-surface-container text-on-surface-variant border-outline-variant/30"
                            }`}
                          >
                            <span>v{p.version} ({p.status})</span>
                            <span className="opacity-60">• {p.totalPrice.toLocaleString("en-US")} QAR</span>
                            <Link
                              href={`/${locale}/proposals/${p.guestToken}`}
                              target="_blank"
                              className="text-primary hover:text-primary-container inline-flex items-center ml-1"
                              title="Customer View"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingProposalId(null);
                          setProposalTitleEn(`${dossier.inquiry.guestName} — Bespoke Qatar Journey`);
                          setProposalTitleAr(`برنامج رحلة ${dossier.inquiry.guestName} في قطر`);
                        }}
                        className="text-xs text-primary hover:underline font-mono"
                      >
                        + Create New Revision
                      </button>
                    </div>
                  )}

                  {/* General Proposal Information */}
                  <div className="bg-surface-container-high/40 p-5 rounded-2xl border border-outline-variant/20 space-y-4">
                    <h3 className="font-headline text-sm font-semibold text-primary">Proposal Overview & Validity</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-on-surface-variant">Title (English):</label>
                        <input
                          type="text"
                          value={proposalTitleEn}
                          onChange={(e) => setProposalTitleEn(e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-on-surface-variant">Title (Arabic):</label>
                        <input
                          type="text"
                          value={proposalTitleAr}
                          onChange={(e) => setProposalTitleAr(e.target.value)}
                          dir="rtl"
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-mono uppercase text-on-surface-variant">Summary / Executive Brief:</label>
                        <input
                          type="text"
                          value={proposalSummaryEn}
                          onChange={(e) => setProposalSummaryEn(e.target.value)}
                          placeholder="Highlight key points of the bespoke program..."
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-on-surface-variant">Offer Valid Until:</label>
                        <input
                          type="date"
                          value={proposalValidUntil}
                          onChange={(e) => setProposalValidUntil(e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Day-by-Day Visual Itinerary Builder */}
                  <div className="bg-surface-container-high/40 p-5 rounded-2xl border border-outline-variant/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline text-sm font-semibold text-primary">
                        Itinerary Days & Activities ({itineraryDays.length} Days)
                      </h3>
                      <button
                        type="button"
                        onClick={addDay}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Day</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {itineraryDays.map((day, dayIdx) => (
                        <div
                          key={dayIdx}
                          className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
                            <span className="font-mono text-xs font-bold text-primary">
                              Day {day.dayNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDay(dayIdx)}
                              className="text-error hover:text-error/80 text-xs font-mono flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove Day</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <input
                              type="text"
                              value={day.titleEn}
                              onChange={(e) => {
                                const copy = [...itineraryDays];
                                copy[dayIdx].titleEn = e.target.value;
                                setItineraryDays(copy);
                              }}
                              placeholder="Day Title (English)"
                              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-xs text-on-surface focus:outline-none"
                            />
                            <input
                              type="text"
                              value={day.titleAr}
                              onChange={(e) => {
                                const copy = [...itineraryDays];
                                copy[dayIdx].titleAr = e.target.value;
                                setItineraryDays(copy);
                              }}
                              dir="rtl"
                              placeholder="عنوان اليوم (عربي)"
                              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-xs text-on-surface focus:outline-none"
                            />
                          </div>

                          {/* Activities for this day */}
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-mono text-on-surface-variant font-bold">
                                Activities ({day.activities.length}):
                              </span>
                              <button
                                type="button"
                                onClick={() => addActivity(dayIdx)}
                                className="text-[11px] text-primary hover:underline font-mono flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add Activity
                              </button>
                            </div>

                            {day.activities.map((act, actIdx) => (
                              <div
                                key={actIdx}
                                className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={act.titleEn}
                                    onChange={(e) => {
                                      const copy = [...itineraryDays];
                                      copy[dayIdx].activities[actIdx].titleEn = e.target.value;
                                      setItineraryDays(copy);
                                    }}
                                    placeholder="Activity Title (EN)"
                                    className="flex-1 bg-surface-container border border-outline-variant/25 rounded-md p-1.5 text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={act.titleAr}
                                    onChange={(e) => {
                                      const copy = [...itineraryDays];
                                      copy[dayIdx].activities[actIdx].titleAr = e.target.value;
                                      setItineraryDays(copy);
                                    }}
                                    dir="rtl"
                                    placeholder="عنوان النشاط (عربي)"
                                    className="flex-1 bg-surface-container border border-outline-variant/25 rounded-md p-1.5 text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeActivity(dayIdx, actIdx)}
                                    className="text-error hover:opacity-75 p-1"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                  <input
                                    type="text"
                                    value={act.startTime || ""}
                                    onChange={(e) => {
                                      const copy = [...itineraryDays];
                                      copy[dayIdx].activities[actIdx].startTime = e.target.value;
                                      setItineraryDays(copy);
                                    }}
                                    placeholder="Start (e.g. 09:00)"
                                    className="bg-surface-container border border-outline-variant/25 rounded-md p-1 text-[11px]"
                                  />
                                  <input
                                    type="text"
                                    value={act.endTime || ""}
                                    onChange={(e) => {
                                      const copy = [...itineraryDays];
                                      copy[dayIdx].activities[actIdx].endTime = e.target.value;
                                      setItineraryDays(copy);
                                    }}
                                    placeholder="End (e.g. 12:00)"
                                    className="bg-surface-container border border-outline-variant/25 rounded-md p-1 text-[11px]"
                                  />
                                  <input
                                    type="text"
                                    value={act.location}
                                    onChange={(e) => {
                                      const copy = [...itineraryDays];
                                      copy[dayIdx].activities[actIdx].location = e.target.value;
                                      setItineraryDays(copy);
                                    }}
                                    placeholder="Location"
                                    className="bg-surface-container border border-outline-variant/25 rounded-md p-1 text-[11px]"
                                  />
                                  <input
                                    type="text"
                                    value={act.transport || ""}
                                    onChange={(e) => {
                                      const copy = [...itineraryDays];
                                      copy[dayIdx].activities[actIdx].transport = e.target.value;
                                      setItineraryDays(copy);
                                    }}
                                    placeholder="Transport (4x4, Van)"
                                    className="bg-surface-container border border-outline-variant/25 rounded-md p-1 text-[11px]"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Quotation Engine in QAR */}
                  <div className="bg-surface-container-high/40 p-5 rounded-2xl border border-outline-variant/20 space-y-4">
                    <h3 className="font-headline text-sm font-semibold text-primary">
                      Custom Quotation Engine (Currency: QAR)
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-on-surface-variant">Pricing Model:</label>
                        <select
                          value={pricingModel}
                          onChange={(e) => setPricingModel(e.target.value as "per_person" | "fixed_group")}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2 text-xs cursor-pointer"
                        >
                          <option value="per_person">Per-Person Rate</option>
                          <option value="fixed_group">Fixed Private Group</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-on-surface-variant">
                          {pricingModel === "per_person" ? "Adult Rate (QAR):" : "Group Total (QAR):"}
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={adultRate}
                          onChange={(e) => setAdultRate(Number(e.target.value))}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2 text-xs"
                        />
                      </div>

                      {pricingModel === "per_person" && (
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-on-surface-variant">Child Rate (QAR):</label>
                          <input
                            type="number"
                            min={0}
                            value={childRate}
                            onChange={(e) => setChildRate(Number(e.target.value))}
                            className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2 text-xs"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-on-surface-variant">Accommodation (QAR):</label>
                        <input
                          type="number"
                          min={0}
                          value={accommodationCost}
                          onChange={(e) => setAccommodationCost(Number(e.target.value))}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-on-surface-variant">Private Fleet (QAR):</label>
                        <input
                          type="number"
                          min={0}
                          value={transportCost}
                          onChange={(e) => setTransportCost(Number(e.target.value))}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-on-surface-variant">Activities & Permits (QAR):</label>
                        <input
                          type="number"
                          min={0}
                          value={activityCost}
                          onChange={(e) => setActivityCost(Number(e.target.value))}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-on-surface-variant">Approved Discount (QAR):</label>
                        <input
                          type="number"
                          min={0}
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Number(e.target.value))}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2 text-xs text-error"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-on-surface-variant">Deposit Requirement:</label>
                        <div className="flex gap-1">
                          <select
                            value={depositType}
                            onChange={(e) => setDepositType(e.target.value as "percentage" | "fixed")}
                            className="bg-surface-container border border-outline-variant/30 rounded-lg p-2 text-xs cursor-pointer w-20"
                          >
                            <option value="percentage">%</option>
                            <option value="fixed">QAR</option>
                          </select>
                          <input
                            type="number"
                            min={0}
                            value={depositValue}
                            onChange={(e) => setDepositValue(Number(e.target.value))}
                            className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Real-time Calculation Summary Box */}
                    <div className="p-4 rounded-2xl bg-surface-container border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase text-on-surface-variant block">Calculated Total (QAR):</span>
                        <div className="font-headline text-2xl font-bold text-primary">
                          {liveCalculation.totalPrice.toLocaleString("en-US")} QAR
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-on-surface-variant block">Deposit Required:</span>
                          <span className="font-bold text-on-surface">
                            {liveCalculation.depositRequired.toLocaleString("en-US")} QAR
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-on-surface-variant block">Balance Due:</span>
                          <span className="font-bold text-on-surface">
                            {liveCalculation.balanceDue.toLocaleString("en-US")} QAR
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={savingProposal}
                      onClick={() => handleSaveProposal(false)}
                      className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Save Draft
                    </button>

                    <button
                      type="button"
                      disabled={savingProposal}
                      onClick={() => handleSaveProposal(true)}
                      className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {savingProposal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Publish & Send Proposal to Guest</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: BOOKING CONVERSION */}
              {activeDossierTab === "conversion" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-high/40 p-5 rounded-2xl border border-outline-variant/20 space-y-4">
                    <h3 className="font-headline text-sm font-semibold text-primary">Convert Accepted Proposal to Booking</h3>

                    {dossier.inquiry.convertedBookingId ? (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>This inquiry has already been converted into an active booking.</span>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          Booking Reference: <strong className="text-on-surface">{dossier.inquiry.convertedBookingRef}</strong>
                        </p>
                        {onNavigateToBookings && (
                          <button
                            type="button"
                            onClick={() => {
                              closeDossier();
                              onNavigateToBookings();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition-colors"
                          >
                            View in Bookings Management
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Authorized staff members can convert the agreed proposal quotation into a formal reservation in
                          <code className="text-primary font-mono ml-1">public.bookings</code>. The reservation will be initialized in
                          <span className="text-primary font-mono ml-1">awaiting_deposit</span> status with exact price snapshots preserved.
                        </p>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-mono uppercase text-on-surface-variant">Select Proposal to Convert:</label>
                            <select
                              value={editingProposalId || ""}
                              onChange={(e) => setEditingProposalId(e.target.value)}
                              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface cursor-pointer"
                            >
                              {dossier.proposals
                                .filter((p) => p.status !== "superseded")
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.proposalRef} (v{p.version}) — {p.totalPrice.toLocaleString("en-US")} QAR [{p.status.toUpperCase()}]
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-mono uppercase text-on-surface-variant">Pickup Location / Hotel Address:</label>
                            <input
                              type="text"
                              value={conversionPickup}
                              onChange={(e) => setConversionPickup(e.target.value)}
                              placeholder="e.g. The St. Regis Doha / Waldorf Astoria Lusail"
                              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-mono uppercase text-on-surface-variant">Operational Reservation Notes:</label>
                            <textarea
                              rows={2}
                              value={conversionNotes}
                              onChange={(e) => setConversionNotes(e.target.value)}
                              placeholder="Special requests to carry forward to dispatch team..."
                              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-2.5 text-xs text-on-surface"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            disabled={isConverting || !editingProposalId}
                            onClick={() => handleConvertProposal(editingProposalId!)}
                            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isConverting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Briefcase className="w-3.5 h-3.5" />}
                            <span>Confirm & Convert to Reservation</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
