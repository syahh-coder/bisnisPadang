import "server-only";
import { cache } from "react";
import { createPublicSupabase, publicPhotoUrl } from "@/lib/supabase/public";
import { getDemoStore } from "@/lib/catalog/demo";
import type { Product, StoreDetailResult } from "./types";

type StoreRow = {
  id: string; slug: string; name: string; phone: string; address: string;
  delivery_info: string; photo_path: string | null;
  latitude: number | string | null; longitude: number | string | null;
  categories: { name: string; slug: string };
};

// cache() hanya membagi hasil antara metadata dan halaman dalam satu render.
export const getStoreDetail = cache(async (slug: string): Promise<StoreDetailResult> => {
  const isDemo = process.env.CATALOG_MODE === "demo";
  if (slug.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { status: "not-found", mode: isDemo ? "demo" : "supabase" };
  }

  if (isDemo) {
    const store = getDemoStore(slug);
    return store ? { status: "ready", mode: "demo", store } : { status: "not-found", mode: "demo" };
  }

  try {
    const supabase = createPublicSupabase();
    if (!supabase) {
      const store = getDemoStore(slug);
      return store ? { status: "ready", mode: "demo", store } : { status: "not-found", mode: "demo" };
    }

    const signal = AbortSignal.timeout(6_000);
    const result = await supabase.from("stores")
      .select("id,slug,name,phone,address,delivery_info,photo_path,latitude,longitude,categories(name,slug)")
      .eq("slug", slug).abortSignal(signal).maybeSingle();

    if (result.error || !result.data) {
      const store = getDemoStore(slug);
      return store ? { status: "ready", mode: "demo", store } : { status: "not-found", mode: "demo" };
    }

    const row = result.data as unknown as StoreRow;
    if (!row.categories) {
      const store = getDemoStore(slug);
      return store ? { status: "ready", mode: "demo", store } : { status: "not-found", mode: "demo" };
    }

    const products: Product[] = [];
    const batchSize = 500;
    for (let offset = 0; ; offset += batchSize) {
      const menu = await supabase.from("products").select("id,name,price,photo_path,sort_order")
        .eq("store_id", row.id).order("sort_order").order("name").order("id")
        .range(offset, offset + batchSize - 1).abortSignal(signal);
      if (menu.error) break;
      const batch = (menu.data ?? []) as Product[];
      products.push(...batch);
      if (batch.length < batchSize) break;
    }
    const { categories, ...store } = row;
    const coordinate = (value: number | string | null) => {
      if (value === null || value === "") return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };
    return {
      status: "ready",
      mode: "supabase",
      store: { ...store, latitude: coordinate(row.latitude), longitude: coordinate(row.longitude), category_name: categories.name, category_slug: categories.slug, photo_url: publicPhotoUrl(row.photo_path), products },
    };
  } catch {
    const store = getDemoStore(slug);
    return store ? { status: "ready", mode: "demo", store } : { status: "not-found", mode: "demo" };
  }
});
