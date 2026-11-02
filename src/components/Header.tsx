"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Locale, TranslationDict } from "@/translations";
import { siteConfig, getWhatsAppInquiryUrl } from "@/config/site-config";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  MessageCircle,
  Globe,
  Shield,
  User,
  Mail,
  Phone,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Compass,
} from "lucide-react";
import { getPublicNavigationAction } from "@/lib/server/cms-actions";
import type { Database } from "@/lib/supabase/database.types";

type CmsNavigationRow = Database["public"]["Tables"]["cms_navigation"]["Row"];

interface HeaderProps {
  dict: TranslationDict;
  currentLocale: Locale;
  onOpenInquiryModal?: (serviceId?: string) => void;
}

interface UserSessionInfo {
  email?: string;
  fullName?: string;
}

export default function Header({
  dict,
  currentLocale,
  onOpenInquiryModal,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserSessionInfo | null>(null);
  const [cmsNavItems, setCmsNavItems] = useState<CmsNavigationRow[]>([]);

  useEffect(() => {
    getPublicNavigationAction("header").then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setCmsNavItems(res.data);
      }
    });
  }, []);

  const pathname = usePathname() || `/${currentLocale}`;
  const isRtl = currentLocale === "ar";
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const otherLocale: Locale = currentLocale === "en" ? "ar" : "en";
  const otherLocaleLabel = currentLocale === "en" ? "العربية" : "English";

  // Calculate equivalent path in the alternate language
  let switchLocalePath = `/${otherLocale}`;
  if (pathname.startsWith("/en")) {
    switchLocalePath = pathname.replace(/^\/en/, "/ar");
  } else if (pathname.startsWith("/ar")) {
    switchLocalePath = pathname.replace(/^\/ar/, "/en");
  }

  // Scroll listener for smooth luxury sticky transition
  useEffect(() => {
    const handleScroll = () => {
      const isPastThreshold = window.scrollY > 20;
      setScrolled(isPastThreshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen to Supabase client auth state to dynamically reflect Login vs My Account
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted && data?.user) {
        setUser({
          email: data.user.email,
          fullName:
            (data.user.user_metadata?.full_name as string) ||
            (data.user.user_metadata?.name as string) ||
            (data.user.email ? data.user.email.split("@")[0] : "VIP Guest"),
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        if (session?.user) {
          setUser({
            email: session.user.email,
            fullName:
              (session.user.user_metadata?.full_name as string) ||
              (session.user.user_metadata?.name as string) ||
              (session.user.email ? session.user.email.split("@")[0] : "VIP Guest"),
          });
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Close drawer on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const defaultVipMessage =
    currentLocale === "ar"
      ? "مرحباً إم زد للسياحة قطر، أود الاستفسار والتنسيق لرحلة خاصة في قطر."
      : "Hello MZ Tourism Qatar, I would like to plan a bespoke private experience in Qatar.";

  const whatsAppUrl = getWhatsAppInquiryUrl(defaultVipMessage);

  const isActive = (path: string) => {
    if (path === `/${currentLocale}`) {
      return pathname === `/${currentLocale}` || pathname === `/${currentLocale}/`;
    }
    return pathname.startsWith(path);
  };

  const navLinks =
    cmsNavItems.length > 0
      ? [
          { href: `/${currentLocale}`, label: dict.nav.home },
          ...cmsNavItems.map((item) => ({
            href: item.url.startsWith("/")
              ? `/${currentLocale}${item.url.replace(/^\/(en|ar)/, "")}`
              : item.url,
            label: isRtl ? item.label_ar : item.label_en,
          })),
        ]
      : [
          { href: `/${currentLocale}`, label: dict.nav.home },
          { href: `/${currentLocale}/services`, label: dict.nav.services },
          { href: `/${currentLocale}/about`, label: dict.nav.about },
          { href: `/${currentLocale}/blog`, label: dict.nav.blog },
          { href: `/${currentLocale}/contact`, label: dict.nav.contact },
        ];

  const handleBookClick = () => {
    if (onOpenInquiryModal) {
      onOpenInquiryModal();
    } else {
      window.location.href = `/${currentLocale}/services`;
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[#0F1115]/95 backdrop-blur-xl border-b border-[#C29B38]/30 shadow-[0_12px_36px_rgba(0,0,0,0.85)]"
            : "bg-[#0F1115]/85 backdrop-blur-md border-b border-[#C29B38]/15 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
        }`}
      >
        {/* Top Micro-Utility Ribbon (Desktop / Tablet) */}
        <div className="hidden md:block border-b border-[#C29B38]/10 bg-[#0A0C0E]/70 text-[11px] text-[#D1C5B1]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 h-9 flex items-center justify-between">
            {/* Left Contact Information */}
            <div className="flex items-center gap-6">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="inline-flex items-center gap-1.5 hover:text-[#ECC15A] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#C29B38]" />
                <span className="font-mono">{siteConfig.contact.email}</span>
              </a>

              <a
                href={`tel:${siteConfig.whatsapp.number}`}
                className="inline-flex items-center gap-1.5 hover:text-[#ECC15A] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#C29B38]" />
                <span className="font-mono">{siteConfig.whatsapp.display}</span>
              </a>
            </div>

            {/* Right: Licensing Badge & Direct Language Toggle */}
            <div className="flex items-center gap-5">
              <div className="hidden lg:flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#9A907D]">
                <Shield className="w-3 h-3 text-[#C29B38]" />
                <span>{dict.brand.licensedBadge}</span>
              </div>

              <div className="h-3 w-[1px] bg-[#C29B38]/20 hidden lg:block" />

              <Link
                href={switchLocalePath}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ECC15A] hover:text-[#F3ECE1] transition-colors"
                title={currentLocale === "en" ? "التحويل إلى العربية" : "Switch to English"}
              >
                <Globe className="w-3.5 h-3.5 text-[#C29B38]" />
                <span>{otherLocaleLabel}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-[1440px] mx-auto h-20 px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
          {/* Brand Emblem & Typography */}
          <Link
            href={`/${currentLocale}`}
            className="flex items-center gap-3.5 group focus:outline-none focus:ring-1 focus:ring-[#C29B38] rounded-xl py-1 px-1 transition-all"
          >
            {/* Emblem */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1E2024] via-[#111317] to-[#72132B]/35 border border-[#C29B38]/45 flex items-center justify-center text-[#ECC15A] font-headline text-lg font-bold group-hover:border-[#ECC15A] group-hover:shadow-[0_0_16px_rgba(194,155,56,0.35)] transition-all shadow-md shrink-0">
              MZ
            </div>

            {/* Typography */}
            <div className="flex flex-col">
              <span className="font-headline text-lg sm:text-xl font-semibold tracking-wide text-[#F3ECE1] group-hover:text-[#ECC15A] transition-colors leading-tight">
                {isRtl ? "إم زد للسياحة" : "MZ TOURISM"}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#C29B38] tracking-[0.16em] uppercase mt-0.5 font-medium leading-none">
                {isRtl ? "قطر • كونسيرج خاص" : "QATAR • BESPOKE CONCIERGE"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-2 transition-all duration-200 group ${
                    active
                      ? "text-[#ECC15A] font-bold"
                      : "text-[#D1C5B1] hover:text-[#ECC15A]"
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gradient-to-r from-transparent via-[#C29B38] to-transparent rounded-full shadow-[0_0_8px_#ECC15A]" />
                  )}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#C29B38] group-hover:w-full transition-all duration-300 opacity-60" />
                </Link>
              );
            })}
          </nav>

          {/* Header Action Elements */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Customer Login / My Account Action */}
            <Link
              href={user ? `/${currentLocale}/account` : `/${currentLocale}/auth`}
              className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                user
                  ? "bg-[#1E2024]/80 hover:bg-[#282A2E] border-[#C29B38]/50 text-[#F3ECE1] hover:border-[#ECC15A] shadow-sm"
                  : "bg-[#1E2024]/50 hover:bg-[#1E2024] border-[#4E4636]/40 hover:border-[#C29B38]/60 text-[#D1C5B1] hover:text-[#ECC15A]"
              }`}
              title={user ? dict.nav.account : isRtl ? "تسجيل الدخول" : "Customer Sign In"}
            >
              {user ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ECC15A] to-[#C29B38] text-[#0F1115] text-[10px] font-bold flex items-center justify-center font-headline shadow-sm">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : "G"}
                  </div>
                  <span className="max-w-[120px] truncate">{dict.nav.account}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-[#C29B38]" />
                  <span>{isRtl ? "دخول الضيوف" : "Sign In"}</span>
                </>
              )}
            </Link>

            {/* Mobile/Tablet Language Pill */}
            <Link
              href={switchLocalePath}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E2024]/70 border border-[#C29B38]/30 text-[#ECC15A] text-xs font-medium"
              title={currentLocale === "en" ? "التحويل إلى العربية" : "Switch to English"}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{otherLocaleLabel}</span>
            </Link>

            {/* WhatsApp Concierge CTA */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E2024]/80 hover:bg-[#282A2E] border border-[#C29B38]/40 hover:border-[#ECC15A] text-[#F3ECE1] hover:text-[#ECC15A] transition-all text-xs font-semibold tracking-wider group shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <MessageCircle className="w-3.5 h-3.5 text-[#C29B38] group-hover:scale-110 transition-transform" />
              <span>{dict.nav.whatsAppVip}</span>
            </a>

            {/* Primary Booking / Inquiry Button */}
            <button
              onClick={handleBookClick}
              className="hidden md:inline-flex items-center justify-center min-h-[42px] px-5 rounded-xl bg-gradient-to-r from-[#C29B38] via-[#ECC15A] to-[#C29B38] hover:brightness-110 text-[#0F1115] text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(194,155,56,0.25)] hover:shadow-[0_0_25px_rgba(194,155,56,0.45)] cursor-pointer"
            >
              <span>{dict.nav.bookNow}</span>
            </button>

            {/* Mobile Menu Hamburger Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Concierge Navigation"
              className="xl:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#1E2024] border border-[#C29B38]/30 text-[#ECC15A] hover:bg-[#282A2E] hover:border-[#ECC15A] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Premium Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with Blur */}
          <div
            className="fixed inset-0 bg-[#0F1115]/85 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Aside */}
          <aside
            dir={isRtl ? "rtl" : "ltr"}
            className={`relative w-full max-w-sm bg-[#111317] border-primary/30 p-6 sm:p-7 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl transition-transform duration-300 ${
              isRtl ? "border-r border-[#C29B38]/30" : "border-l border-[#C29B38]/30"
            }`}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#4E4636]/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E2024] to-[#72132B]/30 border border-[#C29B38]/50 flex items-center justify-center text-[#ECC15A] font-headline text-base font-bold shadow-md">
                    MZ
                  </div>
                  <div>
                    <h3 className="font-headline text-base text-[#F3ECE1] font-semibold">
                      {isRtl ? "إم زد للسياحة قطر" : "MZ Tourism Qatar"}
                    </h3>
                    <p className="text-[10px] text-[#C29B38] uppercase tracking-wider font-medium">
                      {isRtl ? "كونسيرج الضيافة الفاخرة" : "VIP Concierge Desk"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Menu"
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1E2024] text-[#D1C5B1] hover:text-[#ECC15A] hover:bg-[#282A2E] transition-colors border border-[#4E4636]/30 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Account / Sign In Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E2024] to-[#16191F] border border-[#C29B38]/30 shadow-md">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ECC15A] to-[#C29B38] text-[#0F1115] text-sm font-bold flex items-center justify-center font-headline shadow-md">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : "G"}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] uppercase font-mono text-[#C29B38] block tracking-wider font-semibold">
                          {isRtl ? "حساب الضيف النشط" : "Authenticated Guest"}
                        </span>
                        <h4 className="font-headline text-sm text-[#F3ECE1] font-semibold truncate">
                          {user.fullName || "VIP Guest"}
                        </h4>
                      </div>
                    </div>

                    <Link
                      href={`/${currentLocale}/account`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#282A2E] hover:bg-[#333539] border border-[#C29B38]/40 text-[#ECC15A] text-xs font-semibold flex items-center justify-between transition-colors"
                    >
                      <span>{dict.nav.account}</span>
                      <Chevron className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#282A2E] border border-[#4E4636]/40 flex items-center justify-center text-[#C29B38]">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#F3ECE1] block">
                          {isRtl ? "بوابة الضيوف" : "Guest Portfolio"}
                        </span>
                        <span className="text-[10px] text-[#9A907D] block">
                          {isRtl ? "متابعة الحجوزات والعربونات" : "Track reservations & receipts"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/${currentLocale}/auth`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#C29B38] hover:bg-[#ECC15A] text-[#0F1115] text-xs font-bold transition-all shadow-sm shrink-0"
                    >
                      {isRtl ? "تسجيل الدخول" : "Sign In"}
                    </Link>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1 text-sm font-medium">
                {navLinks.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-xl flex items-center justify-between transition-all ${
                        active
                          ? "bg-[#1E2024] text-[#ECC15A] font-bold border border-[#C29B38]/30"
                          : "text-[#D1C5B1] hover:text-[#F3ECE1] hover:bg-[#1E2024]/60"
                      }`}
                    >
                      <span>{item.label}</span>
                      {active ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ECC15A] shadow-[0_0_6px_#ECC15A]" />
                      ) : (
                        <Chevron className="w-4 h-4 text-[#4E4636]" />
                      )}
                    </Link>
                  );
                })}

                {/* Booking Tracker Link in Mobile Drawer */}
                <Link
                  href={`/${currentLocale}/booking`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-[#D1C5B1] hover:text-[#ECC15A] hover:bg-[#1E2024]/60 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#C29B38]" />
                    <span>{dict.nav.trackBooking}</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#C29B38]/20 text-[#ECC15A] border border-[#C29B38]/30">
                    Deposit
                  </span>
                </Link>
              </nav>

              {/* Language Switcher Card */}
              <div className="p-3 rounded-xl bg-[#1E2024]/60 border border-[#4E4636]/30 flex items-center justify-between">
                <span className="text-xs text-[#9A907D] font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#C29B38]" />
                  <span>{dict.nav.selectLanguage}</span>
                </span>
                <Link
                  href={switchLocalePath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1 rounded-lg bg-[#282A2E] hover:bg-[#C29B38] text-[#ECC15A] hover:text-[#0F1115] text-xs font-semibold transition-colors border border-[#C29B38]/30"
                >
                  {otherLocaleLabel}
                </Link>
              </div>

              {/* Direct Concierge Contact Card */}
              <div className="p-3.5 rounded-xl bg-[#16191F] border border-[#C29B38]/20 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-mono text-[#C29B38] font-bold block tracking-wider">
                  {isRtl ? "قنوات التواصل الرسمية" : "Official Concierge Desk"}
                </span>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex items-center gap-2 text-[#D1C5B1] hover:text-[#ECC15A] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#C29B38] shrink-0" />
                  <span className="font-mono text-[11px] truncate">{siteConfig.contact.email}</span>
                </a>
                <a
                  href={`tel:${siteConfig.whatsapp.number}`}
                  className="flex items-center gap-2 text-[#D1C5B1] hover:text-[#ECC15A] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C29B38] shrink-0" />
                  <span className="font-mono text-[11px]">{siteConfig.whatsapp.display}</span>
                </a>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-[#4E4636]/30 space-y-3">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 min-h-[46px] rounded-xl bg-[#1E2024] hover:bg-[#282A2E] border border-[#C29B38]/40 text-[#ECC15A] text-xs font-semibold transition-all shadow-md group"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>{dict.nav.whatsAppVip}</span>
              </a>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleBookClick();
                }}
                className="w-full flex items-center justify-center min-h-[46px] rounded-xl bg-gradient-to-r from-[#C29B38] via-[#ECC15A] to-[#C29B38] text-[#0F1115] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#C29B38]/20 hover:brightness-110 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>{dict.nav.bookNow}</span>
              </button>

              <div className="text-center pt-1">
                <span className="text-[10px] text-[#9A907D]">
                  {dict.brand.licensedBadge}
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
