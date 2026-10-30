import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/server";
import Link from "next/link";
import { logout } from "@/app/akun/actions";
import { AdminNavigation } from "@/components/admin-navigation";
import { Icon } from "@/components/icon";

export const metadata: Metadata = { title: "Portal Admin — Toko Lokal", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const account = await requireRole("admin");

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 text-sm hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center">
              <Icon name="shieldCheck" size={18} />
            </div>
            <span>Toko Lokal Admin</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900">{account.name || account.email}</span>
              <span className="text-[10px] text-teal-700 font-semibold">Administrator</span>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <AdminNavigation />
        {children}
      </div>
    </div>
  );
}
