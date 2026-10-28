import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StorePhoto } from "@/components/store-photo";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Suspense } from "react";
import { VisitTracker } from "@/components/visit-tracker";
import { publicPhotoUrl } from "@/lib/supabase/public";
import { Icon } from "@/components/icon";
import { getStoreDetail } from "@/lib/stores/server";
import { contactLinks, mapLinks, safeCatalogReturn } from "@/lib/stores/links";
import type { CatalogSearchParams } from "@/lib/catalog/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };
const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 2 });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getStoreDetail(slug);
  if (result.status === "not-found") notFound();
  if (result.status === "unavailable") return { title: "Informasi toko belum tersedia", robots: { index: false } };
  return {
    title: result.store.name,
    description: `${result.store.name} — ${result.store.category_name}. ${result.store.address}. Lihat menu dan kontak toko.`,
    ...(result.mode === "demo" ? { robots: { index: false } } : {}),
  };
}

export default async function StorePage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const result = await getStoreDetail(slug);
  if (result.status === "not-found") notFound();
  const back = safeCatalogReturn(query.kembali);
  if (result.status === "unavailable") {
    return (
      <div className="page-heading">
        <h1>Informasi toko belum tersedia</h1>
        <p>Silakan coba lagi beberapa saat lagi.</p>
        <a className="button button--primary mt-6" href={`/toko/${encodeURIComponent(slug)}?${new URLSearchParams({ kembali: back })}`}>Coba lagi</a>
        <Link className="text-link detail-back" href={back}>Kembali ke daftar toko</Link>
      </div>
    );
  }
  const { store } = result;
  const contact = contactLinks(store.phone);
  const maps = mapLinks(store.address, store.latitude, store.longitude);

  return (
    <>
      {result.mode === "supabase" && <Suspense fallback={null}><VisitTracker storeId={store.id} /></Suspense>}
      <Link href={back} className="text-link detail-back"><Icon name="back" />{back.startsWith("/pencarian") ? "Kembali ke hasil pencarian" : "Kembali ke daftar toko"}</Link>
      {result.mode === "demo" && <aside className="demo-note" aria-label="Data contoh">Pratinjau dengan data contoh. Nama dan alamat toko bersifat fiktif.</aside>}
      <StorePhoto key={store.photo_url} src={store.photo_url} name={store.name} />
      <div className="page-heading store-detail-heading">
        <p className="store-category">{store.category_name}</p>
        <h1>{store.name}</h1>
      </div>

      {contact ? (
        <div className="store-contact" aria-label="Hubungi toko">
          <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="button button--primary"><Icon name="chat" />WhatsApp</a>
          <a href={contact.telephone} className="button button--plain"><Icon name="phone" />Telepon</a>
        </div>
      ) : <p className="contact-unavailable">Nomor kontak belum tersedia.</p>}

      <dl className="store-information">
        <div><dt>Nomor HP</dt><dd>{contact ? store.phone : "Belum tersedia"}</dd></div>
        <div><dt>Delivery</dt><dd>{store.delivery_info || "Informasi delivery belum tersedia"}</dd></div>
        <div><dt>Alamat</dt><dd>{store.address}</dd></div>
      </dl>

      <section className="detail-section" aria-labelledby="lokasi-toko">
        <div className="detail-section-heading">
          <h2 id="lokasi-toko" className="section-title">Lokasi toko</h2>
          <a href={maps.open} target="_blank" rel="noopener noreferrer" className="text-link">Buka Google Maps</a>
        </div>
        <iframe className="store-map" src={maps.embed} title={`Peta lokasi ${store.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </section>

      <section className="detail-section" aria-labelledby="menu-toko">
        <h2 id="menu-toko" className="section-title">Menu dan produk</h2>
        {store.products.length > 0 ? (
          <ul className="product-list" aria-label="Menu dan produk toko">
            {store.products.map((product) => <li key={product.id}><span className="product-name"><ProductThumbnail key={product.photo_path} src={publicPhotoUrl(product.photo_path)} name={product.name} /><span>{product.name}</span></span><span className="product-price">{rupiah.format(Number(product.price))}</span></li>)}
          </ul>
        ) : <p className="text-sm text-muted">Belum ada menu atau produk yang ditampilkan.</p>}
      </section>
    </>
  );
}
