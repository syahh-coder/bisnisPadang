"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

const navTabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/portal/toko", label: "Dashboard", icon: "home" },
  { href: "/portal/toko/info", label: "Info Toko", icon: "store" },
  { href: "/portal/toko/menu", label: "Menu & Produk", icon: "shoppingBag" },
];

export function OwnerNavigation() {
  const pathname = usePathname();
  const store = useSearchParams().get("toko");
  const query = store ? `?toko=${encodeURIComponent(store)}` : "";

  return (
    <nav className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl max-w-md mx-auto my-4" aria-label="Menu portal toko">
      {navTabs.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={`${href}${query}`}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon name={icon} size={15} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
