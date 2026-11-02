import { Metadata } from "next";
import AuthView from "@/components/AuthView";
import { getDictionary } from "@/translations";

export const metadata: Metadata = {
  title: "تسجيل الدخول | إم زد للسياحة قطر",
  description: "تسجيل الدخول للوصول إلى حجوزاتك ومحفظتك السياحية في قطر.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPageAr() {
  const dict = getDictionary("ar");
  return <AuthView currentLocale="ar" dict={dict} initialMode="signin" />;
}
