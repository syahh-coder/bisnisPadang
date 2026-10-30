import "server-only";
import { PAGE_SIZE, type CatalogFilters, type CatalogResult, type Category, type StoreSummary } from "./types";
import type { StoreDetail } from "@/lib/stores/types";
import type { Booking } from "@/lib/affiliation";

// Kategori UMKM Universal Indonesia
export const demoCategories: Category[] = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Makanan", slug: "makanan" },
  { id: "00000000-0000-4000-8000-000000000002", name: "Minuman", slug: "minuman" },
  { id: "00000000-0000-4000-8000-000000000003", name: "Jasa", slug: "jasa" },
  { id: "00000000-0000-4000-8000-000000000004", name: "Belanja", slug: "belanja" },
];

export type DemoProduct = {
  id?: string;
  name: string;
  price: number;
  photo_url?: string;
};

export type DemoStore = StoreSummary & {
  phone: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviews_count: number;
  opening_hours: string;
  products: DemoProduct[];
  manager_name?: string;
  category_id?: string;
};

// Data toko universal (multi-daerah di Indonesia, bersih, tanpa spam)
const initialStores: DemoStore[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    slug: "warung-bu-ani",
    name: "Warung Bu Ani",
    category_name: "Makanan",
    category_slug: "makanan",
    category_id: "00000000-0000-4000-8000-000000000001",
    manager_name: "Ibu Ani",
    address: "Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan",
    delivery_info: "Delivery radius 5 km (Gratis ongkir min. Rp 30.000)",
    photo_path: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    phone: "081267891234",
    latitude: -6.2435,
    longitude: 106.8021,
    rating: 4.9,
    reviews_count: 142,
    opening_hours: "09:00 - 21:00 WIB",
    products: [
      { id: "p-101-1", name: "Nasi Liwet Komplit Spesial", price: 25000, photo_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=240&fit=crop&q=80" },
      { id: "p-101-2", name: "Ayam Goreng Lengkuas Gurih", price: 18000, photo_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=240&fit=crop&q=80" },
      { id: "p-101-3", name: "Gulai Ikan Bumbu Kuning", price: 22000, photo_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=240&fit=crop&q=80" },
      { id: "p-101-4", name: "Es Teh Manis Segar", price: 5000, photo_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=240&fit=crop&q=80" },
      { id: "p-101-5", name: "Sambal Bawang Pedas Mantap", price: 5000 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    slug: "kopi-sudut-nusantara",
    name: "Kopi Sudut Nusantara",
    category_name: "Minuman",
    category_slug: "minuman",
    category_id: "00000000-0000-4000-8000-000000000002",
    manager_name: "Rian Hendrawan",
    address: "Jl. Ahmad Yani No. 5, Sumur Bandung, Bandung",
    delivery_info: "Delivery via Gojek/Grab atau Ambil Langsung di Tempat",
    photo_path: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    phone: "081398765432",
    latitude: -6.9175,
    longitude: 107.6191,
    rating: 4.8,
    reviews_count: 98,
    opening_hours: "08:00 - 23:00 WIB",
    products: [
      { id: "p-102-1", name: "Kopi Susu Gula Aren", price: 18000, photo_url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=240&fit=crop&q=80" },
      { id: "p-102-2", name: "Americano Cold Brew", price: 16000, photo_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&fit=crop&q=80" },
      { id: "p-102-3", name: "Matcha Latte Signature", price: 20000, photo_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=240&fit=crop&q=80" },
      { id: "p-102-4", name: "Croissant Mentega Cokelat", price: 15000 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    slug: "laundry-cepat-berkah",
    name: "Laundry Cepat Berkah",
    category_name: "Jasa",
    category_slug: "jasa",
    category_id: "00000000-0000-4000-8000-000000000003",
    manager_name: "Budi Santoso",
    address: "Jl. Veteran No. 20, Klojen, Malang",
    delivery_info: "Gratis antar jemput cucian radius 4 km",
    photo_path: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80",
    phone: "082155554321",
    latitude: -7.9666,
    longitude: 112.6326,
    rating: 4.9,
    reviews_count: 87,
    opening_hours: "07:30 - 20:00 WIB",
    products: [
      { id: "p-103-1", name: "Cuci Kering Lipat (per kg)", price: 7000 },
      { id: "p-103-2", name: "Cuci + Setrika Wangi (per kg)", price: 9000 },
      { id: "p-103-3", name: "Cuci Bedcover Jumbo", price: 25000 },
      { id: "p-103-4", name: "Express 4 Jam Siap Pakai", price: 15000 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    slug: "toko-sembako-jaya",
    name: "Toko Sembako Jaya",
    category_name: "Belanja",
    category_slug: "belanja",
    category_id: "00000000-0000-4000-8000-000000000004",
    manager_name: "Koh Jaya",
    address: "Jl. Pasar Baru No. 3, Sukajadi, Pekanbaru",
    delivery_info: "Antar ke rumah seputar area ruko & pemukiman",
    photo_path: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
    phone: "081912345678",
    latitude: 0.5333,
    longitude: 101.45,
    rating: 4.7,
    reviews_count: 65,
    opening_hours: "06:00 - 18:00 WIB",
    products: [
      { id: "p-104-1", name: "Beras Organik Premium 5 kg", price: 72000 },
      { id: "p-104-2", name: "Minyak Goreng Sawit 2 L", price: 34000 },
      { id: "p-104-3", name: "Gula Pasir Kristal 1 kg", price: 17500 },
      { id: "p-104-4", name: "Telur Ayam Segar 1 Rak (30 butir)", price: 52000 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    slug: "bakso-mang-ujang",
    name: "Bakso Mang Ujang",
    category_name: "Makanan",
    category_slug: "makanan",
    category_id: "00000000-0000-4000-8000-000000000001",
    manager_name: "Mang Ujang",
    address: "Jl. Malioboro No. 8, Danurejan, Yogyakarta",
    delivery_info: "Delivery via WhatsApp kurir toko radius 4 km",
    photo_path: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80",
    phone: "085233334444",
    latitude: -7.7956,
    longitude: 110.3695,
    rating: 4.9,
    reviews_count: 210,
    opening_hours: "11:00 - 21:30 WIB",
    products: [
      { id: "p-105-1", name: "Bakso Urat Granat Pedas", price: 18000, photo_url: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=240&fit=crop&q=80" },
      { id: "p-105-2", name: "Mie Ayam Bakso Spesial", price: 16000 },
      { id: "p-105-3", name: "Bakso Beranak Jumbo", price: 25000 },
      { id: "p-105-4", name: "Es Jeruk Peras Murni", price: 6000 },
    ],
  },
];

// In-memory state for runtime additions/updates
const activeStores: DemoStore[] = [...initialStores];

// Demo bookings storage
const demoBookings: Booking[] = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    manager_name: "Dedi Setiawan",
    whatsapp: "6281299887766",
    address: "Jl. Kemang Raya No. 14, Jakarta Selatan",
    appointment_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    appointment_time: "11:00",
    notes: "Usaha kuliner sate maranggi dan wedang jahe",
    status: "menunggu",
    store_id: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    manager_name: "Siti Rahmawati",
    whatsapp: "6285711223344",
    address: "Jl. Dago No. 120, Coblong, Bandung",
    appointment_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    appointment_time: "13:00",
    notes: "Boutique hijab dan pakaian muslim lokal",
    status: "dikonfirmasi",
    store_id: null,
  },
];

export function getDemoCatalog(filters: CatalogFilters): CatalogResult {
  const query = filters.query.toLowerCase().trim();
  const filtered = activeStores.filter((store) => {
    const matchesCategory = !filters.category || store.category_slug === filters.category;
    const matchesQuery =
      !query ||
      store.name.toLowerCase().includes(query) ||
      store.address.toLowerCase().includes(query) ||
      store.products.some((product) => product.name.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

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
  const store = activeStores.find((item) => item.slug === slug);
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
      id: p.id || `${store.id}-${idx}`,
      name: p.name,
      price: p.price,
      photo_path: p.photo_url ?? null,
      sort_order: idx,
    })),
  };
}

export function getAllDemoStores(): DemoStore[] {
  return [...activeStores];
}

export function addDemoStore(store: DemoStore): void {
  const exists = activeStores.findIndex((s) => s.id === store.id || s.slug === store.slug);
  if (exists >= 0) {
    activeStores[exists] = { ...activeStores[exists], ...store };
  } else {
    activeStores.unshift(store);
  }
}

export function updateDemoStore(id: string, updates: Partial<DemoStore>): boolean {
  const idx = activeStores.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  activeStores[idx] = { ...activeStores[idx], ...updates };
  return true;
}

export function addDemoProduct(storeId: string, product: DemoProduct): boolean {
  const store = activeStores.find((s) => s.id === storeId);
  if (!store) return false;
  store.products.push({
    ...product,
    id: product.id || `p-${Date.now()}`,
  });
  return true;
}

export function updateDemoProduct(storeId: string, productId: string, updates: Partial<DemoProduct>): boolean {
  const store = activeStores.find((s) => s.id === storeId);
  if (!store) return false;
  const pIdx = store.products.findIndex((p) => p.id === productId);
  if (pIdx < 0) return false;
  store.products[pIdx] = { ...store.products[pIdx], ...updates };
  return true;
}

export function deleteDemoProduct(storeId: string, productId: string): boolean {
  const store = activeStores.find((s) => s.id === storeId);
  if (!store) return false;
  const initialLen = store.products.length;
  store.products = store.products.filter((p) => p.id !== productId);
  return store.products.length < initialLen;
}

export function getDemoBookings(): Booking[] {
  return [...demoBookings];
}

export function addDemoBooking(booking: Booking): void {
  demoBookings.unshift(booking);
}

export function updateDemoBookingStatus(id: string, status: string): boolean {
  const booking = demoBookings.find((b) => b.id === id);
  if (!booking) return false;
  booking.status = status;
  return true;
}
