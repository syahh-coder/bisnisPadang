"use client";

import { useActionState, useTransition } from "react";
import { login, loginDemo } from "@/app/akun/actions";
import { Icon } from "@/components/icon";

export function LoginForm({ available }: { available: boolean }) {
  const [state, action, pending] = useActionState(login, { error: null });
  const [demoPending, startDemoTransition] = useTransition();

  const handleDemo = (role: "admin" | "toko") => {
    startDemoTransition(async () => {
      await loginDemo(role);
    });
  };

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4" aria-label="Masuk ke akun" aria-busy={pending}>
        {state.error && (
          <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <Icon name="alertCircle" size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{state.error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
            Email Terdaftar
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            maxLength={254}
            required
            disabled={pending || demoPending}
            placeholder="admin@bisnispadang.com / email toko"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
            Kata Sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={1024}
            required
            disabled={pending || demoPending}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={pending || demoPending}
        >
          {pending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memeriksa Akun…</span>
            </>
          ) : (
            <span>Masuk ke Akun</span>
          )}
        </button>
      </form>

      {/* 1-Click Demo Buttons for Testing */}
      <div className="pt-4 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1.5">
          <Icon name="zap" size={13} className="text-amber-500" />
          <span>Akses Cepat Mode Uji Coba (Demo)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleDemo("admin")}
            disabled={pending || demoPending}
            className="py-2.5 px-3 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/90 text-teal-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Icon name="shieldCheck" size={16} className="text-teal-700" />
            <span>Masuk Portal Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemo("toko")}
            disabled={pending || demoPending}
            className="py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Icon name="store" size={16} className="text-emerald-700" />
            <span>Masuk Portal Toko</span>
          </button>
        </div>
      </div>
    </div>
  );
}
