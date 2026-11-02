"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TranslationDict, Locale } from "@/translations";
import { getWhatsAppInquiryUrl } from "@/config/site-config";
import { Clock, CheckCircle2, MessageCircle, Sparkles, Calendar } from "lucide-react";

interface ServicesSectionProps {
  dict: TranslationDict;
  currentLocale: Locale;
  onOpenServiceDetail?: (serviceId: string) => void;
}

export default function ServicesSection({
  dict,
  currentLocale,
  onOpenServiceDetail,
}: ServicesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const isRtl = currentLocale === "ar";

  const filteredServices = dict.services.filter((service) => {
    if (activeCategory === "all") return true;
    return service.category === activeCategory;
  });

  return (
    <section id="services" className="w-full py-12 lg:py-16 bg-surface relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-2">
              {dict.servicesSection.tag}
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl text-on-surface font-semibold">
              {dict.servicesSection.title}
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mt-2 leading-relaxed">
              {dict.servicesSection.description}
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "all"
                  ? "bg-primary text-on-primary shadow-md shadow-primary/25"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {dict.servicesSection.filterAll}
            </button>
            <button
              onClick={() => setActiveCategory("desert")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "desert"
                  ? "bg-primary text-on-primary shadow-md shadow-primary/25"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {dict.servicesSection.filterDesert}
            </button>
            <button
              onClick={() => setActiveCategory("city")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "city"
                  ? "bg-primary text-on-primary shadow-md shadow-primary/25"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {dict.servicesSection.filterCity}
            </button>
            <button
              onClick={() => setActiveCategory("logistics")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "logistics"
                  ? "bg-primary text-on-primary shadow-md shadow-primary/25"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {dict.servicesSection.filterLogistics}
            </button>
            <button
              onClick={() => setActiveCategory("events")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "events"
                  ? "bg-primary text-on-primary shadow-md shadow-primary/25"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {dict.servicesSection.filterEvents}
            </button>
          </div>
        </div>

        {/* 8 Services Responsive Grid (4 columns on xl, 2 on md, 1 on sm) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => {
            const serviceWhatsAppUrl = getWhatsAppInquiryUrl(service.inquiryMessage);

            return (
              <article
                key={service.id}
                className="group flex flex-col bg-surface-container rounded-2xl overflow-hidden border border-primary/15 shadow-xl shadow-black/40 hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Card Image Thumbnail */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-container-high">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/30" />

                  {/* Duration Pill */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-surface-container-lowest/80 backdrop-blur-md text-primary text-[11px] font-semibold flex items-center gap-1 border border-primary/20">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>{service.duration}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-headline text-base sm:text-lg text-on-surface font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {service.title}
                    </h3>
                    <p className="text-xs text-primary font-medium mt-1">
                      {service.subtitle}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-2.5 leading-relaxed line-clamp-3">
                      {service.description}
                    </p>

                    {/* Inclusions pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3 border-t border-outline-variant/15">
                      {service.highlights.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[11px] flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Pricing & Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-outline-variant/15 flex flex-col gap-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant block">
                          {dict.servicesSection.priceFrom}
                        </span>
                        <span className="font-headline text-sm font-bold text-primary">
                          {service.indicativePrice}
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/70 italic text-right max-w-[130px] line-clamp-1">
                        {service.priceNote}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${currentLocale}/services/${service.id}#book-tour`}
                        className="flex-1 min-h-[40px] px-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-[11px] uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{dict.servicesSection.btnReserve}</span>
                      </Link>

                      <Link
                        href={`/${currentLocale}/services/${service.id}`}
                        onClick={() => onOpenServiceDetail?.(service.id)}
                        className="flex-1 min-h-[40px] px-2 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface text-[11px] uppercase tracking-wider font-semibold border border-outline-variant/30 transition-all flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{dict.servicesSection.btnDetails}</span>
                      </Link>

                      <a
                        href={serviceWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-surface-container-high hover:bg-surface-container text-primary border border-outline-variant/30 flex items-center justify-center shrink-0 transition-colors"
                        title={dict.servicesSection.btnBookTour}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Banner Note */}
        <div className="mt-12 p-4 rounded-xl bg-surface-container-high/60 border border-primary/20 text-center">
          <p className="text-xs text-on-surface-variant">
            {dict.servicesSection.pricePlaceholder} •{" "}
            {isRtl
              ? "كافة الرحلات خاصة ويمكن تخصيص مساراتها وأوقاتها حسب رغبتكم."
              : "All departures are private and can be customized to your exact schedule and specifications."}
          </p>
        </div>
      </div>
    </section>
  );
}
