"use client";

import Image from "next/image";
import { Sparkles, Calendar, GlassWater, Crown, ShieldCheck, ArrowRight } from "lucide-react";

interface PrivateEventsSectionProps {
  onOpenBespokeModal: () => void;
}

export default function PrivateEventsSection({ onOpenBespokeModal }: PrivateEventsSectionProps) {
  const eventPillars = [
    {
      icon: <Crown className="w-5 h-5 text-gold-400" />,
      title: "Royal Majlis & Desert Encampments",
      desc: "Custom-erected royal tent cities with climate control, Persian tapestries, fine china, and private security perimeter.",
    },
    {
      icon: <GlassWater className="w-5 h-5 text-gold-400" />,
      title: "Haute Gastronomy & Private Chefs",
      desc: "Michelin-starred master chefs flown in for bespoke menus paired with rare vintage mocktails and celebratory banquets.",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-gold-400" />,
      title: "Private Orchestras & Drone Displays",
      desc: "Live Oud concertos, Kanun ensembles, or aerial drone choreography illuminating the night sky above the desert crests.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-gold-400" />,
      title: "Discreet Corporate & Diplomatic Summits",
      desc: "Secure retreats for heads of state, family offices, and executives with encrypted communications and armored convoys.",
    },
  ];

  return (
    <section id="private-events" className="py-24 bg-obsidian-950 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial & Pillars */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-px bg-gold-400" />
                <span className="text-xs uppercase tracking-[0.3em] text-gold-400 font-medium">
                  Private Celebrations & Bespoke GCC Packages
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-sand-50 leading-tight">
                Beyond Imagination: <br />
                <span className="italic font-normal gold-text-gradient">
                  Private Celebrations & Tailored Journeys
                </span>
              </h2>
              <p className="text-sand-300 text-sm sm:text-base font-light leading-relaxed max-w-xl">
                When an off-the-shelf journey will not suffice. From monumental 50th birthday desert
                galas beneath crystal chandeliers to cross-border private aviation circuits linking
                Doha, AlUla, and the Musandam Fjords, we orchestrate every detail.
              </p>
            </div>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {eventPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-obsidian-900/80 border border-white/5 hover:border-gold-500/30 transition-all space-y-2"
                >
                  <div className="p-2 rounded bg-obsidian-950 inline-block border border-gold-500/20">
                    {pillar.icon}
                  </div>
                  <h3 className="font-serif text-sm font-bold text-sand-100">{pillar.title}</h3>
                  <p className="text-xs text-sand-400 leading-relaxed font-light">{pillar.desc}</p>
                </div>
              ))}
            </div>

            {/* Action Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenBespokeModal}
                className="px-6 py-3 rounded bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:shadow-gold-500/25 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Design Custom Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <span className="text-xs text-sand-400 font-mono">
                Dedicated concierge manager assigned within 15 minutes
              </span>
            </div>
          </div>

          {/* Right Column: Visual Collage with Overlays */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-gold-500/30 shadow-2xl">
              <div className="relative h-[460px] w-full">
                <Image
                  src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1000&q=80"
                  alt="Luxury desert gala dinner in Qatar under illuminated open skies"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-black/20" />
              </div>

              {/* Floating Quote Card */}
              <div className="absolute bottom-4 inset-x-4 p-4 rounded-xl bg-obsidian-950/90 backdrop-blur-md border border-gold-500/40">
                <div className="flex items-center gap-2 text-gold-400 text-xs mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-serif uppercase tracking-widest text-[10px]">
                    Signature Private Production
                  </span>
                </div>
                <p className="text-xs text-sand-200 italic font-serif leading-relaxed">
                  &ldquo;The most unforgettable evening our royal guests experienced in the Gulf. Flawless
                  discretion and unmatched refinement.&rdquo;
                </p>
                <span className="text-[10px] text-sand-400 font-mono block mt-1">
                  — Diplomatic Delegation Review, Qatar 2026
                </span>
              </div>
            </div>

            {/* Corner Decorative Accent */}
            <div className="absolute -top-3 -right-3 w-20 h-20 border-t-2 border-r-2 border-gold-400/50 rounded-tr-xl pointer-events-none" />
            <div className="absolute -bottom-3 -left-3 w-20 h-20 border-b-2 border-l-2 border-gold-400/50 rounded-bl-xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
