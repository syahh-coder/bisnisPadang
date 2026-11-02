"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";
import { Navigation } from "@/components/navigation";
import { LocationBar } from "@/components/location-context";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/portal/")) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
        {/* Brand & Desktop Location Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 text-slate-900 font-bold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity shrink-0"
            aria-label="Luvio — Beranda"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Icon name="store" size={19} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 leading-none">Luvio</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 mt-0.5 hidden sm:inline">
                Food & Store Delivery
              </span>
            </div>
          </Link>

          {/* Desktop Location Bar (Hidden on Mobile) */}
          <div className="hidden sm:block shrink min-w-0">
            <LocationBar />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:block shrink-0">
          <Navigation variant="header" />
        </div>

        {/* Actions (Portal Mitra & Join Afiliasi) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/akun"
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
            title="Portal Toko & Admin"
            aria-label="Portal Mitra"
          >
            <Icon name="account" size={17} className="text-slate-500" />
            <span className="hidden lg:inline">Portal Mitra</span>
          </Link>

          <Link
            href="/join-afiliasi"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs hover:shadow-sm active:scale-[0.98] transition-all shrink-0"
          >
            <Icon name="sparkles" size={14} />
            <span className="whitespace-nowrap">Daftar Toko</span>
          </Link>
        </div>
      </div>

      {/* Mobile Location Sub-bar: Full width, clean, no awkward squeeze */}
      <div className="sm:hidden border-t border-slate-100 bg-slate-50/90 px-3.5 py-1.5">
        <LocationBar fullWidth />
      </div>
    </header>
  );
}
