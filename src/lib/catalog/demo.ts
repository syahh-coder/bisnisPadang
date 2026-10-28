import "server-only";
import { PAGE_SIZE, type CatalogFilters, type CatalogResult, type StoreSummary } from "./types";
import type { StoreDetail } from "@/lib/stores/types";

// Data fiktif untuk pratinjau lokal; tidak pernah disalin otomatis ke Supabase.
export const demoCategories = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Makanan", slug: "makanan" },
  { id: "00000000-0000-4000-8000-000000000002", name: "Minuman", slug: "minuman" },
  { id: "00000000-0000-4000-8000-000000000003", name: "Jasa", slug: "jasa" },
  { id: "00000000-0000-4000-8000-000000000004", name: "Belanja", slug: "belanja" },
];

type DemoStore = StoreSummary & { products: string[] };

const stores: DemoStore[] = [
  { id: "00000000-0000-4000-8000-000000000101", slug: "warung-bu-ani", name: "Warung Bu Ani", category_name: "Makanan", category_slug: "makanan", address: "Jl. Andalas No. 12, Padang", delivery_info: "Delivery radius 5 km", photo_path: null, products: ["Nasi liwet", "Ayam goreng", "Es teh"] },
  { id: "00000000-0000-4000-8000-000000000102", slug: "kopi-sudut", name: "Kopi Sudut", category_name: "Minuman", category_slug: "minuman", address: "Jl. Ahmad Yani No. 5, Padang", delivery_info: "Delivery via ojek online", photo_path: null, products: ["Kopi susu", "Americano"] },
  { id: "00000000-0000-4000-8000-000000000103", slug: "laundry-cepat", name: "Laundry Cepat", category_name: "Jasa", category_slug: "jasa", address: "Jl. Veteran No. 20, Padang", delivery_info: "Antar jemput gratis", photo_path: null, products: ["Cuci kiloan", "Setrika"] },
  { id: "00000000-0000-4000-8000-000000000104", slug: "toko-sembako-jaya", name: "Toko Sembako Jaya", category_name: "Belanja", category_slug: "belanja", address: "Jl. Pasar Raya No. 3, Padang", delivery_info: "Belum melayani delivery", photo_path: null, products: ["Beras 5 kg", "Minyak 1 L"] },
  { id: "00000000-0000-4000-8000-000000000105", slug: "bakso-mang-ujang", name: "Bakso Mang Ujang", category_name: "Makanan", category_slug: "makanan", address: "Jl. Gajah Mada No. 8, Padang", delivery_info: "Delivery radius 3 km", photo_path: null, products: ["Bakso urat", "Mie ayam"] },
];

export function getDemoCatalog(filters: CatalogFilters): CatalogResult {
  const query = filters.query.toLowerCase();
  const filtered = stores.filter((store) =>
    (!filters.category || store.category_slug === filters.category) &&
    (!query || store.name.toLowerCase().includes(query) || store.products.some((product) => product.toLowerCase().includes(query)))
  );
  const offset = (filters.page - 1) * PAGE_SIZE;
  return {
    categories: demoCategories,
    stores: filtered.slice(offset, offset + PAGE_SIZE).map(({ products: _products, ...store }) => store),
    total: filtered.length,
    mode: "demo",
    status: "ready",
  };
}

export function getDemoStore(slug: string): StoreDetail | null {
  const store = stores.find((item) => item.slug === slug);
  if (!store) return null;
  const prices: Record<string, number> = {
    "Nasi liwet": 18000, "Ayam goreng": 15000, "Es teh": 4000,
    "Kopi susu": 16000, "Americano": 14000, "Cuci kiloan": 7000,
    "Setrika": 5000, "Beras 5 kg": 68000, "Minyak 1 L": 17000,
    "Bakso urat": 15000, "Mie ayam": 13000,
  };
  const { products, ...summary } = store;
  return {
    ...summary,
    phone: "", latitude: null, longitude: null, photo_url: null,
    products: products.map((name, index) => ({ id: `${store.id}-${index}`, name, price: prices[name] ?? 0, photo_path: null, sort_order: index })),
  };
}
