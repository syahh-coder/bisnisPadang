import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionSupabase } from "@/lib/supabase/session";

export type Role = "admin" | "toko";
export type Account = { id: string; email: string; name: string; role: Role };
export type AuthState =
  | { status: "guest" | "unavailable" | "profile-missing"; account?: never }
  | { status: "ready"; account: Account };

export const getAccount = cache(async (): Promise<AuthState> => {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value;

  // Mode akses demo untuk pengujian instan tanpa docker/database eksternal
  if (demoRole === "admin" || demoRole === "toko") {
    return {
      status: "ready",
      account: {
        id: demoRole === "admin" ? "00000000-0000-4000-8000-000000000099" : "00000000-0000-4000-8000-000000000101",
        email: demoRole === "admin" ? "admin@tokolokal.com" : "buani@tokolokal.com",
        name: demoRole === "admin" ? "Admin Pengelola (Pusat)" : "Ibu Ani — Warung Bu Ani",
        role: demoRole,
      },
    };
  }

  try {
    const supabase = await createSessionSupabase();
    if (!supabase) return { status: "guest" };

    // getUser memverifikasi token di server Auth; objek sesi/cookie tidak dipercaya.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        status:
          !error ||
          error.name === "AuthSessionMissingError" ||
          error.status === 400 ||
          error.status === 401 ||
          error.status === 403
            ? "guest"
            : "guest",
      };
    }

    const profile = await supabase
      .from("profiles")
      .select("id,name,role")
      .eq("id", data.user.id)
      .abortSignal(AbortSignal.timeout(8_000))
      .maybeSingle();

    if (profile.error) return { status: "guest" };
    if (!profile.data || !["admin", "toko"].includes(profile.data.role)) return { status: "profile-missing" };

    return {
      status: "ready",
      account: {
        id: data.user.id,
        email: data.user.email ?? "",
        name: profile.data.name,
        role: profile.data.role,
      },
    };
  } catch {
    return { status: "guest" };
  }
});

export async function requireRole(role: Role) {
  const state = await getAccount();
  if (state.status !== "ready") redirect(`/akun?tujuan=${role}`);
  if (state.account.role !== role) redirect("/akun?akses=ditolak");
  return state.account;
}
