import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSessionSupabase } from "@/lib/supabase/session";

export type Role = "admin" | "toko";
export type Account = { id: string; email: string; name: string; role: Role };
export type AuthState = { status: "guest" | "unavailable" | "profile-missing"; account?: never } | { status: "ready"; account: Account };

export const getAccount = cache(async (): Promise<AuthState> => {
  try {
    const supabase = await createSessionSupabase();
    if (!supabase) return { status: "unavailable" };
    // getUser memverifikasi token di server Auth; objek sesi/cookie tidak dipercaya.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return { status: !error || error.name === "AuthSessionMissingError" || error.status === 400 || error.status === 401 || error.status === 403 ? "guest" : "unavailable" };
    }
    const profile = await supabase.from("profiles").select("id,name,role").eq("id", data.user.id).abortSignal(AbortSignal.timeout(8_000)).maybeSingle();
    if (profile.error) return { status: "unavailable" };
    if (!profile.data || !["admin", "toko"].includes(profile.data.role)) return { status: "profile-missing" };
    return { status: "ready", account: { id: data.user.id, email: data.user.email ?? "", name: profile.data.name, role: profile.data.role } };
  } catch { return { status: "unavailable" }; }
});

export async function requireRole(role: Role) {
  const state = await getAccount();
  if (state.status !== "ready") redirect(`/akun?tujuan=${role}`);
  if (state.account.role !== role) redirect("/akun?akses=ditolak");
  return state.account;
}
