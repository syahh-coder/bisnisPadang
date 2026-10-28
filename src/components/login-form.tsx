"use client";

import { useActionState } from "react";
import { login } from "@/app/akun/actions";

export function LoginForm({ available }: { available: boolean }) {
  const [state, action, pending] = useActionState(login, { error: null });
  return (
    <form action={action} className="auth-form" aria-label="Masuk ke akun" aria-busy={pending}>
      <p className="text-sm text-muted">Masuk dengan akun toko atau admin dari pengelola.</p>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" inputMode="email" maxLength={254} required disabled={!available || pending} />
      <label htmlFor="password">Kata sandi</label>
      <input id="password" name="password" type="password" autoComplete="current-password" maxLength={1024} required disabled={!available || pending} />
      {state.error && <p role="alert" className="auth-error">{state.error}</p>}
      {!available && <p role="status" className="auth-error">Layanan masuk belum tersedia. Silakan coba lagi nanti.</p>}
      <button type="submit" className="button button--primary" disabled={!available || pending}>{pending ? "Memeriksa akun…" : "Masuk"}</button>
    </form>
  );
}
