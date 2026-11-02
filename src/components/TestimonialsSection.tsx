"use client";

import { TranslationDict, Locale } from "@/translations";
import { Star, AlertCircle, ShieldCheck } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

type CmsTestimonialRow = Database["public"]["Tables"]["cms_testimonials"]["Row"];

interface TestimonialsSectionProps {
  dict: TranslationDict;
  currentLocale: Locale;
  cmsTestimonials?: CmsTestimonialRow[];
}

export default function TestimonialsSection({
  dict,
  currentLocale,
  cmsTestimonials,
}: TestimonialsSectionProps) {
  const isRtl = currentLocale === "ar";

  const hasCmsReviews = Boolean(cmsTestimonials && cmsTestimonials.length > 0);

  const reviewsToRender = hasCmsReviews
    ? cmsTestimonials!.map((t) => ({
        rating: t.rating,
        quote: isRtl ? t.content_ar : t.content_en,
        name: t.customer_name,
        location: isRtl
          ? t.customer_title_ar || "ضيف موثق"
          : t.customer_title_en || "Verified Client",
        tour: "MZ Tourism Qatar",
        note: isRtl ? "مراجعة معتمدة" : "Verified Review",
      }))
    : dict.testimonials.reviews;

  return (
    <section id="reviews" className="w-full py-12 lg:py-16 bg-surface-container-lowest relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header & Notice */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between pb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-2">
              {dict.testimonials.kicker}
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl text-on-surface font-semibold">
              {dict.testimonials.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs text-primary/80">
              {hasCmsReviews ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
              <span>
                {hasCmsReviews
                  ? isRtl
                    ? "آراء معتمدة وموثقة من ضيوفنا الكرام"
                    : "Verified and authenticated guest reviews"
                  : dict.testimonials.subtitle}
              </span>
            </div>
          </div>

          {/* Rating Stat Pill */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-surface-container-high border border-primary/20">
            <div className="flex items-center gap-2">
              <span className="font-headline text-lg sm:text-xl text-primary font-bold">
                5.0
              </span>
              <div className="flex flex-col text-[11px] text-on-surface-variant leading-tight">
                <span className="font-semibold text-on-surface">
                  {hasCmsReviews
                    ? isRtl
                      ? "تقييم الضيوف"
                      : "Guest Rating"
                    : isRtl
                    ? "تقييم استرشادي"
                    : "Representative Rating"}
                </span>
                <span className="text-on-surface-variant/70">
                  {hasCmsReviews
                    ? isRtl
                      ? "مراجعات موثقة"
                      : "Verified Experiences"
                    : isRtl
                    ? "قيد توثيق العميل"
                    : "Pending Client Review Data"}
                </span>
              </div>
            </div>
            <div className="h-6 w-px bg-outline-variant/40" />
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviewsToRender.map((rev, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-2xl bg-surface-container border border-primary/15 flex flex-col justify-between shadow-xl relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex text-primary">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-primary font-medium border border-primary/20">
                    {rev.note}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-on-surface italic leading-relaxed">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="pt-5 mt-4 flex items-center justify-between border-t border-outline-variant/20">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-on-surface">
                    {rev.name}
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {rev.location}
                  </p>
                </div>
                <span className="text-[10px] text-primary font-medium max-w-[120px] text-right line-clamp-1">
                  {rev.tour}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
