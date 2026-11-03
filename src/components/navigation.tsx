"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

const headerItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/pencarian", label: "Pencarian", icon: "search" },
  { href: "/kategori", label: "Kategori", icon: "layoutGrid" },
];

export function Navigation({ variant }: { variant: "header" | "bottom" }) {
  const pathname = usePathname();
  if (pathname.startsWith("/portal/")) return null;

  const activePath = pathname.startsWith("/toko/") ? "/" : pathname;

  if (variant === "header") {
    return (
      <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60" aria-label="Navigasi utama desktop">
        {headerItems.map(({ href, label, icon }) => {
          const isActive = activePath === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-150 ${
                isActive
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon name={icon} size={15} className={isActive ? "text-emerald-600" : "text-slate-400"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // variant === "bottom" (Mobile & Tablet dock bar per fitur.md: Beranda, Pencarian Tengah Menonjol, Akun)
  const isHomeActive = activePath === "/";
  const isSearchActive = activePath === "/pencarian";
  const isAccountActive = activePath === "/akun";

  return (
    <div className="md:hidden fixed bottom-3 inset-x-0 z-40 px-4 pointer-events-none">
      <nav
        className="pointer-events-auto max-w-xs mx-auto h-14 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 rounded-2xl flex items-center justify-around px-2 relative"
        aria-label="Navigasi utama seluler"
      >
        {/* Menu 1: Beranda */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl active:scale-90 transition-all duration-150 ${
            isHomeActive
              ? "text-emerald-800 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
          aria-current={isHomeActive ? "page" : undefined}
        >
          <Icon name="home" size={20} className={isHomeActive ? "text-emerald-600" : "text-slate-400"} />
          <span className="text-[10px] font-semibold mt-0.5">Beranda</span>
        </Link>

        {/* Menu 2: Pencarian (Tengah, Lebih Besar & Menonjol elevated) */}
        <div className="flex-1 flex flex-col items-center justify-center relative -top-3">
          <Link
            href="/pencarian"
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200 border-4 border-slate-50 ${
              isSearchActive
                ? "bg-emerald-700 text-white shadow-emerald-700/40 ring-2 ring-emerald-400/50"
                : "bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700"
            }`}
            aria-label="Pencarian Toko & Menu"
            aria-current={isSearchActive ? "page" : undefined}
          >
            <Icon name="search" size={21} className="text-white" />
          </Link>
          <span className={`text-[10px] font-bold mt-0.5 ${isSearchActive ? "text-emerald-800" : "text-slate-600"}`}>
            Pencarian
          </span>
        </div>

        {/* Menu 3: Akun */}
        <Link
          href="/akun"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl active:scale-90 transition-all duration-150 ${
            isAccountActive
              ? "text-emerald-800 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
          aria-current={isAccountActive ? "page" : undefined}
        >
          <Icon name="account" size={20} className={isAccountActive ? "text-emerald-600" : "text-slate-400"} />
          <span className="text-[10px] font-semibold mt-0.5">Akun</span>
        </Link>
      </nav>
    </div>
  );
}
