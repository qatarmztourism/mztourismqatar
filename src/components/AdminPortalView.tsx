"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Locale, TranslationDict } from "@/translations";
import {
  getAdminMetricsAction,
  getAdminBookingsAction,
  getAdminDepositProofsAction,
  getAdminSignedProofUrlAction,
  reviewAdminDepositProofAction,
  getAdminCustomTripsAction,
  type AdminMetricsData,
} from "@/lib/server/admin-actions";
import {
  getAdminServicesAction,
} from "@/lib/server/service-actions";
import {
  getCurrentUserAction,
  adminSignInAction,
  signOutAction,
} from "@/lib/server/auth-actions";
import {
  getAdminArticlesAction,
  createAdminArticleAction,
  toggleArticlePublishAction,
} from "@/lib/server/blog-actions";
import type { AdminArticleItem, ArticleCategory } from "@/lib/data/curated-articles";
import {
  Shield,
  Lock,
  AlertCircle,
  Search,
  Eye,
  Check,
  X,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Mail,
  Info,
  BookOpen,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopNavbar from "@/components/admin/AdminTopNavbar";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";
import AdminDeparturesView from "@/components/admin/AdminDeparturesView";
import AdminReportsView from "@/components/admin/AdminReportsView";
import AdminStaffView from "@/components/admin/AdminStaffView";
import AdminToursView from "@/components/admin/AdminToursView";
import AdminBookingsView from "@/components/admin/AdminBookingsView";
import AdminCustomTripsView from "@/components/admin/AdminCustomTripsView";
import AdminCmsView from "@/components/admin/cms/AdminCmsView";
import AdminPaymentsView from "@/components/admin/AdminPaymentsView";

interface AdminBookingRecord {
  id: string;
  bookingRef: string;
  customerId: string | null;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  departureDate: string | null;
  timeWindow: string | null;
  paxCount: number;
  pickupLocation: string | null;
  notes: string | null;
  bookingStatus: "awaiting_deposit" | "deposit_under_review" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "deposit_pending" | "deposit_submitted" | "deposit_confirmed" | "deposit_rejected" | "fully_paid";
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  adminNotes: string | null;
  uploadToken: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminDepositProofItem {
  id: string;
  bookingId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  reviewStatus: "pending" | "accepted" | "rejected";
  rejectionReason: string | null;
  reviewedBy?: string | null;
  reviewedAt: string | null;
  uploadedAt: string;
  booking: {
    id: string;
    bookingRef: string;
    customerName: string;
    customerPhone: string;
    serviceId: string;
    departureDate: string | null;
    depositRequired: number;
  } | null;
}

interface AdminCustomTripItem {
  id: string;
  requestRef: string;
  customerId: string | null;
  guestName: string;
  email: string;
  phone: string;
  destinations: string[];
  experiences: string[];
  partySize: string | null;
  timeframe: string | null;
  budgetRange: string | null;
  specialRequests: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminServiceRecord {
  id: string;
  titleEn: string;
  titleAr: string;
  category: string;
  duration: string;
  indicativePrice: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminPortalViewProps {
  currentLocale: Locale;
  dict: TranslationDict;
}

export default function AdminPortalView({ currentLocale, dict }: AdminPortalViewProps) {
  void dict;
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  // Authorization state
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [adminUserEmail, setAdminUserEmail] = useState<string>("");
  const [adminUserRole, setAdminUserRole] = useState<string>("super_admin");

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Admin login form state
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    "metrics" | "bookings" | "proofs" | "payments" | "departures" | "custom_trips" | "services" | "articles" | "reports" | "staff" | "cms"
  >("metrics");

  const handleNavigateTab = (tabId: string) => {
    if (tabId === "bookings") {
      setActiveTab("bookings");
    } else if (tabId === "proofs") {
      setActiveTab("proofs");
    } else if (tabId === "payments") {
      setActiveTab("payments");
    } else if (tabId === "departures") {
      setActiveTab("departures");
    } else if (tabId === "custom_trips") {
      setActiveTab("custom_trips");
    } else if (tabId === "services" || tabId === "tours") {
      setActiveTab("services");
    } else if (tabId === "reports") {
      setActiveTab("reports");
    } else if (tabId === "staff") {
      setActiveTab("staff");
    } else if (tabId === "cms") {
      setActiveTab("cms");
    } else {
      setActiveTab("metrics");
    }
  };

  // Live Supabase Data states
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);
  const [bookings, setBookings] = useState<AdminBookingRecord[]>([]);
  const [depositProofs, setDepositProofs] = useState<AdminDepositProofItem[]>([]);
  const [customTrips, setCustomTrips] = useState<AdminCustomTripItem[]>([]);
  const [services, setServices] = useState<AdminServiceRecord[]>([]);
  const [articles, setArticles] = useState<AdminArticleItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Filters for Proofs & Articles
  const [proofFilter, setProofFilter] = useState<string>("all");
  const [articleSearch, setArticleSearch] = useState<string>("");
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>("all");
  const [togglingArticleId, setTogglingArticleId] = useState<string | null>(null);

  // Articles modal state
  const [isCreatingArticle, setIsCreatingArticle] = useState<boolean>(false);
  const [articleFormSlug, setArticleFormSlug] = useState<string>("");
  const [articleFormTitleEn, setArticleFormTitleEn] = useState<string>("");
  const [articleFormTitleAr, setArticleFormTitleAr] = useState<string>("");
  const [articleFormExcerptEn, setArticleFormExcerptEn] = useState<string>("");
  const [articleFormExcerptAr, setArticleFormExcerptAr] = useState<string>("");
  const [articleFormContentEn, setArticleFormContentEn] = useState<string>("");
  const [articleFormContentAr, setArticleFormContentAr] = useState<string>("");
  const [articleFormCategory, setArticleFormCategory] = useState<ArticleCategory>("desert_expeditions");
  const [articleFormCoverImage, setArticleFormCoverImage] = useState<string>("");
  const [articleFormReadingTime, setArticleFormReadingTime] = useState<number>(5);
  const [articleFormPublishNow, setArticleFormPublishNow] = useState<boolean>(true);
  const [articleSaving, setArticleSaving] = useState<boolean>(false);
  const [articleFormError, setArticleFormError] = useState<string | null>(null);

  // Proof inspection modal
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);
  const [inspectingLoading, setInspectingLoading] = useState<boolean>(false);
  const [rejectingProofId, setRejectingProofId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  // 1. Check initial administrator authorization
  const checkAuth = async () => {
    setAuthChecking(true);
    try {
      const res = await getCurrentUserAction();
      if (res.success && res.data?.isAdmin) {
        setIsAuthorized(true);
        setAdminUserEmail(res.data.user.email || "Staff Admin");
        setAdminUserRole(res.data.adminRole || "administrator");
      } else {
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error("[Admin Auth Check Error]", err);
      setIsAuthorized(false);
    } finally {
      setAuthChecking(false);
    }
  };

  // 2. Load all dashboard datasets from Supabase
  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [metricsRes, bookingsRes, proofsRes, customTripsRes, servicesRes, articlesRes] = await Promise.all([
        getAdminMetricsAction(),
        getAdminBookingsAction("all"),
        getAdminDepositProofsAction(),
        getAdminCustomTripsAction("all"),
        getAdminServicesAction(),
        getAdminArticlesAction(),
      ]);

      if (metricsRes.success && metricsRes.data) setMetrics(metricsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (proofsRes.success) setDepositProofs(proofsRes.data || []);
      if (customTripsRes.success) setCustomTrips(customTripsRes.data || []);
      if (servicesRes.success) setServices(servicesRes.data || []);
      if (articlesRes.success) setArticles(articlesRes.data || []);
    } catch (err) {
      console.error("[Load Admin Data Error]", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadAllData();
    }
  }, [isAuthorized]);

  // 3. Handle Admin Sign In
  const handleAdminSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await adminSignInAction({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res.success && res.data) {
        setIsAuthorized(true);
        setAdminUserEmail(res.data.email || loginEmail);
        setAdminUserRole(res.data.role || "super_admin");
        await loadAllData();
      } else {
        setLoginError(res.error || "Authentication failed. Please check credentials.");
      }
    } catch (err) {
      console.error("[Admin Sign In Error]", err);
      setLoginError("An unexpected error occurred during administrative login.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutAction();
    setIsAuthorized(false);
    setMetrics(null);
    setBookings([]);
    setDepositProofs([]);
    setCustomTrips([]);
  };

  // 4. Deposit Proof Inspection & Verification
  const handleInspectProof = async (storagePath: string) => {
    setInspectingLoading(true);
    try {
      const res = await getAdminSignedProofUrlAction(storagePath);
      if (res.success && res.signedUrl) {
        setActiveProofUrl(res.signedUrl);
      } else {
        alert(res.error || "Unable to generate secure view URL.");
      }
    } catch (err) {
      console.error("[Inspect Proof Error]", err);
      alert("Failed to load signed receipt image.");
    } finally {
      setInspectingLoading(false);
    }
  };

  const handleReviewProof = async (
    proofId: string,
    bookingId: string,
    reviewStatus: "accepted" | "rejected",
    reason?: string
  ) => {
    if (reviewStatus === "rejected" && (!reason || reason.trim().length < 3)) {
      alert("A clear rejection reason of at least 3 characters is required to decline a deposit proof.");
      return;
    }

    try {
      const res = await reviewAdminDepositProofAction({
        proofId,
        bookingId,
        reviewStatus,
        rejectionReason: reason?.trim() || null,
      });

      if (res.success) {
        setRejectingProofId(null);
        setRejectReason("");
        await loadAllData();
      } else {
        alert(res.error || "Failed to update review status.");
      }
    } catch (err) {
      console.error("[Review Proof Error]", err);
      alert("Operation failed.");
    }
  };

  // 5. Editorial Guides Management
  const handleToggleArticlePublish = async (id: string, currentStatus: boolean) => {
    setTogglingArticleId(id);
    try {
      const newStatus = !currentStatus;
      const res = await toggleArticlePublishAction(id, newStatus);
      if (res.success) {
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isPublished: newStatus } : a))
        );
      } else {
        alert(res.error || "Failed to update article status");
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setTogglingArticleId(null);
    }
  };

  const handleCreateArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setArticleFormError(null);
    setArticleSaving(true);
    try {
      const res = await createAdminArticleAction({
        slug: articleFormSlug.trim(),
        titleEn: articleFormTitleEn.trim(),
        titleAr: articleFormTitleAr.trim(),
        excerptEn: articleFormExcerptEn.trim(),
        excerptAr: articleFormExcerptAr.trim(),
        contentEn: articleFormContentEn.trim(),
        contentAr: articleFormContentAr.trim(),
        category: articleFormCategory,
        coverImage: articleFormCoverImage.trim() || null,
        readingTimeMinutes: Number(articleFormReadingTime) || 5,
        isPublished: articleFormPublishNow,
      });

      if (!res.success) {
        setArticleFormError(res.error || "Failed to create article");
        return;
      }

      setIsCreatingArticle(false);
      setArticleFormSlug("");
      setArticleFormTitleEn("");
      setArticleFormTitleAr("");
      setArticleFormExcerptEn("");
      setArticleFormExcerptAr("");
      setArticleFormContentEn("");
      setArticleFormContentAr("");
      setArticleFormCoverImage("");
      setArticleFormReadingTime(5);

      const refreshed = await getAdminArticlesAction();
      if (refreshed.success && refreshed.data) {
        setArticles(refreshed.data);
      }
    } catch (err) {
      setArticleFormError((err as Error).message);
    } finally {
      setArticleSaving(false);
    }
  };

  // Filter Articles
  const filteredArticles = articles.filter((a) => {
    if (articleCategoryFilter !== "all" && a.category !== articleCategoryFilter) return false;
    if (articleSearch) {
      const q = articleSearch.toLowerCase();
      const matchSlug = a.slug.toLowerCase().includes(q);
      const matchTitleEn = a.titleEn.toLowerCase().includes(q);
      const matchTitleAr = a.titleAr.toLowerCase().includes(q);
      if (!matchSlug && !matchTitleEn && !matchTitleAr) return false;
    }
    return true;
  });

  // Filter Proofs
  const filteredProofs = depositProofs.filter((p) => {
    if (proofFilter !== "all" && p.reviewStatus !== proofFilter) return false;
    return true;
  });

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0F1115] pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-[#C29B38]/30 flex items-center justify-center mx-auto shadow-lg shadow-[#C29B38]/10">
            <Loader2 className="w-7 h-7 text-[#C29B38] animate-spin" />
          </div>
          <p className="text-xs uppercase font-mono tracking-widest text-[#C29B38] font-bold">
            {isRtl ? "جارٍ التحقق من صلاحيات مكتب الإدارة..." : "Verifying staff security clearance..."}
          </p>
        </div>
      </div>
    );
  }

  // View: Administrator Authentication Gate
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0F1115] pt-28 pb-20 px-4 flex items-center justify-center">
        <div className="bg-[#14171F] border border-white/[0.1] hover:border-[#C29B38]/40 rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-2xl space-y-6 transition-all">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#72132B] to-[#0F1115] border border-[#C29B38]/40 text-[#ECC15A] mx-auto flex items-center justify-center shadow-xl shadow-[#C29B38]/10">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C29B38] font-bold block">
                MZ Tourism Qatar
              </span>
              <h1 className="font-headline text-2xl sm:text-3xl text-[#F3ECE1] font-bold mt-1">
                {isRtl ? "بوابة إدارة كونسيرج قطر" : "Operations Desk Clearance"}
              </h1>
            </div>
            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              {isRtl
                ? "تسجيل دخول مخصص لمسؤولي إم زد للسياحة قطر ومكتب إدارة الحجوزات والعمليات."
                : "Restricted to authorized MZ Tourism Qatar operations staff and concierge directors."}
            </p>
          </div>

          {loginError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminSignInSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-stone-300 font-semibold block mb-1.5 font-mono">
                {isRtl ? "البريد الإلكتروني الإداري" : "Administrator Email"}
              </label>
              <div className="relative">
                <Mail className={`absolute ${isRtl ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500`} />
                <input
                  type="email"
                  required
                  placeholder="admin@mztourismqatar.qa"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={`w-full min-h-[46px] ${isRtl ? "pr-10 pl-3.5" : "pl-10 pr-3.5"} rounded-2xl bg-white/[0.03] border border-white/[0.1] text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C29B38] focus:ring-1 focus:ring-[#C29B38] transition-all`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-stone-300 font-semibold block mb-1.5 font-mono">
                {isRtl ? "كلمة المرور المشفرة" : "Password"}
              </label>
              <div className="relative">
                <Lock className={`absolute ${isRtl ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500`} />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`w-full min-h-[46px] ${isRtl ? "pr-10 pl-3.5" : "pl-10 pr-3.5"} rounded-2xl bg-white/[0.03] border border-white/[0.1] text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C29B38] focus:ring-1 focus:ring-[#C29B38] transition-all`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-[#C29B38] to-[#ECC15A] hover:brightness-110 text-[#0F1115] text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-xl shadow-[#C29B38]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? "جارٍ التحقق من الصلاحيات..." : "Verifying Clearance..."}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{isRtl ? "دخول إلى لوحة العمليات" : "Access Operations Portal"}</span>
                </>
              )}
            </button>
          </form>

          {/* Secure First Admin Provisioning Notice */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-stone-400 space-y-1">
            <span className="font-semibold text-[#ECC15A] block flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-wider">
              <Info className="w-3.5 h-3.5" />
              <span>{isRtl ? "إدارة الصلاحيات المشفرة" : "Role-Based Access Control"}</span>
            </span>
            <p className="leading-relaxed">
              {isRtl
                ? "يتم منح صلاحيات المشرفين حصرياً عبر جدول public.admin_users. لتفعيل مشرف جديد، يُستخدم السكربت الآمن node scripts/setup-admin.mjs."
                : "Staff permissions are verified against public.admin_users in Supabase. Admins can be provisioned using node scripts/setup-admin.mjs on the server."}
            </p>
          </div>

          <div className="text-center pt-1">
            <Link
              href={`/${currentLocale}`}
              className="text-xs text-stone-400 hover:text-[#ECC15A] transition-colors inline-flex items-center gap-1.5"
            >
              <Arrow className="w-3.5 h-3.5 rotate-180" />
              <span>{isRtl ? "العودة للموقع الرئيسي" : "Return to Public Portal"}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#F3ECE1]">
      {/* 1. Left Fixed Sidebar (Desktop) + Mobile Sliding Drawer */}
      <AdminSidebar
        currentLocale={currentLocale}
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        adminUserEmail={adminUserEmail}
        adminUserRole={adminUserRole}
        bookingsCount={bookings.length}
        pendingProofsCount={metrics?.pendingProofs ?? 0}
        customTripsCount={customTrips.length}
        servicesCount={services.length}
        articlesCount={articles.length}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Canvas with logical start padding for Sidebar */}
      <div className="lg:ps-72 flex flex-col min-h-screen transition-all">
        {/* Sticky Modern Top Navbar */}
        <AdminTopNavbar
          currentLocale={currentLocale}
          activeTab={activeTab}
          adminUserEmail={adminUserEmail}
          adminUserRole={adminUserRole}
          loadingData={loadingData}
          onRefresh={loadAllData}
          onSignOut={handleSignOut}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          pendingProofsCount={metrics?.pendingProofs ?? 0}
        />

        {/* Tab Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: ADVANCED EXECUTIVE DASHBOARD OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === "metrics" && (
            <AdminDashboardOverview
              locale={currentLocale}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB: SCHEDULED DEPARTURES MANIFEST */}
          {/* ========================================================================= */}
          {activeTab === "departures" && (
            <AdminDeparturesView
              locale={currentLocale}
              onSelectBooking={(ref) => {
                void ref;
                setActiveTab("bookings");
              }}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB: FINANCIAL REPORTS & AUDIT SETTLEMENTS */}
          {/* ========================================================================= */}
          {activeTab === "reports" && (
            <AdminReportsView locale={currentLocale} />
          )}

          {/* ========================================================================= */}
          {/* TAB: STAFF ROLES & PERMISSIONS (SUPER ADMIN ONLY) */}
          {/* ========================================================================= */}
          {activeTab === "staff" && adminUserRole === "super_admin" && (
            <AdminStaffView locale={currentLocale} />
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ALL RESERVATIONS */}
          {/* ========================================================================= */}
          {activeTab === "bookings" && (
            <AdminBookingsView
              locale={currentLocale}
              adminUserRole={adminUserRole}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DEPOSIT PROOF REVIEW QUEUE */}
          {/* ========================================================================= */}
          {activeTab === "proofs" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-[#14171F] p-6 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-headline text-lg sm:text-xl font-bold text-[#F3ECE1] block">
                    {isRtl ? "طابور تدقيق إيصالات العربون" : "Deposit Receipt Review Queue"} ({filteredProofs.length})
                  </h3>
                  <span className="text-xs text-stone-400 font-mono mt-1 block">
                    Short-lived inspection links (15 min / 900s validity) • Private RLS protected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 font-mono">{isRtl ? "التصفية:" : "Filter:"}</span>
                  <select
                    value={proofFilter}
                    onChange={(e) => setProofFilter(e.target.value)}
                    className="bg-white/[0.04] border border-white/[0.1] text-stone-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#C29B38] cursor-pointer"
                  >
                    <option value="all" className="bg-[#14171F]">All Reviews</option>
                    <option value="pending" className="bg-[#14171F]">Pending Only</option>
                    <option value="accepted" className="bg-[#14171F]">Accepted</option>
                    <option value="rejected" className="bg-[#14171F]">Rejected</option>
                  </select>
                </div>
              </div>

              {filteredProofs.length === 0 ? (
                <div className="p-16 text-center text-xs text-stone-500 bg-[#14171F] rounded-3xl border border-white/[0.08] shadow-xl">
                  {isRtl ? "لا توجد إيصالات دفع تحت هذا التصنيف." : "No deposit receipts found under this filter."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredProofs.map((p) => {
                    return (
                      <div
                        key={p.id}
                        className="bg-[#14171F] rounded-3xl border border-white/[0.08] hover:border-[#C29B38]/40 p-6 shadow-xl space-y-5 flex flex-col justify-between transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-bold text-[#ECC15A]">
                              {p.booking?.bookingRef || "UNKNOWN REF"}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold border ${
                                p.reviewStatus === "accepted"
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  : p.reviewStatus === "rejected"
                                  ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              }`}
                            >
                              {p.reviewStatus}
                            </span>
                          </div>

                          <div className="text-xs text-stone-200 space-y-1">
                            <div className="font-bold text-sm text-[#F3ECE1]">{p.booking?.customerName || "Guest"}</div>
                            <div className="text-stone-400 text-xs font-mono">
                              {p.fileName} • {(p.fileSize / 1024 / 1024).toFixed(2)} MB •{" "}
                              {new Date(p.uploadedAt).toLocaleString()}
                            </div>
                          </div>

                          {p.reviewedAt && (
                            <div className="text-[11px] text-stone-500 font-mono">
                              Reviewed: {new Date(p.reviewedAt).toLocaleString()}
                            </div>
                          )}

                          {p.rejectionReason && (
                            <div className="p-3 rounded-2xl bg-rose-950/30 text-xs text-rose-300 border border-rose-500/30">
                              Reason: {p.rejectionReason}
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => handleInspectProof(p.storagePath)}
                            disabled={inspectingLoading}
                            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-[#ECC15A] border border-[#C29B38]/30 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Receipt (15m link)</span>
                          </button>

                          {p.reviewStatus === "pending" && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleReviewProof(p.id, p.bookingId, "accepted")}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify & Confirm</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setRejectingProofId(p.id)}
                                className="px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
                                title="Reject with Reason"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reject reason input prompt */}
                        {rejectingProofId === p.id && (
                          <div className="p-4 rounded-2xl bg-[#0F1115] border border-rose-500/40 space-y-3 mt-3">
                            <label className="text-[10px] uppercase font-mono text-rose-400 font-bold block">
                              Mandatory Rejection Reason (min 3 chars)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Illegible receipt, transfer reference missing..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-stone-200 focus:outline-none focus:border-rose-500"
                            />
                            <div className="flex justify-end gap-2.5">
                              <button
                                onClick={() => {
                                  setRejectingProofId(null);
                                  setRejectReason("");
                                }}
                                className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={rejectReason.trim().length < 3}
                                onClick={() =>
                                  handleReviewProof(p.id, p.bookingId, "rejected", rejectReason)
                                }
                                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-md shadow-rose-900/30"
                              >
                                Confirm Rejection
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3B: QATAR PAYMENTS & BANK COORDINATES */}
          {/* ========================================================================= */}
          {activeTab === "payments" && (
            <AdminPaymentsView
              locale={currentLocale}
              onOpenProofQueue={() => setActiveTab("proofs")}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 4: BESPOKE JOURNEY BRIEFS & ITINERARY CRM */}
          {/* ========================================================================= */}
          {activeTab === "custom_trips" && (
            <AdminCustomTripsView
              locale={currentLocale}
              adminUserRole={adminUserRole}
              onNavigateToBookings={() => setActiveTab("bookings")}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 5: TOURS & EXPERIENCES MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === "services" && (
            <AdminToursView locale={currentLocale} />
          )}

          {/* ========================================================================= */}
          {/* TAB 6: EDITORIAL & TRAVEL GUIDES */}
          {/* ========================================================================= */}
          {activeTab === "articles" && (
            <div className="space-y-6">
              {/* Controls Header */}
              <div className="bg-[#14171F] p-6 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-stone-200 font-bold block">
                    {isRtl ? "المقالات المنشورة والمسودات" : "Travel Guides & Editorial"} ({articles.length})
                  </span>
                  <div className="relative min-w-[240px]">
                    <Search className={`absolute ${isRtl ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500`} />
                    <input
                      type="text"
                      placeholder={isRtl ? "بحث بالعنوان أو الرابط..." : "Search slug or title..."}
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      className={`w-full min-h-[40px] ${isRtl ? "pr-10 pl-3.5" : "pl-10 pr-3.5"} bg-white/[0.03] border border-white/[0.1] text-stone-200 text-xs rounded-xl focus:outline-none focus:border-[#C29B38]`}
                    />
                  </div>
                  <select
                    value={articleCategoryFilter}
                    onChange={(e) => setArticleCategoryFilter(e.target.value)}
                    className="min-h-[40px] bg-white/[0.03] border border-white/[0.1] text-stone-200 text-xs rounded-xl px-3.5 focus:outline-none focus:border-[#C29B38] cursor-pointer"
                  >
                    <option value="all" className="bg-[#14171F]">All Categories</option>
                    <option value="desert_expeditions" className="bg-[#14171F]">Desert Expeditions</option>
                    <option value="culture_heritage" className="bg-[#14171F]">Culture & Heritage</option>
                    <option value="vip_transfers" className="bg-[#14171F]">VIP Transfers</option>
                    <option value="luxury_stays" className="bg-[#14171F]">Luxury Stays</option>
                    <option value="travel_advisory" className="bg-[#14171F]">Travel Advisory</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setArticleFormSlug("");
                    setArticleFormTitleEn("");
                    setArticleFormTitleAr("");
                    setArticleFormExcerptEn("");
                    setArticleFormExcerptAr("");
                    setArticleFormContentEn("");
                    setArticleFormContentAr("");
                    setArticleFormCategory("desert_expeditions");
                    setArticleFormCoverImage("");
                    setArticleFormReadingTime(5);
                    setArticleFormPublishNow(true);
                    setArticleFormError(null);
                    setIsCreatingArticle(true);
                  }}
                  className="min-h-[42px] px-5 rounded-2xl bg-gradient-to-r from-[#C29B38] to-[#ECC15A] text-[#0F1115] text-xs font-bold hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#C29B38]/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isRtl ? "إضافة مقال جديد" : "+ New Editorial Guide"}</span>
                </button>
              </div>

              {/* Articles Table */}
              <div className="bg-[#14171F] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.03] border-b border-white/[0.08] text-stone-400 uppercase text-[10px] font-mono tracking-wider">
                      <tr>
                        <th className="py-4 px-5">Article</th>
                        <th className="py-4 px-5">Category</th>
                        <th className="py-4 px-5">Read Time</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5">Live Link</th>
                        <th className="py-4 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-stone-200">
                      {filteredArticles.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-xs text-stone-500">
                            No editorial guides matching search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredArticles.map((art) => (
                          <tr key={art.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3.5">
                                {art.coverImage ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={art.coverImage}
                                    alt={art.titleEn}
                                    className="w-14 h-11 rounded-xl object-cover border border-white/[0.08] shrink-0"
                                  />
                                ) : (
                                  <div className="w-14 h-11 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.08] shrink-0">
                                    <BookOpen className="w-4 h-4 text-[#ECC15A]" />
                                  </div>
                                )}
                                <div className="min-w-0 max-w-[280px]">
                                  <div className="font-semibold text-stone-100 truncate">{art.titleEn}</div>
                                  <div className="text-[11px] text-stone-400 truncate font-arabic">{art.titleAr}</div>
                                  <div className="text-[10px] text-[#ECC15A]/70 font-mono truncate">{art.slug}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-stone-300 capitalize">
                                {art.category.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-4 px-5 font-mono text-[11px] text-stone-400">
                              {art.readingTimeMinutes} min
                            </td>
                            <td className="py-4 px-5">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold border ${
                                  art.isPublished
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : "bg-white/[0.04] text-stone-400 border-white/[0.08]"
                                }`}
                              >
                                {art.isPublished ? "Published" : "Draft"}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <Link
                                href={`/en/blog/${art.slug}`}
                                target="_blank"
                                className="text-[#ECC15A] hover:underline flex items-center gap-1.5 font-mono text-xs font-semibold"
                              >
                                <span>Preview</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button
                                type="button"
                                disabled={togglingArticleId === art.id}
                                onClick={() => handleToggleArticlePublish(art.id, art.isPublished)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  art.isPublished
                                    ? "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                                    : "bg-[#C29B38]/15 text-[#ECC15A] border-[#C29B38]/30 hover:bg-[#C29B38]/25"
                                }`}
                              >
                                {togglingArticleId === art.id
                                  ? "Saving..."
                                  : art.isPublished
                                  ? "Unpublish"
                                  : "Publish"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 1: Secure Signed Proof Preview */}
          {/* ========================================================================= */}
          {activeProofUrl && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#14171F] border border-[#C29B38]/40 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <span className="font-headline text-base font-bold text-[#ECC15A] block">
                      Secure Deposit Receipt Preview (Private Storage)
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono mt-0.5 block">
                      Temporary signed URL • Expires in 15 minutes
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveProofUrl(null)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-white/[0.06] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-6 overflow-auto flex-1 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeProofUrl}
                    alt="Deposit Receipt"
                    className="max-h-[65vh] object-contain rounded-2xl border border-white/[0.08]"
                  />
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex justify-end">
                  <a
                    href={activeProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#C29B38] to-[#ECC15A] text-[#0F1115] text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-[#C29B38]/20"
                  >
                    <span>Open Full Size</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 2: Create New Editorial Guide Modal */}
          {/* ========================================================================= */}
          {isCreatingArticle && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#14171F] border border-[#C29B38]/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#ECC15A] flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold font-headline text-[#F3ECE1]">
                      {isRtl ? "إضافة مقال جديد إلى دليل السفر" : "Create New Editorial Guide"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingArticle(false)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-white/[0.06] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {articleFormError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
                    {articleFormError}
                  </div>
                )}

                <form onSubmit={handleCreateArticleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        URL Slug * (lowercase, letters, numbers, hyphens)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. al-safliya-island-charter"
                        value={articleFormSlug}
                        onChange={(e) => setArticleFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                        className="w-full min-h-[42px] px-3.5 bg-white/[0.03] border border-white/[0.1] text-stone-100 rounded-2xl font-mono text-xs focus:ring-1 focus:ring-[#C29B38] focus:border-[#C29B38] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        Category *
                      </label>
                      <select
                        value={articleFormCategory}
                        onChange={(e) => setArticleFormCategory(e.target.value as ArticleCategory)}
                        className="w-full min-h-[42px] px-3.5 bg-[#14171F] border border-white/[0.1] text-stone-100 rounded-2xl text-xs focus:ring-1 focus:ring-[#C29B38] focus:outline-none cursor-pointer"
                      >
                        <option value="desert_expeditions">Desert Expeditions</option>
                        <option value="culture_heritage">Culture & Heritage</option>
                        <option value="vip_transfers">VIP Transfers</option>
                        <option value="luxury_stays">Luxury Stays</option>
                        <option value="travel_advisory">Travel Advisory</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        English Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="The Discerning Traveler Guide to..."
                        value={articleFormTitleEn}
                        onChange={(e) => setArticleFormTitleEn(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 bg-white/[0.03] border border-white/[0.1] text-stone-100 rounded-2xl text-xs focus:ring-1 focus:ring-[#C29B38] focus:border-[#C29B38] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        Arabic Title *
                      </label>
                      <input
                        type="text"
                        required
                        dir="rtl"
                        placeholder="الدليل الشامل للرحالة المميز إلى..."
                        value={articleFormTitleAr}
                        onChange={(e) => setArticleFormTitleAr(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 bg-white/[0.03] border border-white/[0.1] text-stone-100 rounded-2xl text-xs focus:ring-1 focus:ring-[#C29B38] focus:border-[#C29B38] focus:outline-none font-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        English Excerpt *
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Brief summary for listings and search engines..."
                        value={articleFormExcerptEn}
                        onChange={(e) => setArticleFormExcerptEn(e.target.value)}
                        className="w-full p-3.5 bg-white/[0.03] border border-white/[0.1] text-stone-100 rounded-2xl text-xs focus:ring-1 focus:ring-[#C29B38] focus:border-[#C29B38] focus:outline-none resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        Arabic Excerpt *
                      </label>
                      <textarea
                        rows={2}
                        required
                        dir="rtl"
                        placeholder="نبذة موجزة للمعاينة ومحركات البحث..."
                        value={articleFormExcerptAr}
                        onChange={(e) => setArticleFormExcerptAr(e.target.value)}
                        className="w-full p-3.5 bg-white/[0.03] border border-white/[0.1] text-stone-100 rounded-2xl text-xs focus:ring-1 focus:ring-[#C29B38] focus:border-[#C29B38] focus:outline-none resize-none font-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        English Full Content * (plain text paragraphs)
                      </label>
                      <textarea
                        rows={5}
                        required
                        placeholder="Write the full editorial body here..."
                        value={articleFormContentEn}
                        onChange={(e) => setArticleFormContentEn(e.target.value)}
                        className="w-full p-3.5 bg-white/[0.03] border border-white/[0.1] text-stone-100 rounded-2xl text-xs focus:ring-1 focus:ring-[#C29B38] focus:border-[#C29B38] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        Arabic Full Content * (فقرات نصية كاملة)
                      </label>
                      <textarea
                        rows={5}
                        required
                        dir="rtl"
                        placeholder="اكتب المحتوى التحريري الكامل هنا..."
                        value={articleFormContentAr}
                        onChange={(e) => setArticleFormContentAr(e.target.value)}
                        className="w-full p-3.5 bg-white/[0.03] border border-white/[0.1] text-stone-100 rounded-2xl text-xs focus:ring-1 focus:ring-[#C29B38] focus:border-[#C29B38] focus:outline-none font-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        Cover Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={articleFormCoverImage}
                        onChange={(e) => setArticleFormCoverImage(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 bg-white/[0.03] border border-white/[0.1] text-stone-100 rounded-2xl text-xs focus:ring-1 focus:ring-[#C29B38] focus:border-[#C29B38] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block font-mono">
                        Reading Time (Min)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={articleFormReadingTime}
                        onChange={(e) => setArticleFormReadingTime(Number(e.target.value) || 5)}
                        className="w-full min-h-[42px] px-3.5 bg-white/[0.03] border border-white/[0.1] text-stone-100 rounded-2xl text-xs font-mono focus:ring-1 focus:ring-[#C29B38] focus:border-[#C29B38] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="publishNow"
                      checked={articleFormPublishNow}
                      onChange={(e) => setArticleFormPublishNow(e.target.checked)}
                      className="w-4 h-4 rounded text-[#C29B38] focus:ring-[#C29B38] bg-white/[0.04] border-white/[0.1] cursor-pointer"
                    />
                    <label htmlFor="publishNow" className="text-xs text-stone-300 cursor-pointer select-none">
                      Publish immediately (visible to visitors and included in public sitemap)
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsCreatingArticle(false)}
                      className="px-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={articleSaving}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#C29B38] to-[#ECC15A] text-[#0F1115] text-xs font-bold hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#C29B38]/20 disabled:opacity-50"
                    >
                      {articleSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{articleSaving ? "Publishing Guide..." : "Save Editorial Guide"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: CONTENT MANAGEMENT SYSTEM (CMS) */}
          {/* ========================================================================= */}
          {activeTab === "cms" && (
            <AdminCmsView
              currentLocale={currentLocale}
              adminUserRole={adminUserRole}
            />
          )}
        </main>
      </div>
    </div>
  );
}
