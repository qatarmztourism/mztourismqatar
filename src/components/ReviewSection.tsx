"use client";

import Image from "next/image";
import { Star, Quote, ShieldCheck, CheckCircle2 } from "lucide-react";
import { REVIEWS } from "@/data/tourism-data";

export default function ReviewSection() {
  return (
    <section id="reviews" className="py-24 bg-obsidian-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs uppercase tracking-widest font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
            <span>Verified Guest Experiences</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-sand-50">
            Commendations of <span className="italic font-normal gold-text-gradient">Distinction</span>
          </h2>

          <p className="text-sand-300 text-sm sm:text-base font-light">
            Reflections from royal families, cultural patrons, diplomats, and international travelers
            who entrusted their Arabian journeys to our private concierge.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="p-6 sm:p-8 rounded-2xl bg-obsidian-950/80 border border-white/10 hover:border-gold-500/40 transition-all duration-300 flex flex-col justify-between space-y-6 relative group"
            >
              <div className="space-y-4">
                {/* Rating & Tour Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gold-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold-400" />
                    ))}
                  </div>

                  <span className="text-[10px] font-mono text-sand-400 border border-white/10 px-2 py-0.5 rounded">
                    {review.date}
                  </span>
                </div>

                {/* Quote Content */}
                <div className="relative">
                  <Quote className="w-8 h-8 text-gold-500/15 absolute -top-3 -left-2 rotate-180" />
                  <p className="text-sand-200 text-sm leading-relaxed font-light italic relative z-10 pl-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>

                {/* Tour Taken Tag */}
                <div className="flex items-center gap-1.5 text-xs text-gold-300/90 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span className="truncate">Experience: {review.tourTaken}</span>
                </div>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-gold-500/40 shrink-0">
                  <Image
                    src={review.avatar}
                    alt={review.name}
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-sm font-bold text-sand-50 truncate">
                    {review.name}
                  </h4>
                  <p className="text-[11px] text-gold-400 font-mono truncate">{review.title}</p>
                  <p className="text-[11px] text-sand-400 font-light truncate">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="font-serif text-3xl font-bold gold-text-gradient">5.0 / 5.0</span>
            <p className="text-xs text-sand-300 uppercase tracking-widest font-mono">
              Flawless Satisfaction
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-serif text-3xl font-bold gold-text-gradient">420+</span>
            <p className="text-xs text-sand-300 uppercase tracking-widest font-mono">
              Private Expeditions
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-serif text-3xl font-bold gold-text-gradient">100%</span>
            <p className="text-xs text-sand-300 uppercase tracking-widest font-mono">
              Bespoke & Discrete
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-serif text-3xl font-bold gold-text-gradient">24 / 7</span>
            <p className="text-xs text-sand-300 uppercase tracking-widest font-mono">
              VIP Personal Concierge
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
