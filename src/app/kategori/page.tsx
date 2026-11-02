import type { Metadata } from "next";
import Link from "next/link";
import { demoCategories, getAllDemoStores } from "@/lib/catalog/demo";
import { Icon, type IconName } from "@/components/icon";

export const metadata: Metadata = {
  title: "Kategori & Layanan — Luvio",
  description: "Jelajahi beragam kategori kuliner, kopi, jasa, dan kebutuhan harian favorit di sekitarmu.",
};

const categoryMeta: Record<
  string,
  {
    icon: IconName;
    badge: string;
    description: string;
    popularItems: string[];
  }
> = {
  makanan: {
    icon: "utensils",
    badge: "Kuliner & Jajanan",
    description: "Aneka kuliner lezat, warung makan, resto keluarga, camilan tradisional, dan makanan siap santap.",
    popularItems: ["Nasi Liwet", "Bakso & Mie", "Ayam Goreng", "Gulai & Rendang", "Jajanan"],
  },
  minuman: {
    icon: "coffee",
    badge: "Kopi & Minuman",
    description: "Kedai kopi kekinian, kopi susu gula aren, matcha, jus buah segar, dan aneka minuman pelepas dahaga.",
    popularItems: ["Kopi Susu Aren", "Cold Brew", "Matcha Latte", "Es Teh Segar", "Pastry"],
  },
  jasa: {
    icon: "briefcase",
    badge: "Layanan & Servis",
    description: "Laundry kiloan & express, penjahit pakaian, reparasi elektronik, pangkas rambut, dan jasa harian.",
    popularItems: ["Cuci Kering Lipat", "Setrika Wangi", "Bedcover Jumbo", "Express 4 Jam"],
  },
  belanja: {
    icon: "shoppingBag",
    badge: "Kebutuhan Harian",
    description: "Toko sembako terpercaya, bahan pokok dapur, sayur & bumbu segar, hingga kebutuhan rumah tangga.",
    popularItems: ["Beras Premium", "Minyak Goreng", "Gula Pasir", "Telur Ayam", "Sembako Lengkap"],
  },
};

export default function CategoriesPage() {
  const stores = getAllDemoStores();

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-0 space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          <Icon name="layoutGrid" size={13} className="text-emerald-700" />
          <span>Kategori Pilihan Luvio</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pilih Kategori Makanan & Usaha
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Temukan kuliner lezat, minuman segar, layanan harian, dan kebutuhan belanja dari toko terdekat.
        </p>
      </div>

      {/* Grid Kategori Clean Natural-Tech */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {demoCategories.map((cat) => {
          const meta = categoryMeta[cat.slug] ?? {
            icon: "store" as IconName,
            badge: "Pilihan Usaha",
            description: "Jelajahi aneka ragam produk dan layanan dari toko terpercaya.",
            popularItems: ["Produk Unggulan", "Layanan Mitra"],
          };

          const storeCount = stores.filter(
            (s) => s.category_slug === cat.slug || s.category_id === cat.id
          ).length;

          return (
            <Link
              key={cat.id}
              href={`/pencarian?kategori=${cat.slug}`}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                    <Icon name={meta.icon} size={22} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                      {meta.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/50">
                      {storeCount} Toko
                    </span>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors mb-1.5">
                  {cat.name}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                  {meta.description}
                </p>

                {/* Tag / Item Populer */}
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                  {meta.popularItems.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/60 group-hover:bg-slate-100/80 transition-colors"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>Jelajahi {cat.name}</span>
                <Icon name="arrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA Box for Business Owners */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm border border-slate-800">
        <div className="space-y-1 text-center sm:text-left">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Icon name="sparkles" size={13} /> Punya Usaha Kuliner / Toko?
          </span>
          <h3 className="text-base sm:text-lg font-bold">Daftarkan Tokomu di Luvio — 100% Gratis</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Miliki katalog menu online, terima order langsung via WhatsApp tanpa potongan biaya komisi, dan dapatkan QR stand kasir.
          </p>
        </div>
        <Link
          href="/join-afiliasi"
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md whitespace-nowrap active:scale-95 transition-all duration-150 shrink-0"
        >
          Buka Toko Gratis
        </Link>
      </div>
    </div>
  );
}
