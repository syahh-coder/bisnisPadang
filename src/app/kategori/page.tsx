import type { Metadata } from "next";
import Link from "next/link";
import { demoCategories, getAllDemoStores } from "@/lib/catalog/demo";
import { Icon, type IconName } from "@/components/icon";

export const metadata: Metadata = {
  title: "Kategori & Layanan — Toko Lokal",
  description: "Jelajahi beragam kategori kuliner, kopi, jasa, dan kebutuhan harian favorit di sekitarmu.",
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
    badge: "Kuliner & Jajanan",
    bgGradient: "from-amber-50 to-orange-50",
    borderColor: "border-amber-200",
    description: "Aneka kuliner lezat, warung makan, resto keluarga, camilan tradisional, dan makanan siap santap.",
    popularTags: ["Nasi Liwet", "Bakso & Mie", "Ayam Goreng", "Gulai & Rendang", "Jajanan Pasar"],
  },
  minuman: {
    icon: "coffee",
    badge: "Kopi & Minuman",
    bgGradient: "from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200",
    description: "Kedai kopi kekinian, kopi susu gula aren, matcha, jus buah segar, dan aneka minuman pelepas dahaga.",
    popularTags: ["Kopi Susu Aren", "Cold Brew", "Matcha Latte", "Es Teh Segar", "Pastry & Croissant"],
  },
  jasa: {
    icon: "briefcase",
    badge: "Layanan & Servis",
    bgGradient: "from-blue-50 to-indigo-50",
    borderColor: "border-blue-200",
    description: "Laundry kiloan & express, penjahit pakaian, reparasi elektronik, pangkas rambut, dan layanan harian.",
    popularTags: ["Cuci Kering Lipat", "Cuci Setrika Wangi", "Bedcover Jumbo", "Express 4 Jam", "Antar Jemput"],
  },
  belanja: {
    icon: "shoppingBag",
    badge: "Kebutuhan Harian",
    bgGradient: "from-purple-50 to-pink-50",
    borderColor: "border-purple-200",
    description: "Toko sembako terpercaya, bahan pokok dapur, sayur & bumbu segar, hingga aneka kebutuhan rumah tangga.",
    popularTags: ["Beras Premium", "Minyak Goreng", "Gula Pasir", "Telur Ayam", "Sembako Lengkap"],
  },
};

export default function CategoriesPage() {
  const stores = getAllDemoStores();

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-0 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-teal-100/90 text-teal-900 mb-3 shadow-2xs">
          <Icon name="layoutGrid" size={14} className="text-teal-700" />
          <span>Pilihan Kategori Favorit</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Temukan yang Kamu Butuhkan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Mulai dari makanan enak, kedai kopi santai, laundry kilat, hingga kebutuhan belanja harian dari usaha lokal terpercaya.
        </p>
      </div>

      {/* Grid Kategori */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {demoCategories.map((cat) => {
          const meta = categoryMeta[cat.slug] ?? {
            icon: "store" as IconName,
            badge: "Pilihan Usaha",
            bgGradient: "from-slate-50 to-slate-100",
            borderColor: "border-slate-200",
            description: "Jelajahi aneka ragam produk dan layanan dari toko lokal terpercaya.",
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
                    {storeCount > 0 ? `${storeCount} Toko Tersedia` : "Jelajahi Pilihan"}
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-teal-800 transition-colors mb-2">
                {cat.name}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {meta.description}
              </p>

              {/* Tag Populer */}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-900/5">
                {meta.popularTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/70 text-slate-700 border border-white/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-800 group-hover:translate-x-1 transition-transform">
                <span>Lihat semua {cat.name.toLowerCase()}</span>
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
            <Icon name="sparkles" size={13} /> Punya Usaha Sendiri?
          </span>
          <h3 className="text-lg sm:text-xl font-bold">Daftarkan Tokomu Sekarang, 100% Gratis</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md">
            Bikin tokomu punya katalog online keren, dapatkan QR code siap cetak untuk kasir/meja, dan terima pesanan langsung via WhatsApp tanpa potongan komisi!
          </p>
        </div>
        <Link
          href="/join-afiliasi"
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md whitespace-nowrap transition-all active:scale-95"
        >
          Buka Toko Online Gratis
        </Link>
      </div>
    </div>
  );
}
