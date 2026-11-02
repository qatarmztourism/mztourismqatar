"use client";

import { useState } from "react";
import { X, Sparkles, CheckCircle } from "lucide-react";

export default function DemoBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-md bg-obsidian-950/95 border border-gold-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-xl text-xs text-sand-200 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-gold-400 font-serif font-bold text-sm">
          <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
          <span>Phase 1 Frontend Prototype</span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="p-1 text-sand-400 hover:text-sand-100 rounded hover:bg-white/5"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="mt-2 text-sand-300 font-light leading-relaxed">
        This is the visual and interaction foundation for your high-value client in Qatar & GCC.
        All 8 experience categories, currency conversions, tour detail modals, and inquiry forms are
        functional for client review.
      </p>

      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-sand-400 font-mono">
        <span className="flex items-center gap-1 text-gold-300">
          <CheckCircle className="w-3.5 h-3.5 text-gold-400" />
          <span>Ready for Client Review</span>
        </span>
        <button
          onClick={() => setVisible(false)}
          className="text-gold-400 hover:underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
