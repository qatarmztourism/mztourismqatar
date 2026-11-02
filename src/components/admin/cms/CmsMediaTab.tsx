"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  Copy,
  Check,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import {
  uploadAdminMediaAction,
  updateAdminMediaMetadataAction,
  deleteAdminMediaAction,
} from "@/lib/server/cms-actions";

type CmsMediaRow = Database["public"]["Tables"]["cms_media"]["Row"];

interface CmsMediaTabProps {
  mediaList: CmsMediaRow[];
  onRefresh: () => void;
  isRtl: boolean;
}

const MEDIA_CATEGORIES = [
  { key: "all", labelEn: "All Media", labelAr: "كافة الوسائط" },
  { key: "hero", labelEn: "Hero & Banners", labelAr: "الواجهة واللافتات" },
  { key: "destinations", labelEn: "Destinations", labelAr: "الوجهات" },
  { key: "experiences", labelEn: "Tours & Experiences", labelAr: "التجارب والجولات" },
  { key: "editorial", labelEn: "Editorial & About", labelAr: "المقالات ومن نحن" },
  { key: "general", labelEn: "General Assets", labelAr: "وسائط عامة" },
];

export default function CmsMediaTab({ mediaList, onRefresh, isRtl }: CmsMediaTabProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Upload Form states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadCategory, setUploadCategory] = useState<CmsMediaRow["category"]>("general");
  const [uploadTitleEn, setUploadTitleEn] = useState("");
  const [uploadTitleAr, setUploadTitleAr] = useState("");
  const [uploadAltEn, setUploadAltEn] = useState("");
  const [uploadAltAr, setUploadAltAr] = useState("");

  // Editing existing metadata
  const [editingItem, setEditingItem] = useState<CmsMediaRow | null>(null);
  const [editTitleEn, setEditTitleEn] = useState("");
  const [editTitleAr, setEditTitleAr] = useState("");
  const [editAltEn, setEditAltEn] = useState("");
  const [editAltAr, setEditAltAr] = useState("");
  const [editCategory, setEditCategory] = useState<CmsMediaRow["category"]>("general");
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredMedia = mediaList.filter((m) =>
    selectedCategory === "all" ? true : m.category === selectedCategory
  );

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      setErrorMessage(isRtl ? "يرجى اختيار ملف صورة أولاً" : "Please select an image file first");
      return;
    }

    const file = fileInputRef.current.files[0];
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(isRtl ? "حجم الملف يتجاوز الحد الأقصى (10 ميجابايت)" : "File size exceeds 10MB limit");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title_en", uploadTitleEn);
      formData.append("title_ar", uploadTitleAr);
      formData.append("alt_en", uploadAltEn);
      formData.append("alt_ar", uploadAltAr);
      formData.append("category", uploadCategory);

      const res = await uploadAdminMediaAction(formData);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to upload image");
      } else {
        setSuccessMessage(isRtl ? "تم رفع الصورة وحفظها بنجاح" : "Image uploaded successfully");
        // Reset form
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploadTitleEn("");
        setUploadTitleAr("");
        setUploadAltEn("");
        setUploadAltAr("");
        onRefresh();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const openEditModal = (item: CmsMediaRow) => {
    setEditingItem(item);
    setEditTitleEn(item.title_en || "");
    setEditTitleAr(item.title_ar || "");
    setEditAltEn(item.alt_en || "");
    setEditAltAr(item.alt_ar || "");
    setEditCategory(item.category);
  };

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const res = await updateAdminMediaMetadataAction(editingItem.id, {
        title_en: editTitleEn,
        title_ar: editTitleAr,
        alt_en: editAltEn,
        alt_ar: editAltAr,
        category: editCategory,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update metadata");
      } else {
        setSuccessMessage(isRtl ? "تم تحديث البيانات الوصفية" : "Metadata updated successfully");
        setEditingItem(null);
        onRefresh();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Update error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (item: CmsMediaRow) => {
    if (confirm(isRtl ? `حذف الصورة "${item.filename}" نهائياً من المكتبة؟` : `Permanently delete media "${item.filename}"?`)) {
      await deleteAdminMediaAction(item.id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
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

      {/* Upload Dropzone & Form */}
      <div className="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">
              {isRtl ? "رفع وسائط وصور جديدة إلى المستودع العام" : "Upload New Assets to Public Media Repository"}
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              {isRtl
                ? "مستودع cms-media العام: يُسمح بصيغ JPG, PNG, WEBP, AVIF, SVG بحد أقصى 10 ميجابايت"
                : "Public cms-media bucket: JPG, PNG, WEBP, AVIF, SVG allowed up to 10MB"}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                {isRtl ? "ملف الصورة *" : "Image File *"}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                {isRtl ? "التصنيف" : "Category"}
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as CmsMediaRow["category"])}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
              >
                <option value="general">{isRtl ? "وسائط عامة" : "General"}</option>
                <option value="hero">{isRtl ? "الواجهة واللافتات" : "Hero & Banners"}</option>
                <option value="destinations">{isRtl ? "الوجهات" : "Destinations"}</option>
                <option value="experiences">{isRtl ? "التجارب والجولات" : "Experiences"}</option>
                <option value="editorial">{isRtl ? "المقالات ومن نحن" : "Editorial"}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={uploadTitleEn}
              onChange={(e) => setUploadTitleEn(e.target.value)}
              placeholder="Title (English, optional)"
              className="px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
            />
            <input
              type="text"
              dir="rtl"
              value={uploadTitleAr}
              onChange={(e) => setUploadTitleAr(e.target.value)}
              placeholder="العنوان الوصفي (عربي، اختياري)"
              className="px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
            />
            <input
              type="text"
              value={uploadAltEn}
              onChange={(e) => setUploadAltEn(e.target.value)}
              placeholder="Alt Text (English, for accessibility)"
              className="px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
            />
            <input
              type="text"
              dir="rtl"
              value={uploadAltAr}
              onChange={(e) => setUploadAltAr(e.target.value)}
              placeholder="النص البديل (عربي، لمحركات البحث وقارئ الشاشة)"
              className="px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {isUploading ? (isRtl ? "جاري الرفع..." : "Uploading...") : (isRtl ? "رفع الصورة" : "Upload Image")}
            </button>
          </div>
        </form>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {MEDIA_CATEGORIES.map((cat) => {
          const count =
            cat.key === "all"
              ? mediaList.length
              : mediaList.filter((m) => m.category === cat.key).length;
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

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-surface-container/50 border border-outline-variant/20 text-on-surface-variant text-xs">
            {isRtl ? "لا توجد صور في هذا التصنيف" : "No media items found in this category"}
          </div>
        ) : (
          filteredMedia.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden hover:border-primary/40 transition-all flex flex-col justify-between group shadow-sm"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video bg-black/40 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.public_url}
                  alt={item.alt_en || item.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to placeholder icon
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="absolute top-2 start-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-primary font-mono font-bold">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-on-surface truncate" title={item.filename}>
                  {item.title_en || item.filename}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                  <span>{(item.file_size / 1024).toFixed(0)} KB</span>
                  <span>{item.mime_type.split("/")[1]?.toUpperCase()}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.id, item.public_url)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-primary/10 text-on-surface hover:text-primary transition-colors text-[11px] font-semibold"
                    title={isRtl ? "نسخ الرابط العام" : "Copy Public URL"}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{isRtl ? "تم النسخ" : "Copied"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isRtl ? "نسخ الرابط" : "Copy URL"}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={item.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                      title={isRtl ? "عرض الصورة كاملة" : "Open Full Image"}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                      title={isRtl ? "تعديل البيانات الوصفية" : "Edit Metadata"}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-rose-400 transition-colors"
                      title={isRtl ? "حذف الصورة" : "Delete Image"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Metadata Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-surface border border-primary/30 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {isRtl ? "تعديل البيانات الوصفية للصورة" : "Edit Image Metadata & Accessibility"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5 truncate max-w-xs sm:max-w-md">
                  {editingItem.filename}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-on-surface-variant hover:text-on-surface text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMetadata} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  {isRtl ? "التصنيف" : "Category"}
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CmsMediaRow["category"])}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                >
                  <option value="general">{isRtl ? "وسائط عامة" : "General"}</option>
                  <option value="hero">{isRtl ? "الواجهة واللافتات" : "Hero & Banners"}</option>
                  <option value="destinations">{isRtl ? "الوجهات" : "Destinations"}</option>
                  <option value="experiences">{isRtl ? "التجارب والجولات" : "Experiences"}</option>
                  <option value="editorial">{isRtl ? "المقالات ومن نحن" : "Editorial"}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={editTitleEn}
                    onChange={(e) => setEditTitleEn(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    العنوان الوصفي (عربي)
                  </label>
                  <input
                    type="text"
                    value={editTitleAr}
                    onChange={(e) => setEditTitleAr(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Alt Text (English)
                  </label>
                  <input
                    type="text"
                    value={editAltEn}
                    onChange={(e) => setEditAltEn(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    النص البديل (عربي)
                  </label>
                  <input
                    type="text"
                    value={editAltAr}
                    onChange={(e) => setEditAltAr(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isUpdating ? (isRtl ? "جاري الحفظ..." : "Updating...") : (isRtl ? "حفظ التعديلات" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
