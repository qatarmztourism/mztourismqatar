import { Metadata } from "next";
import AuthView from "@/components/AuthView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "دخول الضيوف وحساب الكونسيرج | إم زد للسياحة قطر",
  description: "تسجيل الدخول إلى حساب كونسيرج إم زد للسياحة قطر ومتابعة الحجوزات الخاصة.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthPageAr() {
  const dict = getDictionary("ar");
  return <AuthView currentLocale="ar" dict={dict} />;
}
