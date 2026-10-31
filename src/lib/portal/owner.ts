import "server-only";
import { cache } from "react";
import { requireRole } from "@/lib/auth/server";
import { createSessionSupabase } from "@/lib/supabase/session";
import { uuid } from "@/lib/affiliation";
import type { StoreRecord } from "@/lib/admin";
import { getAllDemoStores, demoCategories } from "@/lib/catalog/demo";

function demoStoresAsRecords(ownerId: string): StoreRecord[] {
  return getAllDemoStores().map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    address: s.address,
    delivery_info: s.delivery_info,
    photo_path: s.photo_path,
    category_id: s.category_id || demoCategories[0].id,
    owner_id: ownerId,
    manager_name: s.manager_name || "Pemilik Toko",
    phone: s.phone,
    latitude: s.latitude ?? null,
    longitude: s.longitude ?? null,
    opening_hours: s.opening_hours ?? null,
    gofood_url: s.gofood_url ?? null,
    shopeefood_url: s.shopeefood_url ?? null,
    grabfood_url: s.grabfood_url ?? null,
  }));
}

export const ownerContext = cache(async (requested?: string) => {
  const account = await requireRole("toko");
  const client = await createSessionSupabase();

  const resolveDemoFallback = () => {
    const demoStores = demoStoresAsRecords(account.id);
    if (!demoStores.length) return { status: "missing" as const };
    const selected = requested ? demoStores.find((s) => s.id === requested) : demoStores[0];
    if (!selected) return { status: "missing" as const };
    return {
      status: "ready" as const,
      account,
      client: null as any,
      store: selected,
      stores: demoStores,
    };
  };

  if (!client) {
    return resolveDemoFallback();
  }

  const stores: StoreRecord[] = [];
  try {
    for (let offset = 0; ; offset += 1000) {
      const result = await client
        .from("stores")
        .select("*")
        .eq("owner_id", account.id)
        .order("name")
        .order("id")
        .range(offset, offset + 999);
      if (result.error) {
        return resolveDemoFallback();
      }
      stores.push(...(result.data as StoreRecord[]));
      if (result.data.length < 1000) break;
    }
  } catch {
    return resolveDemoFallback();
  }

  if (!stores.length) {
    return resolveDemoFallback();
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
    const found = getAllDemoStores().some((s) => s.id === id);
    return found ? { client: null as any, account } : null;
  }
  try {
    const result = await client
      .from("stores")
      .select("id")
      .eq("id", id)
      .eq("owner_id", account.id)
      .maybeSingle();
    return !result.error && result.data ? { client, account } : { client: null as any, account };
  } catch {
    return { client: null as any, account };
  }
}
