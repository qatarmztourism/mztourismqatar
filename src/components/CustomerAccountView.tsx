"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Locale, TranslationDict } from "@/translations";
import Header from "@/components/Header";
import {
  getCustomerBookingsAction,
  linkGuestBookingToAccountAction,
} from "@/lib/server/booking-actions";
import {
  getCustomerCustomTripsAction,
  getCustomerBookingDetailAction,
  type CustomerCustomTripItem,
  type CustomerBookingDossier,
} from "@/lib/server/customer-actions";
import {
  getCurrentUserAction,
  signOutAction,
  updateCustomerProfileAction,
  updateCustomerPasswordAction,
} from "@/lib/server/auth-actions";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  Compass,
  LogOut,
  Plus,
  Receipt,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Settings,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  User,
  KeyRound,
  Shield,
  Eye,
  X,
  Sparkles,
} from "lucide-react";

interface CustomerUserSession {
  user: {
    id: string;
    email?: string;
    fullName: string;
    phone?: string;
    preferredLocale?: "en" | "ar";
  };
  isAdmin: boolean;
  adminRole?: string | null;
  isStaffSession?: boolean;
}

interface CustomerBookingItem {
  id: string;
  bookingRef: string;
  serviceId: string;
  departureDate: string | null;
  timeWindow: string | null;
  paxCount: number;
  bookingStatus: string;
  paymentStatus: string;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  uploadToken: string;
  createdAt: string;
  proofStatus?: string;
  rejectionReason?: string | null;
  lastProofFileName?: string | null;
}

interface CustomerAccountViewProps {
  currentLocale: Locale;
  dict: TranslationDict;
}

type TabType = "bookings" | "custom_trips" | "profile";
type BookingFilterType = "all" | "upcoming" | "past";

function formatDate(dateString: string | null | undefined, locale: Locale): string {
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

function formatDateTime(dateString: string | null | undefined, locale: Locale): string {
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

export default function CustomerAccountView({
  currentLocale,
  dict,
}: CustomerAccountViewProps) {
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CustomerUserSession | null>(null);
  const [bookings, setBookings] = useState<CustomerBookingItem[]>([]);
  const [customTrips, setCustomTrips] = useState<CustomerCustomTripItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<TabType>("bookings");
  const [bookingFilter, setBookingFilter] = useState<BookingFilterType>("all");

  // Booking Dossier Detail Modal
  const [selectedDossier, setSelectedDossier] = useState<CustomerBookingDossier | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Link booking modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkRef, setLinkRef] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Edit Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLocale, setProfileLocale] = useState<"en" | "ar">("en");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const userRes = await getCurrentUserAction();
        if (!userRes.success || !userRes.data?.user) {
          router.push(`/${currentLocale}/auth`);
          return;
        }

        if (isMounted) {
          setCurrentUser(userRes.data);
          setProfileName(userRes.data.user.fullName || "");
          setProfilePhone(userRes.data.user.phone || "");
          setProfileLocale(userRes.data.user.preferredLocale || (currentLocale as "en" | "ar"));
        }

        // Parallel load of customer bookings and bespoke inquiries
        const [bookingsRes, tripsRes] = await Promise.all([
          getCustomerBookingsAction(),
          getCustomerCustomTripsAction(),
        ]);

        if (isMounted) {
          if (bookingsRes.success && bookingsRes.data) {
            setBookings(bookingsRes.data);
          }
          if (tripsRes.success && tripsRes.data) {
            setCustomTrips(tripsRes.data);
          }
        }
      } catch (err) {
        console.error("[Load Account Error]", err);
        if (isMounted) {
          setLoadError("Failed to load portfolio details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentLocale, router]);

  const handleSignOut = async () => {
    await signOutAction();
    router.push(`/${currentLocale}`);
    router.refresh();
  };

  const handleOpenDossier = async (bookingId: string) => {
    setLoadingDossier(true);
    try {
      const res = await getCustomerBookingDetailAction(bookingId);
      if (res.success && res.data) {
        setSelectedDossier(res.data);
      } else {
        alert(res.error || "Unable to retrieve reservation details.");
      }
    } catch (err) {
      console.error("[Open Customer Dossier Error]", err);
      alert("Error retrieving reservation details.");
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleLinkBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkMessage(null);
    setLinkLoading(true);

    try {
      const res = await linkGuestBookingToAccountAction(linkRef.trim());
      if (res.success) {
        setLinkMessage({
          type: "success",
          text: isRtl ? "تم ربط الحجز بحسابك بنجاح!" : "Booking linked to your account successfully!",
        });
        setLinkRef("");
        const bookingsRes = await getCustomerBookingsAction();
        if (bookingsRes.success && bookingsRes.data) {
          setBookings(bookingsRes.data);
        }
      } else {
        setLinkMessage({
          type: "error",
          text: res.error || "Unable to link booking.",
        });
      }
    } catch (err) {
      console.error("[Link Booking Error]", err);
      setLinkMessage({
        type: "error",
        text: "Failed to link booking.",
      });
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileLoading(true);

    try {
      const res = await updateCustomerProfileAction({
        fullName: profileName.trim(),
        phone: profilePhone.trim() || undefined,
        preferredLocale: profileLocale,
      });

      if (res.success) {
        setProfileMessage({
          type: "success",
          text: isRtl ? "تم تحديث الملف الشخصي بنجاح." : "Profile updated successfully.",
        });
        if (currentUser) {
          setCurrentUser({
            ...currentUser,
            user: {
              ...currentUser.user,
              fullName: profileName.trim(),
              phone: profilePhone.trim() || "",
              preferredLocale: profileLocale,
            },
          });
        }
      } else {
        setProfileMessage({
          type: "error",
          text: res.error || "Failed to update profile.",
        });
      }
    } catch (err) {
      console.error("[Update Profile Error]", err);
      setProfileMessage({ type: "error", text: "An error occurred." });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: isRtl ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: isRtl ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل." : "Password must be at least 6 characters.",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await updateCustomerPasswordAction({ password: newPassword });
      if (res.success) {
        setPasswordMessage({
          type: "success",
          text: isRtl ? "تم تحديث كلمة المرور بنجاح." : "Password updated successfully.",
        });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({
          type: "error",
          text: res.error || "Failed to update password.",
        });
      }
    } catch (err) {
      console.error("[Update Password Error]", err);
      setPasswordMessage({ type: "error", text: "An error occurred." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          label: isRtl ? "مؤكد" : "Confirmed",
          color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          icon: CheckCircle2,
        };
      case "deposit_under_review":
        return {
          label: isRtl ? "قيد التدقيق" : "Under Review",
          color: "bg-primary/20 text-primary border-primary/40",
          icon: Clock,
        };
      case "completed":
        return {
          label: isRtl ? "مكتمل" : "Completed",
          color: "bg-blue-500/20 text-blue-400 border-blue-500/40",
          icon: CheckCircle2,
        };
      case "cancelled":
        return {
          label: isRtl ? "ملغي" : "Cancelled",
          color: "bg-red-500/20 text-red-400 border-red-500/40",
          icon: AlertCircle,
        };
      case "awaiting_deposit":
      default:
        return {
          label: isRtl ? "بانتظار العربون" : "Awaiting Deposit",
          color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: Clock,
        };
    }
  };

  const getTripStatusBadge = (status: string) => {
    switch (status) {
      case "contacted":
        return {
          label: isRtl ? "تم التواصل" : "Contacted",
          color: "bg-primary/20 text-primary border-primary/40",
        };
      case "quoted":
        return {
          label: isRtl ? "تم تقديم العرض" : "Quoted",
          color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        };
      case "converted":
        return {
          label: isRtl ? "تم التحويل لحجز" : "Converted to Booking",
          color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        };
      case "archived":
        return {
          label: isRtl ? "مؤرشف" : "Archived",
          color: "bg-outline-variant/30 text-on-surface-variant border-outline-variant/40",
        };
      case "new":
      default:
        return {
          label: isRtl ? "طلب جديد" : "New Inquiry",
          color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        };
    }
  };

  // Filter Bookings (Upcoming vs Past)
  const todayStr = new Date().toISOString().split("T")[0];
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "all") return true;
    const isPast =
      b.bookingStatus === "completed" ||
      b.bookingStatus === "cancelled" ||
      (b.departureDate && b.departureDate < todayStr);
    return bookingFilter === "past" ? isPast : !isPast;
  });

  const upcomingCount = bookings.filter((b) => {
    return (
      b.bookingStatus !== "completed" &&
      b.bookingStatus !== "cancelled" &&
      (!b.departureDate || b.departureDate >= todayStr)
    );
  }).length;

  const pastCount = bookings.length - upcomingCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs text-on-surface-variant font-mono">
            {isRtl ? "جارٍ تحميل محفظة كبار الشخصيات..." : "Loading VIP portfolio..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <Header dict={dict} currentLocale={currentLocale} />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <Link
            href={`/${currentLocale}`}
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Arrow className="w-3.5 h-3.5 rotate-180" />
            <span>{dict.nav.home}</span>
          </Link>
          <span className="text-[11px] uppercase tracking-wider text-primary font-mono">
            {isRtl ? "محفظة كبار الشخصيات" : "VIP Guest Portfolio"}
          </span>
        </div>

        {loadError && (
          <div className="p-4 rounded-2xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Profile Banner */}
        <div className="bg-surface-container rounded-3xl border border-primary/30 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary font-headline text-2xl font-bold flex items-center justify-center shadow-lg shadow-primary/20">
              {currentUser?.user?.fullName?.charAt(0) || "G"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline text-xl sm:text-2xl text-on-surface font-semibold">
                  {currentUser?.user?.fullName || "Valued Guest"}
                </h1>
                {currentUser?.isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[10px] font-mono uppercase tracking-wider font-bold">
                    Staff Clearance
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant font-mono">
                {currentUser?.user?.email} {currentUser?.user?.phone && `• ${currentUser.user.phone}`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {currentUser?.isAdmin && (
              <Link
                href={`/${currentLocale}/admin`}
                className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container border border-primary/40 text-primary text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span>{isRtl ? "لوحة الإدارة" : "Operations Desk"}</span>
              </Link>
            )}

            <button
              onClick={() => setShowProfileModal(true)}
              className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? "تعديل الملف" : "Edit Profile"}</span>
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? "كلمة المرور" : "Security"}</span>
            </button>

            <button
              onClick={() => setShowLinkModal(true)}
              className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? "ربط حجز سابق" : "Link Booking"}</span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:text-error text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isRtl ? "خروج" : "Sign Out"}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/20 gap-2 sm:gap-6 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "bookings"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{isRtl ? "الحجوزات والرحلات" : "Reservations & Itineraries"}</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-mono text-[10px]">
              {bookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("custom_trips")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "custom_trips"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRtl ? "طلبات الرحلات الخاصة" : "Bespoke Journey Briefs"}</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-mono text-[10px]">
              {customTrips.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{isRtl ? "الملف الشخصي والأمان" : "Profile & Security"}</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: RESERVATION PORTFOLIO
            ========================================================================= */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-surface-container p-1 rounded-xl border border-outline-variant/20 text-xs font-semibold">
                <button
                  onClick={() => setBookingFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    bookingFilter === "all"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {isRtl ? "كافة الحجوزات" : "All Departures"} ({bookings.length})
                </button>
                <button
                  onClick={() => setBookingFilter("upcoming")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    bookingFilter === "upcoming"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {isRtl ? "الرحلات القادمة" : "Upcoming"} ({upcomingCount})
                </button>
                <button
                  onClick={() => setBookingFilter("past")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    bookingFilter === "past"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {isRtl ? "الرحلات السابقة" : "Past"} ({pastCount})
                </button>
              </div>

              <Link
                href={`/${currentLocale}#services`}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{isRtl ? "استكشاف خدمات جديدة" : "Book New Experience"}</span>
                <Arrow className="w-3 h-3" />
              </Link>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-surface-container rounded-3xl border border-primary/20 p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-primary mx-auto flex items-center justify-center">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-headline text-base text-on-surface font-semibold">
                  {bookingFilter === "upcoming"
                    ? isRtl
                      ? "لا توجد رحلات قادمة مجدولة"
                      : "No Upcoming Departures"
                    : isRtl
                    ? "لا توجد حجوزات في هذه القائمة"
                    : "No Reservations Found in this View"}
                </h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  {isRtl
                    ? "ابدأ بتنسيق رحلتك الخاصة القادمة في قطر أو اربط حجزاً سابقاً برقم الحجز المرجعي."
                    : "Curate your next private expedition in Qatar or link an existing reservation using your reference number."}
                </p>
                <div className="pt-2">
                  <Link
                    href={`/${currentLocale}#services`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{isRtl ? "استكشاف الخدمات الـ 8" : "Explore 8 Signature Services"}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredBookings.map((booking) => {
                  const matchedService = dict.services.find((s) => s.id === booking.serviceId);
                  const badge = getStatusBadge(booking.bookingStatus);
                  const StatusIcon = badge.icon;
                  const whatsAppUrl = getWhatsAppInquiryUrl(
                    `Hello MZ Tourism Qatar, I am inquiring regarding booking: ${booking.bookingRef}`
                  );

                  return (
                    <div
                      key={booking.id}
                      className="bg-surface-container rounded-3xl border border-outline-variant/30 hover:border-primary/40 transition-colors p-5 sm:p-6 shadow-xl space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/20 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary tracking-wider">
                              {booking.bookingRef}
                            </span>
                            <span className="text-on-surface-variant text-xs">•</span>
                            <span className="text-xs text-on-surface-variant font-mono">
                              {formatDate(booking.createdAt, currentLocale)}
                            </span>
                          </div>
                          <h3 className="font-headline text-lg sm:text-xl text-on-surface font-semibold">
                            {matchedService ? matchedService.title : booking.serviceId}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {booking.proofStatus && booking.proofStatus !== "not_submitted" && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono capitalize border ${
                                booking.proofStatus === "accepted"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : booking.proofStatus === "rejected"
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-primary/20 text-primary border-primary/30"
                              }`}
                            >
                              {booking.proofStatus === "accepted"
                                ? isRtl
                                  ? "العربون معتمد"
                                  : "Deposit Approved"
                                : booking.proofStatus === "rejected"
                                ? isRtl
                                  ? "الإيصال مرفوض"
                                  : "Proof Declined"
                                : isRtl
                                ? "الإيصال قيد التدقيق"
                                : "Proof Under Review"}
                            </span>
                          )}
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold self-start sm:self-auto ${badge.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{badge.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rejection notice if declined by operations desk */}
                      {booking.proofStatus === "rejected" && booking.rejectionReason && (
                        <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs space-y-1">
                          <strong className="block text-[10px] uppercase font-mono tracking-wider">
                            {isRtl ? "ملاحظة تدقيق الإيصال من فريق العمليات:" : "Operations Desk Review Note:"}
                          </strong>
                          <p>{booking.rejectionReason}</p>
                        </div>
                      )}

                      {/* Key details row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                            {isRtl ? "الموعد" : "Travel Date"}
                          </span>
                          <span className="text-on-surface font-medium">
                            {booking.departureDate || (isRtl ? "قيد التنسيق" : "Flexible")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                            {isRtl ? "الفترة والضيوف" : "Timing & Guests"}
                          </span>
                          <span className="text-on-surface font-medium line-clamp-1">
                            {booking.timeWindow || "Standard"} • {booking.paxCount} Pax
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                            {isRtl ? "العربون" : "Deposit"}
                          </span>
                          <span className="text-primary font-mono font-semibold">
                            {booking.depositRequired > 0
                              ? `${booking.depositRequired} ${booking.currency}`
                              : isRtl
                              ? "حسب العرض"
                              : "Per Quote"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                            {isRtl ? "حالة الدفع" : "Payment"}
                          </span>
                          <span className="text-on-surface font-medium capitalize">
                            {booking.paymentStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/15">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleOpenDossier(booking.id)}
                            disabled={loadingDossier}
                            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isRtl ? "عرض ملف الرحلة" : "View Dossier & Itinerary"}</span>
                          </button>

                          {booking.uploadToken && (
                            <Link
                              href={`/${currentLocale}/booking/${booking.uploadToken}`}
                              className="px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container border border-primary/30 text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <Receipt className="w-3.5 h-3.5 text-primary" />
                              <span>
                                {booking.proofStatus === "rejected"
                                  ? isRtl
                                    ? "إعادة رفع الإيصال"
                                    : "Re-Upload Receipt"
                                  : isRtl
                                  ? "تتبع الحجز والعربون"
                                  : "Deposit Tracker"}
                              </span>
                            </Link>
                          )}
                        </div>

                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/20 text-primary text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{isRtl ? "تنسيق عبر واتساب" : "Chat on WhatsApp"}</span>
                          <ExternalLink className="w-3 h-3 opacity-75" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: BESPOKE JOURNEY BRIEFS (CUSTOM TRIPS)
            ========================================================================= */}
        {activeTab === "custom_trips" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-lg sm:text-xl text-on-surface font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>{isRtl ? "سجل طلبات الرحلات الخاصة" : "Bespoke Journey Inquiries"}</span>
                <span className="text-xs text-on-surface-variant font-mono font-normal">
                  ({customTrips.length})
                </span>
              </h2>

              <Link
                href={`/${currentLocale}#custom-trip`}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{isRtl ? "طلب رحلة خاصة جديدة" : "New Bespoke Inquiry"}</span>
                <Arrow className="w-3 h-3" />
              </Link>
            </div>

            {customTrips.length === 0 ? (
              <div className="bg-surface-container rounded-3xl border border-primary/20 p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-primary mx-auto flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-headline text-base text-on-surface font-semibold">
                  {isRtl ? "لا توجد طلبات رحلات خاصة مسجلة" : "No Custom Journey Briefs"}
                </h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  {isRtl
                    ? "هل ترغب في جدول سياحي مخصص حسب اهتماماتك؟ صمم برنامجك المفضل مع مستشارينا."
                    : "Looking for a tailored Qatar experience? Curate a bespoke itinerary with our luxury travel advisors."}
                </p>
                <div className="pt-2">
                  <Link
                    href={`/${currentLocale}#custom-trip`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isRtl ? "تصميم برنامج خاص" : "Curate Bespoke Journey"}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {customTrips.map((trip) => {
                  const badge = getTripStatusBadge(trip.status);
                  const whatsAppUrl = getWhatsAppInquiryUrl(
                    `Hello MZ Tourism Qatar, I am following up on custom trip inquiry: ${trip.requestRef}`
                  );

                  return (
                    <div
                      key={trip.id}
                      className="bg-surface-container rounded-3xl border border-outline-variant/30 p-5 sm:p-6 shadow-xl space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-outline-variant/20 gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary tracking-wider">
                              {trip.requestRef}
                            </span>
                            <span className="text-on-surface-variant text-xs">•</span>
                            <span className="text-xs text-on-surface-variant font-mono">
                              {formatDate(trip.createdAt, currentLocale)}
                            </span>
                          </div>
                          <h3 className="font-headline text-base sm:text-lg text-on-surface font-semibold">
                            {trip.destinations.join(" • ") || "Qatar Custom Itinerary"}
                          </h3>
                        </div>

                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border self-start sm:self-auto ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Destinations and Experiences Badges */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant mr-1">
                            {isRtl ? "الوجهات:" : "Destinations:"}
                          </span>
                          {trip.destinations.map((d) => (
                            <span
                              key={d}
                              className="px-2 py-0.5 rounded-lg bg-surface-container-high border border-outline-variant/30 text-on-surface text-[11px]"
                            >
                              {d}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant mr-1">
                            {isRtl ? "التجارب:" : "Experiences:"}
                          </span>
                          {trip.experiences.map((e) => (
                            <span
                              key={e}
                              className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/25 text-primary text-[11px]"
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Overview metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                            {isRtl ? "عدد الضيوف" : "Party Size"}
                          </span>
                          <span className="text-on-surface font-medium">{trip.partySize}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                            {isRtl ? "الفترة المحددة" : "Timeframe"}
                          </span>
                          <span className="text-on-surface font-medium">{trip.timeframe}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                            {isRtl ? "الميزانية المتوقعة" : "Budget Range"}
                          </span>
                          <span className="text-on-surface font-medium">{trip.budgetRange}</span>
                        </div>
                      </div>

                      {trip.specialRequests && (
                        <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 text-xs text-on-surface-variant font-mono whitespace-pre-line">
                          {trip.specialRequests}
                        </div>
                      )}

                      {/* Proposal Banner if generated */}
                      {trip.proposal && (
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-primary">
                                {trip.proposal.proposalRef}
                              </span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-semibold">
                                {trip.proposal.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-on-surface">
                              {isRtl ? trip.proposal.titleAr : trip.proposal.titleEn}
                            </h4>
                            <p className="text-xs text-on-surface-variant font-mono">
                              {isRtl ? "القيمة المتفق عليها:" : "Total Quotation:"}{" "}
                              <span className="font-bold text-primary">
                                {trip.proposal.totalPrice.toLocaleString("en-US")} QAR
                              </span>
                              {" • "}
                              {isRtl ? "يسري حتى:" : "Valid until:"}{" "}
                              {trip.proposal.validUntil}
                            </p>
                          </div>

                          <Link
                            href={`/${currentLocale}/proposals/${trip.proposal.guestToken}`}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-md shadow-primary/20 whitespace-nowrap"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isRtl ? "معاينة واعتماد البرنامج" : "Review Itinerary & Proposal"}</span>
                            <Arrow className="w-3 h-3" />
                          </Link>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-end border-t border-outline-variant/15 gap-2">
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container border border-primary/30 text-primary text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{isRtl ? "متابعة الطلب عبر واتساب" : "Follow Up on WhatsApp"}</span>
                          <ExternalLink className="w-3 h-3 opacity-75" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: PROFILE & SECURITY SETTINGS
            ========================================================================= */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Info Card */}
            <div className="bg-surface-container rounded-3xl border border-outline-variant/30 p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <h3 className="font-headline text-lg text-on-surface font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span>{isRtl ? "بيانات الحساب الأساسية" : "Profile Credentials"}</span>
                </h3>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  {isRtl ? "تعديل" : "Edit"}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                    {isRtl ? "الاسم الكامل" : "Full Name"}
                  </span>
                  <span className="text-on-surface font-medium text-sm">
                    {currentUser?.user?.fullName || "Valued Guest"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                    {isRtl ? "البريد الإلكتروني" : "Email Address"}
                  </span>
                  <span className="text-on-surface font-mono">{currentUser?.user?.email}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                    {isRtl ? "رقم الهاتف / واتساب" : "Mobile / WhatsApp"}
                  </span>
                  <span className="text-on-surface font-mono">
                    {currentUser?.user?.phone || (isRtl ? "غير مسجل" : "Not configured")}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                    {isRtl ? "اللغة المفضلة" : "Preferred Language"}
                  </span>
                  <span className="text-on-surface font-medium">
                    {currentUser?.user?.preferredLocale === "ar" ? "العربية" : "English"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>{isRtl ? "تحديث معلومات الملف الشخصي" : "Update Profile Information"}</span>
                </button>
              </div>
            </div>

            {/* Security & Access Card */}
            <div className="bg-surface-container rounded-3xl border border-outline-variant/30 p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <h3 className="font-headline text-lg text-on-surface font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>{isRtl ? "الأمان وكلمة المرور" : "Security & Authentication"}</span>
                </h3>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isRtl
                  ? "بيانات دخولك وحسابك مؤمنة بأعلى معايير التشفير والحماية المعتمدة لدى إم زد للسياحة قطر. يمكنك تحديث كلمة المرور في أي وقت."
                  : "Your guest credentials and portfolio are encrypted with enterprise-grade luxury security standards. You can rotate your password anytime."}
              </p>

              <div className="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-1 text-xs">
                <span className="text-[10px] uppercase font-mono text-primary font-bold block">
                  {isRtl ? "مستوى التشفير" : "Encryption Clearance"}
                </span>
                <span className="text-on-surface">End-to-End Encrypted Session Cookies</span>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isRtl ? "تغيير كلمة المرور" : "Change Account Password"}</span>
                </button>

                <button
                  onClick={() => setShowLinkModal(true)}
                  className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>{isRtl ? "ربط حجز ضيف سابق بحسابي" : "Link Previous Guest Booking"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 1: BOOKING DOSSIER DETAIL MODAL
            ========================================================================= */}
        {selectedDossier && (
          <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface-container border border-primary/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div>
                  <span className="font-mono text-xs font-bold text-primary tracking-wider block">
                    {selectedDossier.bookingRef}
                  </span>
                  <h3 className="font-headline text-lg sm:text-xl text-on-surface font-semibold">
                    {dict.services.find((s) => s.id === selectedDossier.serviceId)?.title ||
                      selectedDossier.serviceId}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDossier(null)}
                  className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-surface-container-high p-4 rounded-2xl border border-outline-variant/20">
                <div>
                  <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                    {isRtl ? "حالة الحجز" : "Booking Status"}
                  </span>
                  <span className="font-semibold text-on-surface capitalize">
                    {selectedDossier.bookingStatus.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                    {isRtl ? "حالة الدفع" : "Payment Status"}
                  </span>
                  <span className="font-semibold text-on-surface capitalize">
                    {selectedDossier.paymentStatus.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                    {isRtl ? "تاريخ الرحلة" : "Departure Date"}
                  </span>
                  <span className="font-semibold text-on-surface">
                    {selectedDossier.departureDate || "Flexible"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-on-surface-variant block">
                    {isRtl ? "عدد الضيوف" : "Guests"}
                  </span>
                  <span className="font-semibold text-on-surface">
                    {selectedDossier.paxCount} Pax
                  </span>
                </div>
              </div>

              {/* Itinerary & Pickup Details */}
              <div className="space-y-3 text-xs">
                {selectedDossier.pickupLocation && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      <strong className="text-on-surface">{isRtl ? "موقع التوصيل:" : "Pickup Location:"}</strong>{" "}
                      {selectedDossier.pickupLocation}
                    </span>
                  </div>
                )}

                {selectedDossier.timeWindow && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      <strong className="text-on-surface">{isRtl ? "الفترة الزمنية:" : "Time Window:"}</strong>{" "}
                      {selectedDossier.timeWindow}
                    </span>
                  </div>
                )}

                {selectedDossier.notes && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-1">
                    <strong className="text-on-surface block text-[10px] uppercase font-mono">
                      {isRtl ? "ملاحظات وتفضيلات الضيف:" : "Guest Preferences & Special Requests:"}
                    </strong>
                    <p className="text-on-surface-variant whitespace-pre-line font-mono text-[11px]">
                      {selectedDossier.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Reconciliation */}
              <div className="p-4 rounded-2xl bg-surface-container-high border border-primary/20 space-y-2">
                <span className="text-[10px] uppercase font-mono text-primary font-bold block">
                  {isRtl ? "البيان المالي للحجز" : "Financial Statement"}
                </span>
                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">
                      {isRtl ? "العربون المطلوب" : "Deposit Required"}
                    </span>
                    <span className="text-on-surface font-semibold">
                      {selectedDossier.depositRequired} {selectedDossier.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">
                      {isRtl ? "المدفوع المعتمد" : "Deposit Paid"}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {selectedDossier.depositPaid} {selectedDossier.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">
                      {isRtl ? "المتبقي" : "Balance Due"}
                    </span>
                    <span className="text-primary font-semibold">
                      {selectedDossier.balanceDue} {selectedDossier.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deposit Proofs / Receipts with Signed Preview Links */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-primary" />
                  <span>{isRtl ? "إيصالات العربون المرفوعة" : "Submitted Deposit Receipts"}</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    ({selectedDossier.proofs.length})
                  </span>
                </h4>

                {selectedDossier.proofs.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic p-3 rounded-xl bg-surface-container-high">
                    {isRtl ? "لم يتم رفع إيصالات بعد." : "No deposit receipts submitted yet."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDossier.proofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-on-surface">{proof.fileName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono capitalize ${
                                proof.reviewStatus === "accepted"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : proof.reviewStatus === "rejected"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-primary/20 text-primary"
                              }`}
                            >
                              {proof.reviewStatus}
                            </span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-mono block">
                            {formatDateTime(proof.uploadedAt, currentLocale)} • {(proof.fileSize / 1024).toFixed(1)} KB
                          </span>
                          {proof.reviewStatus === "rejected" && proof.rejectionReason && (
                            <p className="text-xs text-error mt-1">{proof.rejectionReason}</p>
                          )}
                        </div>

                        {proof.signedUrl && (
                          <a
                            href={proof.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-lowest border border-primary/30 text-primary text-xs font-semibold flex items-center gap-1 shrink-0"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isRtl ? "معاينة آمنة" : "Secure View"}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-outline-variant/20">
                <Link
                  href={`/${currentLocale}/booking/${selectedDossier.uploadToken}`}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{isRtl ? "فتح صفحة رفع العربون الرسمية ←" : "Open Official Deposit Page →"}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedDossier(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface font-semibold hover:bg-surface-container"
                >
                  {isRtl ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: EDIT PROFILE MODAL
            ========================================================================= */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-container border border-primary/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-headline text-lg text-on-surface font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>{isRtl ? "تعديل الملف الشخصي" : "Edit Profile"}</span>
              </h3>

              {profileMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMessage.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                      : "bg-error/15 border border-error/30 text-error"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "رقم الهاتف / واتساب" : "Mobile / WhatsApp"}
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+974 5500 0000"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "اللغة المفضلة" : "Preferred Language"}
                  </label>
                  <select
                    value={profileLocale}
                    onChange={(e) => setProfileLocale(e.target.value as "en" | "ar")}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileModal(false);
                      setProfileMessage(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-50"
                  >
                    {profileLoading ? "..." : isRtl ? "حفظ التغييرات" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: CHANGE PASSWORD MODAL
            ========================================================================= */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-container border border-primary/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-headline text-lg text-on-surface font-semibold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <span>{isRtl ? "تغيير كلمة المرور" : "Change Password"}</span>
              </h3>

              {passwordMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                      : "bg-error/15 border border-error/30 text-error"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "كلمة المرور الجديدة" : "New Password"}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1">
                    {isRtl ? "تأكيد كلمة المرور" : "Confirm New Password"}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordMessage(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-50"
                  >
                    {passwordLoading ? "..." : isRtl ? "تحديث كلمة المرور" : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 4: LINK BOOKING MODAL
            ========================================================================= */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-surface-container border border-primary/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-headline text-lg text-on-surface font-semibold">
                {isRtl ? "ربط حجز ضيف بحسابك" : "Link Guest Booking"}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isRtl
                  ? "أدخل الرقم المرجعي لحجزك (مثال MZ-XXXXXXXX). سيتم التحقق من تطابق البريد الإلكتروني وربطه فوراً بمحفظتك."
                  : "Enter the Booking Reference (MZ-XXXXXXXX). The reservation will be linked to your portfolio if the registered email matches."}
              </p>

              {linkMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    linkMessage.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                      : "bg-error/15 border border-error/30 text-error"
                  }`}
                >
                  {linkMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{linkMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleLinkBooking} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="MZ-XXXXXXXX"
                  value={linkRef}
                  onChange={(e) => setLinkRef(e.target.value.toUpperCase())}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono text-xs sm:text-sm tracking-wider focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkModal(false);
                      setLinkMessage(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={linkLoading}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-50"
                  >
                    {linkLoading ? "..." : isRtl ? "ربط الحجز" : "Link Booking"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
