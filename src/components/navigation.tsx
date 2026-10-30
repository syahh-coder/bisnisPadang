"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

const items: { href: string; label: string; icon: IconName }[] = [
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

  // variant === "bottom" (Mobile dock bar)
  return (
    <div className="sm:hidden fixed bottom-3 inset-x-0 z-40 px-4 pointer-events-none">
      <nav
        className="pointer-events-auto max-w-xs mx-auto h-14 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 rounded-2xl flex items-center justify-around px-1.5 gap-1"
        aria-label="Navigasi utama seluler"
      >
        {items.map(({ href, label, icon }) => {
          const isActive = activePath === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive
                  ? "text-teal-800 font-bold bg-teal-50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon name={icon} size={19} className={isActive ? "text-teal-700" : "text-slate-400"} />
              <span className="text-[10px] font-semibold mt-0.5">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
