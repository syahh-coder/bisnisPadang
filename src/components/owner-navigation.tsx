"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function OwnerNavigation() {
  const pathname = usePathname();
  const store = useSearchParams().get("toko");
  const query = store ? `?toko=${encodeURIComponent(store)}` : "";
  return <nav className="admin-nav" aria-label="Menu toko">{[["/portal/toko", "Dashboard"], ["/portal/toko/info", "Info toko"], ["/portal/toko/menu", "Menu / Produk"]].map(([href, label]) => <Link key={href} href={`${href}${query}`} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>;
}
