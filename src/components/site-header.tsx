"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";
import { Navigation } from "@/components/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/portal/")) return null;
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Toko Lokal — Beranda">
          <Icon name="store" />
          <span>Toko Lokal</span>
        </Link>
        <Navigation variant="header" />
        <div className="header-actions">
          <Link href="/akun" className="button button--plain">Masuk</Link>
          <Link href="/join-afiliasi" className="button button--join">Join Afiliasi</Link>
        </div>
      </div>
    </header>
  );
}
