"use client";

import { useState } from "react";
import {
  Plus,
  HelpCircle,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import {
  saveAdminFaqAction,
  toggleAdminFaqPublishAction,
  deleteAdminFaqAction,
  reorderAdminFaqsAction,
} from "@/lib/server/cms-actions";

type CmsFaqRow = Database["public"]["Tables"]["cms_faqs"]["Row"];

interface CmsFaqsTabProps {
  faqs: CmsFaqRow[];
  onRefresh: () => void;
  isRtl: boolean;
}

const FAQ_CATEGORIES = [
  { key: "all", labelEn: "All Categories", labelAr: "جميع الأقسام" },
  { key: "bookings", labelEn: "Bookings & Payments", labelAr: "الحجوزات والمدفوعات" },
  { key: "safari", labelEn: "Desert Expeditions", labelAr: "الرحلات الصحراوية" },
  { key: "charters", labelEn: "Yacht & Aviation Charters", labelAr: "اليخوت والطيران الخاص" },
  { key: "general", labelEn: "General & VIP Protocols", labelAr: "عام وبروتوكول كبار الشخصيات" },
];

export default function CmsFaqsTab({ faqs, onRefresh, isRtl }: CmsFaqsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingFaq, setEditingFaq] = useState<CmsFaqRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formCategory, setFormCategory] = useState("bookings");
  const [formQuestionEn, setFormQuestionEn] = useState("");
  const [formQuestionAr, setFormQuestionAr] = useState("");
  const [formAnswerEn, setFormAnswerEn] = useState("");
  const [formAnswerAr, setFormAnswerAr] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(true);

  const filteredFaqs = faqs.filter((f) =>
    selectedCategory === "all" ? true : f.category === selectedCategory
  );

  const openEditor = (faq?: CmsFaqRow) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (faq) {
      setEditingFaq(faq);
      setFormCategory(faq.category);
      setFormQuestionEn(faq.question_en);
      setFormQuestionAr(faq.question_ar);
      setFormAnswerEn(faq.answer_en);
      setFormAnswerAr(faq.answer_ar);
      setFormIsPublished(faq.is_published);
    } else {
      setEditingFaq({
        id: "",
        category: selectedCategory === "all" ? "bookings" : selectedCategory,
        question_en: "",
        question_ar: "",
        answer_en: "",
        answer_ar: "",
        display_order: (faqs.length + 1) * 10,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setFormCategory(selectedCategory === "all" ? "bookings" : selectedCategory);
      setFormQuestionEn("");
      setFormQuestionAr("");
      setFormAnswerEn("");
      setFormAnswerAr("");
      setFormIsPublished(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await saveAdminFaqAction({
        id: editingFaq?.id ? editingFaq.id : undefined,
        category: formCategory,
        question_en: formQuestionEn,
        question_ar: formQuestionAr,
        answer_en: formAnswerEn,
        answer_ar: formAnswerAr,
        display_order: editingFaq?.display_order ?? (faqs.length + 1) * 10,
        is_published: formIsPublished,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to save FAQ");
      } else {
        setSuccessMessage(isRtl ? "تم حفظ السؤال بنجاح" : "FAQ saved successfully");
        setTimeout(() => {
          setEditingFaq(null);
          onRefresh();
        }, 600);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (faq: CmsFaqRow) => {
    const nextState = !faq.is_published;
    await toggleAdminFaqPublishAction(faq.id, nextState);
    onRefresh();
  };

  const handleDelete = async (faq: CmsFaqRow) => {
    if (confirm(isRtl ? `حذف السؤال الشائع؟` : `Delete FAQ "${faq.question_en}"?`)) {
      await deleteAdminFaqAction(faq.id);
      onRefresh();
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= filteredFaqs.length) return;

    const list = [...filteredFaqs];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const orderMap = list.map((item, idx) => ({
      id: item.id,
      display_order: (idx + 1) * 10,
    }));

    await reorderAdminFaqsAction(orderMap);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            {isRtl ? "إدارة الأسئلة الشائعة والدليل الإرشادي" : "FAQ & Advisory Guide Management"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {isRtl
              ? "تحكم في إجابات الأسئلة المتكررة وتصنيفاتها وترتيب ظهورها للضيوف"
              : "Curate bilingual travel advisory responses, categories, and display sequence"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? "إضافة سؤال جديد" : "Add New Question"}</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {FAQ_CATEGORIES.map((cat) => {
          const count =
            cat.key === "all"
              ? faqs.length
              : faqs.filter((f) => f.category === cat.key).length;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat.key
                  ? "bg-primary text-on-primary shadow-sm shadow-primary/20"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20"
              }`}
            >
              <span>{isRtl ? cat.labelAr : cat.labelEn}</span>
              <span className="ms-1.5 opacity-70 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface-container/50 border border-outline-variant/20 text-on-surface-variant text-xs">
            {isRtl ? "لا توجد أسئلة مسجلة في هذا القسم" : "No FAQs found in this category"}
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => (
            <div
              key={faq.id}
              className={`p-5 rounded-2xl border transition-all ${
                faq.is_published
                  ? "bg-surface-container border-outline-variant/30 hover:border-primary/40 shadow-sm"
                  : "bg-surface-container/40 border-outline-variant/15 opacity-70"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30"
                      title={isRtl ? "تحريك لأعلى" : "Move Up"}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-primary">
                      {faq.display_order}
                    </span>
                    <button
                      type="button"
                      disabled={idx === filteredFaqs.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30"
                      title={isRtl ? "تحريك لأسفل" : "Move Down"}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-surface-container-high text-primary font-bold">
                        {faq.category}
                      </span>
                      {faq.is_published ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20">
                          <Eye className="w-3 h-3" />
                          {isRtl ? "منشور" : "Published"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 font-semibold border border-zinc-500/20">
                          <EyeOff className="w-3 h-3" />
                          {isRtl ? "مخفي" : "Unpublished"}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-on-surface flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{isRtl ? faq.question_ar : faq.question_en}</span>
                    </h4>

                    <p className="text-xs text-on-surface-variant line-clamp-2 ps-6">
                      {isRtl ? faq.answer_ar : faq.answer_en}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(faq)}
                    className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                      faq.is_published
                        ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                    title={faq.is_published ? (isRtl ? "إلغاء النشر" : "Unpublish") : (isRtl ? "نشر السؤال" : "Publish")}
                  >
                    {faq.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditor(faq)}
                    className="p-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface hover:text-primary transition-all"
                    title={isRtl ? "تعديل السؤال" : "Edit Question"}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(faq)}
                    className="p-2 rounded-xl bg-surface-container-high border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all"
                    title={isRtl ? "حذف السؤال" : "Delete Question"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-surface border border-primary/30 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {editingFaq.id
                    ? isRtl
                      ? "تعديل السؤال الشائع"
                      : "Edit Frequently Asked Question"
                    : isRtl
                    ? "إضافة سؤال شائع جديد"
                    : "Create Frequently Asked Question"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isRtl ? "صيغة السؤال والإجابة المعتمدة باللغتين الإنجليزية والعربية" : "Provide verified question and response in English and Arabic"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
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
                    {isRtl ? "التصنيف" : "Category"}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  >
                    <option value="bookings">{isRtl ? "الحجوزات والمدفوعات" : "Bookings & Payments"}</option>
                    <option value="safari">{isRtl ? "الرحلات الصحراوية" : "Desert Expeditions"}</option>
                    <option value="charters">{isRtl ? "اليخوت والطيران الخاص" : "Yacht & Aviation Charters"}</option>
                    <option value="general">{isRtl ? "عام وبروتوكول كبار الشخصيات" : "General & VIP Protocols"}</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="rounded accent-primary w-4 h-4"
                    />
                    <span>{isRtl ? "نشر السؤال في الدليل الإرشادي" : "Publish to Public Guide"}</span>
                  </label>
                </div>
              </div>

              {/* Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Question (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formQuestionEn}
                    onChange={(e) => setFormQuestionEn(e.target.value)}
                    placeholder="e.g. How are private tours confirmed?"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    صيغة السؤال (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formQuestionAr}
                    onChange={(e) => setFormQuestionAr(e.target.value)}
                    placeholder="مثال: كيف يتم تأكيد الجولات السياحية الخاصة؟"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                </div>
              </div>

              {/* Answers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Answer (English) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formAnswerEn}
                    onChange={(e) => setFormAnswerEn(e.target.value)}
                    placeholder="Verified operations explanation in English..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    الإجابة والتوضيح (عربي) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formAnswerAr}
                    onChange={(e) => setFormAnswerAr(e.target.value)}
                    placeholder="الإجابة التشغيلية المعتمدة باللغة العربية..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none resize-none font-arabic"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
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
                    ? "حفظ السؤال"
                    : "Save FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
