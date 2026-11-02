"use client";

import React from "react";
import Link from "next/link";
import { Locale } from "@/translations";
import {
  Menu,
  RefreshCw,
  LogOut,
  Globe,
  Shield,
  Layers,
  Calendar,
  Sparkles,
  Palmtree,
  BookOpen,
  TrendingUp,
  Users,
  Compass,
  LayoutTemplate,
} from "lucide-react";

interface AdminTopNavbarProps {
  currentLocale: Locale;
  activeTab: string;
  adminUserEmail: string;
  adminUserRole: string;
  loadingData: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
  onToggleMobileSidebar: () => void;
  pendingProofsCount?: number;
}

export default function AdminTopNavbar({
  currentLocale,
  activeTab,
  adminUserEmail,
  adminUserRole,
  loadingData,
  onRefresh,
  onSignOut,
  onToggleMobileSidebar,
  pendingProofsCount = 0,
}: AdminTopNavbarProps) {
  const isAr = currentLocale === "ar";

  // Tab Breadcrumbs mapping
  const getSectionTitle = () => {
    switch (activeTab) {
      case "bookings":
        return {
          en: "All Reservations",
          ar: "سجل الحجوزات الكامل",
          icon: Calendar,
        };
      case "proofs":
        return {
          en: "Deposit Review Queue",
          ar: "مراجعة إيصالات العربون",
          icon: Shield,
        };
      case "departures":
        return {
          en: "Departures Manifest",
          ar: "الانطلاقات الميدانية",
          icon: Compass,
        };
      case "custom_trips":
        return {
          en: "Bespoke Journey Briefs",
          ar: "طلبات الرحلات المخصصة",
          icon: Sparkles,
        };
      case "services":
        return {
          en: "Tours & Experiences",
          ar: "إدارة الجولات والتجارب",
          icon: Palmtree,
        };
      case "articles":
        return {
          en: "Travel Guides & Editorial",
          ar: "المقالات والأدلة",
          icon: BookOpen,
        };
      case "reports":
        return {
          en: "Financial Reports",
          ar: "التقارير والمطابقة المالية",
          icon: TrendingUp,
        };
      case "staff":
        return {
          en: "Staff & Permissions",
          ar: "إدارة المشرفين والصلاحيات",
          icon: Users,
        };
      case "cms":
        return {
          en: "Content Management (CMS)",
          ar: "إدارة محتوى الموقع",
          icon: LayoutTemplate,
        };
      case "metrics":
      default:
        return {
          en: "Executive Overview",
          ar: "المؤشرات التشغيلية والمالية",
          icon: Layers,
        };
    }
  };

  const section = getSectionTitle();
  const SectionIcon = section.icon;

  const alternateLocale = isAr ? "en" : "ar";
  const alternateLocaleLabel = isAr ? "English" : "العربية";

  return (
    <header className="sticky top-0 z-30 bg-[#0F1115]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-sm transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Trigger & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-stone-300 hover:text-stone-100 hover:bg-white/[0.06] border border-white/[0.08] transition-colors shrink-0"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#C29B38]/15 border border-[#C29B38]/30 text-[#ECC15A] flex items-center justify-center shrink-0 shadow-sm">
              <SectionIcon className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-stone-500">
                <span>{isAr ? "المكتب التنفيذي" : "Operations Desk"}</span>
                <span>/</span>
                <span className="text-[#C29B38] font-bold">
                  {isAr ? "دولة قطر" : "State of Qatar"}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-headline font-bold text-[#F3ECE1] truncate">
                {isAr ? section.ar : section.en}
              </h1>
            </div>
          </div>
        </div>

        {/* Center / Time Context Pill (Visible on md+) */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-stone-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Asia/Qatar (UTC+3)</span>
          <span className="text-stone-600">•</span>
          <span className="text-[#C29B38] font-semibold">QAR (ر.ق) Standard</span>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Refresh Action */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingData}
            title={isAr ? "تحديث السجلات المباشرة" : "Refresh live database records"}
            className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-stone-300 hover:text-[#ECC15A] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#C29B38] ${
                loadingData ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isAr ? "تحديث" : "Refresh"}
            </span>
          </button>

          {/* Language Switcher */}
          <Link
            href={`/${alternateLocale}/admin`}
            className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-stone-300 hover:text-stone-100 transition-all flex items-center gap-1.5"
            title={isAr ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Globe className="w-3.5 h-3.5 text-[#C29B38]" />
            <span className="font-semibold">{alternateLocaleLabel}</span>
          </Link>

          {/* Pending Proofs Alert Pill (if any) */}
          {pendingProofsCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{pendingProofsCount} {isAr ? "إيصالات معلقة" : "Pending Receipts"}</span>
            </div>
          )}

          {/* Admin Role Chip */}
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#72132B]/20 border border-[#72132B]/40 text-[#F3ECE1] text-xs font-mono"
            title={adminUserEmail || "Staff Administrator"}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-bold uppercase tracking-wider text-[11px]">
              {adminUserRole}
            </span>
            {adminUserEmail && (
              <span className="text-[10px] text-stone-400 max-w-[120px] truncate hidden xl:inline">
                ({adminUserEmail.split("@")[0]})
              </span>
            )}
          </div>

          {/* Lock Session / Sign Out Action */}
          <button
            type="button"
            onClick={onSignOut}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 hover:border-red-500/40 text-red-300 hover:text-red-200 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            title={isAr ? "قفل الجلسة والخروج" : "Lock Session & Sign Out"}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isAr ? "قفل الجلسة" : "Lock Session"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
