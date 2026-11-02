import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0c0e12] text-[#f7f5f0] flex flex-col items-center justify-center px-4 text-center">
      <span className="text-xs uppercase tracking-widest text-[#ecc15a] font-semibold mb-2">
        MZ Tourism Qatar • إم زد للسياحة قطر
      </span>
      <h1 className="text-5xl md:text-7xl font-bold font-serif text-[#ecc15a] mb-4">404</h1>
      <h2 className="text-xl md:text-2xl font-semibold mb-4">
        Page Not Found • الصفحة غير موجودة
      </h2>
      <p className="text-sm text-gray-400 max-w-md mb-8">
        The destination you are looking for does not exist or has been relocated.
        <br />
        الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
      </p>
      <Link
        href="/en"
        className="px-6 py-3 rounded-full bg-[#ecc15a] text-[#1c1800] font-semibold text-xs uppercase tracking-wider hover:bg-[#ecc15a]/90 transition-all shadow-lg"
      >
        Return to Homepage • العودة للرئيسية
      </Link>
    </div>
  );
}
