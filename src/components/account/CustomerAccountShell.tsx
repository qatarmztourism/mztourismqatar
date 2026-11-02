"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Locale, TranslationDict } from "@/translations";
import { getCurrentUserAction, signOutAction } from "@/lib/server/auth-actions";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import {
  Compass,
  Calendar,
  Receipt,
  User,
  Shield,
  LogOut,
  Globe,
  MessageCircle,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface CustomerAccountShellProps {
  children: React.ReactNode;
  locale: Locale;
  dict?: TranslationDict;
}

interface UserInfo {
  id: string;
  email?: string;
  fullName: string;
  phone?: string;
}

export default function CustomerAccountShell({
  children,
  locale,
}: CustomerAccountShellProps) {
  const isRtl = locale === "ar";
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const pathname = usePathname() || `/${locale}/account`;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Determine other locale path for language switcher
  const switchLocalePath = pathname.startsWith("/en")
    ? pathname.replace(/^\/en/, "/ar")
    : pathname.replace(/^\/ar/, "/en");

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const res = await getCurrentUserAction();
        if (!mounted) return;
        if (!res.success || !res.data?.user) {
          router.push(`/${locale}/login`);
          return;
        }
        setUser(res.data.user);
      } catch (err) {
        console.error("[Account Shell Auth Error]", err);
        if (mounted) router.push(`/${locale}/login`);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [locale, router]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOutAction();
      router.push(`/${locale}`);
      router.refresh();
    } catch (err) {
      console.error("[Sign Out Error]", err);
      setSigningOut(false);
    }
  };

  const navLinks = [
    {
      href: `/${locale}/account`,
      label: isRtl ? "نظرة عامة على المحفظة" : "Portfolio Overview",
      icon: Compass,
      exact: true,
    },
    {
      href: `/${locale}/account/bookings`,
      label: isRtl ? "حجوزاتي والرحلات" : "My Reservations",
      icon: Calendar,
      exact: false,
    },
    {
      href: `/${locale}/account/payments`,
      label: isRtl ? "المدفوعات والإيصالات" : "Payments & Receipts",
      icon: Receipt,
      exact: false,
    },
    {
      href: `/${locale}/account/profile`,
      label: isRtl ? "الملف الشخصي والأمان" : "Profile & Security",
      icon: User,
      exact: false,
    },
  ];

  const getIsActive = (linkHref: string, exact: boolean) => {
    if (exact) {
      return pathname === linkHref;
    }
    return pathname.startsWith(linkHref);
  };

  const userInitials = (user?.fullName || "MZ")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const whatsappConciergeUrl = getWhatsAppInquiryUrl(
    isRtl
      ? `مرحباً إم زد للسياحة قطر، أنا العميل (${user?.fullName || "VIP"})، أحتاج إلى مساعدة الكونسيرج.`
      : `Hello MZ Tourism Qatar, I am client (${user?.fullName || "VIP"}), requesting concierge assistance.`
  );

  if (loading) {
    return (
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`min-h-screen bg-[#0F1115] text-[#F3ECE1] flex items-center justify-center ${
          isRtl ? "font-cairo" : "font-sans"
        }`}
      >
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full border border-[#C29B38]/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#C29B38] animate-spin" />
            </div>
            <Sparkles className="w-4 h-4 text-[#C29B38] absolute -top-1 -right-1 animate-pulse" />
          </div>
          <p className="text-sm font-medium tracking-widest uppercase text-[#C29B38]">
            {isRtl ? "جارٍ تحميل محفظة كبار الشخصيات..." : "Loading VIP Concierge Portfolio..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={`min-h-screen bg-[#0A0B0E] text-[#F3ECE1] flex flex-col md:flex-row ${
        isRtl ? "font-cairo" : "font-sans"
      }`}
    >
      {/* ============================================================== */}
      {/* DESKTOP LUXURY SIDEBAR                                         */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 bg-[#0F1115] border-r border-[#C29B38]/20 shrink-0 sticky top-0 h-screen z-40">
        {/* Brand Crest */}
        <div className="p-6 border-b border-stone-800/80 bg-gradient-to-b from-[#72132B]/15 to-transparent">
          <Link
            href={`/${locale}`}
            className="group block transition-opacity hover:opacity-90"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C29B38] via-[#85651B] to-[#72132B] flex items-center justify-center shadow-lg shadow-[#C29B38]/10 text-stone-950 font-bold text-sm tracking-wider">
                MZ
              </div>
              <div>
                <span className="font-serif text-base tracking-widest text-[#F3ECE1] block font-semibold leading-tight group-hover:text-[#C29B38] transition-colors">
                  MZ TOURISM
                </span>
                <span className="text-[10px] tracking-[0.25em] text-[#C29B38] uppercase block">
                  QATAR • LUXURY
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Customer VIP Identity Card */}
        <div className="p-5 border-b border-stone-800/80 bg-stone-900/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#72132B] to-[#0F1115] border border-[#C29B38]/40 flex items-center justify-center font-serif text-[#C29B38] font-semibold text-sm shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-100 truncate">
                {user?.fullName || "VIP Guest"}
              </p>
              <p className="text-xs text-stone-400 truncate">
                {user?.email || "concierge@client"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="w-3 h-3 text-[#C29B38]" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#C29B38]">
                  {isRtl ? "عميل معتمد" : "Verified Client"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const active = getIsActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? "bg-[#C29B38]/15 text-[#C29B38] border border-[#C29B38]/30 shadow-sm"
                    : "text-stone-300 hover:text-[#F3ECE1] hover:bg-stone-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      active ? "text-[#C29B38]" : "text-stone-400 group-hover:text-[#C29B38]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C29B38]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-stone-800/80 space-y-2 bg-stone-950/40">
          {/* WhatsApp VIP Concierge */}
          <a
            href={whatsappConciergeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-emerald-300 hover:bg-emerald-900/40 transition-colors text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>{isRtl ? "كونسيرج واتساب المباشر" : "Direct WhatsApp Liaison"}</span>
            </div>
            <ExternalLink className="w-3 h-3 text-emerald-400/70" />
          </a>

          {/* Language Switcher */}
          <Link
            href={switchLocalePath}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-stone-300 hover:text-[#F3ECE1] hover:bg-stone-800/50 transition-colors text-xs"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-stone-400" />
              <span>{isRtl ? "English" : "العربية"}</span>
            </div>
            <Chevron className="w-3.5 h-3.5 text-stone-500" />
          </Link>

          {/* Return to Public Website */}
          <Link
            href={`/${locale}`}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors text-xs"
          >
            <span>{isRtl ? "الموقع الرئيسي" : "Main Website"}</span>
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </Link>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/20 transition-colors text-xs disabled:opacity-50"
          >
            {signingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{isRtl ? "تسجيل الخروج" : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE STICKY TOP BAR                                          */}
      {/* ============================================================== */}
      <div className="md:hidden sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-md border-b border-[#C29B38]/20 px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C29B38] to-[#72132B] flex items-center justify-center font-bold text-xs text-stone-950">
            MZ
          </div>
          <div>
            <span className="font-serif text-sm font-semibold tracking-wider text-[#F3ECE1] block">
              MZ TOURISM
            </span>
            <span className="text-[9px] tracking-widest text-[#C29B38] uppercase block">
              QATAR
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={switchLocalePath}
            className="p-1.5 text-xs text-stone-300 border border-stone-700 rounded-md"
          >
            {isRtl ? "EN" : "عربي"}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-200 hover:text-[#C29B38] transition-colors"
            aria-label="Toggle navigation drawer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0F1115]/98 backdrop-blur-xl flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-6 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#72132B] border border-[#C29B38] flex items-center justify-center font-serif text-[#C29B38] font-bold">
                {userInitials}
              </div>
              <div>
                <p className="font-medium text-stone-100 text-sm">{user?.fullName || "VIP Guest"}</p>
                <p className="text-xs text-stone-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-stone-400 hover:text-stone-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="py-6 space-y-2 flex-1">
            {navLinks.map((item) => {
              const active = getIsActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#C29B38]/20 text-[#C29B38] border border-[#C29B38]/30"
                      : "text-stone-300 hover:bg-stone-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  <Chevron className="w-4 h-4 opacity-70" />
                </Link>
              );
            })}
          </div>

          <div className="pt-6 border-t border-stone-800 space-y-3">
            <a
              href={whatsappConciergeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isRtl ? "محادثة الكونسيرج (واتساب)" : "WhatsApp VIP Concierge"}</span>
            </a>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm font-medium"
            >
              {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>{isRtl ? "تسجيل الخروج" : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA                                              */}
      {/* ============================================================== */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">{children}</div>
      </main>
    </div>
  );
}
