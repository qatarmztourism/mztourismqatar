"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Sparkles, Compass } from "lucide-react";
import { DESTINATIONS, Destination } from "@/data/tourism-data";

export default function DestinationsSection() {
  const [activeTab, setActiveTab] = useState<"qatar" | "gcc">("qatar");

  const filteredDestinations = DESTINATIONS.filter((d) =>
    activeTab === "qatar" ? d.isQatar : !d.isQatar
  );

  return (
    <section id="destinations" className="py-24 bg-obsidian-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-gold-400 font-medium">
              Geographic Realms
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-sand-50">
              Captivating <span className="italic font-normal gold-text-gradient">Destinations</span>
            </h2>
            <p className="text-sand-300 text-sm sm:text-base max-w-xl font-light">
              Discover the contrasting majesty of Qatar&apos;s UNESCO natural treasures and futuristic
              skyline, alongside seamless private extensions across the broader Gulf.
            </p>
          </div>

          {/* Region Tabs */}
          <div className="inline-flex p-1 rounded-lg bg-obsidian-950 border border-gold-500/30 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("qatar")}
              className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "qatar"
                  ? "bg-gold-500 text-obsidian-950 shadow-md"
                  : "text-sand-300 hover:text-white"
              }`}
            >
              State of Qatar (Flagship)
            </button>
            <button
              onClick={() => setActiveTab("gcc")}
              className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "gcc"
                  ? "bg-gold-500 text-obsidian-950 shadow-md"
                  : "text-sand-300 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>GCC Expansion</span>
            </button>
          </div>
        </div>

        {/* Destination Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDestinations.map((dest: Destination) => (
            <div
              key={dest.id}
              className="group relative rounded-xl overflow-hidden border border-white/10 bg-obsidian-950 hover:border-gold-500/50 transition-all duration-500 hover:shadow-2xl flex flex-col justify-between"
            >
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-obsidian-950/80 backdrop-blur-md border border-gold-500/30 text-[10px] font-mono text-gold-300">
                    <MapPin className="w-3 h-3 text-gold-400" />
                    <span>{dest.region}</span>
                  </span>
                </div>

                <div className="absolute bottom-3 inset-x-3">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 block">
                    {dest.subtitle}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-sand-50 group-hover:text-gold-300 transition-colors">
                    {dest.name}
                  </h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-sand-300/80 text-xs leading-relaxed font-light">
                  {dest.description}
                </p>

                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-sand-400 block">
                    Featured Highlights:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dest.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] bg-obsidian-900 border border-white/10 text-sand-300"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Callout box for customized regional itineraries */}
        <div className="mt-12 p-6 rounded-xl border border-gold-500/25 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-400/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-sand-50">
                Multi-City Cross-Border Itineraries
              </h4>
              <p className="text-sand-300 text-xs font-light">
                Combine Qatar with Saudi Arabia (AlUla), Dubai, and Oman via private jet charter with
                diplomatic customs clearance.
              </p>
            </div>
          </div>
          <a
            href="#private-events"
            className="px-4 py-2 rounded border border-gold-500/40 text-gold-300 hover:bg-gold-500 hover:text-obsidian-950 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all"
          >
            Explore Custom Routes →
          </a>
        </div>
      </div>
    </section>
  );
}
