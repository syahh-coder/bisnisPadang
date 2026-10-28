import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SearchForm } from "./search-form";
import { catalogHref, PAGE_SIZE, type CatalogFilters, type CatalogResult } from "@/lib/catalog/types";

export function Catalog({ catalog, filters, view }: {
  catalog: CatalogResult;
  filters: CatalogFilters;
  view: "home" | "search";
}) {
  const path = view === "home" ? "/" : "/pencarian";
  const category = catalog.categories.find(({ slug }) => slug === filters.category);
  const filtered = Boolean(filters.query || filters.category);
  const pastLastPage = filters.page > 1 && catalog.stores.length === 0;
  const title = filters.query ? `Hasil untuk “${filters.query}”` : category?.name ?? (filters.category ? "Hasil kategori" : view === "home" ? "Toko terbaru" : "Semua toko");

  return (
    <>
      {catalog.mode === "demo" && (
        <aside className="demo-note" aria-label="Data contoh">Pratinjau dengan data contoh. Nama dan alamat toko bersifat fiktif.</aside>
      )}
      <SearchForm filters={filters} live={view === "search"} />
      {catalog.categories.length > 0 && (
        <nav className="category-list" aria-label="Kategori toko">
          <Link href={catalogHref(path, { ...filters, category: "", page: 1 })} className="category-chip" aria-current={!filters.category ? "true" : undefined}>Semua</Link>
          {catalog.categories.map(({ id, name, slug }) => (
            <Link key={id} href={catalogHref(path, { ...filters, category: slug, page: 1 })} className="category-chip" aria-current={filters.category === slug ? "true" : undefined}>{name}</Link>
          ))}
        </nav>
      )}

      <section aria-labelledby="judul-daftar" className="catalog-results" aria-live="polite" aria-atomic="false">
        <div className="catalog-heading">
          <h2 id="judul-daftar" className="section-title">{title}</h2>
          {catalog.status === "ready" && <p className="result-count">{catalog.total} toko</p>}
        </div>

        {catalog.status === "unavailable" ? (
          <div className="catalog-unavailable" role="status">
            <EmptyState title="Daftar toko belum tersedia">Silakan coba lagi beberapa saat lagi.</EmptyState>
            <a href={catalogHref(path, filters)} className="text-link">Coba lagi</a>
          </div>
        ) : catalog.stores.length === 0 ? (
          <>
            <EmptyState icon={filtered ? "search" : "store"} title={pastLastPage ? "Tidak ada toko di halaman ini" : filtered ? "Toko tidak ditemukan" : "Belum ada toko"}>
              {pastLastPage ? "Kembali ke halaman pertama untuk melihat daftar toko." : filtered ? "Coba kata kunci lain atau pilih kategori yang berbeda." : "Toko yang bergabung akan ditampilkan di sini."}
            </EmptyState>
            {(filtered || filters.page > 1) && <Link href={path} className="text-link catalog-reset">Lihat semua toko</Link>}
          </>
        ) : (
          <ul className="store-list" aria-label="Daftar toko">
            {catalog.stores.map((store) => (
              <li key={store.id}>
                <Link href={`/toko/${encodeURIComponent(store.slug)}?${new URLSearchParams({ kembali: catalogHref(path, filters), ...(view === "search" ? { src: "search" } : {}) })}`} className="store-row" aria-label={`Lihat toko ${store.name}`}>
                  <div className="store-monogram" aria-hidden="true">{Array.from(store.name.trim())[0]?.toUpperCase()}</div>
                  <div className="store-summary">
                    <p className="store-category">{store.category_name}</p>
                    <h3>{store.name}</h3>
                    <p className="store-address">{store.address}</p>
                    {store.delivery_info && <p className="store-delivery">{store.delivery_info}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {catalog.status === "ready" && catalog.stores.length > 0 && catalog.total > PAGE_SIZE && (
          <nav className="catalog-pagination" aria-label="Halaman daftar toko">
            {filters.page > 1 ? <Link className="text-link" href={catalogHref(path, { ...filters, page: filters.page - 1 })}>Sebelumnya</Link> : <span />}
            <span>Halaman {filters.page}</span>
            {filters.page * PAGE_SIZE < catalog.total ? <Link className="text-link" href={catalogHref(path, { ...filters, page: filters.page + 1 })}>Berikutnya</Link> : <span />}
          </nav>
        )}
      </section>
    </>
  );
}
