import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SearchForm } from "./search-form";
import { Icon, FoodAgentIcon, type IconName } from "@/components/icon";
import { StoreDistanceBadge } from "@/components/location-context";
import { catalogHref, PAGE_SIZE, type CatalogFilters, type CatalogResult } from "@/lib/catalog/types";
import { parseDeliveryChannels } from "@/lib/stores/links";

interface CategoryStyle {
  icon: IconName;
  label: string;
  sub: string;
  accentBg: string;
  iconBg: string;
  iconColor: string;
  activeRing: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  makanan: {
    icon: "utensils",
    label: "Makanan",
    sub: "Kuliner",
    accentBg: "bg-amber-50/70 border-amber-200/80 text-amber-950 hover:bg-amber-100/60",
    iconBg: "bg-amber-100 text-amber-800",
    iconColor: "text-amber-700",
    activeRing: "ring-2 ring-amber-500 border-amber-500 bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black",
  },
  minuman: {
    icon: "coffee",
    label: "Minuman",
    sub: "Kopi & Jus",
    accentBg: "bg-emerald-50/70 border-emerald-200/80 text-emerald-950 hover:bg-emerald-100/60",
    iconBg: "bg-emerald-100 text-emerald-800",
    iconColor: "text-emerald-700",
    activeRing: "ring-2 ring-emerald-600 border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
  },
  jasa: {
    icon: "briefcase",
    label: "Jasa",
    sub: "Layanan",
    accentBg: "bg-sky-50/70 border-sky-200/80 text-sky-950 hover:bg-sky-100/60",
    iconBg: "bg-sky-100 text-sky-800",
    iconColor: "text-sky-700",
    activeRing: "ring-2 ring-sky-600 border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-600/20",
  },
  belanja: {
    icon: "shoppingBag",
    label: "Belanja",
    sub: "Sembako",
    accentBg: "bg-purple-50/70 border-purple-200/80 text-purple-950 hover:bg-purple-100/60",
    iconBg: "bg-purple-100 text-purple-800",
    iconColor: "text-purple-700",
    activeRing: "ring-2 ring-purple-600 border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-600/20",
  },
};

const defaultStyle: CategoryStyle = {
  icon: "tag",
  label: "Lainnya",
  sub: "Usaha",
  accentBg: "bg-slate-50/80 border-slate-200/80 text-slate-900 hover:bg-slate-100/70",
  iconBg: "bg-slate-100 text-slate-700",
  iconColor: "text-slate-600",
  activeRing: "ring-2 ring-emerald-600 border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
};

export function Catalog({
  catalog,
  filters,
  view,
}: {
  catalog: CatalogResult;
  filters: CatalogFilters;
  view: "home" | "search";
}) {
  const path = view === "home" ? "/" : "/pencarian";
  const category = catalog.categories.find(({ slug }) => slug === filters.category);
  const filtered = Boolean(filters.query || filters.category);
  const pastLastPage = filters.page > 1 && catalog.stores.length === 0;
  const title = filters.query
    ? `Hasil pencarian “${filters.query}”`
    : category?.name
    ? `Kategori: ${category.name}`
    : view === "home"
    ? "Rekomendasi Toko & Usaha Pilihan"
    : "Semua Toko Terdaftar";

  return (
    <div className="w-full pb-28 sm:pb-16 min-h-[70vh]">
      {/* Screen-reader accessible title for clean minimalist layout */}
      <h1 className="sr-only">Luvio — Pesan Makanan & Toko Pilihan di Sekitarmu</h1>

      {/* Hero Search Bar */}
      <div className="pt-2 sm:pt-4">
        <SearchForm filters={filters} live={view === "search"} />
      </div>

      {/* Category Squircles Grid per Natural-Tech Design System */}
      {catalog.categories.length > 0 && (
        <section aria-label="Kategori toko" className="my-3 sm:my-4">
          <nav className="grid grid-cols-5 gap-2 sm:gap-3.5">
            {/* Category: Semua */}
            <Link
              href={catalogHref(path, { ...filters, category: "", page: 1 })}
              className={`group flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 text-center cursor-pointer ${
                !filters.category
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-600/30 -translate-y-0.5"
                  : "bg-white border-slate-200/80 text-slate-700 hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5"
              }`}
              aria-current={!filters.category ? "true" : undefined}
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:scale-110 ${
                  !filters.category
                    ? "bg-white/20 text-white"
                    : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100"
                }`}
              >
                <Icon name="layoutGrid" size={20} />
              </div>
              <span className="text-[11px] sm:text-xs font-black tracking-tight truncate max-w-full">
                Semua
              </span>
              <span
                className={`text-[9px] sm:text-[10px] hidden sm:block ${
                  !filters.category ? "text-emerald-100 font-semibold" : "text-slate-400 font-medium"
                }`}
              >
                Katalog
              </span>
            </Link>

            {/* Dynamic Categories */}
            {catalog.categories.map(({ id, name, slug }) => {
              const isCurrent = filters.category === slug;
              const style = CATEGORY_STYLES[slug] || {
                ...defaultStyle,
                label: name,
              };

              return (
                <Link
                  key={id}
                  href={catalogHref(path, { ...filters, category: slug, page: 1 })}
                  className={`group flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 text-center cursor-pointer ${
                    isCurrent
                      ? `${style.activeRing} -translate-y-0.5`
                      : `${style.accentBg} hover:shadow-xs hover:-translate-y-0.5`
                  }`}
                  aria-current={isCurrent ? "true" : undefined}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:scale-110 ${
                      isCurrent
                        ? "bg-white/20 text-white"
                        : `${style.iconBg} ${style.iconColor}`
                    }`}
                  >
                    <Icon name={style.icon} size={20} />
                  </div>
                  <span className="text-[11px] sm:text-xs font-black tracking-tight truncate max-w-full">
                    {name}
                  </span>
                  <span
                    className={`text-[9px] sm:text-[10px] hidden sm:block ${
                      isCurrent ? "text-white/90 font-semibold" : "text-slate-500 font-medium"
                    }`}
                  >
                    {style.sub}
                  </span>
                </Link>
              );
            })}
          </nav>
        </section>
      )}

      {/* Section Header & Count */}
      <div className="flex items-center justify-between gap-4 mt-6 sm:mt-8 mb-4 px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
          {catalog.status === "ready" && (
            <p className="text-xs text-slate-500 mt-0.5">Menampilkan {catalog.stores.length} dari {catalog.total} usaha</p>
          )}
        </div>

        {filtered && (
          <Link
            href={path}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 active:scale-95 transition-all"
          >
            <span>Reset filter</span>
          </Link>
        )}
      </div>

      {/* Catalog Grid / Modern Store Cards */}
      {catalog.status === "unavailable" ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center my-6 shadow-xs" role="status">
          <EmptyState icon="alertCircle" title="Daftar toko belum dapat dimuat">
            Terjadi kendala saat menghubungkan ke database. Silakan muat ulang halaman.
          </EmptyState>
          <a
            href={catalogHref(path, filters)}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Coba lagi
          </a>
        </div>
      ) : catalog.stores.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center my-6 shadow-xs">
          <EmptyState
            icon={filtered ? "search" : "store"}
            title={pastLastPage ? "Halaman tidak ditemukan" : filtered ? "Toko tidak ditemukan" : "Belum ada toko"}
          >
            {pastLastPage
              ? "Kembali ke halaman pertama untuk melihat katalog toko."
              : filtered
              ? "Coba gunakan kata kunci pencarian yang lebih umum atau pilih kategori lain."
              : "Toko yang terdaftar sebagai mitra akan muncul di sini."}
          </EmptyState>
          {(filtered || filters.page > 1) && (
            <Link
              href={path}
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Lihat semua toko
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch" aria-label="Daftar toko">
          {catalog.stores.map((store) => {
            const detailUrl = `/toko/${encodeURIComponent(store.slug)}?${new URLSearchParams({
              kembali: catalogHref(path, filters),
              ...(view === "search" ? { src: "search" } : {}),
            })}`;
            const catStyle = CATEGORY_STYLES[store.category_slug] || defaultStyle;
            const ch = parseDeliveryChannels(store.delivery_info, store.name, {
              opening_hours: store.opening_hours,
              gofood_url: store.gofood_url,
              shopeefood_url: store.shopeefood_url,
              grabfood_url: store.grabfood_url,
            });

            return (
              <article
                key={store.id}
                className="group bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-500/40 shadow-xs hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                {/* Store Photo / Thumbnail with 16:10 Ratio & Badges */}
                <Link href={detailUrl} className="relative block w-full aspect-[16/10] bg-slate-100 overflow-hidden">
                  {store.photo_path ? (
                    <img
                      src={store.photo_path}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-emerald-700 mb-1">
                        <Icon name="store" size={24} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">{store.name}</span>
                    </div>
                  )}

                  {/* Frosted Category Badge Top Left */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-white/95 backdrop-blur-md text-slate-800 shadow-sm flex items-center gap-1.5 border border-white/60">
                    <span className={`w-2 h-2 rounded-full ${catStyle.iconColor.replace("text-", "bg-")}`} />
                    <span>{store.category_name}</span>
                  </span>

                  {/* Frosted Rating Pill Top Right */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[11px] font-black bg-white/95 backdrop-blur-md text-slate-900 shadow-sm flex items-center gap-1 border border-white/60">
                    <Icon name="star" size={13} className="text-amber-500 fill-amber-500" />
                    <span>4.9</span>
                    <span className="text-[10px] text-slate-400 font-semibold">(100+)</span>
                  </span>

                  {/* Delivery Speed Pill Bottom Left */}
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-emerald-300 shadow-sm flex items-center gap-1 border border-white/10">
                    <Icon name="clock" size={12} className="text-emerald-400" />
                    <span>15-25 mnt</span>
                  </span>
                </Link>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={detailUrl} className="block group-hover:text-emerald-700 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug line-clamp-1">
                          {store.name}
                        </h3>
                        <span className="text-emerald-600 shrink-0" title="Toko Resmi Terverifikasi">
                          <Icon name="shieldCheck" size={17} />
                        </span>
                      </div>
                    </Link>

                    <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1.5 line-clamp-1 leading-relaxed">
                      <Icon name="mapPin" size={14} className="shrink-0 text-slate-400 mt-0.5" />
                      <span className="truncate">{store.address}</span>
                    </p>

                    {/* Distance & Delivery Channels */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 min-h-[26px]">
                      <StoreDistanceBadge lat={store.latitude} lon={store.longitude} />
                      
                      {ch.cleanDeliveryInfo && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 max-w-full">
                          <Icon name="truck" size={12} className="text-emerald-700 shrink-0" />
                          <span className="truncate">{ch.cleanDeliveryInfo}</span>
                        </div>
                      )}
                      {ch.gofoodUrl && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-green-50 text-green-800 border border-green-200"
                          title="Tersedia di GoFood"
                        >
                          <FoodAgentIcon agent="gofood" size={11} />
                          <span>GoFood</span>
                        </span>
                      )}
                      {ch.shopeefoodUrl && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200"
                          title="Tersedia di ShopeeFood"
                        >
                          <FoodAgentIcon agent="shopeefood" size={11} />
                          <span>ShopeeFood</span>
                        </span>
                      )}
                      {ch.grabfoodUrl && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          title="Tersedia di GrabFood"
                        >
                          <FoodAgentIcon agent="grabfood" size={11} />
                          <span>GrabFood</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={detailUrl}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors group-hover:translate-x-0.5 duration-150"
                    >
                      <span>Lihat Menu</span>
                      <Icon name="chevronRight" size={14} />
                    </Link>

                    <Link
                      href={detailUrl}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-xs hover:shadow-md hover:shadow-emerald-600/20 transition-all duration-150 flex items-center gap-1.5"
                      aria-label={`Pesan di ${store.name}`}
                    >
                      <Icon name="shoppingBag" size={14} />
                      <span>Pesan Menu</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {catalog.status === "ready" && catalog.stores.length > 0 && catalog.total > PAGE_SIZE && (
        <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Halaman daftar toko">
          {filters.page > 1 ? (
            <Link
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              href={catalogHref(path, { ...filters, page: filters.page - 1 })}
            >
              <Icon name="chevronLeft" size={14} />
              <span>Sebelumnya</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-300 cursor-not-allowed">
              <Icon name="chevronLeft" size={14} />
              <span>Sebelumnya</span>
            </span>
          )}

          <span className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl">
            Halaman {filters.page}
          </span>

          {filters.page * PAGE_SIZE < catalog.total ? (
            <Link
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              href={catalogHref(path, { ...filters, page: filters.page + 1 })}
            >
              <span>Berikutnya</span>
              <Icon name="chevronRight" size={14} />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-300 cursor-not-allowed">
              <span>Berikutnya</span>
              <Icon name="chevronRight" size={14} />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
