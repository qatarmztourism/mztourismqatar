"use client";

import React from "react";
import Link from "next/link";
import { Locale } from "@/translations";
import {
  Layers,
  Calendar,
  ShieldCheck,
  Compass,
  Sparkles,
  BookOpen,
  TrendingUp,
  Users,
  Palmtree,
  LayoutTemplate,
  ExternalLink,
  CreditCard,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  currentLocale: Locale;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  adminUserEmail: string;
  adminUserRole: string;
  bookingsCount: number;
  pendingProofsCount: number;
  customTripsCount: number;
  servicesCount: number;
  articlesCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badgeType?: "default" | "warning" | "success";
  superAdminOnly?: boolean;
}

interface NavGroup {
  groupEn: string;
  groupAr: string;
  items: NavItem[];
}

export default function AdminSidebar({
  currentLocale,
  activeTab,
  onSelectTab,
  adminUserEmail,
  adminUserRole,
  bookingsCount,
  pendingProofsCount,
  customTripsCount,
  servicesCount,
  articlesCount,
  isMobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const isAr = currentLocale === "ar";

  const navGroups: NavGroup[] = [
    {
      groupEn: "Operations & Bookings",
      groupAr: "العمليات والحجوزات",
      items: [
        {
          id: "metrics",
          labelEn: "Executive Overview",
          labelAr: "المؤشرات والعمليات",
          icon: Layers,
        },
        {
          id: "bookings",
          labelEn: "All Reservations",
          labelAr: "جدول الحجوزات",
          icon: Calendar,
          count: bookingsCount,
          badgeType: "default",
        },
        {
          id: "proofs",
          labelEn: "Deposit Review Queue",
          labelAr: "مراجعة إيصالات العربون",
          icon: ShieldCheck,
          count: pendingProofsCount,
          badgeType: pendingProofsCount > 0 ? "warning" : "default",
        },
        {
          id: "payments",
          labelEn: "Qatar Payments & Bank",
          labelAr: "المدفوعات والحساب البنكي",
          icon: CreditCard,
        },
        {
          id: "departures",
          labelEn: "Departures Manifest",
          labelAr: "الانطلاقات الميدانية",
          icon: Compass,
        },
        {
          id: "custom_trips",
          labelEn: "Bespoke Journey Briefs",
          labelAr: "طلبات الرحلات المخصصة",
          icon: Sparkles,
          count: customTripsCount,
          badgeType: "default",
        },
      ],
    },
    {
      groupEn: "Catalog & Editorial",
      groupAr: "الكتالوج والتحرير",
      items: [
        {
          id: "services",
          labelEn: "Tours & Experiences",
          labelAr: "إدارة الجولات والتجارب",
          icon: Palmtree,
          count: servicesCount,
          badgeType: "default",
        },
        {
          id: "articles",
          labelEn: "Travel Guides & Editorial",
          labelAr: "المقالات والأدلة",
          icon: BookOpen,
          count: articlesCount,
          badgeType: "default",
        },
        {
          id: "cms",
          labelEn: "Content Management (CMS)",
          labelAr: "إدارة محتوى الموقع (CMS)",
          icon: LayoutTemplate,
          badgeType: "default",
        },
      ],
    },
    {
      groupEn: "Financials & Governance",
      groupAr: "المالية والحوكمة",
      items: [
        {
          id: "reports",
          labelEn: "Financial Reports",
          labelAr: "التقارير المالية",
          icon: TrendingUp,
        },
        {
          id: "staff",
          labelEn: "Staff & Access",
          labelAr: "إدارة الصلاحيات",
          icon: Users,
          superAdminOnly: true,
        },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between overflow-y-auto scrollbar-thin select-none">
      {/* 1. Brand Logo & System Identification */}
      <div>
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
          <Link
            href={`/${currentLocale}`}
            className="flex items-center gap-3.5 group focus:outline-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C29B38] via-[#ECC15A] to-[#872439] p-0.5 shadow-lg shadow-[#C29B38]/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#0F1115] flex items-center justify-center font-headline font-bold text-base text-[#ECC15A]">
                MZ
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline font-bold text-base text-[#F3ECE1] tracking-wide group-hover:text-[#ECC15A] transition-colors truncate">
                  MZ TOURISM
                </span>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#C29B38] font-semibold truncate">
                {isAr ? "دولة قطر • كونسيرج فاخر" : "Qatar • Luxury Operations"}
              </p>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-white/[0.06] transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Operations Desk Pill */}
        <div className="px-5 py-3.5">
          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-[11px] text-stone-400 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isAr ? "مكتب العمليات المعتمد" : "Doha Operations Desk"}</span>
            </span>
            <span className="text-[10px] font-bold text-[#C29B38] uppercase">QAR Standard</span>
          </div>
        </div>

        {/* 3. Navigation Groups */}
        <nav className="px-3 space-y-6 pb-6 pt-1">
          {navGroups.map((group, groupIdx) => {
            const visibleItems = group.items.filter(
              (item) => !item.superAdminOnly || adminUserRole === "super_admin"
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1">
                <h4 className="px-3 mb-2 text-[10px] font-mono font-bold tracking-widest uppercase text-stone-500">
                  {isAr ? group.groupAr : group.groupEn}
                </h4>

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-r from-[#C29B38]/20 via-[#C29B38]/10 to-transparent text-[#F3ECE1] border-s-4 border-[#C29B38] font-semibold shadow-sm"
                            : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-[#ECC15A]"
                                : "text-stone-400 group-hover:text-stone-200"
                            }`}
                          />
                          <span className="truncate">
                            {isAr ? item.labelAr : item.labelEn}
                          </span>
                        </div>

                        {item.count !== undefined && item.count > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                              item.badgeType === "warning"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : isActive
                                ? "bg-[#C29B38]/30 text-[#ECC15A] border border-[#C29B38]/40"
                                : "bg-white/[0.06] text-stone-400"
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* 4. Bottom Admin Profile & Live Site Link */}
      <div className="p-4 border-t border-white/[0.08] space-y-3 bg-[#0A0C0F]/60">
        {/* User Card */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#72132B] to-[#0F1115] border border-[#C29B38]/30 text-[#ECC15A] flex items-center justify-center font-bold text-xs shrink-0">
              {adminUserEmail ? adminUserEmail.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-stone-200 block truncate">
                {adminUserEmail || "Staff Administrator"}
              </span>
              <span className="text-[10px] font-mono text-[#C29B38] font-bold uppercase tracking-wider block">
                {adminUserRole}
              </span>
            </div>
          </div>
          <span
            className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
            title="Connected to Supabase"
          />
        </div>

        {/* Public Website Deep Link */}
        <Link
          href={`/${currentLocale}`}
          target="_blank"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-[11px] font-medium text-stone-400 hover:text-[#ECC15A] transition-colors"
        >
          <span>{isAr ? "معاينة الموقع العام" : "View Live Platform"}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 start-0 z-40 w-72 bg-[#0F1115]/95 backdrop-blur-2xl border-e border-white/[0.08] shadow-2xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Canvas */}
          <div className="fixed inset-y-0 start-0 w-80 max-w-[85vw] bg-[#0F1115] border-e border-white/[0.1] shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
