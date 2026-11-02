"use client";

import Image from "next/image";
import { TranslationDict, Locale } from "@/translations";
import {
  Compass,
  Sparkles,
  CalendarCheck,
  Eye,
  Headphones,
  Sliders,
  ShieldCheck,
  Landmark,
  UserCheck,
  Crown,
  FileCheck2,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

type CmsHomepageSectionRow = Database["public"]["Tables"]["cms_homepage_sections"]["Row"];

interface WhyUsSectionProps {
  dict: TranslationDict;
  currentLocale?: Locale;
  cmsSection?: CmsHomepageSectionRow | null;
}

export default function WhyUsSection({
  dict,
  currentLocale,
  cmsSection,
}: WhyUsSectionProps) {
  const resolvedLocale: Locale = currentLocale || (dict as { locale?: Locale }).locale || "en";
  const isRtl = resolvedLocale === "ar" || dict.dir === "rtl";

  // Section Header & Storytelling Copy (Dynamic CMS fallback to luxury editorial copy)
  const sectionEyebrow = cmsSection
    ? isRtl
      ? cmsSection.subtitle_ar || "جوهر تميز إم زد"
      : cmsSection.subtitle_en || "THE MZ DIFFERENCE"
    : isRtl
    ? "جوهر تميز إم زد"
    : "THE MZ DIFFERENCE";

  const headlinePrefix = isRtl ? "اكتشف قطر،" : "Discover Qatar,";
  const headlineEmphasis = isRtl ? "برؤية تتجاوز التوقعات." : "Beyond Expectations.";

  const sectionDescription = cmsSection
    ? isRtl
      ? cmsSection.content_ar ||
        dict.whyUs?.subtitle ||
        "رحلات مصممة بعناية فائقة تجمع بين أصالة التراث القطري العريق، وسحر الطبيعة الأخّاذة، وأرقى معايير الضيافة العربية الاستثنائية."
      : cmsSection.content_en ||
        dict.whyUs?.subtitle ||
        "Thoughtfully crafted journeys that bring together Qatar's rich heritage, extraordinary landscapes and unmistakable hospitality."
    : isRtl
    ? "رحلات مصممة بعناية فائقة تجمع بين أصالة التراث القطري العريق، وسحر الطبيعة الأخّاذة، وأرقى معايير الضيافة العربية الاستثنائية."
    : "Thoughtfully crafted journeys that bring together Qatar's rich heritage, extraordinary landscapes and unmistakable hospitality.";

  // Authentic Qatar visual (Doha traditional dhow & modern architecture at golden hour)
  const defaultVisual =
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=85";
  const featuredImage = cmsSection?.media_url || defaultVisual;

  // Six Premium Experience Pillars
  const pillars = isRtl
    ? [
        {
          num: "01",
          title: "تجارب قطرية منتقاة بعناية",
          description:
            "تجارب منتقاة بعناية فائقة لتكشف أسرار قطر وجمال طبيعتها وثقافتها المتفردة.",
          icon: Compass,
        },
        {
          num: "02",
          title: "رؤى محلية وخدمة شخصية",
          description:
            "استكشاف أعمق بمعيّة نخبة من المرشدين المحليين وخدمة شخصية تهتم بأدق التفاصيل.",
          icon: UserCheck,
        },
        {
          num: "03",
          title: "راحة ورفاهية بلا مساومة",
          description:
            "أقصى درجات الراحة والرفاهية مع أسطول حديث وتجهيزات فاخرة تفوق التوقعات.",
          icon: Crown,
        },
        {
          num: "04",
          title: "تخطيط شفاف وتواصل مسبق",
          description:
            "تواصل شفاف وترتيبات متكاملة واضحة من لحظة الاستفسار حتى ختام الرحلة.",
          icon: FileCheck2,
        },
        {
          num: "05",
          title: "مسارات مصممة وفق تطلعاتكم",
          description:
            "مسارات سفر مخصصة تُصاغ بالكامل وفق تطلعاتكم، جدولكم الزمني، وشغفكم الاستكشافي.",
          icon: Sliders,
        },
        {
          num: "06",
          title: "احترام التراث والمكان",
          description:
            "احترام عميق لثقافة المكان وبيئته الطبيعية، مع تعزيز الروابط التراثية الأصيلة.",
          icon: Landmark,
        },
      ]
    : [
        {
          num: "01",
          title: "Curated Qatar Experiences",
          description:
            "Every journey is thoughtfully selected to reveal the character and beauty of Qatar.",
          icon: Compass,
        },
        {
          num: "02",
          title: "Local Insight, Personal Service",
          description:
            "Discover more through attentive guidance and meaningful local experiences.",
          icon: UserCheck,
        },
        {
          num: "03",
          title: "Comfort Without Compromise",
          description:
            "Enjoy carefully considered experiences with comfort, quality and attention to detail.",
          icon: Crown,
        },
        {
          num: "04",
          title: "Transparent Planning",
          description:
            "Clear communication and thoughtfully presented arrangements from enquiry to experience.",
          icon: FileCheck2,
        },
        {
          num: "05",
          title: "Journeys Made Around You",
          description:
            "Personalised experiences shaped around your interests, schedule and travel preferences.",
          icon: Sliders,
        },
        {
          num: "06",
          title: "Respect for Place and Culture",
          description:
            "Discover Qatar with appreciation for its heritage, communities and natural environment.",
          icon: Landmark,
        },
      ];

  // 4 Non-numeric authentic trust statements (strictly no fake numbers/metrics)
  const trustStatements = isRtl
    ? [
        {
          icon: Compass,
          title: "تجارب قطرية أصيلة",
          subtitle: "متجذرة في كرم الضيافة وعراقة التراث",
        },
        {
          icon: CalendarCheck,
          title: "تخطيط مخصص للرحلات",
          subtitle: "عناية خاصة بجدول ومواعيد الضيوف",
        },
        {
          icon: Eye,
          title: "استكشاف محلي واعٍ",
          subtitle: "مرشدون محليون بمعرفة ثقافية عميقة",
        },
        {
          icon: Headphones,
          title: "رعاية مستمرة للضيوف",
          subtitle: "مرافقة ودعم كونسيرج متواصل",
        },
      ]
    : [
        {
          icon: Compass,
          title: "Qatar-Based Experiences",
          subtitle: "Rooted in authentic Arabian hospitality",
        },
        {
          icon: CalendarCheck,
          title: "Personalised Travel Planning",
          subtitle: "Crafted exclusively around your schedule",
        },
        {
          icon: Eye,
          title: "Thoughtful Local Discovery",
          subtitle: "Deep cultural insights from native guides",
        },
        {
          icon: Headphones,
          title: "Dedicated Guest Assistance",
          subtitle: "Attentive executive concierge support",
        },
      ];

  return (
    <section
      id="why-us"
      className="w-full py-12 lg:py-20 bg-[#0F1115] relative overflow-hidden text-[#F3ECE1]"
    >
      {/* 1. Atmospheric Glows & Subtle Texture */}
      <div className="absolute top-0 end-1/4 w-[600px] h-[600px] rounded-full bg-[#C29B38]/5 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 start-1/4 w-[500px] h-[500px] rounded-full bg-[#72132B]/8 blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(#C29B38_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* 2. Editorial Section Opening */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 lg:mb-14 pb-6 border-b border-[#C29B38]/15">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16191F] border border-[#C29B38]/25 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C29B38] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase text-[#F3ECE1]">
                {sectionEyebrow}
              </span>
            </div>

            <h2 className="font-headline text-3xl sm:text-5xl lg:text-6xl text-[#F3ECE1] font-semibold tracking-tight leading-[1.14]">
              <span>{headlinePrefix} </span>
              <span className="block mt-1 sm:mt-2 italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#F3ECE1] via-[#ECC15A] to-[#C29B38] rtl:bg-gradient-to-l">
                {headlineEmphasis}
              </span>
            </h2>
          </div>

          <div className="max-w-md lg:pb-2">
            <p className="text-sm sm:text-base text-[#F3ECE1]/75 leading-relaxed">
              {sectionDescription}
            </p>
          </div>
        </div>

        {/* 3. Asymmetrical Editorial Composition (6 Pillars + Featured Visual) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10 lg:mb-14 items-stretch">
          
          {/* Left Column (5 Cols): Cinematic Photograph + Anchor Pillar 1 */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            {/* Cinematic Focal Frame */}
            <div className="relative rounded-2xl overflow-hidden min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] border border-[#C29B38]/25 group shadow-2xl">
              <Image
                src={featuredImage}
                alt="Authentic Qatar heritage and coastal landscape"
                fill
                quality={85}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/40 to-transparent" />
              <div
                className={`absolute inset-0 ${
                  isRtl ? "bg-gradient-to-l" : "bg-gradient-to-r"
                } from-[#0F1115]/60 to-transparent`}
              />

              {/* Cultural Watermark Badge */}
              <div className="absolute top-5 start-5 z-10">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F1115]/80 backdrop-blur-md border border-[#C29B38]/30 text-[10px] font-semibold uppercase tracking-widest text-[#F3ECE1]">
                  <Compass className="w-3 h-3 text-[#C29B38]" />
                  {isRtl ? "أصالة التجربة القطرية" : "AUTHENTIC QATARI HERITAGE"}
                </span>
              </div>

              {/* Inspiring Editorial Bottom Quote */}
              <div className="absolute bottom-5 start-5 end-5 z-10 p-4 sm:p-5 rounded-xl bg-[#0F1115]/85 backdrop-blur-md border border-[#C29B38]/20">
                <p className="font-headline italic text-xs sm:text-sm text-[#F3ECE1] leading-relaxed">
                  {isRtl
                    ? "«قطر أكثر من مجرد وجهة سفر.. إنها تجربة استثنائية تستحق أن تُعاش بكامل تفاصيلها.»"
                    : "“Qatar is more than a destination. It is an experience worth discovering.”"}
                </p>
              </div>
            </div>

            {/* Pillar 1 — Curated Qatar Experiences (Anchored beneath the visual) */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#16191F]/70 backdrop-blur-md border border-[#C29B38]/25 hover:border-[#C29B38]/60 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <span className="font-headline text-2xl font-bold text-[#C29B38]">
                  {pillars[0].num}
                </span>
                <span className="w-8 h-px bg-[#C29B38]/40" />
              </div>
              <h3 className="font-headline text-lg sm:text-xl text-[#F3ECE1] font-semibold mb-2 group-hover:text-[#ECC15A] transition-colors">
                {pillars[0].title}
              </h3>
              <p className="text-xs sm:text-sm text-[#F3ECE1]/75 leading-relaxed">
                {pillars[0].description}
              </p>
            </div>
          </div>

          {/* Right Column (7 Cols): Editorial Text Blocks & Glass Panels (Pillars 2–6) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            
            {/* Row A: Pillars 2 & 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pillar 2 */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#16191F]/50 backdrop-blur-md border border-[#C29B38]/15 hover:border-[#C29B38]/45 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-headline text-2xl font-bold text-[#C29B38]/80">
                    {pillars[1].num}
                  </span>
                  <span className="w-8 h-px bg-[#C29B38]/30" />
                </div>
                <h3 className="font-headline text-lg sm:text-xl text-[#F3ECE1] font-semibold mb-2 group-hover:text-[#ECC15A] transition-colors">
                  {pillars[1].title}
                </h3>
                <p className="text-xs sm:text-sm text-[#F3ECE1]/75 leading-relaxed">
                  {pillars[1].description}
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#16191F]/50 backdrop-blur-md border border-[#C29B38]/15 hover:border-[#C29B38]/45 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-headline text-2xl font-bold text-[#C29B38]/80">
                    {pillars[2].num}
                  </span>
                  <span className="w-8 h-px bg-[#C29B38]/30" />
                </div>
                <h3 className="font-headline text-lg sm:text-xl text-[#F3ECE1] font-semibold mb-2 group-hover:text-[#ECC15A] transition-colors">
                  {pillars[2].title}
                </h3>
                <p className="text-xs sm:text-sm text-[#F3ECE1]/75 leading-relaxed">
                  {pillars[2].description}
                </p>
              </div>
            </div>

            {/* Row B: Pillars 4 & 5 (Contrasting Architectural Finishes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pillar 4 */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#16191F]/40 backdrop-blur-md border border-[#C29B38]/15 hover:border-[#C29B38]/45 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-headline text-2xl font-bold text-[#C29B38]/80">
                    {pillars[3].num}
                  </span>
                  <span className="w-8 h-px bg-[#C29B38]/30" />
                </div>
                <h3 className="font-headline text-lg sm:text-xl text-[#F3ECE1] font-semibold mb-2 group-hover:text-[#ECC15A] transition-colors">
                  {pillars[3].title}
                </h3>
                <p className="text-xs sm:text-sm text-[#F3ECE1]/75 leading-relaxed">
                  {pillars[3].description}
                </p>
              </div>

              {/* Pillar 5 (Elevated VIP Gold Accented Card) */}
              <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#16191F]/90 to-[#0F1115]/95 backdrop-blur-md border border-[#C29B38]/35 shadow-xl hover:border-[#C29B38]/70 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-headline text-2xl font-bold text-[#C29B38]">
                    {pillars[4].num}
                  </span>
                  <span className="w-8 h-px bg-[#C29B38]/50" />
                </div>
                <h3 className="font-headline text-lg sm:text-xl text-[#F3ECE1] font-semibold mb-2 group-hover:text-[#ECC15A] transition-colors">
                  {pillars[4].title}
                </h3>
                <p className="text-xs sm:text-sm text-[#F3ECE1]/80 leading-relaxed">
                  {pillars[4].description}
                </p>
              </div>
            </div>

            {/* Row C: Pillar 6 (Full-Width Architectural Strip) */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#16191F]/60 backdrop-blur-md border border-[#C29B38]/20 hover:border-[#C29B38]/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-headline text-xl font-bold text-[#C29B38]">
                    {pillars[5].num}
                  </span>
                  <h3 className="font-headline text-lg sm:text-xl text-[#F3ECE1] font-semibold group-hover:text-[#ECC15A] transition-colors">
                    {pillars[5].title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#F3ECE1]/75 leading-relaxed">
                  {pillars[5].description}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C29B38]">
                <ShieldCheck className="w-4 h-4 text-[#C29B38]" />
                <span>{isRtl ? "التزام بالتراث والبيئة" : "CULTURAL STEWARDSHIP"}</span>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Four Verified Non-Numeric Trust Statements (Replacing generic fabricated numbers) */}
        <div className="pt-10 border-t border-[#C29B38]/15">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trustStatements.map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-[#16191F]/40 border border-[#C29B38]/15 hover:border-[#C29B38]/35 transition-all flex flex-col items-start gap-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-[#0F1115] border border-[#C29B38]/20 flex items-center justify-center text-[#C29B38]">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#F3ECE1] tracking-wide">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#F3ECE1]/65 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Concluding Signature Statement */}
          <div className="mt-8 text-center max-w-2xl mx-auto">
            <p className="font-headline italic text-base sm:text-lg text-[#F3ECE1]/90 leading-relaxed">
              {isRtl
                ? "«قطر أكثر من مجرد وجهة سفر.. إنها تجربة استثنائية تستحق أن تُعاش بكامل تفاصيلها.»"
                : "“Qatar is more than a destination. It is an experience worth discovering.”"}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-[#C29B38]/40" />
              <Sparkles className="w-3.5 h-3.5 text-[#C29B38]" />
              <span className="w-8 h-px bg-[#C29B38]/40" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
