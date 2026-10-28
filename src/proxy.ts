import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const { url, key } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookieOptions: { name: AUTH_COOKIE_NAME, httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:" },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(8_000) }) },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  try { await supabase.auth.getClaims(); } catch { /* Halaman/action tetap memverifikasi sesi dan gagal tertutup. */ }
  return response;
}

export const config = { matcher: ["/akun/:path*", "/portal/:path*"] };
