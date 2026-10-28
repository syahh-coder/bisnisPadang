import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

export function createPublicSupabase() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export function publicPhotoUrl(path: string | null) {
  const { url } = getSupabaseConfig();
  if (!url || !path || /[\\?#\u0000-\u001f]/.test(path)) return null;
  const segments = path.split("/");
  if (segments.some((part) => !part || part === "." || part === "..")) return null;
  const base = new URL(url);
  if (base.protocol !== "https:" && !(base.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname))) return null;
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/store-media/${segments.map(encodeURIComponent).join("/")}`;
}
