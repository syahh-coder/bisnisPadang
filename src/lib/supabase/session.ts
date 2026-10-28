import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";
import { getSupabaseConfig } from "./config";

export async function createSessionSupabase() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookieOptions: { name: AUTH_COOKIE_NAME, httpOnly: true, sameSite: "lax", secure: url.startsWith("https://") && process.env.NODE_ENV === "production" },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(8_000) }) },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server Component tidak dapat menulis cookie; proxy menangani refresh. */ }
      },
    },
  });
}
