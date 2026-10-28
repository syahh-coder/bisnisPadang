import "server-only";
import { requireRole } from "@/lib/auth/server";
import { createSessionSupabase } from "@/lib/supabase/session";

export async function adminClient() {
  await requireRole("admin");
  const client = await createSessionSupabase();
  if (!client) throw new Error("Database belum dapat dihubungi");
  return client;
}
export function pageNumber(value?: string) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 && n < 1_000_000 ? n : 1; }
export type StoreRecord = { id: string; name: string; slug: string; manager_name: string; owner_id: string | null; category_id: string; phone: string; address: string; delivery_info: string; latitude: number | null; longitude: number | null; photo_path: string | null };
export type Choice = { id: string; name: string };
