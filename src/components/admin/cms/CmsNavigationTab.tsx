"use client";

import { useState } from "react";
import {
  Plus,
  Compass,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import {
  saveAdminNavigationAction,
  toggleAdminNavigationVisibilityAction,
  deleteAdminNavigationAction,
  reorderAdminNavigationAction,
} from "@/lib/server/cms-actions";

type CmsNavigationRow = Database["public"]["Tables"]["cms_navigation"]["Row"];

interface CmsNavigationTabProps {
  navigationItems: CmsNavigationRow[];
  onRefresh: () => void;
  isRtl: boolean;
}

const NAV_LOCATIONS = [
  { key: "all", labelEn: "All Menus", labelAr: "كافة القوائم" },
  { key: "header", labelEn: "Main Header Menu", labelAr: "قائمة الترويسة الرئيسية" },
  { key: "footer_quick_links", labelEn: "Footer Quick Links", labelAr: "روابط التذييل السريعة" },
  { key: "footer_experiences", labelEn: "Footer Experiences", labelAr: "تجارب التذييل" },
  { key: "footer_legal", labelEn: "Footer Legal & Policies", labelAr: "السياسات والروابط القانونية" },
];

export default function CmsNavigationTab({
  navigationItems,
  onRefresh,
  isRtl,
}: CmsNavigationTabProps) {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [editingItem, setEditingItem] = useState<CmsNavigationRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formLocation, setFormLocation] = useState<CmsNavigationRow["location"]>("header");
  const [formLabelEn, setFormLabelEn] = useState("");
  const [formLabelAr, setFormLabelAr] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formIsVisible, setFormIsVisible] = useState(true);

  const filteredItems = navigationItems.filter((item) =>
    selectedLocation === "all" ? true : item.location === selectedLocation
  );

  const openEditor = (item?: CmsNavigationRow) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (item) {
      setEditingItem(item);
      setFormLocation(item.location);
      setFormLabelEn(item.label_en);
      setFormLabelAr(item.label_ar);
      setFormUrl(item.url);
      setFormIsVisible(item.is_visible);
    } else {
      const defaultLoc: CmsNavigationRow["location"] =
        selectedLocation === "all" ? "header" : (selectedLocation as CmsNavigationRow["location"]);
      setEditingItem({
        id: "",
        location: defaultLoc,
        label_en: "",
        label_ar: "",
        url: "",
        display_order: (navigationItems.length + 1) * 10,
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setFormLocation(defaultLoc);
      setFormLabelEn("");
      setFormLabelAr("");
      setFormUrl("");
      setFormIsVisible(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await saveAdminNavigationAction({
        id: editingItem?.id ? editingItem.id : undefined,
        location: formLocation,
        label_en: formLabelEn,
        label_ar: formLabelAr,
        url: formUrl,
        display_order: editingItem?.display_order ?? (navigationItems.length + 1) * 10,
        is_visible: formIsVisible,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to save navigation link");
      } else {
        setSuccessMessage(isRtl ? "تم حفظ الرابط بنجاح" : "Link saved successfully");
        setTimeout(() => {
          setEditingItem(null);
          onRefresh();
        }, 600);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item: CmsNavigationRow) => {
    const next = !item.is_visible;
    await toggleAdminNavigationVisibilityAction(item.id, next);
    onRefresh();
  };

  const handleDelete = async (item: CmsNavigationRow) => {
    if (confirm(isRtl ? `حذف الرابط "${item.label_ar || item.label_en}"؟` : `Delete navigation link "${item.label_en}"?`)) {
      await deleteAdminNavigationAction(item.id);
      onRefresh();
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= filteredItems.length) return;

    const list = [...filteredItems];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const orderMap = list.map((item, idx) => ({
      id: item.id,
      display_order: (idx + 1) * 10,
    }));

    await reorderAdminNavigationAction(orderMap);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container border border-outline-variant/30">
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            {isRtl ? "إدارة قوائم الترويسة والتذييل" : "Header & Footer Navigation"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {isRtl
              ? "تحكم في روابط القائمة العلوية وروابط الفوتر والسياسات القانونية"
              : "Manage top bar links, footer columns, and legal policy navigation"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? "إضافة رابط جديد" : "Add Navigation Link"}</span>
        </button>
      </div>

      {/* Location Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {NAV_LOCATIONS.map((loc) => {
          const count =
            loc.key === "all"
              ? navigationItems.length
              : navigationItems.filter((i) => i.location === loc.key).length;
          return (
            <button
              key={loc.key}
              type="button"
              onClick={() => setSelectedLocation(loc.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedLocation === loc.key
                  ? "bg-primary text-on-primary shadow-sm shadow-primary/20"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20"
              }`}
            >
              <span>{isRtl ? loc.labelAr : loc.labelEn}</span>
              <span className="ms-1.5 opacity-70 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface-container/50 border border-outline-variant/20 text-on-surface-variant text-xs">
            {isRtl ? "لا توجد روابط مسجلة في هذا القسم" : "No navigation links found in this menu"}
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.is_visible
                  ? "bg-surface-container border-outline-variant/30 hover:border-primary/40 shadow-sm"
                  : "bg-surface-container/40 border-outline-variant/15 opacity-70"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-primary">
                      {item.display_order}
                    </span>
                    <button
                      type="button"
                      disabled={idx === filteredItems.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Compass className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-on-surface">
                        {item.label_en} / {item.label_ar}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono">
                        {item.location}
                      </span>
                      {item.is_visible ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20">
                          {isRtl ? "مرئي" : "Visible"}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 font-semibold border border-zinc-500/20">
                          {isRtl ? "مخفي" : "Hidden"}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-primary/80 font-mono block mt-0.5">
                      {item.url}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className={`p-1.5 rounded-lg border text-xs transition-all ${
                      item.is_visible
                        ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditor(item)}
                    className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-rose-400 transition-colors"
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
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-surface border border-primary/30 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {editingItem.id
                    ? isRtl
                      ? "تعديل رابط القائمة"
                      : "Edit Navigation Link"
                    : isRtl
                    ? "إضافة رابط قائمة جديد"
                    : "Add Navigation Link"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isRtl ? "حدد وجهة الرابط والتسميات ثنائية اللغة وموقع العرض" : "Set link destination, bilingual labels, and placement"}
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
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  {isRtl ? "موقع القائمة" : "Menu Placement"}
                </label>
                <select
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value as CmsNavigationRow["location"])}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                >
                  <option value="header">{isRtl ? "قائمة الترويسة العلوية" : "Main Header Menu"}</option>
                  <option value="footer_quick_links">{isRtl ? "روابط الفوتر السريعة" : "Footer Quick Links"}</option>
                  <option value="footer_experiences">{isRtl ? "تجارب الفوتر" : "Footer Experiences"}</option>
                  <option value="footer_legal">{isRtl ? "السياسات والروابط القانونية" : "Footer Legal & Policies"}</option>
                </select>
              </div>

              {/* Labels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Label (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLabelEn}
                    onChange={(e) => setFormLabelEn(e.target.value)}
                    placeholder="e.g. Experiences"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none"
                  />
                </div>
                <div dir="rtl">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    نص الرابط (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLabelAr}
                    onChange={(e) => setFormLabelAr(e.target.value)}
                    placeholder="مثال: التجارب السياحية"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-arabic"
                  />
                </div>
              </div>

              {/* Destination URL */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  {isRtl ? "الرابط المقصود (URL) *" : "Destination URL *"}
                </label>
                <input
                  type="text"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="/services, /about, or https://..."
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:border-primary outline-none font-mono"
                />
              </div>

              {/* Visibility toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                  <input
                    type="checkbox"
                    checked={formIsVisible}
                    onChange={(e) => setFormIsVisible(e.target.checked)}
                    className="rounded accent-primary w-4 h-4"
                  />
                  <span>{isRtl ? "إظهار الرابط في القائمة" : "Visible in Menu"}</span>
                </label>
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
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isSaving
                    ? isRtl
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isRtl
                    ? "حفظ الرابط"
                    : "Save Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
