import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/server";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/akun/actions";
import { OwnerNavigation } from "@/components/owner-navigation";

export const metadata: Metadata = { title: "Portal Toko", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function StorePortalLayout({ children }: { children: React.ReactNode }) {
  const account = await requireRole("toko");
  return <div className="owner-shell"><header className="admin-header"><div><Link className="brand" href="/">Toko Lokal</Link><p>{account.name || account.email} · Toko</p></div><form action={logout}><button className="button">Keluar</button></form></header><Suspense fallback={null}><OwnerNavigation /></Suspense>{children}</div>;
}
