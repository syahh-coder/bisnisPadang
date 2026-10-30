"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSessionSupabase } from "@/lib/supabase/session";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

export type LoginState = { error: string | null };

export async function loginDemo(role: "admin" | "toko"): Promise<void> {
  const store = await cookies();
  store.set("demo_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  revalidatePath("/", "layout");
  redirect(`/portal/${role}`);
}

export async function login(_previous: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 1024) {
    return { error: "Isi email dan kata sandi yang valid." };
  }

  // Quick fallback login for demo accounts
  if (email === "admin@tokolokal.com") {
    const store = await cookies();
    store.set("demo_role", "admin", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
    revalidatePath("/", "layout");
    redirect("/portal/admin");
  }

  if (email === "toko@tokolokal.com" || email === "buani@tokolokal.com") {
    const store = await cookies();
    store.set("demo_role", "toko", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
    revalidatePath("/", "layout");
    redirect("/portal/toko");
  }

  let destination: "admin" | "toko" | null = null;
  try {
    const supabase = await createSessionSupabase();
    if (!supabase) {
      // If supabase is not running, provide helpful notice
      return { error: "Database offline. Silakan gunakan tombol 'Akses Cepat Mode Uji Coba (Demo)' di bawah untuk masuk langsung." };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return { error: error?.status === 429 ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi." : "Email atau kata sandi tidak sesuai." };
    }
    const profile = await supabase.from("profiles").select("role").eq("id", data.user.id).abortSignal(AbortSignal.timeout(8_000)).maybeSingle();
    if (profile.error || !profile.data || !["admin", "toko"].includes(profile.data.role)) {
      await supabase.auth.signOut({ scope: "local" });
      return { error: "Akun belum siap digunakan. Hubungi pengelola." };
    }
    destination = profile.data.role;
  } catch {
    return { error: "Layanan database tidak dapat dihubungi. Silakan gunakan tombol demo di bawah." };
  }

  revalidatePath("/", "layout");
  redirect(`/portal/${destination}`);
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete("demo_role");
  try {
    const supabase = await createSessionSupabase();
    if (supabase) await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* Keluar lokal tetap tersedia ketika Auth tidak dapat dihubungi. */
  }
  store.getAll().filter(({ name }) => name === AUTH_COOKIE_NAME || name.startsWith(`${AUTH_COOKIE_NAME}.`)).forEach(({ name }) => store.delete(name));
  revalidatePath("/", "layout");
  redirect("/akun");
}
