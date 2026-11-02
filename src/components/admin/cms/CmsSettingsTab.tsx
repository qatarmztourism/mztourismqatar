"use client";

import { useState } from "react";
import {
  Save,
  Globe,
  Phone,
  Mail,
  Share2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import { updateAdminSiteSettingsAction } from "@/lib/server/cms-actions";

type CmsSiteSettingsRow = Database["public"]["Tables"]["cms_site_settings"]["Row"];

interface CmsSettingsTabProps {
  settings: CmsSiteSettingsRow;
  onRefresh: () => void;
  isRtl: boolean;
}

export default function CmsSettingsTab({ settings, onRefresh, isRtl }: CmsSettingsTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [titleEn, setTitleEn] = useState(settings.site_title_en);
  const [titleAr, setTitleAr] = useState(settings.site_title_ar);
  const [taglineEn, setTaglineEn] = useState(settings.site_tagline_en || "");
  const [taglineAr, setTaglineAr] = useState(settings.site_tagline_ar || "");
  const [descEn, setDescEn] = useState(settings.site_description_en);
  const [descAr, setDescAr] = useState(settings.site_description_ar);

  const [email, setEmail] = useState(settings.contact_email);
  const [phone, setPhone] = useState(settings.contact_phone);
  const [whatsapp, setWhatsapp] = useState(settings.contact_whatsapp);
  const [addressEn, setAddressEn] = useState(settings.contact_address_en || "");
  const [addressAr, setAddressAr] = useState(settings.contact_address_ar || "");

  const [instagram, setInstagram] = useState(settings.social_instagram || "");
  const [facebook, setFacebook] = useState(settings.social_facebook || "");
  const [twitter] = useState(settings.social_twitter || "");
  const [linkedin] = useState(settings.social_linkedin || "");

  const [ogImage, setOgImage] = useState(settings.seo_og_image || "");
  const [canonicalUrl, setCanonicalUrl] = useState(settings.seo_canonical_url || "");
  const [footerAboutEn, setFooterAboutEn] = useState(settings.footer_about_en || "");
  const [footerAboutAr, setFooterAboutAr] = useState(settings.footer_about_ar || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateAdminSiteSettingsAction({
        site_title_en: titleEn,
        site_title_ar: titleAr,
        site_tagline_en: taglineEn,
        site_tagline_ar: taglineAr,
        site_description_en: descEn,
        site_description_ar: descAr,
        contact_email: email,
        contact_phone: phone,
        contact_whatsapp: whatsapp,
        social_whatsapp: whatsapp,
        contact_address_en: addressEn,
        contact_address_ar: addressAr,
        social_instagram: instagram,
        social_facebook: facebook,
        social_twitter: twitter,
        social_linkedin: linkedin,
        seo_og_image: ogImage,
        seo_canonical_url: canonicalUrl,
        footer_about_en: footerAboutEn,
        footer_about_ar: footerAboutAr,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update site settings");
      } else {
        setSuccessMessage(isRtl ? "تم حفظ إعدادات الموقع بنجاح" : "Site settings updated successfully");
        onRefresh();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            {isRtl ? "الإعدادات العامة وهوية الموقع وSEO" : "Global Site Identity & SEO Settings"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {isRtl
              ? "تحكم في بيانات الاتصال المعتمدة لقطر، شبكات التواصل الاجتماعي، والوسوم العامة"
              : "Bilingual brand titles, Qatar contact points, social channels, and OpenGraph metadata"}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Brand Titles & Global SEO */}
        <div className="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/20">
            <Globe className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-on-surface">
              {isRtl ? "عناوين الموقع والشعارات (SEO & Brand Identity)" : "Site Brand & Global Meta Tags"}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Global Title (English) *
              </label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div dir="rtl">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                عنوان الموقع العام (عربي) *
              </label>
              <input
                type="text"
                required
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Brand Slogan (English)
              </label>
              <input
                type="text"
                value={taglineEn}
                onChange={(e) => setTaglineEn(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div dir="rtl">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                شعار العلامة التجارية (عربي)
              </label>
              <input
                type="text"
                value={taglineAr}
                onChange={(e) => setTaglineAr(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Default Meta Description (English) *
              </label>
              <textarea
                rows={3}
                required
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none"
              />
            </div>
            <div dir="rtl">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                الوصف الافتراضي لمحركات البحث (عربي) *
              </label>
              <textarea
                rows={3}
                required
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none font-arabic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Default OpenGraph Image URL
              </label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="/images/hero-safari.jpg"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Canonical Base URL
              </label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://mztourismqatar.com"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Operating Details */}
        <div className="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/20">
            <Phone className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-on-surface">
              {isRtl ? "بيانات التواصل والاستقبال في قطر" : "Qatar Operations & Concierge Coordinates"}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Contact Phone *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                WhatsApp Concierge *
              </label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Physical Address (English)
              </label>
              <input
                type="text"
                value={addressEn}
                onChange={(e) => setAddressEn(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div dir="rtl">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                العنوان والمقر (عربي)
              </label>
              <input
                type="text"
                value={addressAr}
                onChange={(e) => setAddressAr(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Social Media Links (Footer Icons) */}
        <div className="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/20">
            <Share2 className="w-4 h-4 text-primary" />
            <div>
              <h4 className="text-sm font-bold text-on-surface">
                {isRtl ? "أيقونات التواصل الاجتماعي في أسفل الموقع" : "Footer Social Media Icons (Managed via CMS)"}
              </h4>
              <p className="text-[11px] text-on-surface-variant">
                {isRtl
                  ? "تظهر فقط الأيقونات المحددة برابط في التذييل (فيسبوك، واتساب، إنستغرام) وتفتح بأمان في نافذة جديدة."
                  : "Only configured icons appear in the footer (Facebook, WhatsApp, Instagram) and safely open in a new tab."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Facebook Page URL
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/mztourismqatar"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                WhatsApp Link / Number
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+974 5555 1234 or https://wa.me/..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Instagram Profile URL
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/mztourismqatar"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Footer About Us Column */}
        <div className="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/20">
            <Mail className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-on-surface">
              {isRtl ? "نبذة تذييل الموقع (Footer About Paragraph)" : "Footer Brand Overview"}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Footer About (English)
              </label>
              <textarea
                rows={3}
                value={footerAboutEn}
                onChange={(e) => setFooterAboutEn(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none"
              />
            </div>
            <div dir="rtl">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                نبذة الفوتر (عربي)
              </label>
              <textarea
                rows={3}
                value={footerAboutAr}
                onChange={(e) => setFooterAboutAr(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none font-arabic"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? isRtl
                  ? "جاري الحفظ والتحديث..."
                  : "Updating Settings..."
                : isRtl
                ? "حفظ جميع الإعدادات"
                : "Save All Settings"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
