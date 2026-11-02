"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Clock,
  Users,
  Star,
  CheckCircle2,
  Calendar,
  Send,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { TourPackage, Currency } from "@/data/tourism-data";

interface TourDetailModalProps {
  tour: TourPackage | null;
  currency: Currency;
  onClose: () => void;
}

export default function TourDetailModal({ tour, currency, onClose }: TourDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary" | "inquire">("overview");
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryReference, setInquiryReference] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    date: "",
    guests: "2",
    specialRequests: "",
  });

  if (!tour) return null;

  // Calculate price in selected currency
  const convertedPrice = Math.round(tour.priceInQAR * currency.rateAgainstQAR);

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return;

    const ref = "MQ-" + Math.floor(100000 + Math.random() * 900000);
    setInquiryReference(ref);
    setInquirySubmitted(true);
  };

  const handleResetForm = () => {
    setInquirySubmitted(false);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      date: "",
      guests: "2",
      specialRequests: "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-obsidian-900 border border-gold-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Top Header Bar */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden shrink-0">
          <Image
            src={tour.image}
            alt={tour.title}
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 via-obsidian-900/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-obsidian-950/80 border border-white/20 text-sand-200 hover:text-white hover:border-gold-400 transition-colors z-10"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge & Rating */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded bg-gold-500 text-obsidian-950 font-bold text-xs uppercase tracking-wider">
              {tour.badge}
            </span>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-obsidian-950/80 border border-gold-500/30 text-gold-300 text-xs font-mono">
              <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
              <span>{tour.rating.toFixed(1)}</span>
              <span className="text-sand-400">({tour.reviewsCount})</span>
            </div>
          </div>

          {/* Title & Key Meta */}
          <div className="absolute bottom-4 inset-x-4 sm:inset-x-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-sand-50 mb-1">
              {tour.title}
            </h2>
            <p className="text-sand-300 text-xs sm:text-sm line-clamp-1 max-w-2xl font-light">
              {tour.tagline}
            </p>
          </div>
        </div>

        {/* Quick Meta Row */}
        <div className="bg-obsidian-950 border-y border-white/10 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sand-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gold-400" />
              <span>{tour.duration}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gold-400" />
              <span>{tour.groupType}</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-gold-400/90 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Private Bespoke Experience</span>
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sand-400 uppercase text-[10px] tracking-wider">Estimated From:</span>
            <span className="text-gold-300 font-mono text-base font-bold">
              {currency.symbol} {convertedPrice.toLocaleString()}{" "}
              <span className="text-xs text-sand-400 font-normal">{currency.code}</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-4 sm:px-6 bg-obsidian-900 shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-gold-400 text-gold-300"
                : "border-transparent text-sand-400 hover:text-sand-200"
            }`}
          >
            Overview & Highlights
          </button>
          <button
            onClick={() => setActiveTab("itinerary")}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "itinerary"
                ? "border-gold-400 text-gold-300"
                : "border-transparent text-sand-400 hover:text-sand-200"
            }`}
          >
            Curated Itinerary
          </button>
          <button
            onClick={() => setActiveTab("inquire")}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "inquire"
                ? "border-gold-400 text-gold-300"
                : "border-transparent text-sand-400 hover:text-sand-200"
            }`}
          >
            <span>Inquire / Reserve</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sand-200 text-sm">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-sand-50 mb-2">
                  The Experience
                </h3>
                <p className="text-sand-300 text-sm leading-relaxed font-light">
                  {tour.overview}
                </p>
              </div>

              {/* Highlights */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-gold-400 font-semibold mb-3">
                  Signature Highlights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tour.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded bg-obsidian-950/70 border border-white/5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-sand-200 leading-snug">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inclusions */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-gold-400 font-semibold mb-3">
                  Comprehensive Inclusions
                </h4>
                <div className="p-4 rounded-lg bg-obsidian-950/90 border border-gold-500/20 space-y-2">
                  {tour.inclusions.map((inclusion, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-sand-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                      <span>{inclusion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA to Inquire */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab("inquire")}
                  className="px-6 py-2.5 rounded bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 font-semibold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
                >
                  Proceed to Private Reservation Inquiry →
                </button>
              </div>
            </div>
          )}

          {activeTab === "itinerary" && (
            <div className="space-y-6">
              <h3 className="font-serif text-lg font-semibold text-sand-50">
                Timeline & Execution
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-gold-500/30">
                {tour.schedule.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 pl-1">
                    <div className="w-7 h-7 rounded-full bg-obsidian-900 border border-gold-400 flex items-center justify-center text-[10px] font-mono text-gold-300 shrink-0 z-10">
                      {idx + 1}
                    </div>
                    <div className="p-3 rounded-lg bg-obsidian-950/80 border border-white/5 flex-1">
                      <span className="text-xs font-mono text-gold-400 font-semibold">
                        {item.time}
                      </span>
                      <p className="text-xs text-sand-200 mt-1">{item.activity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded bg-obsidian-950/60 border border-white/5 text-xs text-sand-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-gold-400 shrink-0" />
                <span>
                  All schedules are completely flexible and can be customized according to your flight
                  timings, family preferences, or executive calendar.
                </span>
              </div>
            </div>
          )}

          {activeTab === "inquire" && (
            <div className="space-y-4">
              {inquirySubmitted ? (
                <div className="p-6 rounded-xl border border-gold-500/50 bg-obsidian-950/90 text-center space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-gold-500/20 border border-gold-400 text-gold-300 mx-auto flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-sand-50">
                    Concierge Inquiry Received
                  </h3>
                  <p className="text-sand-300 text-xs max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-sand-100">{formData.fullName}</strong>. Your
                    request for <strong className="text-gold-300">{tour.title}</strong> has been
                    logged in our Phase 1 demonstration pipeline under reference:
                  </p>
                  <div className="inline-block px-4 py-2 rounded bg-obsidian-900 border border-gold-500/40 font-mono text-gold-400 font-bold text-sm tracking-widest">
                    {inquiryReference}
                  </div>
                  <p className="text-[11px] text-sand-400/80 italic max-w-sm mx-auto">
                    Note: This is a Phase 1 frontend prototype. No real bookings or payments are processed.
                    In production, our 24/7 concierge will contact you within 15 minutes.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleResetForm}
                      className="px-4 py-2 rounded border border-white/20 text-xs text-sand-300 hover:text-white hover:border-gold-400 transition-colors"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div className="p-3 rounded-lg bg-gold-500/10 border border-gold-500/30 text-xs text-gold-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Phase 1 Demonstration Booking Form</strong>
                      <span>
                        Verify the frontend interaction. No payments or personal information are stored.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-sand-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lord Harrington or Sheikh Al-Thani"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-obsidian-950 border border-white/10 text-sand-100 text-xs focus:outline-none focus:border-gold-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-sand-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="vip@client.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-obsidian-950 border border-white/10 text-sand-100 text-xs focus:outline-none focus:border-gold-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-sand-300 mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="+974 5500 0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-obsidian-950 border border-white/10 text-sand-100 text-xs focus:outline-none focus:border-gold-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-sand-300 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gold-400" />
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-obsidian-950 border border-white/10 text-sand-100 text-xs focus:outline-none focus:border-gold-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-sand-300 mb-1">
                        Guests Count
                      </label>
                      <select
                        value={formData.guests}
                        onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-obsidian-950 border border-white/10 text-sand-100 text-xs focus:outline-none focus:border-gold-400"
                      >
                        <option value="1">1 Guest (Solo Private)</option>
                        <option value="2">2 Guests (Couple)</option>
                        <option value="4">3 - 4 Guests (Family)</option>
                        <option value="8">5 - 8 Guests (Private Enclave)</option>
                        <option value="12+">9+ Guests (VIP Gala Delegation)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-sand-300 mb-1">
                      Bespoke Requests & Butler Preferences
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Special dietary requirements, champagne preferences, VIP tarmac escort, private helicopter transfer..."
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-obsidian-950 border border-white/10 text-sand-100 text-xs focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-sand-400 font-mono">
                      Estimated Cost: {currency.symbol} {convertedPrice.toLocaleString()} {currency.code}
                    </span>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:brightness-110 shadow-lg"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Reservation Request</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
