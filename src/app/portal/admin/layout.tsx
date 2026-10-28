import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/server";
import Link from "next/link";
import { AdminNavigation } from "@/components/admin-navigation";
import { logout } from "@/app/akun/actions";

export const metadata: Metadata = { title: "Portal Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await requireRole("admin");
  return <div className="admin-shell"><header className="admin-header"><div><Link className="brand" href="/">Toko Lokal</Link><p>{account.name || account.email} · Admin</p></div><form action={logout}><button className="button">Keluar</button></form></header><AdminNavigation />{children}</div>;
}
