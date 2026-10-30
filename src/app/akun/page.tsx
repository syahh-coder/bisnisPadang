import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { getAccount } from "@/lib/auth/server";
import { logout } from "./actions";
import { Icon } from "@/components/icon";

export const metadata: Metadata = { title: "Akun & Portal Masuk — Toko Lokal", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ akses?: string }> }) {
  const [state, params] = await Promise.all([getAccount(), searchParams]);

  return (
    <div className="max-w-md mx-auto py-8 sm:py-14 px-4">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Icon name="account" size={24} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Portal Akun</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Masuk untuk mengelola data toko, menu, omset harian, atau QR afiliasi.
        </p>
      </div>

      {params.akses === "ditolak" && (
        <div role="alert" className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Icon name="alertCircle" size={16} className="text-amber-700 shrink-0" />
          <span>Anda tidak memiliki izin untuk mengakses halaman tersebut.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        {state.status === "ready" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                {state.account.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{state.account.name}</p>
                <p className="text-xs text-slate-500 truncate">{state.account.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                  Role: {state.account.role === "admin" ? "Admin" : "Pemilik Toko"}
                </span>
              </div>
            </div>

            <Link
              href={`/portal/${state.account.role}`}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="store" size={16} />
              <span>Buka Portal {state.account.role === "admin" ? "Admin" : "Toko"}</span>
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors"
              >
                Keluar dari Sesi
              </button>
            </form>
          </div>
        ) : (
          <LoginForm available={true} />
        )}
      </div>

      <p className="text-center mt-6 text-xs text-slate-500">
        Belum memiliki toko terdaftar?{" "}
        <Link href="/join-afiliasi" className="font-semibold text-teal-700 hover:underline">
          Join Afiliasi Gratis
        </Link>
      </p>
    </div>
  );
}
