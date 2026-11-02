import { Metadata } from "next";
import AuthView from "@/components/AuthView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "إنشاء حساب جديد | إم زد للسياحة قطر",
  description: "سجل حسابك الخاص للاستفادة من خدمات الكونسيرج ومتابعة رحلاتك الفاخرة في قطر.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPageAr() {
  const dict = getDictionary("ar");
  return <AuthView currentLocale="ar" dict={dict} initialMode="signup" />;
}
