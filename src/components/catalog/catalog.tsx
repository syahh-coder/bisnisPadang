import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SearchForm } from "./search-form";
import { NoticeBanner } from "@/components/notice-banner";
import { Icon, type IconName } from "@/components/icon";
import { StoreDistanceBadge } from "@/components/location-context";
import { catalogHref, PAGE_SIZE, type CatalogFilters, type CatalogResult } from "@/lib/catalog/types";

const categoryIcons: Record<string, IconName> = {
  makanan: "utensils",
  minuman: "coffee",
  jasa: "briefcase",
  belanja: "shoppingBag",
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
    ? "Toko & Usaha Pilihan Nusantara"
    : "Semua Toko Terdaftar";

  return (
    <div className="w-full pb-28 sm:pb-16 min-h-[70vh]">
      {catalog.mode === "demo" && (
        <NoticeBanner
          type="info"
          storageKey="demo_catalog_banner"
          title="Mode Pratinjau Toko Lokal"
        >
          Menampilkan data contoh UMKM Indonesia. Anda dapat menjelajahi menu, mencoba simulasi WhatsApp order, dan menguji semua fitur secara interaktif.
        </NoticeBanner>
      )}

      {view === "home" && !filtered && (
        <section className="text-center py-6 sm:py-10 max-w-2xl mx-auto px-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 mb-3">
            <Icon name="sparkles" size={14} /> Direktori UMKM Indonesia
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Temukan Usaha Lokal & Kuliner Terbaik
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            Cari toko terdekat, cek menu dan harga terupdate, serta pesan langsung via WhatsApp tanpa perantara.
          </p>
        </section>
      )}

      {/* Search Input Bar */}
      <SearchForm filters={filters} live={view === "search"} />

      {/* Category Pills Navigation */}
      {catalog.categories.length > 0 && (
        <nav className="flex items-center gap-2 overflow-x-auto py-2 my-2 no-scrollbar" aria-label="Kategori toko">
          <Link
            href={catalogHref(path, { ...filters, category: "", page: 1 })}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              !filters.category
                ? "bg-teal-800 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
            }`}
            aria-current={!filters.category ? "true" : undefined}
          >
            <Icon name="layoutGrid" size={14} />
            <span>Semua</span>
          </Link>

          {catalog.categories.map(({ id, name, slug }) => {
            const isCurrent = filters.category === slug;
            const iconName = categoryIcons[slug] || "tag";
            return (
              <Link
                key={id}
                href={catalogHref(path, { ...filters, category: slug, page: 1 })}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-teal-800 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                }`}
                aria-current={isCurrent ? "true" : undefined}
              >
                <Icon name={iconName} size={14} />
                <span>{name}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Heading & Count */}
      <div className="flex items-center justify-between gap-4 mt-6 mb-4 px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          {catalog.status === "ready" && (
            <p className="text-xs text-slate-500 mt-0.5">Menampilkan {catalog.stores.length} dari {catalog.total} usaha</p>
          )}
        </div>

        {filtered && (
          <Link
            href={path}
            className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1"
          >
            <span>Reset filter</span>
          </Link>
        )}
      </div>

      {/* Catalog Grid / Store Cards */}
      {catalog.status === "unavailable" ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center my-6 shadow-xs" role="status">
          <EmptyState icon="alertCircle" title="Daftar toko belum dapat dimuat">
            Terjadi kendala saat menghubungkan ke database. Silakan muat ulang halaman.
          </EmptyState>
          <a
            href={catalogHref(path, filters)}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors"
          >
            Coba lagi
          </a>
        </div>
      ) : catalog.stores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center my-6 shadow-xs">
          <EmptyState
            icon={filtered ? "search" : "store"}
            title={pastLastPage ? "Halaman tidak ditemukan" : filtered ? "Toko tidak ditemukan" : "Belum ada toko"}
          >
            {pastLastPage
              ? "Kembali ke halaman pertama untuk melihat katalog toko."
              : filtered
              ? "Coba gunakan kata kunci pencarian yang lebih umum atau pilih kategori lain."
              : "Toko yang terdaftar sebagai afiliasi akan muncul di sini."}
          </EmptyState>
          {(filtered || filters.page > 1) && (
            <Link
              href={path}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors"
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
            const catIcon = categoryIcons[store.category_slug] || "tag";

            return (
              <article
                key={store.id}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-teal-500/50 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden"
              >
                {/* Store Photo / Thumbnail */}
                <Link href={detailUrl} className="relative block w-full aspect-[16/10] bg-slate-100 overflow-hidden">
                  {store.photo_path ? (
                    <img
                      src={store.photo_path}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-400">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-xs flex items-center justify-center text-teal-700 mb-1">
                        <Icon name="store" size={24} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">{store.name}</span>
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs flex items-center gap-1.5">
                    <Icon name={catIcon} size={12} className="text-teal-700" />
                    <span>{store.category_name}</span>
                  </span>

                  {/* Rating Tag */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/90 backdrop-blur-md text-amber-700 shadow-xs flex items-center gap-1">
                    <Icon name="star" size={12} className="text-amber-500 fill-amber-500" />
                    <span>4.9</span>
                  </span>
                </Link>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={detailUrl} className="block group-hover:text-teal-700 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{store.name}</h3>
                        <span className="text-teal-600 shrink-0" title="Terverifikasi">
                          <Icon name="shieldCheck" size={16} />
                        </span>
                      </div>
                    </Link>

                    <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-2 line-clamp-2 leading-relaxed">
                      <Icon name="mapPin" size={15} className="shrink-0 text-slate-400 mt-0.5" />
                      <span>{store.address}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <StoreDistanceBadge lat={store.latitude} lon={store.longitude} />
                      {store.delivery_info && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          <Icon name="truck" size={13} className="text-emerald-700" />
                          <span className="line-clamp-1">{store.delivery_info}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={detailUrl}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-950 transition-colors"
                    >
                      <span>Lihat Menu & Detail</span>
                      <Icon name="chevronRight" size={14} />
                    </Link>

                    <Link
                      href={detailUrl}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors flex items-center gap-1"
                      aria-label={`Buka ${store.name}`}
                    >
                      <Icon name="chat" size={14} />
                      <span>Order</span>
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
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              href={catalogHref(path, { ...filters, page: filters.page - 1 })}
            >
              ← Sebelumnya
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-300 cursor-not-allowed">
              ← Sebelumnya
            </span>
          )}

          <span className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">
            Halaman {filters.page}
          </span>

          {filters.page * PAGE_SIZE < catalog.total ? (
            <Link
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              href={catalogHref(path, { ...filters, page: filters.page + 1 })}
            >
              Berikutnya →
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-300 cursor-not-allowed">
              Berikutnya →
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
