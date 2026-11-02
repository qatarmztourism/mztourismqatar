"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Locale } from "@/translations";
import {
  getAdminToursAction,
  upsertAdminTourAction,
  duplicateAdminTourAction,
  toggleTourStatusAction,
  archiveAdminTourAction,
  deleteAdminTourAction,
  getTourDeparturesAction,
  upsertTourDepartureAction,
  deleteTourDepartureAction,
  uploadTourMediaAction,
} from "@/lib/server/tour-actions";
import {
  type TourRecord,
  type TourDepartureSlot,
  TOUR_CATEGORIES,
} from "@/lib/data/curated-tours";
import { formatQAR } from "./admin-utils";
import {
  Compass,
  Search,
  Plus,
  Copy,
  ExternalLink,
  Calendar,
  Archive,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  X,
  RefreshCw,
} from "lucide-react";

interface AdminToursViewProps {
  locale: Locale;
}

export default function AdminToursView({ locale }: AdminToursViewProps) {
  const isAr = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<TourRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingTour, setEditingTour] = useState<TourRecord | null>(null);
  const [savingTour, setSavingTour] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"basic" | "pricing" | "content" | "media" | "seo">("basic");

  // Departures modal
  const [departuresTour, setDeparturesTour] = useState<TourRecord | null>(null);
  const [departuresList, setDeparturesList] = useState<TourDepartureSlot[]>([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);
  const [newDepDate, setNewDepDate] = useState("");
  const [newDepTime, setNewDepTime] = useState("08:30");
  const [newDepCapacity, setNewDepCapacity] = useState(6);
  const [addingDeparture, setAddingDeparture] = useState(false);

  // Media upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form fields
  const [formId, setFormId] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formTitleAr, setFormTitleAr] = useState("");
  const [formShortDescEn, setFormShortDescEn] = useState("");
  const [formShortDescAr, setFormShortDescAr] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formDescAr, setFormDescAr] = useState("");
  const [formCategory, setFormCategory] = useState<TourRecord["category"]>("safari");
  const [formDestinations, setFormDestinations] = useState<string[]>(["Doha City"]);
  const [formTourType, setFormTourType] = useState<"private" | "group">("private");
  const [formDifficulty, setFormDifficulty] = useState<"easy" | "moderate" | "challenging">("easy");
  const [formDuration, setFormDuration] = useState("6 - 8 Hours");
  const [formMaxAltitude, setFormMaxAltitude] = useState("Sea Level / Dunes");
  const [formMinPax, setFormMinPax] = useState(1);
  const [formMaxPax, setFormMaxPax] = useState(6);
  const [formPricingType, setFormPricingType] = useState<"per_person" | "per_private_tour">("per_private_tour");
  const [formTotalPrice, setFormTotalPrice] = useState(2400);
  const [formDepositType, setFormDepositType] = useState<"percentage" | "fixed">("percentage");
  const [formDepositValue, setFormDepositValue] = useState(30);
  const [formPickupEn, setFormPickupEn] = useState("");
  const [formPickupAr, setFormPickupAr] = useState("");
  const [formInclusionsEn, setFormInclusionsEn] = useState<string[]>([]);
  const [formInclusionsAr, setFormInclusionsAr] = useState<string[]>([]);
  const [formExclusionsEn, setFormExclusionsEn] = useState<string[]>([]);
  const [formExclusionsAr, setFormExclusionsAr] = useState<string[]>([]);
  const [formGearEn, setFormGearEn] = useState<string[]>([]);
  const [formGearAr, setFormGearAr] = useState<string[]>([]);
  const [formImportantInfoEn, setFormImportantInfoEn] = useState("");
  const [formImportantInfoAr, setFormImportantInfoAr] = useState("");
  const [formCancellationEn, setFormCancellationEn] = useState("");
  const [formCancellationAr, setFormCancellationAr] = useState("");
  const [formSeoTitleEn, setFormSeoTitleEn] = useState("");
  const [formSeoTitleAr, setFormSeoTitleAr] = useState("");
  const [formSeoDescEn, setFormSeoDescEn] = useState("");
  const [formSeoDescAr, setFormSeoDescAr] = useState("");
  const [formFeaturedImage, setFormFeaturedImage] = useState("");
  const [formGalleryImages, setFormGalleryImages] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<"draft" | "published" | "archived">("published");

  // Load tours
  const loadTours = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminToursAction(categoryFilter, statusFilter, searchQuery);
      if (res.success && res.data) {
        setTours(res.data);
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to load tour catalog." });
      }
    } catch (err) {
      console.error("[Load Tours Error]", err);
      setFeedbackMsg({ type: "error", text: "An unexpected error occurred loading tours." });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setIsCreatingNew(true);
    setEditingTour(null);
    setFormId("");
    setFormTitleEn("");
    setFormTitleAr("");
    setFormShortDescEn("");
    setFormShortDescAr("");
    setFormDescEn("");
    setFormDescAr("");
    setFormCategory("safari");
    setFormDestinations(["Doha City", "Khor Al Adaid (Inland Sea)"]);
    setFormTourType("private");
    setFormDifficulty("easy");
    setFormDuration("6 - 8 Hours");
    setFormMaxAltitude("Sea Level / Dunes");
    setFormMinPax(1);
    setFormMaxPax(6);
    setFormPricingType("per_private_tour");
    setFormTotalPrice(2400);
    setFormDepositType("percentage");
    setFormDepositValue(30);
    setFormPickupEn("Complimentary VIP pickup and return across Doha.");
    setFormPickupAr("خدمة التوصيل والاستقبال المجانية بكبار الشخصيات من أي مكان في الدوحة.");
    setFormInclusionsEn(["Private luxury vehicle", "Licensed tour guide", "Refreshments & Karak"]);
    setFormInclusionsAr(["مركبة خاصة فاخرة", "مرشد سياحي معتمد", "ضيافة وشاي كرك"]);
    setFormExclusionsEn(["Personal shopping expenses"]);
    setFormExclusionsAr(["المصاريف الشخصية"]);
    setFormGearEn(["Comfortable casual attire", "Sun protection"]);
    setFormGearAr(["ملابس مريحة", "واقي شمس"]);
    setFormImportantInfoEn("");
    setFormImportantInfoAr("");
    setFormCancellationEn("Free cancellation up to 48 hours prior to departure.");
    setFormCancellationAr("إلغاء مجاني حتى 48 ساعة قبل موعد الرحلة.");
    setFormSeoTitleEn("");
    setFormSeoTitleAr("");
    setFormSeoDescEn("");
    setFormSeoDescAr("");
    setFormFeaturedImage("https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80");
    setFormGalleryImages([]);
    setFormStatus("published");
    setActiveFormTab("basic");
    setIsEditingModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (tour: TourRecord) => {
    setIsCreatingNew(false);
    setEditingTour(tour);
    setFormId(tour.id);
    setFormTitleEn(tour.titleEn);
    setFormTitleAr(tour.titleAr);
    setFormShortDescEn(tour.shortDescriptionEn || "");
    setFormShortDescAr(tour.shortDescriptionAr || "");
    setFormDescEn(tour.descriptionEn);
    setFormDescAr(tour.descriptionAr);
    setFormCategory(tour.category);
    setFormDestinations(tour.destinations || ["Doha City"]);
    setFormTourType(tour.tourType || "private");
    setFormDifficulty(tour.difficultyLevel || "easy");
    setFormDuration(tour.duration);
    setFormMaxAltitude(tour.maxAltitude || "Sea Level");
    setFormMinPax(tour.minParticipants || 1);
    setFormMaxPax(tour.maxParticipants || 6);
    setFormPricingType(tour.pricingType || "per_private_tour");
    setFormTotalPrice(tour.totalPrice || 2000);
    setFormDepositType(tour.depositType || "percentage");
    setFormDepositValue(tour.depositValue || 30);
    setFormPickupEn(tour.pickupInfoEn || "");
    setFormPickupAr(tour.pickupInfoAr || "");
    setFormInclusionsEn(tour.inclusionsEn || []);
    setFormInclusionsAr(tour.inclusionsAr || []);
    setFormExclusionsEn(tour.exclusionsEn || []);
    setFormExclusionsAr(tour.exclusionsAr || []);
    setFormGearEn(tour.requiredGearEn || []);
    setFormGearAr(tour.requiredGearAr || []);
    setFormImportantInfoEn(tour.importantInfoEn || "");
    setFormImportantInfoAr(tour.importantInfoAr || "");
    setFormCancellationEn(tour.cancellationPolicyEn || "");
    setFormCancellationAr(tour.cancellationPolicyAr || "");
    setFormSeoTitleEn(tour.seoTitleEn || "");
    setFormSeoTitleAr(tour.seoTitleAr || "");
    setFormSeoDescEn(tour.seoDescriptionEn || "");
    setFormSeoDescAr(tour.seoDescriptionAr || "");
    setFormFeaturedImage(tour.featuredImage || "");
    setFormGalleryImages(tour.galleryImages || []);
    setFormStatus(tour.status || "published");
    setActiveFormTab("basic");
    setIsEditingModalOpen(true);
  };

  // Save tour
  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTour(true);
    setFeedbackMsg(null);
    try {
      const payload: Partial<TourRecord> & { id: string } = {
        id: formId.trim().toLowerCase(),
        slug: formId.trim().toLowerCase(),
        titleEn: formTitleEn.trim(),
        titleAr: formTitleAr.trim(),
        shortDescriptionEn: formShortDescEn.trim(),
        shortDescriptionAr: formShortDescAr.trim(),
        descriptionEn: formDescEn.trim(),
        descriptionAr: formDescAr.trim(),
        category: formCategory,
        destinations: formDestinations,
        tourType: formTourType,
        difficultyLevel: formDifficulty,
        duration: formDuration.trim(),
        maxAltitude: formMaxAltitude.trim(),
        minParticipants: Number(formMinPax),
        maxParticipants: Number(formMaxPax),
        pricingType: formPricingType,
        totalPrice: Number(formTotalPrice),
        depositType: formDepositType,
        depositValue: Number(formDepositValue),
        currency: "QAR",
        pickupInfoEn: formPickupEn.trim(),
        pickupInfoAr: formPickupAr.trim(),
        itinerary: editingTour?.itinerary || [],
        inclusionsEn: formInclusionsEn,
        inclusionsAr: formInclusionsAr,
        exclusionsEn: formExclusionsEn,
        exclusionsAr: formExclusionsAr,
        requiredGearEn: formGearEn,
        requiredGearAr: formGearAr,
        faqs: editingTour?.faqs || [],
        importantInfoEn: formImportantInfoEn.trim(),
        importantInfoAr: formImportantInfoAr.trim(),
        cancellationPolicyEn: formCancellationEn.trim(),
        cancellationPolicyAr: formCancellationAr.trim(),
        seoTitleEn: formSeoTitleEn.trim() || `${formTitleEn.trim()} | MZ Tourism Qatar`,
        seoTitleAr: formSeoTitleAr.trim() || `${formTitleAr.trim()} | إم زد للسياحة قطر`,
        seoDescriptionEn: formSeoDescEn.trim() || formShortDescEn.trim(),
        seoDescriptionAr: formSeoDescAr.trim() || formShortDescAr.trim(),
        featuredImage: formFeaturedImage.trim(),
        galleryImages: formGalleryImages,
        status: formStatus,
      };

      const res = await upsertAdminTourAction(payload);
      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: isAr ? "تم حفظ بيانات الجولة بنجاح." : "Tour package saved successfully.",
        });
        setIsEditingModalOpen(false);
        await loadTours();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to save tour package." });
      }
    } catch (err) {
      console.error("[Save Tour Error]", err);
      setFeedbackMsg({ type: "error", text: "An error occurred while saving the tour." });
    } finally {
      setSavingTour(false);
    }
  };

  // Safe duplication
  const handleDuplicate = async (tourId: string) => {
    try {
      setFeedbackMsg(null);
      const res = await duplicateAdminTourAction(tourId);
      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: isAr
            ? `تم إنشاء نسخة جديدة بنجاح (${res.data?.newTourId}).`
            : `Tour duplicated successfully as draft (${res.data?.newTourId}).`,
        });
        await loadTours();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to duplicate tour." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Error duplicating tour." });
    }
  };

  // Status toggle
  const handleToggleStatus = async (tourId: string, currentStatus: "draft" | "published" | "archived") => {
    try {
      const nextStatus = currentStatus === "published" ? "draft" : "published";
      const res = await toggleTourStatusAction(tourId, nextStatus);
      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: isAr ? `تم تحديث حالة الجولة إلى (${nextStatus}).` : `Tour status changed to ${nextStatus}.`,
        });
        await loadTours();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to toggle status." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Error toggling status." });
    }
  };

  // Archive
  const handleArchive = async (tourId: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من أرشفة هذه الجولة؟ ستختفي من الموقع العام مع الحفاظ على سجلات الحجوزات السابقة." : "Archive this tour? It will be hidden from the public website while preserving past booking dossiers.")) return;
    try {
      const res = await archiveAdminTourAction(tourId);
      if (res.success) {
        setFeedbackMsg({ type: "success", text: isAr ? "تمت أرشفة الجولة بنجاح." : "Tour archived successfully." });
        await loadTours();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to archive tour." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Error archiving tour." });
    }
  };

  // Delete
  const handleDelete = async (tourId: string) => {
    if (!confirm(isAr ? "هل تريد حذف هذه الجولة نهائياً؟ (لا يمكن الحذف إذا كانت هناك حجوزات سابقة)" : "Permanently delete this tour? (Blocked if active bookings exist)")) return;
    try {
      const res = await deleteAdminTourAction(tourId);
      if (res.success) {
        setFeedbackMsg({ type: "success", text: isAr ? "تم حذف الجولة بنجاح." : "Tour permanently deleted." });
        await loadTours();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Cannot delete tour." });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Error deleting tour." });
    }
  };

  // Departures modal handler
  const handleOpenDepartures = async (tour: TourRecord) => {
    setDeparturesTour(tour);
    setLoadingDepartures(true);
    try {
      const res = await getTourDeparturesAction(tour.id);
      if (res.success && res.data) {
        setDeparturesList(res.data);
      }
    } catch (err) {
      console.error("[Departures Load Error]", err);
    } finally {
      setLoadingDepartures(false);
    }
  };

  const handleAddDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departuresTour || !newDepDate) return;
    setAddingDeparture(true);
    try {
      const res = await upsertTourDepartureAction({
        tourId: departuresTour.id,
        departureDate: newDepDate,
        startTime: newDepTime,
        capacity: Number(newDepCapacity),
        status: "open",
      });

      if (res.success && res.data) {
        setDeparturesList((prev) => [res.data!, ...prev]);
        setNewDepDate("");
        setFeedbackMsg({ type: "success", text: isAr ? "تمت إضافة موعد الانطلاق." : "Departure slot added." });
      } else {
        alert(res.error || "Failed to add departure.");
      }
    } catch {
      alert("Error adding departure slot.");
    } finally {
      setAddingDeparture(false);
    }
  };

  const handleDeleteDeparture = async (depId: string) => {
    if (!departuresTour) return;
    try {
      const res = await deleteTourDepartureAction(departuresTour.id, depId);
      if (res.success) {
        setDeparturesList((prev) => prev.filter((d) => d.id !== depId));
      }
    } catch {
      alert("Error removing departure slot.");
    }
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadTourMediaAction(formData);
      if (res.success && res.url) {
        setFormFeaturedImage(res.url);
        setFeedbackMsg({ type: "success", text: isAr ? "تم رفع الصورة بنجاح إلى مستودع الوسائط." : "Image uploaded to tour media repository." });
      } else {
        alert(res.error || "Upload failed.");
      }
    } catch {
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Compute live deposit preview
  const previewDeposit =
    formDepositType === "percentage"
      ? Math.round((Number(formTotalPrice) * Number(formDepositValue)) / 100)
      : Math.min(Number(formTotalPrice), Number(formDepositValue));
  const previewBalance = Math.max(0, Number(formTotalPrice) - previewDeposit);

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F1115] border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#C29B38] text-[10px] font-semibold tracking-wider uppercase">
            <Compass className="w-3 h-3" />
            <span>{isAr ? "نظام إدارة الجولات والتجارب الفاخرة" : "Luxury Tour Management System"}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3ECE1]">
            {isAr ? "إدارة الجولات والمسارات السياحية" : "Expedition & Tour Catalog Management"}
          </h1>
          <p className="text-xs text-stone-400">
            {isAr
              ? "التحكم الكامل في البرامج السياحية بقطر، تسعير الريال القطري (QAR)، الطاقة الاستيعابية، وإدارة المقاعد."
              : "Full lifecycle management of Qatar luxury packages, QAR pricing, departures, and vehicle buyout capacity."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTours}
            disabled={loading}
            className="p-2.5 rounded-xl bg-stone-900 border border-stone-700 hover:border-[#C29B38]/50 text-stone-200 text-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-[#C29B38] ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-[#C29B38] hover:bg-[#A8842E] text-stone-950 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-[#C29B38]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "إضافة جولة جديدة" : "Create New Tour"}</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
              : "bg-[#72132B]/30 border border-[#72132B]/60 text-rose-300"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 2. Controls & Search Filter Bar */}
      <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row gap-3.5 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={isAr ? "بحث بالاسم، الرابط، الوجهة..." : "Search tour title, slug, destination..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#C29B38]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 text-xs cursor-pointer focus:outline-none focus:border-[#C29B38]"
          >
            <option value="all">{isAr ? "كافة التصنيفات" : "All Categories"}</option>
            {TOUR_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {isAr ? cat.labelAr : cat.labelEn}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
            {[
              { id: "all", label: isAr ? "الكل" : "All" },
              { id: "published", label: isAr ? "المنشورة" : "Published" },
              { id: "draft", label: isAr ? "المسودات" : "Drafts" },
              { id: "archived", label: isAr ? "المؤرشفة" : "Archived" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === tab.id
                    ? "bg-[#C29B38] text-stone-950 font-semibold"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Tours Management Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 space-y-3">
          <Loader2 className="w-8 h-8 text-[#C29B38] animate-spin" />
          <span className="text-xs uppercase font-mono tracking-widest text-[#C29B38]">
            {isAr ? "جارٍ تحميل باقات الجولات والتجارب..." : "Auditing Tour Manifests..."}
          </span>
        </div>
      ) : tours.length > 0 ? (
        <div className="bg-[#0F1115] border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-stone-900/80 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">{isAr ? "الجولة السياحية" : "Tour Package"}</th>
                  <th className="px-4 py-3">{isAr ? "التصنيف والنوع" : "Category & Type"}</th>
                  <th className="px-4 py-3">{isAr ? "السعر والعربون" : "Price & Deposit (QAR)"}</th>
                  <th className="px-4 py-3">{isAr ? "المدة والركاب" : "Duration & Pax"}</th>
                  <th className="px-4 py-3">{isAr ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isAr ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {tours.map((tour) => {
                  return (
                    <tr key={tour.id} className="hover:bg-stone-900/40 transition-colors">
                      {/* Tour Package */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={tour.featuredImage || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=300&q=80"}
                            alt={tour.titleEn}
                            className="w-12 h-12 rounded-lg object-cover border border-stone-800 shrink-0"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <span className="font-semibold text-stone-100 block truncate">
                              {isAr ? tour.titleAr : tour.titleEn}
                            </span>
                            <span className="font-mono text-[11px] text-[#C29B38] block truncate">
                              /{tour.slug || tour.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300 font-mono text-[10px] capitalize block mb-1">
                          {tour.category}
                        </span>
                        <span className="text-[10px] text-stone-400 capitalize block">
                          {tour.tourType === "private" ? (isAr ? "خاص بالكامل" : "100% Private Charter") : (isAr ? "مجموعة" : "Group Expedition")}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-serif font-bold text-emerald-400 block text-sm">
                          {formatQAR(tour.totalPrice, locale)}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono block">
                          {isAr ? "العربون: " : "Deposit: "}
                          {tour.depositType === "percentage" ? `${tour.depositValue}%` : `${tour.depositValue} QAR`}
                          {" "}({tour.pricingType === "per_person" ? (isAr ? "لكل شخص" : "Per Person") : (isAr ? "للسيارة" : "Vehicle Buyout")})
                        </span>
                      </td>

                      {/* Duration & Capacity */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-stone-200 block">{tour.duration}</span>
                        <span className="text-[10px] text-stone-500 font-mono block">
                          {tour.minParticipants} - {tour.maxParticipants} {isAr ? "ركاب" : "Guests"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(tour.id, tour.status)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold border transition-all cursor-pointer ${
                            tour.status === "published"
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50"
                              : tour.status === "draft"
                              ? "bg-amber-950/60 text-amber-400 border-amber-500/30 hover:bg-amber-900/50"
                              : "bg-rose-950/60 text-rose-400 border-rose-500/30 hover:bg-rose-900/50"
                          }`}
                        >
                          {tour.status === "published" ? (isAr ? "منشور" : "Published") : tour.status === "draft" ? (isAr ? "مسودة" : "Draft") : (isAr ? "مؤرشف" : "Archived")}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right rtl:text-left whitespace-nowrap">
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          {/* Preview Public Page */}
                          <Link
                            href={`/${locale}/services/${tour.slug || tour.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 transition-colors"
                            title={isAr ? "معاينة الجولة" : "Preview Public Page"}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Departures Manager */}
                          <button
                            type="button"
                            onClick={() => handleOpenDepartures(tour)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-[#C29B38] hover:text-amber-300 transition-colors"
                            title={isAr ? "إدارة مواعيد الانطلاق والمقاعد" : "Manage Departure Slots"}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          {/* Safe Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(tour.id)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
                            title={isAr ? "استنساخ آمن" : "Duplicate Tour Safely"}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tour)}
                            className="px-2.5 py-1 rounded-lg bg-[#C29B38]/15 hover:bg-[#C29B38]/25 text-[#C29B38] font-medium text-[11px] transition-colors"
                          >
                            {isAr ? "تعديل" : "Edit"}
                          </button>

                          {/* Archive */}
                          <button
                            type="button"
                            onClick={() => handleArchive(tour.id)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 transition-colors"
                            title={isAr ? "أرشفة" : "Archive"}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(tour.id)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 transition-colors"
                            title={isAr ? "حذف نهائي" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
        <div className="p-16 rounded-2xl bg-[#0F1115] border border-stone-800 text-center space-y-3">
          <Compass className="w-8 h-8 text-stone-600 mx-auto" />
          <h3 className="font-serif text-base font-semibold text-stone-300">
            {isAr ? "لا توجد جولات تطابق الفلتر الحالي" : "No tours found matching criteria"}
          </h3>
          <p className="text-xs text-stone-500">
            {isAr ? "جرّب تغيير التصنيف أو حالة النشر أو مصطلح البحث." : "Try adjusting category, status filters, or search terms."}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CREATE / EDIT TOUR FULL MULTI-TAB MODAL                                */}
      {/* ========================================================================= */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#0F1115] border border-[#C29B38]/40 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-950">
              <div className="space-y-0.5">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F3ECE1]">
                  {isCreatingNew
                    ? isAr
                      ? "إنشاء باقة سياحية جديدة"
                      : "Create Luxury Tour Package"
                    : isAr
                    ? `تعديل الباقة: ${formTitleAr || formId}`
                    : `Edit Tour: ${formTitleEn || formId}`}
                </h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  Standard settlement: QAR (ر.ق) • Asia/Qatar timezone
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-stone-800 bg-stone-900/60 overflow-x-auto text-xs shrink-0">
              {[
                { id: "basic", label: isAr ? "المعلومات الأساسية" : "Basic Info" },
                { id: "pricing", label: isAr ? "التسعير والعربون (QAR)" : "Pricing & Deposit" },
                { id: "content", label: isAr ? "المسار والشموليات" : "Itinerary & Inclusions" },
                { id: "media", label: isAr ? "الوسائط والصور" : "Media & Images" },
                { id: "seo", label: isAr ? "تحسين محركات البحث" : "SEO & Metadata" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id as typeof activeFormTab)}
                  className={`px-4 py-2.5 font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeFormTab === tab.id
                      ? "border-[#C29B38] text-[#C29B38] bg-[#C29B38]/10 font-semibold"
                      : "border-transparent text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveTour} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* TAB 1: BASIC INFO */}
              {activeFormTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "معرّف الرابط (Slug) *" : "URL Slug / Identifier *"}
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!isCreatingNew}
                        value={formId}
                        onChange={(e) => setFormId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="e.g. desert-safari-sunset"
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-xs focus:outline-none focus:border-[#C29B38] disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "التصنيف *" : "Category *"}
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as TourRecord["category"])}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] cursor-pointer"
                      >
                        {TOUR_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {isAr ? cat.labelAr : cat.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "العنوان بالإنجليزية *" : "Tour Title (English) *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={formTitleEn}
                        onChange={(e) => setFormTitleEn(e.target.value)}
                        placeholder="e.g. Khor Al Adaid Inland Sea Private Safari"
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>

                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "العنوان بالعربية *" : "Tour Title (Arabic) *"}
                      </label>
                      <input
                        type="text"
                        required
                        dir="rtl"
                        value={formTitleAr}
                        onChange={(e) => setFormTitleAr(e.target.value)}
                        placeholder="مثال: رحلة سفاري صحراوية خاصة إلى خور العديد"
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] font-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "الوصف القصير (بالإنجليزية)" : "Short Description (English)"}
                      </label>
                      <textarea
                        rows={2}
                        value={formShortDescEn}
                        onChange={(e) => setFormShortDescEn(e.target.value)}
                        placeholder="Brief summary for catalog cards..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>

                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "الوصف القصير (بالعربية)" : "Short Description (Arabic)"}
                      </label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={formShortDescAr}
                        onChange={(e) => setFormShortDescAr(e.target.value)}
                        placeholder="ملخص قصير للبطاقات وقوائم العرض..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] font-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "الوصف الكامل والتفصيلي (بالإنجليزية) *" : "Full Description (English) *"}
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formDescEn}
                        onChange={(e) => setFormDescEn(e.target.value)}
                        placeholder="Comprehensive experience narrative..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>

                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "الوصف الكامل والتفصيلي (بالعربية) *" : "Full Description (Arabic) *"}
                      </label>
                      <textarea
                        rows={4}
                        required
                        dir="rtl"
                        value={formDescAr}
                        onChange={(e) => setFormDescAr(e.target.value)}
                        placeholder="السرد الكامل والتفصيلي للبرنامج السياحي..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] font-arabic"
                      />
                    </div>
                  </div>

                  {/* Operational parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "نوع الرحلة" : "Tour Type"}
                      </label>
                      <select
                        value={formTourType}
                        onChange={(e) => setFormTourType(e.target.value as "private" | "group")}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      >
                        <option value="private">{isAr ? "خاصة (Buyout)" : "Private Charter"}</option>
                        <option value="group">{isAr ? "مجموعة (Seats)" : "Group Departure"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "المدة" : "Duration"}
                      </label>
                      <input
                        type="text"
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                        placeholder="e.g. 6 - 8 Hours"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>

                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "أقل عدد ركاب" : "Min Pax"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formMinPax}
                        onChange={(e) => setFormMinPax(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>

                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "أقصى سعة للمركبة" : "Max Pax (Capacity)"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formMaxPax}
                        onChange={(e) => setFormMaxPax(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & DEPOSIT */}
              {activeFormTab === "pricing" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-[#C29B38]/30 space-y-2">
                    <span className="font-semibold text-[#C29B38] block text-xs">
                      {isAr ? "معايير التسعير المالي لدولة قطر (QAR):" : "Official Qatar Monetary Standard (QAR):"}
                    </span>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      {isAr
                        ? "جميع المعاملات تتم حصرياً بالريال القطري. يتم حساب العربون والرصيد المتبقي بدقة متناهية لمنع أي أخطاء حسابية أو احتساب مزدوج."
                        : "All bookings settle strictly in Qatari Riyal. The deposit and remaining balance reconcile transparently before client departure."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "نموذج التسعير *" : "Pricing Model *"}
                      </label>
                      <select
                        value={formPricingType}
                        onChange={(e) => setFormPricingType(e.target.value as "per_person" | "per_private_tour")}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] cursor-pointer"
                      >
                        <option value="per_private_tour">{isAr ? "سعر شامل للمركبة الخاصة بالكامل" : "Per Private Vehicle Buyout"}</option>
                        <option value="per_person">{isAr ? "سعر لكل فرد / مقعد" : "Per Person / Seat"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "السعر الإجمالي (ر.ق QAR) *" : "Total Price (QAR) *"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formTotalPrice}
                        onChange={(e) => setFormTotalPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-sm focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>

                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "طريقة حساب العربون" : "Deposit Calculation"}
                      </label>
                      <select
                        value={formDepositType}
                        onChange={(e) => setFormDepositType(e.target.value as "percentage" | "fixed")}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] cursor-pointer"
                      >
                        <option value="percentage">{isAr ? "نسبة مئوية (%)" : "Percentage (%)"}</option>
                        <option value="fixed">{isAr ? "مبلغ ثابت (ر.ق QAR)" : "Fixed Amount (QAR)"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {formDepositType === "percentage" ? (isAr ? "نسبة العربون (%)" : "Deposit Percentage (%)") : (isAr ? "مبلغ العربون (ر.ق QAR)" : "Deposit Amount (QAR)")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={formDepositType === "percentage" ? 100 : formTotalPrice}
                        value={formDepositValue}
                        onChange={(e) => setFormDepositValue(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 font-mono text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>

                    {/* Live Preview Card */}
                    <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase block">{isAr ? "عربون الحجز المطلوب:" : "Deposit Required:"}</span>
                        <span className="font-bold text-[#C29B38] text-sm">{formatQAR(previewDeposit, locale)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-500 uppercase block">{isAr ? "الرصيد المتبقي للدفع:" : "Balance Due at Pickup:"}</span>
                        <span className="font-bold text-amber-300 text-sm">{formatQAR(previewBalance, locale)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTENT & INCLUSIONS */}
              {activeFormTab === "content" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "تعليمات ونقاط الاستقبال (بالإنجليزية)" : "Pickup Information (English)"}
                      </label>
                      <input
                        type="text"
                        value={formPickupEn}
                        onChange={(e) => setFormPickupEn(e.target.value)}
                        placeholder="Complimentary hotel transfer across Doha..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "تعليمات ونقاط الاستقبال (بالعربية)" : "Pickup Information (Arabic)"}
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={formPickupAr}
                        onChange={(e) => setFormPickupAr(e.target.value)}
                        placeholder="توصيل واستقبال مجاني من الفنادق في الدوحة..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] font-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "ما تشمله الجولة (سطر لكل عنصر - بالإنجليزية)" : "Inclusions (One per line - English)"}
                      </label>
                      <textarea
                        rows={3}
                        value={formInclusionsEn.join("\n")}
                        onChange={(e) => setFormInclusionsEn(e.target.value.split("\n").filter(Boolean))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "ما تشمله الجولة (سطر لكل عنصر - بالعربية)" : "Inclusions (One per line - Arabic)"}
                      </label>
                      <textarea
                        rows={3}
                        dir="rtl"
                        value={formInclusionsAr.join("\n")}
                        onChange={(e) => setFormInclusionsAr(e.target.value.split("\n").filter(Boolean))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] font-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "ما لا تشمله الجولة (بالإنجليزية)" : "Exclusions (One per line - English)"}
                      </label>
                      <textarea
                        rows={2}
                        value={formExclusionsEn.join("\n")}
                        onChange={(e) => setFormExclusionsEn(e.target.value.split("\n").filter(Boolean))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "ما لا تشمله الجولة (بالعربية)" : "Exclusions (One per line - Arabic)"}
                      </label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={formExclusionsAr.join("\n")}
                        onChange={(e) => setFormExclusionsAr(e.target.value.split("\n").filter(Boolean))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] font-arabic"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MEDIA & IMAGES */}
              {activeFormTab === "media" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-3">
                    <span className="font-semibold text-stone-200 block text-xs">
                      {isAr ? "مستودع وسائط الجولات السياحية (Tour Media Repository):" : "Dedicated Public Tour Media Bucket:"}
                    </span>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      {isAr
                        ? "يتم رفع الصور مباشرة إلى مجلد التخزين العام tour-media. يتم عزل هذه الصور بالكامل عن إيصالات الدفع الخاصة بالعملاء."
                        : "Images are securely uploaded to the public 'tour-media' bucket, strictly segregated from private customer payment slips."}
                    </p>

                    <div className="flex items-center gap-3">
                      <label className="px-3.5 py-2 rounded-xl bg-[#C29B38]/20 hover:bg-[#C29B38]/30 border border-[#C29B38]/40 text-[#C29B38] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>{uploadingImage ? (isAr ? "جارٍ الرفع..." : "Uploading...") : (isAr ? "رفع صورة جديدة" : "Upload Image to Bucket")}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          disabled={uploadingImage}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-300 font-semibold block mb-1">
                      {isAr ? "رابط الصورة البارزة (Featured Image URL) *" : "Featured Image URL *"}
                    </label>
                    <input
                      type="url"
                      required
                      value={formFeaturedImage}
                      onChange={(e) => setFormFeaturedImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                    />
                    {formFeaturedImage && (
                      <div className="mt-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formFeaturedImage}
                          alt="Preview"
                          className="h-32 rounded-xl object-cover border border-stone-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: SEO & PUBLISHING */}
              {activeFormTab === "seo" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-stone-300 font-semibold block mb-1">
                      {isAr ? "حالة النشر *" : "Publication Status *"}
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as "draft" | "published" | "archived")}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] cursor-pointer"
                    >
                      <option value="published">{isAr ? "منشورة ومتاحة للحجز العام (Published)" : "Published (Visible on Website)"}</option>
                      <option value="draft">{isAr ? "مسودة غير معلنة (Draft)" : "Draft (Admin Preview Only)"}</option>
                      <option value="archived">{isAr ? "مؤرشفة ومحجوبة (Archived)" : "Archived (Preserves Past Bookings)"}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "عنوان محركات البحث (English)" : "SEO Title (English)"}
                      </label>
                      <input
                        type="text"
                        value={formSeoTitleEn}
                        onChange={(e) => setFormSeoTitleEn(e.target.value)}
                        placeholder="Title for Google results..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38]"
                      />
                    </div>
                    <div>
                      <label className="text-stone-300 font-semibold block mb-1">
                        {isAr ? "عنوان محركات البحث (Arabic)" : "SEO Title (Arabic)"}
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={formSeoTitleAr}
                        onChange={(e) => setFormSeoTitleAr(e.target.value)}
                        placeholder="العنوان لمحركات البحث..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-[#C29B38] font-arabic"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={savingTour}
                  className="px-5 py-2.5 rounded-xl bg-[#C29B38] hover:bg-[#A8842E] text-stone-950 font-semibold text-xs transition-all shadow-md flex items-center gap-2"
                >
                  {savingTour && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isCreatingNew ? (isAr ? "إنشاء الجولة" : "Create Tour") : (isAr ? "حفظ التعديلات" : "Save Changes")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DEPARTURES & SEAT INVENTORY MODAL                                      */}
      {/* ========================================================================= */}
      {departuresTour && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#0F1115] border border-[#C29B38]/40 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-950">
              <div className="space-y-0.5">
                <h3 className="font-serif text-lg font-bold text-[#F3ECE1]">
                  {isAr ? `إدارة مواعيد الانطلاق والمقاعد: ${departuresTour.titleAr}` : `Departures & Capacity: ${departuresTour.titleEn}`}
                </h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  {departuresTour.tourType === "private"
                    ? (isAr ? "أسطول خاص (Vehicle Buyout) • حجز واحد يحجز كامل الطاقة الاستيعابية للمركبة" : "100% Private Charter • One booking buyouts vehicle")
                    : (isAr ? "مجموعة بنظام المقاعد الفردية" : "Group pooled ticketing")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeparturesTour(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Add New Slot Form */}
              <form onSubmit={handleAddDeparture} className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[10px] text-stone-400 uppercase font-mono block mb-1">
                    {isAr ? "تاريخ الانطلاق" : "Departure Date"}
                  </label>
                  <input
                    type="date"
                    required
                    value={newDepDate}
                    onChange={(e) => setNewDepDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 text-xs"
                  />
                </div>

                <div className="w-24">
                  <label className="text-[10px] text-stone-400 uppercase font-mono block mb-1">
                    {isAr ? "الوقت" : "Time"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newDepTime}
                    onChange={(e) => setNewDepTime(e.target.value)}
                    placeholder="08:30"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 text-xs font-mono"
                  />
                </div>

                <div className="w-24">
                  <label className="text-[10px] text-stone-400 uppercase font-mono block mb-1">
                    {isAr ? "السعة (مقاعد)" : "Capacity"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newDepCapacity}
                    onChange={(e) => setNewDepCapacity(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-stone-100 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingDeparture}
                  className="px-3 py-1.5 rounded-lg bg-[#C29B38] text-stone-950 font-semibold text-xs hover:bg-[#A8842E]"
                >
                  {addingDeparture ? "..." : (isAr ? "إضافة موعد" : "Add Slot")}
                </button>
              </form>

              {/* Departures Table */}
              {loadingDepartures ? (
                <div className="text-center py-8 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#C29B38] mx-auto mb-2" />
                  <span>Loading scheduled slots...</span>
                </div>
              ) : departuresList.length > 0 ? (
                <div className="rounded-xl border border-stone-800 overflow-hidden">
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-stone-900 text-stone-400 text-[10px] uppercase font-mono border-b border-stone-800">
                      <tr>
                        <th className="px-3 py-2.5">{isAr ? "التاريخ" : "Date"}</th>
                        <th className="px-3 py-2.5">{isAr ? "الوقت" : "Time"}</th>
                        <th className="px-3 py-2.5">{isAr ? "السعة" : "Cap"}</th>
                        <th className="px-3 py-2.5">{isAr ? "محجوز" : "Booked"}</th>
                        <th className="px-3 py-2.5">{isAr ? "المتاح" : "Avail"}</th>
                        <th className="px-3 py-2.5">{isAr ? "الحالة" : "Status"}</th>
                        <th className="px-3 py-2.5 text-right rtl:text-left">{isAr ? "إجراء" : "Action"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80">
                      {departuresList.map((slot) => (
                        <tr key={slot.id} className="hover:bg-stone-900/40">
                          <td className="px-3 py-2 font-mono text-stone-200">{slot.departureDate}</td>
                          <td className="px-3 py-2 font-mono text-stone-300">{slot.startTime}</td>
                          <td className="px-3 py-2 font-mono text-stone-200">{slot.capacity}</td>
                          <td className="px-3 py-2 font-mono text-amber-400">{slot.reservedSeats}</td>
                          <td className="px-3 py-2 font-mono text-emerald-400 font-bold">{slot.availableSeats}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${
                                slot.status === "open"
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                                  : "bg-rose-950/60 text-rose-400 border-rose-500/30"
                              }`}
                            >
                              {slot.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right rtl:text-left">
                            <button
                              type="button"
                              onClick={() => handleDeleteDeparture(slot.id)}
                              className="text-stone-500 hover:text-rose-400 p-1"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-6 text-stone-500">No departure slots configured yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
