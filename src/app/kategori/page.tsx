import type { Metadata } from "next";
import Link from "next/link";
import { demoCategories, getAllDemoStores } from "@/lib/catalog/demo";
import { Icon, type IconName } from "@/components/icon";

export const metadata: Metadata = {
  title: "Kategori Usaha & Sektor UMKM — Toko Lokal",
  description: "Jelajahi toko, kuliner, minuman, jasa, dan belanja UMKM lokal di seluruh Indonesia.",
};

const categoryMeta: Record<
  string,
  {
    icon: IconName;
    badge: string;
    bgGradient: string;
    borderColor: string;
    description: string;
    popularTags: string[];
  }
> = {
  makanan: {
    icon: "utensils",
    badge: "Kuliner & Resto",
    bgGradient: "from-amber-50 to-orange-50",
    borderColor: "border-amber-200",
    description: "Aneka kuliner lezat, warung nasi, restoran keluarga, camilan tradisional, dan makanan siap saji.",
    popularTags: ["Nasi Liwet", "Bakso & Mie", "Ayam Goreng", "Gulai & Rendang", "Jajanan Pasar"],
  },
  minuman: {
    icon: "coffee",
    badge: "Kopi & Minuman",
    bgGradient: "from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200",
    description: "Coffee shop kekinian, kedai kopi susu gula aren, matcha latte, jus segar, dan minuman pelepas dahaga.",
    popularTags: ["Kopi Susu Aren", "Cold Brew", "Matcha Latte", "Es Teh Segar", "Pastry & Croissant"],
  },
  jasa: {
    icon: "briefcase",
    badge: "Layanan & Servis",
    bgGradient: "from-blue-50 to-indigo-50",
    borderColor: "border-blue-200",
    description: "Jasa laundry kiloan & express, penjahit pakaian, reparasi elektronik, pangkas rambut, dan layanan kebersihan.",
    popularTags: ["Cuci Kering Lipat", "Cuci Setrika Wangi", "Bedcover Jumbo", "Express 4 Jam", "Antar Jemput"],
  },
  belanja: {
    icon: "shoppingBag",
    badge: "Kebutuhan & Ritel",
    bgGradient: "from-purple-50 to-pink-50",
    borderColor: "border-purple-200",
    description: "Toko sembako terpercaya, bahan pokok harian, sayuran & bumbu segar, toko kelontong, dan kebutuhan rumah tangga.",
    popularTags: ["Beras Premium", "Minyak Goreng", "Gula Pasir", "Telur Ayam", "Sembako Lengkap"],
  },
};

export default function CategoriesPage() {
  const stores = getAllDemoStores();

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-0 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 mb-3">
          <Icon name="layoutGrid" size={14} /> Direktori Sektor Usaha
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Kategori Usaha & Layanan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Temukan produk dan jasa yang Anda butuhkan dengan mudah melalui klasifikasi kategori UMKM di bawah ini.
        </p>
      </div>

      {/* Grid Kategori */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {demoCategories.map((cat) => {
          const meta = categoryMeta[cat.slug] ?? {
            icon: "store" as IconName,
            badge: "Sektor Usaha",
            bgGradient: "from-slate-50 to-slate-100",
            borderColor: "border-slate-200",
            description: "Jelajahi aneka ragam produk dan layanan dari mitra UMKM lokal terdaftar.",
            popularTags: ["Toko Lokal", "Produk Unggulan", "Layanan Mitra"],
          };

          const storeCount = stores.filter(
            (s) => s.category_slug === cat.slug || s.category_id === cat.id
          ).length;

          return (
            <Link
              key={cat.id}
              href={`/pencarian?kategori=${cat.slug}`}
              className={`group block p-6 rounded-3xl bg-gradient-to-br ${meta.bgGradient} border ${meta.borderColor} hover:shadow-md hover:scale-[1.01] transition-all duration-200`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-white flex items-center justify-center text-teal-800 group-hover:scale-110 transition-transform">
                  <Icon name={meta.icon} size={24} />
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/80 text-slate-700 border border-white/60">
                    {meta.badge}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    {storeCount > 0 ? `${storeCount} Toko Terdaftar` : "Buka Direktori"}
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-teal-800 transition-colors mb-2">
                {cat.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                {meta.description}
              </p>

              <div className="pt-3 border-t border-slate-200/60">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                  Populer Dicari:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {meta.popularTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-white/90 text-slate-700 text-[11px] font-medium shadow-2xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-bold text-teal-800 group-hover:translate-x-1 transition-transform">
                <span>Lihat Semua Toko {cat.name}</span>
                <Icon name="arrowRight" size={16} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA Box for Business Owners */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5 text-center sm:text-left">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Icon name="sparkles" size={13} /> Peluang Kemitraan UMKM
          </span>
          <h3 className="text-lg sm:text-xl font-bold">Punya Usaha Sendiri?</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md">
            Daftarkan bisnis Anda gratis. Dapatkan halaman profil toko digital, QR code materi promosi, dan jangkau pelanggan tanpa potongan komisi.
          </p>
        </div>
        <Link
          href="/join-afiliasi"
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md whitespace-nowrap transition-all active:scale-95"
        >
          Daftar Afiliasi Gratis
        </Link>
      </div>
    </div>
  );
}
