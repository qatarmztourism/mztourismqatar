"use client";

import { useState } from "react";
import {
  Plus,
  Star,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import {
  saveAdminTestimonialAction,
  toggleAdminTestimonialPublishAction,
  deleteAdminTestimonialAction,
} from "@/lib/server/cms-actions";

type CmsTestimonialRow = Database["public"]["Tables"]["cms_testimonials"]["Row"];

interface CmsTestimonialsTabProps {
  testimonials: CmsTestimonialRow[];
  onRefresh: () => void;
  isRtl: boolean;
}

export default function CmsTestimonialsTab({
  testimonials,
  onRefresh,
  isRtl,
}: CmsTestimonialsTabProps) {
  const [editingTestimonial, setEditingTestimonial] = useState<CmsTestimonialRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formTitleAr, setFormTitleAr] = useState("");
  const [formContentEn, setFormContentEn] = useState("");
  const [formContentAr, setFormContentAr] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formAvatarUrl, setFormAvatarUrl] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(false); // Defaults false for safety

  const openEditor = (item?: CmsTestimonialRow) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (item) {
      setEditingTestimonial(item);
      setFormName(item.customer_name);
      setFormTitleEn(item.customer_title_en || "");
      setFormTitleAr(item.customer_title_ar || "");
      setFormContentEn(item.content_en);
      setFormContentAr(item.content_ar);
      setFormRating(item.rating);
      setFormAvatarUrl(item.avatar_url || "");
      setFormIsPublished(item.is_published);
    } else {
      setEditingTestimonial({
        id: "",
        customer_name: "",
        customer_title_en: "",
        customer_title_ar: "",
        content_en: "",
        content_ar: "",
        rating: 5,
        avatar_url: "",
        display_order: (testimonials.length + 1) * 10,
        is_published: false, // strictly unpublished by default
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setFormName("");
      setFormTitleEn("");
      setFormTitleAr("");
      setFormContentEn("");
      setFormContentAr("");
      setFormRating(5);
      setFormAvatarUrl("");
      setFormIsPublished(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await saveAdminTestimonialAction({
        id: editingTestimonial?.id ? editingTestimonial.id : undefined,
        customer_name: formName,
        customer_title_en: formTitleEn || null,
        customer_title_ar: formTitleAr || null,
        content_en: formContentEn,
        content_ar: formContentAr,
        rating: formRating,
        avatar_url: formAvatarUrl || null,
        display_order: editingTestimonial?.display_order ?? (testimonials.length + 1) * 10,
        is_published: formIsPublished,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to save testimonial");
      } else {
        setSuccessMessage(isRtl ? "تم حفظ التقييم بنجاح" : "Review saved successfully");
        setTimeout(() => {
          setEditingTestimonial(null);
          onRefresh();
        }, 600);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item: CmsTestimonialRow) => {
    const next = !item.is_published;
    await toggleAdminTestimonialPublishAction(item.id, next);
    onRefresh();
  };

  const handleDelete = async (item: CmsTestimonialRow) => {
    if (confirm(isRtl ? `حذف تقييم العميل "${item.customer_name}"؟` : `Delete testimonial from "${item.customer_name}"?`)) {
      await deleteAdminTestimonialAction(item.id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Integrity Safeguard Banner */}
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 flex items-start gap-3 text-xs text-primary/90">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-on-surface">
            {isRtl
              ? "ضوابط المصداقية ومراجعات الضيوف المعتمدة"
              : "Review Authenticity & Compliance Safeguard"}
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            {isRtl
              ? "تلتزم إم زد للسياحة قطر بنشر التقييمات الحقيقية الموثقة من العملاء الفعليين حصراً. يُمنع توليد مراجعات وهمية أو تقييمات مفبركة. تبقى جميع التقييمات الجديدة غير منشورة تلقائياً حتى التدقيق والاعتماد."
              : "MZ Tourism Qatar strictly publishes authentic, verified reviews from genuine clients. Fabricating customer reviews or ratings is strictly prohibited. All new entries default to unpublished until manually approved."}
          </p>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            {isRtl ? "سجل آراء وتقييمات الضيوف" : "Verified Guest Reviews & Testimonials"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {isRtl
              ? `إجمالي التقييمات: ${testimonials.length} (المنشورة: ${testimonials.filter((t) => t.is_published).length})`
              : `Total reviews: ${testimonials.length} (${testimonials.filter((t) => t.is_published).length} approved & live)`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? "إضافة تقييم موثق" : "Add Verified Review"}</span>
        </button>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-surface-container/50 border border-outline-variant/20 text-on-surface-variant text-xs">
            {isRtl
              ? "لا توجد مراجعات عملاء مسجلة حالياً. استخدم الزر أعلاه لإضافة أول تقييم معتمد."
              : "No guest testimonials recorded yet. Use the button above to add verified customer feedback."}
          </div>
        ) : (
          testimonials.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                item.is_published
                  ? "bg-surface-container border-outline-variant/30 hover:border-primary/40 shadow-sm"
                  : "bg-surface-container/40 border-outline-variant/15 opacity-80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < item.rating ? "fill-primary text-primary" : "text-outline-variant/40"
                        }`}
                      />
                    ))}
                  </div>

                  {item.is_published ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20">
                      <Eye className="w-3 h-3" />
                      {isRtl ? "معتمد ومنشور" : "Approved"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/20">
                      <EyeOff className="w-3 h-3" />
                      {isRtl ? "قيد المراجعة" : "Pending Vetting"}
                    </span>
                  )}
                </div>

                <p className="text-xs text-on-surface italic line-clamp-3 leading-relaxed">
                  &ldquo;{isRtl ? item.content_ar : item.content_en}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {item.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.avatar_url}
                        alt={item.customer_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-on-surface">{item.customer_name}</h5>
                    <p className="text-[10px] text-on-surface-variant">
                      {isRtl ? item.customer_title_ar || "ضيف مميز" : item.customer_title_en || "Distinguished Guest"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className={`p-1.5 rounded-lg border text-xs transition-all ${
                      item.is_published
                        ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        : "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                    }`}
                    title={item.is_published ? (isRtl ? "إلغاء الاعتماد" : "Unpublish") : (isRtl ? "اعتماد ونشر التقييم" : "Approve & Publish")}
                  >
                    {item.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditor(item)}
                    className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                    title={isRtl ? "تعديل" : "Edit"}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-rose-400 transition-colors"
                    title={isRtl ? "حذف" : "Delete"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-surface border border-primary/30 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {editingTestimonial.id
                    ? isRtl
                      ? "تعديل تقييم العميل"
                      : "Edit Guest Review"
                    : isRtl
                    ? "إضافة تقييم ضيف معتمد"
                    : "Add Verified Guest Review"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isRtl ? "توثيق بيانات وتجربة العميل الحقيقية" : "Enter authentic customer feedback details"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
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

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    {isRtl ? "اسم العميل / الضيف *" : "Guest / Client Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Al-Thani Family / Ambassador H.E."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    {isRtl ? "التقييم (١ إلى ٥ نجوم)" : "Rating (1 to 5 Stars)"}
                  </label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                    <option value={3}>⭐⭐⭐ 3 Stars</option>
                    <option value={2}>⭐⭐ 2 Stars</option>
                    <option value={1}>⭐ 1 Star</option>
                  </select>
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Guest Title / Origin (English)
                  </label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g. Private Charter Guest, London"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    صفة أو جنسية الضيف (عربي)
                  </label>
                  <input
                    type="text"
                    value={formTitleAr}
                    onChange={(e) => setFormTitleAr(e.target.value)}
                    placeholder="مثال: ضيف رحلة يخت خاصة، لندن"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                </div>
              </div>

              {/* Review Copies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Testimonial (English) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formContentEn}
                    onChange={(e) => setFormContentEn(e.target.value)}
                    placeholder="Authentic feedback quote in English..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    نص التقييم (عربي) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formContentAr}
                    onChange={(e) => setFormContentAr(e.target.value)}
                    placeholder="نص التقييم المعتمد باللغة العربية..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none font-arabic"
                  />
                </div>
              </div>

              {/* Avatar URL & Publish Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    {isRtl ? "صورة شخصية (اختياري)" : "Avatar URL (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={formAvatarUrl}
                    onChange={(e) => setFormAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="rounded accent-primary w-4 h-4"
                    />
                    <span>{isRtl ? "اعتماد ونشر التقييم في الموقع" : "Approve & Publish to Website"}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
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
                    ? "حفظ التقييم"
                    : "Save Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
