import "server-only";
import { createPublicSupabase } from "@/lib/supabase/public";
import { getDemoCatalog } from "./demo";
import { PAGE_SIZE, type CatalogFilters, type CatalogResult, type Category, type StoreSummary } from "./types";

export async function getCatalog(filters: CatalogFilters): Promise<CatalogResult> {
  if (process.env.CATALOG_MODE === "demo") return getDemoCatalog(filters);

  const unavailable: CatalogResult = {
    categories: [], stores: [], total: 0, mode: "supabase", status: "unavailable",
  };
  try {
    // Pembacaan publik dengan publishable key tetap mengikuti kebijakan RLS.
    const supabase = createPublicSupabase();
    if (!supabase) return unavailable;
    const signal = AbortSignal.timeout(8_000);
    const offset = (filters.page - 1) * PAGE_SIZE;
    const searchArgs = { search_text: filters.query, category_slug: filters.category };
    const [categoriesResult, initialStoresResult] = await Promise.all([
      supabase.from("categories").select("id,name,slug").order("sort_order").order("name").abortSignal(signal),
      supabase.rpc("search_stores", searchArgs, { count: "exact" })
        .range(offset, offset + PAGE_SIZE - 1).abortSignal(signal),
    ]);
    let storesResult = initialStoresResult;
    // PostgREST mengembalikan 416 saat offset melewati jumlah hasil. Itu halaman
    // kosong, bukan koneksi gagal; ambil ulang hitungan tanpa offset berlebihan.
    if (filters.page > 1 && storesResult.error?.code === "PGRST103") {
      const firstPage = await supabase.rpc("search_stores", searchArgs, { count: "exact" })
        .range(0, 0).abortSignal(signal);
      storesResult = firstPage.error ? firstPage : { ...firstPage, data: [] };
    }

    if (categoriesResult.error || storesResult.error) {
      // Jangan bocorkan detail konfigurasi atau kredensial ke UI/log.
      console.error("Katalog Supabase tidak dapat dibaca.");
      return unavailable;
    }

    return {
      categories: (categoriesResult.data ?? []) as Category[],
      stores: (storesResult.data ?? []) as StoreSummary[],
      total: storesResult.count ?? 0,
      mode: "supabase",
      status: "ready",
    };
  } catch {
    console.error("Koneksi katalog Supabase tidak tersedia.");
    return unavailable;
  }
}
