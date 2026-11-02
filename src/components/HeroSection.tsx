"use client";

import Image from "next/image";
import { TranslationDict, Locale } from "@/translations";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

type CmsHomepageSectionRow = Database["public"]["Tables"]["cms_homepage_sections"]["Row"];

interface HeroSectionProps {
  dict: TranslationDict;
  currentLocale: Locale;
  onOpenInquiryModal: (serviceId?: string) => void;
  cmsHero?: CmsHomepageSectionRow | null;
}

export default function HeroSection({
  dict,
  currentLocale,
  onOpenInquiryModal,
  cmsHero,
}: HeroSectionProps) {
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  // Professional Qatar landscape photograph: Khor Al Adaid (Inland Sea) golden desert dunes at sunset
  const defaultHeroImage = "/images/qatar-desert-hero.jpg";
  const heroBgImage = cmsHero?.media_url || defaultHeroImage;

  // Bilingual Editorial Content
  const eyebrowText = cmsHero
    ? isRtl
      ? cmsHero.subtitle_ar || "اكتشف الاستثنائي • دولة قطر"
      : cmsHero.subtitle_en || "DISCOVER THE EXTRAORDINARY • QATAR"
    : isRtl
    ? "اكتشف الاستثنائي • دولة قطر"
    : "DISCOVER THE EXTRAORDINARY • QATAR";

  const headlineFirst = isRtl ? "اكتشف قطر." : "Discover Qatar.";
  const headlineSecond = isRtl ? "تجارب تفوق المألوف." : "Beyond the Ordinary.";

  const heroDescription = cmsHero
    ? isRtl
      ? cmsHero.content_ar ||
        dict.hero?.description ||
        "عِش جوهر الضيافة القطرية عبر رحلات صحراوية استثنائية، واكتشافات ثقافية أصيلة، وملاذات بحرية ساحرة، وتجارب سياحية فاخرة مصممة خصيصاً لتطلعاتكم."
      : cmsHero.content_en ||
        dict.hero?.description ||
        "Experience the soul of Qatar through extraordinary desert journeys, cultural discoveries, coastal escapes and tailor-made luxury experiences."
    : isRtl
    ? "عِش جوهر الضيافة القطرية عبر رحلات صحراوية استثنائية، واكتشافات ثقافية أصيلة، وملاذات بحرية ساحرة، وتجارب سياحية فاخرة مصممة خصيصاً لتطلعاتكم."
    : "Experience the soul of Qatar through extraordinary desert journeys, cultural discoveries, coastal escapes and tailor-made luxury experiences.";

  const primaryCtaLabel = isRtl ? "استكشف التجارب" : "Explore Experiences";
  const secondaryCtaLabel = isRtl ? "تخطيط رحلة مخصصة" : "Plan a Tailor-Made Journey";

  return (
    <section className="relative w-full min-h-[75vh] lg:min-h-[680px] overflow-hidden flex flex-col justify-between pt-24 pb-12 sm:pb-14 lg:pt-28 lg:pb-16 bg-[#0F1115]">
      {/* 1. Cinematic Background Image & Gradient Scrim */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroBgImage}
          alt={
            isRtl
              ? "كثبان خور العديد الرملية الذهبية في قطر عند الغروب"
              : "Khor Al Adaid golden desert dunes at sunset in Qatar"
          }
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Multi-layered dark charcoal & onyx gradient scrim for optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/65 to-[#0F1115]/80" />
        <div
          className={`absolute inset-0 ${
            isRtl
              ? "bg-gradient-to-l from-[#0F1115]/95 via-[#0F1115]/80 to-transparent"
              : "bg-gradient-to-r from-[#0F1115]/95 via-[#0F1115]/80 to-transparent"
          }`}
        />
        <div className="absolute inset-0 bg-radial at-top from-transparent via-[#0F1115]/30 to-[#0F1115]" />
      </div>

      {/* 2. Ambient Gold & Qatar Burgundy Luxury Glow Accents */}
      <div className="absolute top-1/4 start-1/12 w-[500px] h-[500px] rounded-full bg-[#C29B38]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/5 end-1/10 w-[420px] h-[420px] rounded-full bg-[#72132B]/15 blur-[120px] pointer-events-none" />

      {/* 3. Main Hero Editorial Content Container */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 flex-1 flex flex-col justify-center">
        {/* Eyebrow Badge */}
        <div className="hero-fade-up mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F1115]/80 backdrop-blur-md border border-[#C29B38]/30 shadow-lg shadow-black/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C29B38] animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase text-[#F3ECE1]">
              {eyebrowText}
            </span>
          </div>
        </div>

        {/* Large Expressive Headline */}
        <div className="max-w-4xl space-y-3 sm:space-y-4">
          <h1 className="hero-fade-up font-headline text-3xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.12] sm:leading-[1.1] text-[#F3ECE1] font-semibold tracking-tight">
            <span>{headlineFirst}</span>
            <span className="block mt-1 sm:mt-2 italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#F3ECE1] via-[#ECC15A] to-[#C29B38] rtl:bg-gradient-to-l">
              {headlineSecond}
            </span>
          </h1>

          <p className="hero-fade-up-delay-1 text-sm sm:text-base lg:text-lg text-[#F3ECE1]/85 max-w-2xl leading-relaxed pt-1">
            {heroDescription}
          </p>
        </div>

        {/* Premium CTA Buttons — Directing to Single Unified Booking Form & Custom Planner */}
        <div className="hero-fade-up-delay-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-6 sm:pt-8">
          <a
            href="#booking-inquiry"
            className="inline-flex items-center justify-center min-h-[50px] px-8 rounded-lg bg-[#C29B38] text-[#0F1115] font-semibold text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-[#C29B38]/20 hover:bg-[#ECC15A] transition-all duration-200 active:scale-[0.98]"
          >
            <span>{primaryCtaLabel}</span>
            <Arrow className={`w-4 h-4 ${isRtl ? "mr-2" : "ml-2"}`} />
          </a>

          <button
            type="button"
            onClick={() => onOpenInquiryModal()}
            className="inline-flex items-center justify-center min-h-[50px] px-7 rounded-lg bg-[#0F1115]/50 backdrop-blur-md text-[#F3ECE1] hover:text-[#ECC15A] border border-[#C29B38]/30 hover:border-[#C29B38] text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all duration-200 shadow-lg active:scale-[0.98]"
          >
            <Sparkles className={`w-4 h-4 text-[#C29B38] ${isRtl ? "ml-2" : "mr-2"}`} />
            <span>{secondaryCtaLabel}</span>
          </button>
        </div>

        {/* 4. Verified Non-Numeric Trust Indicators (Rendered once, authentic) */}
        <div className="hero-fade-up-delay-3 pt-6 sm:pt-8 flex flex-wrap items-center gap-y-3 gap-x-6 sm:gap-x-8 text-xs text-[#F3ECE1]/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C29B38]" />
            <span className="font-medium tracking-wide">
              {isRtl ? "تجارب مصممة خصيصاً" : "Tailor-Made Experiences"}
            </span>
          </div>

          <span className="hidden sm:inline-block h-3 w-px bg-[#C29B38]/30" />

          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-[#C29B38]" />
            <span className="font-medium tracking-wide">
              {isRtl ? "تجارب قطرية أصيلة" : "Qatar-Based Experiences"}
            </span>
          </div>

          <span className="hidden sm:inline-block h-3 w-px bg-[#C29B38]/30" />

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C29B38]" />
            <span className="font-medium tracking-wide">
              {isRtl ? "مرافقة وضيافة شخصية" : "Personalised Travel Assistance"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
