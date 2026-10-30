import "server-only";
import { createPublicSupabase } from "@/lib/supabase/public";
import { getDemoCatalog } from "./demo";
import { PAGE_SIZE, type CatalogFilters, type CatalogResult, type Category, type StoreSummary } from "./types";

export async function getCatalog(filters: CatalogFilters): Promise<CatalogResult> {
  // If demo mode is explicitly enabled, return demo catalog
  if (process.env.CATALOG_MODE === "demo") {
    return getDemoCatalog(filters);
  }

  try {
    const supabase = createPublicSupabase();
    if (!supabase) return getDemoCatalog(filters);

    const signal = AbortSignal.timeout(6_000);
    const offset = (filters.page - 1) * PAGE_SIZE;
    const searchArgs = { search_text: filters.query, category_slug: filters.category };
    const [categoriesResult, initialStoresResult] = await Promise.all([
      supabase.from("categories").select("id,name,slug").order("sort_order").order("name").abortSignal(signal),
      supabase.rpc("search_stores", searchArgs, { count: "exact" })
        .range(offset, offset + PAGE_SIZE - 1).abortSignal(signal),
    ]);
    let storesResult = initialStoresResult;
    if (filters.page > 1 && storesResult.error?.code === "PGRST103") {
      const firstPage = await supabase.rpc("search_stores", searchArgs, { count: "exact" })
        .range(0, 0).abortSignal(signal);
      storesResult = firstPage.error ? firstPage : { ...firstPage, data: [] };
    }

    if (categoriesResult.error || storesResult.error) {
      return getDemoCatalog(filters);
    }

    return {
      categories: (categoriesResult.data ?? []) as Category[],
      stores: (storesResult.data ?? []) as StoreSummary[],
      total: storesResult.count ?? 0,
      mode: "supabase",
      status: "ready",
    };
  } catch {
    return getDemoCatalog(filters);
  }
}
