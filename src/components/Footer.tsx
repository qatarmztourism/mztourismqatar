"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TranslationDict, Locale } from "@/translations";
import { siteConfig, getWhatsAppInquiryUrl } from "@/config/site-config";
import { ShieldCheck, MapPin, Mail, MessageCircle, Globe } from "lucide-react";

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
import { getPublicSiteSettingsAction } from "@/lib/server/cms-actions";
import type { Database } from "@/lib/supabase/database.types";

type CmsSiteSettingsRow = Database["public"]["Tables"]["cms_site_settings"]["Row"];

interface FooterProps {
  dict: TranslationDict;
  currentLocale: Locale;
  onOpenInquiryModal: () => void;
  siteSettings?: Partial<CmsSiteSettingsRow> | null;
}

export default function Footer({
  dict,
  currentLocale,
  onOpenInquiryModal,
  siteSettings,
}: FooterProps) {
  const pathname = usePathname() || `/${currentLocale}`;
  const isRtl = currentLocale === "ar";
  const otherLocale: Locale = currentLocale === "en" ? "ar" : "en";
  const otherLocaleLabel = currentLocale === "en" ? "العربية" : "English";

  // Calculate equivalent path in the opposite language
  let switchLocalePath = `/${otherLocale}`;
  if (pathname.startsWith("/en")) {
    switchLocalePath = pathname.replace(/^\/en/, "/ar");
  } else if (pathname.startsWith("/ar")) {
    switchLocalePath = pathname.replace(/^\/ar/, "/en");
  }

  const [settings, setSettings] = useState<Partial<CmsSiteSettingsRow> | null>(siteSettings || null);

  useEffect(() => {
    if (!settings) {
      getPublicSiteSettingsAction()
        .then((res) => {
          if (res.success && res.data) {
            setSettings(res.data);
          }
        })
        .catch(() => {});
    }
  }, [settings]);

  const defaultVipMessage =
    currentLocale === "ar"
      ? "مرحباً إم زد للسياحة قطر، أود التواصل مع فريق الكونسيرج."
      : "Hello MZ Tourism Qatar, I would like to connect with your concierge team.";

  const whatsAppUrl = getWhatsAppInquiryUrl(defaultVipMessage);

  const facebookUrl = (settings?.social_facebook ?? siteConfig.social?.facebook ?? "").trim();
  const rawWhatsApp = (settings?.contact_whatsapp ?? siteConfig.whatsapp?.number ?? "").trim();
  const instagramUrl = (settings?.social_instagram ?? siteConfig.social?.instagram ?? "").trim();

  const whatsAppFinalUrl = rawWhatsApp
    ? (rawWhatsApp.startsWith("http")
        ? rawWhatsApp
        : getWhatsAppInquiryUrl(defaultVipMessage, rawWhatsApp))
    : whatsAppUrl;

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-primary/20 pt-12 pb-20 md:pb-12 text-on-surface-variant text-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Main 4-column footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-outline-variant/20">
          {/* Col 1: Brand & Credentials */}
          <div className="space-y-4">
            <Link href={`/${currentLocale}`} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary font-headline text-base font-bold group-hover:border-primary transition-colors">
                MZ
              </div>
              <span className="font-headline text-lg text-primary font-semibold group-hover:text-primary-fixed transition-colors">
                {dict.brand.name}
              </span>
            </Link>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {dict.footer.aboutText}
            </p>

            <div className="p-3 rounded-xl bg-surface-container-low border border-primary/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-[11px] text-on-surface leading-tight font-medium">
                {dict.footer.licenseNotice}
              </span>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-on-surface-variant">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{dict.footer.address}</span>
            </div>
          </div>

          {/* Col 2: 8 Signature Services */}
          <div className="space-y-3">
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wider">
              {dict.footer.servicesTitle}
            </h3>
            <ul className="space-y-2 text-xs">
              {dict.services.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/${currentLocale}/services/${service.id}`}
                    className="hover:text-primary transition-colors line-clamp-1 block"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Guest Concierge */}
          <div className="space-y-3">
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wider">
              {dict.footer.conciergeTitle}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href={`/${currentLocale}/about`}
                  className="hover:text-primary transition-colors block"
                >
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${currentLocale}/faq`}
                  className="hover:text-primary transition-colors block"
                >
                  {dict.nav.advisory}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${currentLocale}/contact`}
                  className="hover:text-primary transition-colors block"
                >
                  {dict.nav.contact}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenInquiryModal}
                  className="hover:text-primary text-left transition-colors"
                  style={{ textAlign: isRtl ? "right" : "left" }}
                >
                  {dict.nav.bookNow}
                </button>
              </li>
              <li>
                <Link
                  href={`/${currentLocale}/booking`}
                  className="hover:text-primary transition-colors block text-primary"
                >
                  {dict.nav.trackBooking}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${currentLocale}/account`}
                  className="hover:text-primary transition-colors block"
                >
                  {dict.nav.account}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${currentLocale}#reviews`}
                  className="hover:text-primary transition-colors block"
                >
                  {dict.nav.testimonials}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: 24/7 VIP Helpline & Language */}
          <div className="space-y-4">
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wider">
              {isRtl ? "قنوات التواصل المباشر" : "Direct VIP Helpline"}
            </h3>

            <div className="space-y-2.5">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container border border-primary/20 hover:border-primary text-on-surface hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-xs">{dict.footer.phone}</span>
              </a>

              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary text-on-surface hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs">{dict.footer.email}</span>
              </a>
            </div>

            {/* Language Switch */}
            <div className="pt-2">
              <span className="text-[11px] text-on-surface-variant block mb-1.5 uppercase tracking-wider">
                {dict.nav.selectLanguage}
              </span>
              <Link
                href={switchLocalePath}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high border border-primary/30 text-primary text-xs font-semibold hover:bg-primary hover:text-on-primary transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{otherLocaleLabel}</span>
              </Link>
            </div>

            {/* Exactly 3 Social Media Icons Managed via CMS */}
            {(facebookUrl || whatsAppFinalUrl || instagramUrl) && (
              <div className="pt-1">
                <span className="text-[11px] text-on-surface-variant block mb-1.5 uppercase tracking-wider">
                  {isRtl ? "تابعنا على" : "Connect With Us"}
                </span>
                <div className="flex items-center gap-2">
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-8 h-8 rounded-lg bg-surface-container border border-primary/20 hover:border-primary text-primary hover:text-primary-fixed flex items-center justify-center transition-colors shadow-sm"
                    >
                      <FacebookIcon className="w-4 h-4" />
                    </a>
                  )}
                  {whatsAppFinalUrl && (
                    <a
                      href={whatsAppFinalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      className="w-8 h-8 rounded-lg bg-surface-container border border-primary/20 hover:border-primary text-primary hover:text-primary-fixed flex items-center justify-center transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-8 h-8 rounded-lg bg-surface-container border border-primary/20 hover:border-primary text-primary hover:text-primary-fixed flex items-center justify-center transition-colors shadow-sm"
                    >
                      <InstagramIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legal Policy Links */}
        <div className="pt-6 mt-6 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-on-surface-variant/80 border-t border-outline-variant/15">
          <Link href={`/${currentLocale}/privacy-policy`} className="hover:text-primary transition-colors">
            {isRtl ? "سياسة الخصوصية" : "Privacy Policy"}
          </Link>
          <span className="text-outline-variant/40">•</span>
          <Link href={`/${currentLocale}/terms-conditions`} className="hover:text-primary transition-colors">
            {isRtl ? "الشروط والأحكام" : "Terms & Conditions"}
          </Link>
          <span className="text-outline-variant/40">•</span>
          <Link href={`/${currentLocale}/cancellation-policy`} className="hover:text-primary transition-colors">
            {isRtl ? "سياسة الإلغاء والاسترداد" : "Cancellation Policy"}
          </Link>
        </div>

        {/* Policy disclaimer & Copyright */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-on-surface-variant/80">
          <p>{dict.footer.rightsText}</p>
          <p className="text-center md:text-right max-w-xl text-primary/80">
            {dict.footer.policyNotice}
          </p>
        </div>
      </div>
    </footer>
  );
}
