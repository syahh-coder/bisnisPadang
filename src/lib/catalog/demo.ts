import "server-only";
import { PAGE_SIZE, type CatalogFilters, type CatalogResult, type StoreSummary } from "./types";
import type { StoreDetail } from "@/lib/stores/types";

// Kategori UMKM Padang
export const demoCategories = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Makanan", slug: "makanan" },
  { id: "00000000-0000-4000-8000-000000000002", name: "Minuman", slug: "minuman" },
  { id: "00000000-0000-4000-8000-000000000003", name: "Jasa", slug: "jasa" },
  { id: "00000000-0000-4000-8000-000000000004", name: "Belanja", slug: "belanja" },
];

export type DemoStore = StoreSummary & {
  phone: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviews_count: number;
  opening_hours: string;
  products: { name: string; price: number; photo_url?: string }[];
};

const stores: DemoStore[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    slug: "warung-bu-ani",
    name: "Warung Bu Ani",
    category_name: "Makanan",
    category_slug: "makanan",
    address: "Jl. Andalas No. 12, Padang Timur, Kota Padang",
    delivery_info: "Delivery radius 5 km (Gratis ongkir min. Rp 30.000)",
    photo_path: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    phone: "081267891234",
    latitude: -0.9412,
    longitude: 100.3688,
    rating: 4.9,
    reviews_count: 142,
    opening_hours: "09:00 - 21:00 WIB",
    products: [
      { name: "Nasi Liwet Komplit", price: 22000, photo_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=240&fit=crop&q=80" },
      { name: "Ayam Goreng Lengkuas", price: 16000, photo_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=240&fit=crop&q=80" },
      { name: "Gulai Ikan Mas", price: 20000, photo_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=240&fit=crop&q=80" },
      { name: "Es Teh Manis Segar", price: 4000, photo_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=240&fit=crop&q=80" },
      { name: "Sambal Ijo Khas Padang", price: 5000 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    slug: "kopi-sudut",
    name: "Kopi Sudut Padang",
    category_name: "Minuman",
    category_slug: "minuman",
    address: "Jl. Ahmad Yani No. 5, Padang Barat, Kota Padang",
    delivery_info: "Delivery via Gojek/Grab atau Ambil di Tempat",
    photo_path: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    phone: "081398765432",
    latitude: -0.952,
    longitude: 100.3541,
    rating: 4.8,
    reviews_count: 98,
    opening_hours: "08:00 - 23:00 WIB",
    products: [
      { name: "Kopi Susu Gula Aren", price: 18000, photo_url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=240&fit=crop&q=80" },
      { name: "Americano Cold Brew", price: 16000, photo_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&fit=crop&q=80" },
      { name: "Matcha Latte", price: 20000, photo_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=240&fit=crop&q=80" },
      { name: "Croissant Cokelat", price: 15000 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    slug: "laundry-cepat",
    name: "Laundry Cepat Berkah",
    category_name: "Jasa",
    category_slug: "jasa",
    address: "Jl. Veteran No. 20, Padang Barat, Kota Padang",
    delivery_info: "Gratis antar jemput seputar Padang Barat",
    photo_path: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80",
    phone: "082155554321",
    latitude: -0.9443,
    longitude: 100.3556,
    rating: 4.9,
    reviews_count: 87,
    opening_hours: "07:30 - 20:00 WIB",
    products: [
      { name: "Cuci Kering Lipat (per kg)", price: 7000 },
      { name: "Cuci + Setrika Wangi (per kg)", price: 9000 },
      { name: "Cuci Bedcover Besar", price: 25000 },
      { name: "Express 4 Jam Jadi", price: 15000 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    slug: "toko-sembako-jaya",
    name: "Toko Sembako Jaya",
    category_name: "Belanja",
    category_slug: "belanja",
    address: "Jl. Pasar Raya No. 3, Kampung Jao, Kota Padang",
    delivery_info: "Antar ke rumah sekitar Pasar Raya & Padang Selatan",
    photo_path: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
    phone: "081912345678",
    latitude: -0.9589,
    longitude: 100.3612,
    rating: 4.7,
    reviews_count: 65,
    opening_hours: "06:00 - 18:00 WIB",
    products: [
      { name: "Beras Solok Premium 5 kg", price: 72000 },
      { name: "Minyak Goreng Sawit 2 L", price: 34000 },
      { name: "Gula Pasir 1 kg", price: 17500 },
      { name: "Telur Ayam 1 Rak (30 butir)", price: 52000 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    slug: "bakso-mang-ujang",
    name: "Bakso Mang Ujang",
    category_name: "Makanan",
    category_slug: "makanan",
    address: "Jl. Gajah Mada No. 8, Gn. Pangilun, Kota Padang",
    delivery_info: "Delivery via WhatsApp kurir toko radius 4 km",
    photo_path: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80",
    phone: "085233334444",
    latitude: -0.9321,
    longitude: 100.3625,
    rating: 4.9,
    reviews_count: 210,
    opening_hours: "11:00 - 21:30 WIB",
    products: [
      { name: "Bakso Urat Granat Pedas", price: 18000, photo_url: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=240&fit=crop&q=80" },
      { name: "Mie Ayam Bakso Spesial", price: 16000 },
      { name: "Bakso Beranak Jumbo", price: 25000 },
      { name: "Es Jeruk Peras Murni", price: 6000 },
    ],
  },
];

export function getDemoCatalog(filters: CatalogFilters): CatalogResult {
  const query = filters.query.toLowerCase();
  const filtered = stores.filter((store) =>
    (!filters.category || store.category_slug === filters.category) &&
    (!query ||
      store.name.toLowerCase().includes(query) ||
      store.address.toLowerCase().includes(query) ||
      store.products.some((product) => product.name.toLowerCase().includes(query)))
  );
  const offset = (filters.page - 1) * PAGE_SIZE;
  return {
    categories: demoCategories,
    stores: filtered.slice(offset, offset + PAGE_SIZE).map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      address: s.address,
      delivery_info: s.delivery_info,
      photo_path: s.photo_path,
      category_name: s.category_name,
      category_slug: s.category_slug,
    })),
    total: filtered.length,
    mode: "demo",
    status: "ready",
  };
}

export function getDemoStore(slug: string): StoreDetail | null {
  const store = stores.find((item) => item.slug === slug);
  if (!store) return null;

  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    address: store.address,
    delivery_info: store.delivery_info,
    photo_path: store.photo_path,
    category_name: store.category_name,
    category_slug: store.category_slug,
    phone: store.phone,
    latitude: store.latitude,
    longitude: store.longitude,
    photo_url: store.photo_path,
    products: store.products.map((p, idx) => ({
      id: `${store.id}-${idx}`,
      name: p.name,
      price: p.price,
      photo_path: p.photo_url ?? null,
      sort_order: idx,
    })),
  };
}
