"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Locale, TranslationDict } from "@/translations";
import {
  getCurrentUserAction,
  updateCustomerProfileAction,
  updateCustomerPasswordAction,
} from "@/lib/server/auth-actions";
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

interface AccountProfileViewProps {
  locale: Locale;
  dict?: TranslationDict;
}

export default function AccountProfileView({
  locale,
}: AccountProfileViewProps) {
  const isRtl = locale === "ar";
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<"en" | "ar">(locale);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await getCurrentUserAction();
        if (res.success && res.data?.user) {
          const u = res.data.user;
          setFullName(u.fullName || "");
          setEmail(u.email || "");
          // Default to +974 if phone is empty or doesn't have country code
          setPhone(u.phone || "+974 ");
          setPreferredLocale(u.preferredLocale || locale);
        }
      } catch (err) {
        console.error("[Profile Load Error]", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [locale]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      const res = await updateCustomerProfileAction({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        preferredLocale,
      });

      if (res.success) {
        setProfileMsg({
          type: "success",
          text: isRtl
            ? "تم تحديث الملف الشخصي بنجاح."
            : "Profile information updated successfully.",
        });
        // If preferred locale changed, we can transition URL if user wishes
        if (preferredLocale !== locale) {
          setTimeout(() => {
            router.push(`/${preferredLocale}/account/profile`);
            router.refresh();
          }, 1000);
        }
      } else {
        setProfileMsg({
          type: "error",
          text: res.error || (isRtl ? "تعذر حفظ التعديلات." : "Failed to update profile."),
        });
      }
    } catch {
      setProfileMsg({
        type: "error",
        text: isRtl ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({
        type: "error",
        text: isRtl
          ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
          : "Password must be at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: isRtl
          ? "كلمتا المرور غير متطابقتين."
          : "Passwords do not match.",
      });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await updateCustomerPasswordAction({
        newPassword,
      });

      if (res.success) {
        setPasswordMsg({
          type: "success",
          text: isRtl
            ? "تم تغيير كلمة المرور بنجاح."
            : "Password updated successfully.",
        });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg({
          type: "error",
          text: res.error || (isRtl ? "فشل تغيير كلمة المرور." : "Failed to update password."),
        });
      }
    } catch {
      setPasswordMsg({
        type: "error",
        text: isRtl ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-stone-400">
        <Loader2 className="w-8 h-8 text-[#C29B38] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3ECE1]">
          {isRtl ? "الملف الشخصي وإعدادات الأمان" : "Profile & Security Settings"}
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          {isRtl
            ? "إدارة بياناتك الشخصية، رقم الهاتف للتواصل، وكلمة المرور الخاصة بمحفظتك."
            : "Manage your VIP contact information, concierge liaison preferences, and account credentials."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-md">
          <h2 className="font-serif text-lg font-semibold text-[#F3ECE1] flex items-center gap-2 border-b border-stone-800 pb-3">
            <User className="w-4 h-4 text-[#C29B38]" />
            <span>{isRtl ? "البيانات الشخصية" : "Personal Information"}</span>
          </h2>

          {profileMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                profileMsg.type === "success"
                  ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                  : "bg-[#72132B]/30 border border-[#72132B]/60 text-red-300"
              }`}
            >
              {profileMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                {isRtl ? "الاسم الكامل" : "Full Name"}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-[#C29B38]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                {isRtl ? "البريد الإلكتروني (الحساب المعتمد)" : "Email Address (Verified Account)"}
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900/50 border border-stone-800 text-xs text-stone-500 cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-stone-600 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3" />
              </div>
              <span className="text-[10px] text-stone-500 mt-1 block">
                {isRtl
                  ? "البريد الإلكتروني مرتبط بهوية تسجيل الدخول ولا يمكن تعديله يدوياً."
                  : "Email is tied to your authentication identity."}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                {isRtl ? "رقم الهاتف (الدوحة / دولي)" : "Phone Number (+974 Qatar Default)"}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+974 7038 6705"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-[#C29B38]"
                />
                <Phone className="w-4 h-4 text-stone-500 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                {isRtl ? "اللغة المفضلة" : "Preferred Language"}
              </label>
              <select
                value={preferredLocale}
                onChange={(e) => setPreferredLocale(e.target.value as "en" | "ar")}
                className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-[#C29B38]"
              >
                <option value="en">English (Official)</option>
                <option value="ar">العربية (الدوحة، قطر)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-lg bg-[#C29B38] text-stone-950 font-semibold text-xs hover:bg-[#A8842E] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isRtl ? "حفظ التغييرات" : "Save Profile Details"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Password & Security Card */}
        <div className="bg-[#0F1115] border border-stone-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-[#F3ECE1] flex items-center gap-2 border-b border-stone-800 pb-3">
              <KeyRound className="w-4 h-4 text-[#C29B38]" />
              <span>{isRtl ? "أمان الحساب وكلمة المرور" : "Password & Credentials"}</span>
            </h2>

            {passwordMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                    : "bg-[#72132B]/30 border border-[#72132B]/60 text-red-300"
                }`}
              >
                {passwordMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  {isRtl ? "كلمة المرور الجديدة" : "New Password"}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-[#C29B38]"
                  />
                  <Lock className="w-4 h-4 text-stone-500 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3" />
                </div>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {isRtl ? "8 أحرف على الأقل" : "Minimum 8 characters"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  {isRtl ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-[#C29B38]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword}
                  className="w-full py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 font-semibold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isRtl ? "تحديث كلمة المرور" : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security Notice */}
          <div className="pt-4 border-t border-stone-800/80">
            <div className="flex items-start gap-2 text-stone-400 text-[11px] leading-relaxed">
              <Shield className="w-4 h-4 text-[#C29B38] shrink-0 mt-0.5" />
              <span>
                {isRtl
                  ? "جميع جلسات تسجيل الدخول والبيانات مشفرة بأعلى معايير الأمان وفقاً لبروتوكولات الخصوصية المعتمدة."
                  : "All client sessions and reservations are protected with end-to-end encrypted transport."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
