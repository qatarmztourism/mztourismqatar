"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0c0e12] text-[#f7f5f0] flex flex-col items-center justify-center px-4 text-center">
      <span className="text-xs uppercase tracking-widest text-[#ecc15a] font-semibold mb-2">
        MZ Tourism Qatar • إم زد للسياحة قطر
      </span>
      <h1 className="text-3xl md:text-5xl font-bold font-serif text-[#ecc15a] mb-4">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-400 max-w-md mb-8">
        We encountered an unexpected condition while loading this page. Please try again or return to the concierge desk.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-full bg-[#ecc15a] text-[#1c1800] font-semibold text-xs uppercase tracking-wider hover:bg-[#ecc15a]/90 transition-all shadow-lg"
        >
          Try Again
        </button>
        <Link
          href="/en"
          className="px-6 py-3 rounded-full bg-white/10 text-white font-semibold text-xs uppercase tracking-wider hover:bg-white/20 transition-all border border-white/20"
        >
          Concierge Home
        </Link>
      </div>
    </div>
  );
}
