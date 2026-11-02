"use client";

import { useState } from "react";
import {
  Plus,
  FileText,
  Eye,
  Archive,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import {
  saveAdminPageAction,
  toggleAdminPageStatusAction,
  deleteAdminPageAction,
} from "@/lib/server/cms-actions";

type CmsPageRow = Database["public"]["Tables"]["cms_pages"]["Row"];

interface CmsPagesTabProps {
  pages: CmsPageRow[];
  onRefresh: () => void;
  isRtl: boolean;
}

export default function CmsPagesTab({ pages, onRefresh, isRtl }: CmsPagesTabProps) {
  const [editingPage, setEditingPage] = useState<CmsPageRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formSlug, setFormSlug] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formTitleAr, setFormTitleAr] = useState("");
  const [formExcerptEn, setFormExcerptEn] = useState("");
  const [formExcerptAr, setFormExcerptAr] = useState("");
  const [formContentEn, setFormContentEn] = useState("");
  const [formContentAr, setFormContentAr] = useState("");
  const [formHeroImage, setFormHeroImage] = useState("");
  const [formMetaTitleEn, setFormMetaTitleEn] = useState("");
  const [formMetaTitleAr, setFormMetaTitleAr] = useState("");
  const [formMetaDescEn, setFormMetaDescEn] = useState("");
  const [formMetaDescAr, setFormMetaDescAr] = useState("");
  const [formStatus, setFormStatus] = useState<"draft" | "published" | "archived">("published");

  const openEditor = (pg?: CmsPageRow) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (pg) {
      setEditingPage(pg);
      setFormSlug(pg.slug);
      setFormTitleEn(pg.title_en);
      setFormTitleAr(pg.title_ar);
      setFormExcerptEn(pg.excerpt_en || "");
      setFormExcerptAr(pg.excerpt_ar || "");
      setFormContentEn(pg.content_en);
      setFormContentAr(pg.content_ar);
      setFormHeroImage(pg.hero_image || "");
      setFormMetaTitleEn(pg.meta_title_en || "");
      setFormMetaTitleAr(pg.meta_title_ar || "");
      setFormMetaDescEn(pg.meta_description_en || "");
      setFormMetaDescAr(pg.meta_description_ar || "");
      setFormStatus(pg.status);
    } else {
      setEditingPage({
        id: "",
        slug: "",
        title_en: "",
        title_ar: "",
        excerpt_en: "",
        excerpt_ar: "",
        content_en: "",
        content_ar: "",
        hero_image: "",
        meta_title_en: "",
        meta_title_ar: "",
        meta_description_en: "",
        meta_description_ar: "",
        status: "published",
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
      });
      setFormSlug("");
      setFormTitleEn("");
      setFormTitleAr("");
      setFormExcerptEn("");
      setFormExcerptAr("");
      setFormContentEn("");
      setFormContentAr("");
      setFormHeroImage("");
      setFormMetaTitleEn("");
      setFormMetaTitleAr("");
      setFormMetaDescEn("");
      setFormMetaDescAr("");
      setFormStatus("published");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await saveAdminPageAction({
        id: editingPage?.id ? editingPage.id : undefined,
        slug: formSlug,
        title_en: formTitleEn,
        title_ar: formTitleAr,
        excerpt_en: formExcerptEn || null,
        excerpt_ar: formExcerptAr || null,
        content_en: formContentEn,
        content_ar: formContentAr,
        hero_image: formHeroImage || null,
        meta_title_en: formMetaTitleEn || null,
        meta_title_ar: formMetaTitleAr || null,
        meta_description_en: formMetaDescEn || null,
        meta_description_ar: formMetaDescAr || null,
        status: formStatus,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to save page");
      } else {
        setSuccessMessage(isRtl ? "تم حفظ الصفحة بنجاح" : "Page saved successfully");
        setTimeout(() => {
          setEditingPage(null);
          onRefresh();
        }, 600);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (pg: CmsPageRow, status: "draft" | "published" | "archived") => {
    await toggleAdminPageStatusAction(pg.id, status);
    onRefresh();
  };

  const handleDelete = async (pg: CmsPageRow) => {
    if (confirm(isRtl ? `هل تريد حذف الصفحة "${pg.title_ar || pg.title_en}"؟` : `Delete page "${pg.title_en}"?`)) {
      await deleteAdminPageAction(pg.id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            {isRtl ? "إدارة الصفحات الثابتة والمحتوى القانوني" : "Static Pages & Content Management"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {isRtl
              ? "تحرير صفحات من نحن، اتصل بنا، سياسة الخصوصية، الشروط والأحكام، وسياسة الإلغاء"
              : "Bilingual management of About, Contact, Privacy Policy, Terms, and Cancellation"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? "إنشاء صفحة جديدة" : "Create New Page"}</span>
        </button>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((pg) => {
          const isComplete = Boolean(
            pg.title_en &&
            pg.title_ar &&
            pg.content_en.length > 20 &&
            pg.content_ar.length > 20
          );
          return (
            <div
              key={pg.id}
              className="p-5 rounded-2xl bg-surface-container border border-outline-variant/30 hover:border-primary/40 transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">
                      {isRtl ? pg.title_ar : pg.title_en}
                    </h4>
                    <span className="font-mono text-[11px] text-primary/80">
                      /{pg.slug}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {pg.status === "published" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20">
                      {isRtl ? "منشور" : "Published"}
                    </span>
                  )}
                  {pg.status === "draft" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/20">
                      {isRtl ? "مسودة" : "Draft"}
                    </span>
                  )}
                  {pg.status === "archived" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 font-semibold border border-zinc-500/20">
                      {isRtl ? "مؤرشف" : "Archived"}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-on-surface-variant line-clamp-2">
                {isRtl ? pg.excerpt_ar || pg.excerpt_en : pg.excerpt_en || pg.excerpt_ar}
              </p>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
                <div className="flex items-center gap-1.5">
                  {isComplete ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">
                      EN ✓ AR ✓
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20 font-semibold">
                      {isRtl ? "ترجمة ناقصة" : "Missing AR / EN"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`/en/${pg.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                    title={isRtl ? "معاينة الصفحة العامة" : "Preview Public Page"}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => openEditor(pg)}
                    className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                    title={isRtl ? "تعديل الصفحة" : "Edit Page"}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        pg,
                        pg.status === "published" ? "draft" : "published"
                      )
                    }
                    className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-amber-400 transition-colors"
                    title={pg.status === "published" ? (isRtl ? "تحويل لمسودة" : "Unpublish to Draft") : (isRtl ? "نشر الصفحة" : "Publish Page")}
                  >
                    {pg.status === "published" ? <Archive className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(pg)}
                    className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-rose-400 transition-colors"
                    title={isRtl ? "حذف الصفحة" : "Delete Page"}
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
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-surface border border-primary/30 p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {editingPage.id
                    ? isRtl
                      ? `تعديل الصفحة: ${editingPage.title_ar || editingPage.title_en}`
                      : `Edit Page: ${editingPage.title_en}`
                    : isRtl
                    ? "إنشاء صفحة جديدة"
                    : "Create New Static Page"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isRtl ? "تحرير المحتوى ثنائي اللغة والوسوم التعريفية لمحركات البحث (SEO)" : "Bilingual content authoring with full SEO and XSS sanitization"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPage(null)}
                className="text-on-surface-variant hover:text-on-surface text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Regulatory Notice Banner */}
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-xs text-primary/90 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isRtl
                  ? "تنبيه تنظيمي: يُحظر إدراج تراخيص غير معتمدة أو ادعاءات قانونية غير موثقة. يرجى استخدام المعرفات المصرح بها لقطر للسياحة فقط."
                  : "Compliance Notice: Never invent unverified licenses, certifications or legal awards. Preserve verified company disclosures."}
              </span>
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
                    {isRtl ? "المعرف الرابط (Slug)" : "URL Slug"}
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^[a-z0-9-]+$"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. about, privacy-policy"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    {isRtl ? "حالة النشر" : "Publication Status"}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "draft" | "published" | "archived")}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  >
                    <option value="published">{isRtl ? "منشور للعامة (Published)" : "Published (Live to public)"}</option>
                    <option value="draft">{isRtl ? "مسودة (Draft - مخفي)" : "Draft (Admin only)"}</option>
                    <option value="archived">{isRtl ? "مؤرشف (Archived)" : "Archived"}</option>
                  </select>
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Page Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g. About MZ Tourism Qatar"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    عنوان الصفحة (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitleAr}
                    onChange={(e) => setFormTitleAr(e.target.value)}
                    placeholder="مثال: عن إم زد للسياحة قطر"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                </div>
              </div>

              {/* Excerpts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Excerpt / Lead Paragraph (English)
                  </label>
                  <textarea
                    rows={2}
                    value={formExcerptEn}
                    onChange={(e) => setFormExcerptEn(e.target.value)}
                    placeholder="Brief lead summary..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    المقدمة / الملخص (عربي)
                  </label>
                  <textarea
                    rows={2}
                    value={formExcerptAr}
                    onChange={(e) => setFormExcerptAr(e.target.value)}
                    placeholder="مقدمة ملخصة للصفحة..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none font-arabic"
                  />
                </div>
              </div>

              {/* Rich Body Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Full Content HTML (English) *
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={formContentEn}
                    onChange={(e) => setFormContentEn(e.target.value)}
                    placeholder="<p>Full formatted article HTML...</p>"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    المحتوى الكامل HTML (عربي) *
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={formContentAr}
                    onChange={(e) => setFormContentAr(e.target.value)}
                    placeholder="<p>محتوى المقال باللغة العربية...</p>"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                  />
                </div>
              </div>

              {/* Hero Image */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  {isRtl ? "صورة الغلاف (Hero Image URL - اختياري)" : "Hero Image URL (Optional)"}
                </label>
                <input
                  type="text"
                  value={formHeroImage}
                  onChange={(e) => setFormHeroImage(e.target.value)}
                  placeholder="/images/hero-safari.jpg or https://..."
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                />
              </div>

              {/* SEO Tags */}
              <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-4">
                <span className="text-xs font-bold text-primary block">
                  {isRtl ? "وسوم محركات البحث المخصصة (SEO Metadata)" : "SEO Metadata Settings"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formMetaTitleEn}
                    onChange={(e) => setFormMetaTitleEn(e.target.value)}
                    placeholder="Meta Title (EN)"
                    className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={formMetaTitleAr}
                    onChange={(e) => setFormMetaTitleAr(e.target.value)}
                    placeholder="عنوان محرك البحث (عربي)"
                    className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                  <input
                    type="text"
                    value={formMetaDescEn}
                    onChange={(e) => setFormMetaDescEn(e.target.value)}
                    placeholder="Meta Description (EN)"
                    className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={formMetaDescAr}
                    onChange={(e) => setFormMetaDescAr(e.target.value)}
                    placeholder="وصف محرك البحث (عربي)"
                    className="px-3.5 py-2 rounded-xl bg-surface border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setEditingPage(null)}
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
                    ? "حفظ الصفحة"
                    : "Save Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
