"use client";

import { useState } from "react";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import {
  saveAdminHomepageSectionAction,
  toggleAdminHomepageSectionAction,
  deleteAdminHomepageSectionAction,
  reorderAdminHomepageSectionsAction,
} from "@/lib/server/cms-actions";

type CmsHomepageSectionRow = Database["public"]["Tables"]["cms_homepage_sections"]["Row"];

interface CmsHomepageTabProps {
  sections: CmsHomepageSectionRow[];
  onRefresh: () => void;
  isRtl: boolean;
}

export default function CmsHomepageTab({ sections, onRefresh, isRtl }: CmsHomepageTabProps) {
  const [editingSection, setEditingSection] = useState<CmsHomepageSectionRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formKey, setFormKey] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formTitleAr, setFormTitleAr] = useState("");
  const [formSubtitleEn, setFormSubtitleEn] = useState("");
  const [formSubtitleAr, setFormSubtitleAr] = useState("");
  const [formContentEn, setFormContentEn] = useState("");
  const [formContentAr, setFormContentAr] = useState("");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formCtaPrimaryLabelEn, setFormCtaPrimaryLabelEn] = useState("");
  const [formCtaPrimaryLabelAr, setFormCtaPrimaryLabelAr] = useState("");
  const [formCtaPrimaryUrl, setFormCtaPrimaryUrl] = useState("");
  const [formCtaSecondaryLabelEn, setFormCtaSecondaryLabelEn] = useState("");
  const [formCtaSecondaryLabelAr, setFormCtaSecondaryLabelAr] = useState("");
  const [formCtaSecondaryUrl, setFormCtaSecondaryUrl] = useState("");
  const [formIsEnabled, setFormIsEnabled] = useState(true);

  const openEditor = (sec?: CmsHomepageSectionRow) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (sec) {
      setEditingSection(sec);
      setFormKey(sec.section_key);
      setFormTitleEn(sec.title_en || "");
      setFormTitleAr(sec.title_ar || "");
      setFormSubtitleEn(sec.subtitle_en || "");
      setFormSubtitleAr(sec.subtitle_ar || "");
      setFormContentEn(sec.content_en || "");
      setFormContentAr(sec.content_ar || "");
      setFormMediaUrl(sec.media_url || "");
      setFormCtaPrimaryLabelEn(sec.cta_primary_label_en || "");
      setFormCtaPrimaryLabelAr(sec.cta_primary_label_ar || "");
      setFormCtaPrimaryUrl(sec.cta_primary_url || "");
      setFormCtaSecondaryLabelEn(sec.cta_secondary_label_en || "");
      setFormCtaSecondaryLabelAr(sec.cta_secondary_label_ar || "");
      setFormCtaSecondaryUrl(sec.cta_secondary_url || "");
      setFormIsEnabled(sec.is_enabled);
    } else {
      setEditingSection({
        id: "",
        section_key: "custom_banner_" + Date.now().toString().slice(-4),
        title_en: "",
        title_ar: "",
        subtitle_en: "",
        subtitle_ar: "",
        content_en: "",
        content_ar: "",
        media_url: "",
        cta_primary_label_en: "",
        cta_primary_label_ar: "",
        cta_primary_url: "",
        cta_secondary_label_en: "",
        cta_secondary_label_ar: "",
        cta_secondary_url: "",
        metadata: {},
        display_order: (sections.length + 1) * 10,
        is_enabled: true,
        updated_at: null,
        updated_by: null,
      });
      setFormKey("custom_section_" + Date.now().toString().slice(-4));
      setFormTitleEn("");
      setFormTitleAr("");
      setFormSubtitleEn("");
      setFormSubtitleAr("");
      setFormContentEn("");
      setFormContentAr("");
      setFormMediaUrl("");
      setFormCtaPrimaryLabelEn("");
      setFormCtaPrimaryLabelAr("");
      setFormCtaPrimaryUrl("");
      setFormCtaSecondaryLabelEn("");
      setFormCtaSecondaryLabelAr("");
      setFormCtaSecondaryUrl("");
      setFormIsEnabled(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await saveAdminHomepageSectionAction({
        id: editingSection?.id ? editingSection.id : undefined,
        section_key: formKey,
        title_en: formTitleEn || null,
        title_ar: formTitleAr || null,
        subtitle_en: formSubtitleEn || null,
        subtitle_ar: formSubtitleAr || null,
        content_en: formContentEn || null,
        content_ar: formContentAr || null,
        media_url: formMediaUrl || null,
        cta_primary_label_en: formCtaPrimaryLabelEn || null,
        cta_primary_label_ar: formCtaPrimaryLabelAr || null,
        cta_primary_url: formCtaPrimaryUrl || null,
        cta_secondary_label_en: formCtaSecondaryLabelEn || null,
        cta_secondary_label_ar: formCtaSecondaryLabelAr || null,
        cta_secondary_url: formCtaSecondaryUrl || null,
        display_order: editingSection?.display_order ?? (sections.length + 1) * 10,
        is_enabled: formIsEnabled,
        metadata: {},
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to save homepage section");
      } else {
        setSuccessMessage(isRtl ? "تم حفظ القسم بنجاح" : "Section saved successfully");
        setTimeout(() => {
          setEditingSection(null);
          onRefresh();
        }, 600);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (sec: CmsHomepageSectionRow) => {
    const nextState = !sec.is_enabled;
    await toggleAdminHomepageSectionAction(sec.id, nextState);
    onRefresh();
  };

  const handleDelete = async (sec: CmsHomepageSectionRow) => {
    if (confirm(isRtl ? `هل أنت متأكد من حذف قسم "${sec.title_ar || sec.section_key}"؟` : `Delete section "${sec.title_en || sec.section_key}"?`)) {
      await deleteAdminHomepageSectionAction(sec.id);
      onRefresh();
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const list = [...sections];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const orderMap = list.map((item, idx) => ({
      id: item.id,
      display_order: (idx + 1) * 10,
    }));

    await reorderAdminHomepageSectionsAction(orderMap);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            {isRtl ? "مُنشئ ومُنسق أقسام الصفحة الرئيسية" : "Homepage Sections Builder"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {isRtl
              ? "تحكم في ترتيب النصوص، لافتات الترويج، أزرار الدعوة للإجراء (CTA) وصور الخلفية"
              : "Reorder hero, service banners, why us pillars, and promotional call-to-actions"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? "إضافة قسم جديد" : "Add New Section"}</span>
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((sec, idx) => {
          const isComplete = Boolean(sec.title_en && sec.title_ar);
          return (
            <div
              key={sec.id}
              className={`p-5 rounded-2xl border transition-all ${
                sec.is_enabled
                  ? "bg-surface-container border-outline-variant/30 hover:border-primary/40 shadow-sm"
                  : "bg-surface-container/50 border-outline-variant/15 opacity-70"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant"
                      title={isRtl ? "تحريك لأعلى" : "Move Up"}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-primary">
                      {sec.display_order}
                    </span>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant"
                      title={isRtl ? "تحريك لأسفل" : "Move Down"}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-surface-container-high text-primary font-bold">
                        {sec.section_key}
                      </span>
                      {sec.is_enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                          <Eye className="w-3 h-3" />
                          {isRtl ? "نشط ومفعل" : "Live & Active"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 font-medium border border-zinc-500/20">
                          <EyeOff className="w-3 h-3" />
                          {isRtl ? "معطل" : "Disabled"}
                        </span>
                      )}
                      {isComplete ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">
                          EN ✓ AR ✓
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                          {isRtl ? "ترجمة غير مكتملة" : "Translation Incomplete"}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-on-surface">
                      {isRtl ? sec.title_ar || sec.title_en : sec.title_en || sec.title_ar}
                    </h4>

                    {(sec.subtitle_en || sec.subtitle_ar) && (
                      <p className="text-xs text-on-surface-variant line-clamp-1">
                        {isRtl ? sec.subtitle_ar || sec.subtitle_en : sec.subtitle_en || sec.subtitle_ar}
                      </p>
                    )}

                    {sec.cta_primary_label_en && (
                      <div className="flex items-center gap-2 text-[11px] text-primary/80 pt-1">
                        <Sparkles className="w-3 h-3" />
                        <span>
                          CTA: {sec.cta_primary_label_en} ({sec.cta_primary_url || "#"})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(sec)}
                    className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                      sec.is_enabled
                        ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                    title={sec.is_enabled ? (isRtl ? "تعطيل القسم" : "Disable Section") : (isRtl ? "تفعيل القسم" : "Enable Section")}
                  >
                    {sec.is_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditor(sec)}
                    className="p-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface hover:text-primary transition-all"
                    title={isRtl ? "تعديل القسم" : "Edit Section"}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(sec)}
                    className="p-2 rounded-xl bg-surface-container-high border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all"
                    title={isRtl ? "حذف القسم" : "Delete Section"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-surface border border-primary/30 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {editingSection.id
                    ? isRtl
                      ? `تعديل قسم [${editingSection.section_key}]`
                      : `Edit Section [${editingSection.section_key}]`
                    : isRtl
                    ? "إنشاء قسم جديد في الصفحة الرئيسية"
                    : "Create New Homepage Section"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isRtl ? "أدخل المحتوى والروابط باللغتين الإنجليزية والعربية" : "Configure bilingual headings, subtitles, and CTA routes"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="text-on-surface-variant hover:text-on-surface text-xl leading-none"
              >
                ✕
              </button>
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

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    {isRtl ? "مُعرّف القسم (Key)" : "Section Key"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formKey}
                    onChange={(e) => setFormKey(e.target.value)}
                    placeholder="e.g. hero, vip_fleet, summer_charter"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                    <input
                      type="checkbox"
                      checked={formIsEnabled}
                      onChange={(e) => setFormIsEnabled(e.target.checked)}
                      className="rounded accent-primary w-4 h-4"
                    />
                    <span>{isRtl ? "تفعيل القسم على الصفحة الرئيسية" : "Enable & Display on Homepage"}</span>
                  </label>
                </div>
              </div>

              {/* Headings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g. Uncompromising Arabian Luxury"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    العنوان الرئيسي (عربي)
                  </label>
                  <input
                    type="text"
                    value={formTitleAr}
                    onChange={(e) => setFormTitleAr(e.target.value)}
                    placeholder="مثال: قمة الفخامة والضيافة العربية"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                </div>
              </div>

              {/* Subtitles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Subtitle (English)
                  </label>
                  <input
                    type="text"
                    value={formSubtitleEn}
                    onChange={(e) => setFormSubtitleEn(e.target.value)}
                    placeholder="e.g. Curated Private Expeditions"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    العنوان الفرعي (عربي)
                  </label>
                  <input
                    type="text"
                    value={formSubtitleAr}
                    onChange={(e) => setFormSubtitleAr(e.target.value)}
                    placeholder="مثال: رحلات خاصة منسقة واستئجار يخوت"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Body Copy (English)
                  </label>
                  <textarea
                    rows={3}
                    value={formContentEn}
                    onChange={(e) => setFormContentEn(e.target.value)}
                    placeholder="English section description..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    النص والوصف (عربي)
                  </label>
                  <textarea
                    rows={3}
                    value={formContentAr}
                    onChange={(e) => setFormContentAr(e.target.value)}
                    placeholder="نص وتفاصيل القسم باللغة العربية..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none font-arabic"
                  />
                </div>
              </div>

              {/* Media URL */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  {isRtl ? "رابط الصورة أو الوسائط (Media URL)" : "Media Image URL"}
                </label>
                <input
                  type="text"
                  value={formMediaUrl}
                  onChange={(e) => setFormMediaUrl(e.target.value)}
                  placeholder="/images/hero-safari.jpg or https://..."
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                />
              </div>

              {/* Primary CTA */}
              <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-3">
                <span className="text-xs font-bold text-primary block">
                  {isRtl ? "زر الإجراء الرئيسي (Primary CTA)" : "Primary Call-to-Action"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={formCtaPrimaryLabelEn}
                    onChange={(e) => setFormCtaPrimaryLabelEn(e.target.value)}
                    placeholder="Label (EN)"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={formCtaPrimaryLabelAr}
                    onChange={(e) => setFormCtaPrimaryLabelAr(e.target.value)}
                    placeholder="نص الزر (عربي)"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                  <input
                    type="text"
                    value={formCtaPrimaryUrl}
                    onChange={(e) => setFormCtaPrimaryUrl(e.target.value)}
                    placeholder="URL (/services or #inquiry)"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                  />
                </div>
              </div>

              {/* Secondary CTA */}
              <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-3">
                <span className="text-xs font-bold text-on-surface-variant block">
                  {isRtl ? "زر الإجراء الثانوي (Secondary CTA - اختياري)" : "Secondary Call-to-Action (Optional)"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={formCtaSecondaryLabelEn}
                    onChange={(e) => setFormCtaSecondaryLabelEn(e.target.value)}
                    placeholder="Label (EN)"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={formCtaSecondaryLabelAr}
                    onChange={(e) => setFormCtaSecondaryLabelAr(e.target.value)}
                    placeholder="نص الزر (عربي)"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                  <input
                    type="text"
                    value={formCtaSecondaryUrl}
                    onChange={(e) => setFormCtaSecondaryUrl(e.target.value)}
                    placeholder="URL (/contact or #planner)"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isSaving
                    ? isRtl
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isRtl
                    ? "حفظ التعديلات"
                    : "Save Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
