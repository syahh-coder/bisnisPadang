"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/pencarian", label: "Pencarian", icon: "search" },
  { href: "/akun", label: "Akun", icon: "account" },
];

export function Navigation({ variant }: { variant: "header" | "bottom" }) {
  const pathname = usePathname();
  if (pathname.startsWith("/portal/")) return null;

  const activePath = pathname.startsWith("/toko/") ? "/" : pathname;

  if (variant === "header") {
    return (
      <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl" aria-label="Navigasi utama desktop">
        {items.map(({ href, label, icon }) => {
          const isActive = activePath === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon name={icon} size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // variant === "bottom" (Mobile floating dock)
  return (
    <div className="sm:hidden fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
      <nav
        className="pointer-events-auto max-w-sm mx-auto h-16 bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-lg shadow-slate-900/10 rounded-2xl flex items-center justify-around px-3 relative"
        aria-label="Navigasi utama seluler"
      >
        {items.map(({ href, label, icon }) => {
          const isActive = activePath === href;
          const isSearch = icon === "search";

          if (isSearch) {
            return (
              <Link
                key={href}
                href={href}
                className="group relative -top-4 flex flex-col items-center focus:outline-none"
                aria-label="Pencarian toko"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-700/30 transition-transform active:scale-90 duration-150 ${
                    isActive
                      ? "bg-gradient-to-tr from-teal-700 to-emerald-500 ring-4 ring-teal-100"
                      : "bg-gradient-to-tr from-teal-800 to-teal-600 hover:from-teal-700 hover:to-emerald-500"
                  }`}
                >
                  <Icon name="search" size={24} className="group-hover:rotate-6 transition-transform" />
                </div>
                <span className={`text-[10px] font-semibold mt-1 transition-colors ${isActive ? "text-teal-800 font-bold" : "text-slate-500"}`}>
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive ? "text-teal-800 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon name={icon} size={22} />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-700 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
