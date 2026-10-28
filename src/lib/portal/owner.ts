import "server-only";
import { cache } from "react";
import { requireRole } from "@/lib/auth/server";
import { createSessionSupabase } from "@/lib/supabase/session";
import { uuid } from "@/lib/affiliation";
import type { StoreRecord } from "@/lib/admin";

export const ownerContext = cache(async (requested?: string) => {
  const account = await requireRole("toko");
  const client = await createSessionSupabase();
  if (!client) return { status: "unavailable" as const };
  const stores: StoreRecord[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await client.from("stores").select("*").eq("owner_id", account.id).order("name").order("id").range(offset, offset + 999);
    if (result.error) return { status: "unavailable" as const };
    stores.push(...result.data as StoreRecord[]);
    if (result.data.length < 1000) break;
  }
  if (!stores.length) return { status: "empty" as const };
  const store = requested ? stores.find((s) => s.id === requested) : stores[0];
  if (!store) return { status: "missing" as const };
  return { status: "ready" as const, account, client, store, stores };
});

export async function ownedStore(id: string) {
  const account = await requireRole("toko");
  if (!uuid.test(id)) return null;
  const client = await createSessionSupabase();
  if (!client) return null;
  const result = await client.from("stores").select("id").eq("id", id).eq("owner_id", account.id).maybeSingle();
  return !result.error && result.data ? { client, account } : null;
}
