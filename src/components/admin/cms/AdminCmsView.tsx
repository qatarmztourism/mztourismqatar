"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutTemplate,
  FileText,
  HelpCircle,
  Star,
  Compass,
  Image as ImageIcon,
  Settings,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Locale } from "@/translations";
import type { Database } from "@/lib/supabase/database.types";
import {
  getAdminHomepageSectionsAction,
  getAdminPagesAction,
  getAdminFaqsAction,
  getAdminTestimonialsAction,
  getAdminNavigationAction,
  getAdminMediaListAction,
  getAdminSiteSettingsAction,
} from "@/lib/server/cms-actions";

import CmsHomepageTab from "./CmsHomepageTab";
import CmsPagesTab from "./CmsPagesTab";
import CmsFaqsTab from "./CmsFaqsTab";
import CmsTestimonialsTab from "./CmsTestimonialsTab";
import CmsNavigationTab from "./CmsNavigationTab";
import CmsMediaTab from "./CmsMediaTab";
import CmsSettingsTab from "./CmsSettingsTab";

type CmsHomepageSectionRow = Database["public"]["Tables"]["cms_homepage_sections"]["Row"];
type CmsPageRow = Database["public"]["Tables"]["cms_pages"]["Row"];
type CmsFaqRow = Database["public"]["Tables"]["cms_faqs"]["Row"];
type CmsTestimonialRow = Database["public"]["Tables"]["cms_testimonials"]["Row"];
type CmsNavigationRow = Database["public"]["Tables"]["cms_navigation"]["Row"];
type CmsMediaRow = Database["public"]["Tables"]["cms_media"]["Row"];
type CmsSiteSettingsRow = Database["public"]["Tables"]["cms_site_settings"]["Row"];

interface AdminCmsViewProps {
  currentLocale: Locale;
  adminUserRole?: string;
}

type CmsActiveTab =
  | "sections"
  | "pages"
  | "faqs"
  | "testimonials"
  | "navigation"
  | "media"
  | "settings";

export default function AdminCmsView({
  currentLocale,
}: AdminCmsViewProps) {
  const isRtl = currentLocale === "ar";
  const [activeTab, setActiveTab] = useState<CmsActiveTab>("sections");
  const [isLoading, setIsLoading] = useState(true);

  // Loaded data stores
  const [sections, setSections] = useState<CmsHomepageSectionRow[]>([]);
  const [pages, setPages] = useState<CmsPageRow[]>([]);
  const [faqs, setFaqs] = useState<CmsFaqRow[]>([]);
  const [testimonials, setTestimonials] = useState<CmsTestimonialRow[]>([]);
  const [navigationItems, setNavigationItems] = useState<CmsNavigationRow[]>([]);
  const [mediaList, setMediaList] = useState<CmsMediaRow[]>([]);
  const [siteSettings, setSiteSettings] = useState<CmsSiteSettingsRow | null>(null);

  const fetchCmsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        secRes,
        pagesRes,
        faqsRes,
        testRes,
        navRes,
        mediaRes,
        settingsRes,
      ] = await Promise.all([
        getAdminHomepageSectionsAction(),
        getAdminPagesAction(),
        getAdminFaqsAction(),
        getAdminTestimonialsAction(),
        getAdminNavigationAction(),
        getAdminMediaListAction(),
        getAdminSiteSettingsAction(),
      ]);

      if (secRes.success && secRes.data) setSections(secRes.data);
      if (pagesRes.success && pagesRes.data) setPages(pagesRes.data);
      if (faqsRes.success && faqsRes.data) setFaqs(faqsRes.data);
      if (testRes.success && testRes.data) setTestimonials(testRes.data);
      if (navRes.success && navRes.data) setNavigationItems(navRes.data);
      if (mediaRes.success && mediaRes.data) setMediaList(mediaRes.data);
      if (settingsRes.success && settingsRes.data) setSiteSettings(settingsRes.data);
    } catch (err) {
      console.error("[Fetch CMS Data Error]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCmsData();
  }, [fetchCmsData]);

  const tabs = [
    {
      id: "sections" as CmsActiveTab,
      labelEn: "Homepage Builder",
      labelAr: "مُنشئ الرئيسية",
      icon: LayoutTemplate,
      count: sections.length,
    },
    {
      id: "pages" as CmsActiveTab,
      labelEn: "Static Pages",
      labelAr: "الصفحات الثابتة",
      icon: FileText,
      count: pages.length,
    },
    {
      id: "faqs" as CmsActiveTab,
      labelEn: "FAQs & Advisory",
      labelAr: "الأسئلة الشائعة",
      icon: HelpCircle,
      count: faqs.length,
    },
    {
      id: "testimonials" as CmsActiveTab,
      labelEn: "Guest Reviews",
      labelAr: "آراء الضيوف",
      icon: Star,
      count: testimonials.length,
    },
    {
      id: "navigation" as CmsActiveTab,
      labelEn: "Menus & Navigation",
      labelAr: "القوائم والروابط",
      icon: Compass,
      count: navigationItems.length,
    },
    {
      id: "media" as CmsActiveTab,
      labelEn: "Media Library",
      labelAr: "مكتبة الوسائط",
      icon: ImageIcon,
      count: mediaList.length,
    },
    {
      id: "settings" as CmsActiveTab,
      labelEn: "Site & SEO",
      labelAr: "إعدادات SEO",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-container border border-primary/25 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              {isRtl ? "نظام إدارة المحتوى المتكامل" : "Content Management System"}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {isRtl ? "ثنائي اللغة ومحمي من XSS" : "Bilingual & XSS Protected"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            {isRtl ? "إدارة محتوى موقع إم زد للسياحة قطر" : "MZ Tourism Qatar Website CMS"}
          </h2>
          <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
            {isRtl
              ? "تحكم كامل وبث حي لكافة أقسام الموقع والصفحات الثابتة والروابط والوسائط دون الحاجة لتعديل الكود البرمجي."
              : "Dynamic control over homepage sections, static legal disclosures, travel guide FAQs, genuine client reviews, and media library without code deployment."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchCmsData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface hover:text-primary transition-all disabled:opacity-50"
            title={isRtl ? "تحديث البيانات" : "Refresh Data"}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </button>

          <a
            href={`/${currentLocale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface hover:text-primary text-xs font-semibold transition-all"
          >
            <span>{isRtl ? "معاينة الموقع المباشر" : "Preview Live Site"}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant/20 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-high text-primary"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {isLoading && (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs font-medium">
            {isRtl ? "جاري تحميل بيانات نظام إدارة المحتوى..." : "Loading CMS records & media..."}
          </span>
        </div>
      )}

      {!isLoading && (
        <div>
          {activeTab === "sections" && (
            <CmsHomepageTab
              sections={sections}
              onRefresh={fetchCmsData}
              isRtl={isRtl}
            />
          )}

          {activeTab === "pages" && (
            <CmsPagesTab
              pages={pages}
              onRefresh={fetchCmsData}
              isRtl={isRtl}
            />
          )}

          {activeTab === "faqs" && (
            <CmsFaqsTab
              faqs={faqs}
              onRefresh={fetchCmsData}
              isRtl={isRtl}
            />
          )}

          {activeTab === "testimonials" && (
            <CmsTestimonialsTab
              testimonials={testimonials}
              onRefresh={fetchCmsData}
              isRtl={isRtl}
            />
          )}

          {activeTab === "navigation" && (
            <CmsNavigationTab
              navigationItems={navigationItems}
              onRefresh={fetchCmsData}
              isRtl={isRtl}
            />
          )}

          {activeTab === "media" && (
            <CmsMediaTab
              mediaList={mediaList}
              onRefresh={fetchCmsData}
              isRtl={isRtl}
            />
          )}

          {activeTab === "settings" && siteSettings && (
            <CmsSettingsTab
              settings={siteSettings}
              onRefresh={fetchCmsData}
              isRtl={isRtl}
            />
          )}
        </div>
      )}
    </div>
  );
}
