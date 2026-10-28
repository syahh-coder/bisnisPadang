import type { StoreSummary } from "@/lib/catalog/types";

export type Product = {
  id: string;
  name: string;
  price: number | string;
  photo_path: string | null;
  sort_order: number;
};

export type StoreDetail = StoreSummary & {
  phone: string;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  products: Product[];
};

export type StoreDetailResult =
  | { status: "ready"; mode: "demo" | "supabase"; store: StoreDetail }
  | { status: "not-found"; mode: "demo" | "supabase" }
  | { status: "unavailable"; mode: "demo" | "supabase" };
