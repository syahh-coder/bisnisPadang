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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all duration-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 text-slate-900 font-bold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity shrink-0"
            aria-label="Toko Lokal — Beranda"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Icon name="store" size={19} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 leading-none">Toko Lokal</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-700 mt-0.5 hidden sm:inline">Direktori UMKM</span>
            </div>
          </Link>

          <LocationBar />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Navigation variant="header" />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/akun"
            className="px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
            title="Portal Toko & Admin"
          >
            <Icon name="account" size={16} className="text-slate-500" />
            <span className="hidden sm:inline">Portal Mitra</span>
          </Link>
          <Link
            href="/join-afiliasi"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm hover:shadow active:scale-[0.98] transition-all"
          >
            <Icon name="sparkles" size={15} />
            <span className="whitespace-nowrap">Join Afiliasi</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
