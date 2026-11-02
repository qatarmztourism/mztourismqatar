"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, Users, Star, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { FEATURED_TOURS, TourPackage, Currency } from "@/data/tourism-data";

interface FeaturedToursProps {
  currentCategory: string;
  currency: Currency;
  onSelectTour: (tour: TourPackage) => void;
}

export default function FeaturedTours({
  currentCategory,
  currency,
  onSelectTour,
}: FeaturedToursProps) {
  const [activeFilter, setActiveFilter] = useState(currentCategory || "all");

  const filterTabs = [
    { id: "all", label: "All Journeys" },
    { id: "safari", label: "Desert & Inland Sea" },
    { id: "city", label: "City & Heritage" },
    { id: "chauffeur", label: "VIP Fleet" },
    { id: "resorts", label: "Island Villas" },
    { id: "equestrian", label: "Arabian Horses" },
    { id: "events", label: "Desert Galas" },
    { id: "tents", label: "Royal Glamping" },
    { id: "gcc", label: "GCC Grand Tour" },
  ];

  const filteredTours =
    activeFilter === "all"
      ? FEATURED_TOURS
      : FEATURED_TOURS.filter((tour) => tour.category === activeFilter);

  return (
    <section id="tours" className="py-24 bg-obsidian-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-px bg-gold-400" />
              <span className="text-xs uppercase tracking-[0.3em] text-gold-400 font-medium">
                The Signature Collection
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-sand-50">
              Curated <span className="italic font-normal gold-text-gradient">Expeditions</span>
            </h2>
            <p className="text-sand-300 text-sm sm:text-base max-w-2xl font-light">
              Each experience is strictly private, escorted by dedicated cultural historians, desert
              masters, or VIP chauffeurs. Pricing displayed dynamically in your preferred currency.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-obsidian-900 border border-gold-500/20 px-4 py-2 rounded-lg text-xs font-mono text-sand-300">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>
              Rates in: <strong className="text-gold-300">{currency.code}</strong> ({currency.symbol})
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase whitespace-nowrap transition-all duration-300 ${
                activeFilter === tab.id
                  ? "bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 font-bold shadow-lg shadow-gold-500/20"
                  : "bg-obsidian-900/80 text-sand-300 border border-white/10 hover:border-gold-500/40 hover:text-sand-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTours.map((tour) => {
            const convertedPrice = Math.round(tour.priceInQAR * currency.rateAgainstQAR);

            return (
              <div
                key={tour.id}
                className="group rounded-2xl overflow-hidden border border-white/10 bg-obsidian-900/60 backdrop-blur-md hover:border-gold-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gold-500/10 flex flex-col justify-between"
              >
                {/* Image & Badges */}
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={tour.image}
                    alt={tour.title}
                    fill
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 via-obsidian-900/30 to-transparent" />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <span className="px-3 py-1 rounded bg-obsidian-950/85 backdrop-blur-md border border-gold-500/40 text-[10px] font-bold uppercase tracking-wider text-gold-300">
                      {tour.badge}
                    </span>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-obsidian-950/80 border border-white/10 text-gold-300 text-xs font-mono">
                      <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                      <span>{tour.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Quick specs pill */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs text-sand-200">
                    <span className="flex items-center gap-1 bg-obsidian-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                      <Clock className="w-3 h-3 text-gold-400" />
                      <span>{tour.duration}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-obsidian-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                      <Users className="w-3 h-3 text-gold-400" />
                      <span className="truncate max-w-[130px]">{tour.groupType}</span>
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-bold text-sand-50 group-hover:text-gold-300 transition-colors leading-snug">
                      {tour.title}
                    </h3>
                    <p className="text-sand-300 text-xs leading-relaxed font-light line-clamp-2">
                      {tour.tagline}
                    </p>
                  </div>

                  {/* Highlights preview */}
                  <div className="space-y-1.5 py-2 border-y border-white/5">
                    {tour.highlights.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-sand-300">
                        <CheckCircle className="w-3 h-3 text-gold-400 shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-sand-400">
                        Private Package From
                      </span>
                      <div className="font-mono text-lg font-bold text-gold-300">
                        {currency.symbol} {convertedPrice.toLocaleString()}{" "}
                        <span className="text-[11px] text-sand-400 font-normal">
                          {currency.code}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectTour(tour)}
                      className="px-4 py-2.5 rounded border border-gold-500/40 hover:border-gold-400 bg-obsidian-950 text-gold-300 hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all group-hover:bg-gold-500 group-hover:text-obsidian-950"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
