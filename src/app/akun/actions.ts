"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSessionSupabase } from "@/lib/supabase/session";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

export type LoginState = { error: string | null };

export async function login(_previous: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 1024) {
    return { error: "Isi email dan kata sandi yang valid." };
  }
  let destination: "admin" | "toko" | null = null;
  try {
    const supabase = await createSessionSupabase();
    if (!supabase) return { error: "Layanan masuk belum tersedia. Silakan coba lagi nanti." };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: error?.status === 429 ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi." : "Email atau kata sandi tidak sesuai." };
    // Role selalu dibaca dari profil yang dilindungi RLS, bukan form/metadata.
    const profile = await supabase.from("profiles").select("role").eq("id", data.user.id).abortSignal(AbortSignal.timeout(8_000)).maybeSingle();
    if (profile.error || !profile.data || !["admin", "toko"].includes(profile.data.role)) {
      await supabase.auth.signOut({ scope: "local" });
      return { error: "Akun belum siap digunakan. Hubungi pengelola." };
    }
    destination = profile.data.role;
  } catch { return { error: "Layanan masuk tidak dapat dihubungi. Silakan coba lagi." }; }
  revalidatePath("/akun");
  redirect(`/portal/${destination}`);
}

export async function logout(): Promise<void> {
  try {
    const supabase = await createSessionSupabase();
    if (supabase) await supabase.auth.signOut({ scope: "local" });
  } catch { /* Keluar lokal tetap tersedia ketika Auth tidak dapat dihubungi. */ }
  const store = await cookies();
  store.getAll().filter(({ name }) => name === AUTH_COOKIE_NAME || name.startsWith(`${AUTH_COOKIE_NAME}.`)).forEach(({ name }) => store.delete(name));
  revalidatePath("/akun");
  redirect("/akun");
}
