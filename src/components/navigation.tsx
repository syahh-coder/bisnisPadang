"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/icon";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/pencarian", label: "Pencarian", icon: "search" },
  { href: "/akun", label: "Akun", icon: "account" },
];

export function Navigation({ variant }: { variant: "header" | "bottom" }) {
  const pathname = usePathname();
  if (pathname.startsWith("/portal/")) return null;
  const activePath = pathname.startsWith("/portal/") ? "/akun" : pathname.startsWith("/toko/") ? "/" : pathname;
  const activeIndex = items.findIndex(({ href }) => activePath === href);

  return (
    <nav
      className={`site-nav site-nav--${variant}`}
      aria-label={variant === "bottom" ? "Navigasi utama seluler" : "Navigasi utama"}
      style={{ "--active-index": Math.max(0, activeIndex) } as CSSProperties}
    >
      {items.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className={`nav-link${icon === "search" ? " nav-link--search" : ""}`}
          aria-current={activePath === href ? "page" : undefined}
        >
          <span className="nav-icon"><Icon name={icon} /></span>
          <span className="nav-label">{label}</span>
        </Link>
      ))}
      {variant === "bottom" && activeIndex >= 0 && <span className="nav-indicator" aria-hidden="true" />}
    </nav>
  );
}
