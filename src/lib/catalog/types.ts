export const PAGE_SIZE = 20;
export const MAX_QUERY_LENGTH = 120;

export type Category = { id: string; name: string; slug: string };

export type StoreSummary = {
  id: string;
  slug: string;
  name: string;
  address: string;
  delivery_info: string;
  photo_path: string | null;
  category_name: string;
  category_slug: string;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviews_count?: number | null;
};

export type CatalogFilters = { query: string; category: string; page: number };
export type CatalogResult = {
  categories: Category[];
  stores: StoreSummary[];
  total: number;
  mode: "demo" | "supabase";
  status: "ready" | "unavailable";
};

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function readFilters(params: CatalogSearchParams): CatalogFilters {
  const query = first(params.q).replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
  const rawCategory = first(params.kategori);
  const category = /^[a-z0-9-]{1,64}$/.test(rawCategory) ? rawCategory : "";
  const rawPage = first(params.halaman);
  const page = /^\d{1,6}$/.test(rawPage) ? Math.max(1, Number(rawPage)) : 1;
  return { query, category, page };
}

export function catalogHref(path: string, filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("kategori", filters.category);
  if (filters.page > 1) params.set("halaman", String(filters.page));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
