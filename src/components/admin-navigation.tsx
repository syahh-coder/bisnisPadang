"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavigation() {
  const pathname = usePathname();
  return <nav className="admin-nav" aria-label="Menu admin">{[
    ["/portal/admin/qr", "Pembuat QR"],
    ["/portal/admin", "Daftar toko"],
    ["/portal/admin/kelola", "Kelola toko"],
  ].map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>;
}
