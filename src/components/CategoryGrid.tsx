"use client";

import Image from "next/image";
import {
  Compass,
  Landmark,
  Car,
  Hotel,
  Award,
  Sparkles,
  Tent,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import { CATEGORIES, ExperienceCategory } from "@/data/tourism-data";

interface CategoryGridProps {
  onSelectCategory: (categoryId: string) => void;
}

export default function CategoryGrid({ onSelectCategory }: CategoryGridProps) {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Compass":
        return <Compass className="w-5 h-5 text-gold-400" />;
      case "Landmark":
        return <Landmark className="w-5 h-5 text-gold-400" />;
      case "Car":
        return <Car className="w-5 h-5 text-gold-400" />;
      case "Hotel":
        return <Hotel className="w-5 h-5 text-gold-400" />;
      case "Award":
        return <Award className="w-5 h-5 text-gold-400" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5 text-gold-400" />;
      case "Tent":
        return <Tent className="w-5 h-5 text-gold-400" />;
      case "Globe":
        return <Globe className="w-5 h-5 text-gold-400" />;
      default:
        return <Compass className="w-5 h-5 text-gold-400" />;
    }
  };

  const handleCardClick = (cat: ExperienceCategory) => {
    onSelectCategory(cat.id);
    const element = document.getElementById("tours");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="experiences" className="py-24 bg-obsidian-900 relative">
      {/* Decorative gold ambient accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-gold-400 font-medium">
              Curated Portfolios
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-sand-50">
              Pillars of <span className="italic font-normal gold-text-gradient">Distinction</span>
            </h2>
            <p className="text-sand-300 text-sm sm:text-base max-w-xl font-light">
              From golden dunes meeting the sea to bespoke royal equestrian journeys, explore eight
              unmatched realms of hospitality across Qatar and the Arabian Peninsula.
            </p>
          </div>

          <div className="text-xs font-mono text-gold-400/80 border border-gold-500/20 px-3 py-1.5 rounded self-start md:self-auto bg-obsidian-950/50">
            <span>[Phase 1 Architecture Preview]</span>
          </div>
        </div>

        {/* 8 Category Cards Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCardClick(category)}
              className="group relative rounded-xl overflow-hidden border border-white/10 bg-obsidian-950/60 cursor-pointer transition-all duration-500 hover:border-gold-500/50 hover:shadow-2xl hover:shadow-gold-500/10 flex flex-col justify-between"
            >
              {/* Image Container with Zoom effect */}
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-transparent" />

                {/* Top Badge & Count */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-obsidian-950/80 backdrop-blur-md border border-gold-500/30 text-[10px] font-semibold uppercase tracking-wider text-gold-300">
                    {category.tag}
                  </span>
                  <span className="text-[11px] font-mono text-sand-200/80 bg-obsidian-950/70 px-2 py-0.5 rounded">
                    {category.count}
                  </span>
                </div>

                {/* Floating Category Icon */}
                <div className="absolute bottom-3 left-4 p-2.5 rounded-lg bg-obsidian-900/90 border border-gold-500/30 backdrop-blur-md group-hover:border-gold-400 group-hover:bg-gold-500/10 transition-colors">
                  {getCategoryIcon(category.iconName)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400/90 block mb-1">
                    {category.subtitle}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-sand-50 group-hover:text-gold-300 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sand-300/80 text-xs mt-2 line-clamp-3 leading-relaxed font-light">
                    {category.description}
                  </p>
                </div>

                {/* Card Action footer */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gold-400 font-medium group-hover:text-gold-300">
                  <span className="tracking-wide">Explore Experiences</span>
                  <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
