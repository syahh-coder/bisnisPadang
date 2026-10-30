"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";
import { Navigation } from "@/components/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/portal/")) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all duration-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-900 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
          aria-label="Toko Lokal — Beranda"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center shadow-sm">
            <Icon name="store" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 leading-none">Toko Lokal</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-700 mt-0.5">Direktori UMKM</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:block">
          <Navigation variant="header" />
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/akun"
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
            title="Portal Toko & Admin"
          >
            <Icon name="account" size={16} className="text-slate-500" />
            <span>Portal Mitra</span>
          </Link>
          <Link
            href="/join-afiliasi"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm hover:shadow active:scale-[0.98] transition-all"
          >
            <Icon name="sparkles" size={15} />
            <span>Join Afiliasi</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
