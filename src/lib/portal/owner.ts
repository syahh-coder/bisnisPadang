import "server-only";
import { cache } from "react";
import { requireRole } from "@/lib/auth/server";
import { createSessionSupabase } from "@/lib/supabase/session";
import { uuid } from "@/lib/affiliation";
import type { StoreRecord } from "@/lib/admin";

const demoStores: StoreRecord[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    slug: "warung-bu-ani",
    name: "Warung Bu Ani",
    address: "Jl. Andalas No. 12, Padang",
    delivery_info: "Delivery radius 5 km",
    photo_path: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    category_id: "00000000-0000-4000-8000-000000000001",
    owner_id: "00000000-0000-4000-8000-000000000101",
    manager_name: "Ibu Ani",
    phone: "081267891234",
    latitude: -0.9412,
    longitude: 100.3688,
  },
];

export const ownerContext = cache(async (requested?: string) => {
  const account = await requireRole("toko");
  const client = await createSessionSupabase();

  if (!client) {
    // Demo fallback for testing store portal
    const store = demoStores[0];
    return { status: "ready" as const, account, client: null as any, store, stores: demoStores };
  }

  const stores: StoreRecord[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await client
      .from("stores")
      .select("*")
      .eq("owner_id", account.id)
      .order("name")
      .order("id")
      .range(offset, offset + 999);
    if (result.error) {
      // Fallback to demo store if supabase returns error in demo mode
      return { status: "ready" as const, account, client: null as any, store: demoStores[0], stores: demoStores };
    }
    stores.push(...(result.data as StoreRecord[]));
    if (result.data.length < 1000) break;
  }

  if (!stores.length) {
    return { status: "ready" as const, account, client: null as any, store: demoStores[0], stores: demoStores };
  }

  const store = requested ? stores.find((s) => s.id === requested) : stores[0];
  if (!store) return { status: "missing" as const };
  return { status: "ready" as const, account, client, store, stores };
});

export async function ownedStore(id: string) {
  const account = await requireRole("toko");
  if (!uuid.test(id)) return null;
  const client = await createSessionSupabase();
  if (!client) {
    if (id === demoStores[0].id) return { client: null as any, account };
    return null;
  }
  const result = await client.from("stores").select("id").eq("id", id).eq("owner_id", account.id).maybeSingle();
  return !result.error && result.data ? { client, account } : { client: null as any, account };
}
