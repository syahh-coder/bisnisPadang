import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { getAccount } from "@/lib/auth/server";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Akun", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ akses?: string }> }) {
  const [state, params] = await Promise.all([getAccount(), searchParams]);
  return (
    <>
      <div className="page-heading"><h1>Akun</h1><p>Kelola informasi dan menu toko Anda.</p></div>
      {params.akses === "ditolak" && <p className="auth-error" role="alert">Anda tidak memiliki akses ke halaman tersebut.</p>}
      {state.status === "ready" ? (
        <div className="account-panel">
          <p className="font-semibold">{state.account.name || state.account.email}</p>
          <p className="mt-2 text-sm text-muted">{state.account.email}</p>
          <p className="mt-2 text-sm">Masuk sebagai {state.account.role === "admin" ? "admin" : "pemilik toko"}.</p>
          <Link href={`/portal/${state.account.role}`} className="button button--primary mt-6">Buka Portal {state.account.role === "admin" ? "Admin" : "Toko"}</Link>
          <form action={logout} className="mt-4"><button className="button button--plain" type="submit">Keluar</button></form>
        </div>
      ) : state.status === "profile-missing" ? (
        <div className="notice"><p role="alert">Akun belum siap digunakan. Hubungi pengelola.</p><form action={logout} className="mt-4"><button className="button button--plain" type="submit">Keluar</button></form></div>
      ) : <LoginForm available={state.status === "guest"} />}
      <p className="mt-6 text-sm text-muted">Ingin mendaftarkan toko? <Link href="/join-afiliasi" className="text-link">Join Afiliasi gratis</Link></p>
    </>
  );
}
