"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Locale, TranslationDict } from "@/translations";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import {
  signInAction,
  signUpAction,
  requestPasswordResetAction,
  updateCustomerPasswordAction,
} from "@/lib/server/auth-actions";
import {
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

interface AuthViewProps {
  currentLocale: Locale;
  dict: TranslationDict;
  initialMode?: AuthMode;
}

type AuthMode = "signin" | "signup" | "forgot" | "reset";

export default function AuthView({ currentLocale, dict, initialMode }: AuthViewProps) {
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>(initialMode || "signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In Form
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up Form
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");

  // Password Recovery Form
  const [forgotEmail, setForgotEmail] = useState("");

  // Reset Password Form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Detect mode parameter and OAuth error parameters from URL on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode");
      if (urlMode === "forgot" || urlMode === "reset" || urlMode === "signup" || urlMode === "signin") {
        setMode(urlMode);
      }

      const urlError = params.get("error");
      const urlErrorDesc = params.get("error_description");
      if (urlError) {
        if (urlError === "access_denied") {
          setError(
            isRtl
              ? "تم إلغاء عملية تسجيل الدخول بواسطة جوجل."
              : "Google sign-in was cancelled."
          );
        } else {
          setError(urlErrorDesc || urlError);
        }
      }
    }
  }, [isRtl]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/api/auth/callback?next=/${currentLocale}/account`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
      // If successful, Supabase automatically redirects the browser to Google
    } catch (err) {
      console.error("[Google OAuth Client Error]", err);
      setError(
        isRtl
          ? "فشل بدء تسجيل الدخول بواسطة جوجل. يرجى المحاولة مجدداً."
          : "Failed to initiate Google sign-in. Please try again."
      );
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signInAction({
        email: signInEmail.trim(),
        password: signInPassword,
      });

      if (res.success) {
        router.push(`/${currentLocale}/account`);
        router.refresh();
      } else {
        setError(res.error || "Invalid email or password.");
      }
    } catch (err) {
      console.error("[Sign In Error]", err);
      setError("An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await signUpAction({
        fullName: signUpName.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        phone: signUpPhone.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg(
          isRtl
            ? "تم إنشاء حسابك بنجاح. يُرجى تسجيل الدخول للوصول إلى حجوزاتك."
            : "Account created successfully. Please sign in to access your bookings."
        );
        setMode("signin");
        setSignInEmail(signUpEmail);
      } else {
        setError(res.error || "Failed to create account.");
      }
    } catch (err) {
      console.error("[Sign Up Error]", err);
      setError("An unexpected error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await requestPasswordResetAction({
        email: forgotEmail.trim(),
        locale: currentLocale,
      });

      if (res.success) {
        setSuccessMsg(
          res.message ||
            (isRtl
              ? "إذا كان هذا البريد مسجلاً لدينا، فقد تم إرسال رابط استعادة كلمة المرور إلى صندوق الوارد."
              : "If an account exists with this email, a recovery link has been dispatched to your inbox.")
        );
      } else {
        setError(res.error || "Unable to request password reset.");
      }
    } catch (err) {
      console.error("[Forgot Password Error]", err);
      setError("Failed to process password recovery.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setError(
        isRtl
          ? "كلمتا المرور غير متطابقتين."
          : "New password and confirmation do not match."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        isRtl
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
          : "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await updateCustomerPasswordAction({ password: newPassword });

      if (res.success) {
        setSuccessMsg(
          isRtl
            ? "تم تحديث كلمة المرور بنجاح! جارٍ تحويلك إلى حسابك..."
            : "Password updated successfully! Redirecting to your account..."
        );
        setTimeout(() => {
          router.push(`/${currentLocale}/account`);
          router.refresh();
        }, 1500);
      } else {
        setError(res.error || "Failed to update password.");
      }
    } catch (err) {
      console.error("[Reset Password Error]", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <Header dict={dict} currentLocale={currentLocale} />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <Link
              href={`/${currentLocale}`}
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Arrow className="w-3.5 h-3.5 rotate-180" />
              <span>{dict.nav.home}</span>
            </Link>
            <span className="text-[11px] uppercase tracking-wider text-primary font-mono font-semibold">
              {isRtl ? "بوابة الضيوف الفاخرة" : "Guest Concierge Portal"}
            </span>
          </div>

          {/* Auth Card */}
          <div className="bg-surface-container rounded-3xl border border-primary/30 p-6 sm:p-9 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-surface-container-high to-surface-container border border-primary/40 text-primary font-headline text-lg font-bold mx-auto flex items-center justify-center shadow-md">
                MZ
              </div>
              <h1 className="font-headline text-2xl text-on-surface font-semibold">
                {mode === "signin"
                  ? isRtl
                    ? "تسجيل دخول الضيوف"
                    : "Sign In to Your Account"
                  : mode === "signup"
                  ? isRtl
                    ? "إنشاء حساب ضيف جديد"
                    : "Create Guest Account"
                  : mode === "forgot"
                  ? isRtl
                    ? "استعادة كلمة المرور"
                    : "Recover Your Password"
                  : isRtl
                  ? "تعيين كلمة مرور جديدة"
                  : "Reset Your Password"}
              </h1>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                {mode === "forgot"
                  ? isRtl
                    ? "أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لتعيين كلمة مرور جديدة."
                    : "Enter your registered email and we will dispatch a secure link to reset your credentials."
                  : mode === "reset"
                  ? isRtl
                    ? "أدخل كلمة المرور الجديدة لحسابك وقم بتأكيدها للمتابعة."
                    : "Enter and confirm your new account password to complete recovery."
                  : isRtl
                  ? "متابعة الحجوزات النشطة، تواريخ الرحلات، وتأكيدات إيداع العربون."
                  : "Manage your private departures, review itinerary schedules, and deposit receipts."}
              </p>
            </div>

            {/* Mode Switcher Tabs (Only for signin / signup) */}
            {(mode === "signin" || mode === "signup") && (
              <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-container-high border border-outline-variant/20 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    mode === "signin"
                      ? "bg-primary text-on-primary shadow-md shadow-primary/20 font-bold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {isRtl ? "تسجيل الدخول" : "Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    mode === "signup"
                      ? "bg-primary text-on-primary shadow-md shadow-primary/20 font-bold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {isRtl ? "حساب جديد" : "Create Account"}
                </button>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google OAuth Customer Button (Sign In & Sign Up) */}
            {(mode === "signin" || mode === "signup") && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full min-h-[48px] rounded-xl bg-[#1E2024] hover:bg-[#282A2E] border border-primary/35 hover:border-primary text-on-surface text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-3 shadow-md group cursor-pointer disabled:opacity-60"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>{isRtl ? "جارٍ الاتصال بجوجل..." : "Connecting with Google..."}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>
                        {isRtl ? "المتابعة باستخدام Google" : "Continue with Google"}
                      </span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-outline-variant/30 w-full" />
                  <span className="bg-surface-container px-3 text-[10px] uppercase font-mono text-on-surface-variant shrink-0 tracking-wider">
                    {mode === "signin"
                      ? isRtl
                        ? "أو بواسطة البريد الإلكتروني"
                        : "or continue with email"
                      : isRtl
                      ? "أو التسجيل بالبريد الإلكتروني"
                      : "or register with email"}
                  </span>
                  <div className="border-t border-outline-variant/30 w-full" />
                </div>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {mode === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "البريد الإلكتروني" : "Email Address"}</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span>{isRtl ? "كلمة المرور" : "Password"}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                        setSuccessMsg(null);
                        setForgotEmail(signInEmail);
                      }}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      {isRtl ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full min-h-[48px] rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? "جارٍ تسجيل الدخول..." : "Signing In..."}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{isRtl ? "دخول إلى حسابي" : "Sign In to Account"}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {mode === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "الاسم الكامل" : "Full Name"}</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sheikh / VIP Guest"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "البريد الإلكتروني" : "Email Address"}</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "رقم الهاتف / واتساب" : "Mobile / WhatsApp"}</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+974 5500 0000"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "كلمة المرور (6 أحرف على الأقل)" : "Password (min. 6 characters)"}</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full min-h-[48px] rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? "جارٍ إنشاء الحساب..." : "Creating Account..."}</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      <span>{isRtl ? "تسجيل الحساب" : "Register Account"}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {mode === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "البريد الإلكتروني المسجل" : "Registered Email"}</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? "جارٍ الإرسال..." : "Dispatching Link..."}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{isRtl ? "إرسال رابط الاستعادة" : "Dispatch Recovery Link"}</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    {isRtl ? "← العودة إلى تسجيل الدخول" : "← Back to Sign In"}
                  </button>
                </div>
              </form>
            )}

            {/* 4. RESET PASSWORD FORM */}
            {mode === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "كلمة المرور الجديدة" : "New Password"}</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? "جارٍ التحديث..." : "Updating Password..."}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{isRtl ? "تحديث كلمة المرور" : "Set New Password"}</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    {isRtl ? "← العودة إلى تسجيل الدخول" : "← Back to Sign In"}
                  </button>
                </div>
              </form>
            )}

            {/* Footer Security Note */}
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex items-center gap-2 text-[11px] text-on-surface-variant">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <span>
                {isRtl
                  ? "تشفير مشدد وفق معايير الأمان لحماية بيانات الضيوف وخصوصيتهم."
                  : "End-to-end encrypted guest credentials and privacy protection."}
              </span>
            </div>

            <div className="text-center pt-2">
              <Link
                href={`/${currentLocale}/booking`}
                className="text-xs text-primary hover:underline font-medium"
              >
                {isRtl ? "تتبع حجز ضيف بدون تسجيل دخول ←" : "Track a guest reservation without logging in →"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
