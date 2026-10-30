import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StorePhoto } from "@/components/store-photo";
import { Suspense } from "react";
import { VisitTracker } from "@/components/visit-tracker";
import { Icon } from "@/components/icon";
import { getStoreDetail } from "@/lib/stores/server";
import { contactLinks, mapLinks, safeCatalogReturn } from "@/lib/stores/links";
import { NoticeBanner } from "@/components/notice-banner";
import { StoreOrderBuilder } from "@/components/store-order-builder";
import { ShareButton } from "@/components/share-button";
import { publicPhotoUrl } from "@/lib/supabase/public";
import type { CatalogSearchParams } from "@/lib/catalog/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getStoreDetail(slug);
  if (result.status === "not-found") notFound();
  if (result.status === "unavailable") return { title: "Informasi toko belum tersedia", robots: { index: false } };
  return {
    title: `${result.store.name} — Toko Lokal Padang`,
    description: `${result.store.name} — ${result.store.category_name}. ${result.store.address}. Lihat menu, harga, dan pesan langsung via WhatsApp.`,
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
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Informasi Toko Belum Tersedia</h1>
        <p className="text-slate-600 text-sm mb-6">Silakan coba beberapa saat lagi.</p>
        <div className="flex items-center justify-center gap-3">
          <a
            className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors"
            href={`/toko/${encodeURIComponent(slug)}?${new URLSearchParams({ kembali: back })}`}
          >
            Coba lagi
          </a>
          <Link className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors" href={back}>
            Kembali ke katalog
          </Link>
        </div>
      </div>
    );
  }

  const { store } = result;
  const contact = contactLinks(store.phone);
  const maps = mapLinks(store.address, store.latitude, store.longitude);

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4 sm:px-0">
      {result.mode === "supabase" && (
        <Suspense fallback={null}>
          <VisitTracker storeId={store.id} />
        </Suspense>
      )}

      {/* Top back navigation */}
      <div className="py-3 flex items-center justify-between">
        <Link
          href={back}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-800 transition-colors py-1"
        >
          <Icon name="back" size={16} />
          <span>{back.startsWith("/pencarian") ? "Kembali ke pencarian" : "Kembali ke daftar toko"}</span>
        </Link>
        <ShareButton title={store.name} />
      </div>

      {result.mode === "demo" && (
        <NoticeBanner type="info" storageKey="demo_store_banner" title="Data Toko Contoh">
          Informasi toko dan menu ini merupakan data pratinjau. Anda dapat mencoba simulasi kirim pesanan ke WhatsApp secara langsung.
        </NoticeBanner>
      )}

      {/* Store Banner Photo */}
      <div className="relative mt-2">
        <StorePhoto key={store.photo_url} src={store.photo_url} name={store.name} />
      </div>

      {/* Store Info Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 mt-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/60 flex items-center gap-1.5">
            <Icon name="tag" size={13} className="text-teal-700" />
            <span>{store.category_name}</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Buka Sekarang</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-1">
            <Icon name="star" size={12} className="text-amber-500 fill-amber-500" />
            <span>4.9 (100+ ulasan)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{store.name}</h1>
          <span className="text-teal-600 shrink-0" title="Toko Terverifikasi">
            <Icon name="shieldCheck" size={22} />
          </span>
        </div>

        <p className="text-slate-600 text-xs sm:text-sm flex items-start gap-1.5 mt-2.5 leading-relaxed">
          <Icon name="mapPin" size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <span>{store.address}</span>
        </p>

        {/* Action Buttons Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          {contact ? (
            <>
              <a
                href={contact.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow active:scale-[0.98] transition-all"
              >
                <Icon name="chat" size={17} />
                <span>Chat WhatsApp</span>
              </a>
              <a
                href={contact.telephone}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
              >
                <Icon name="phone" size={16} />
                <span>Telepon</span>
              </a>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">Kontak belum tersedia</span>
          )}

          <a
            href={maps.open}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors ml-auto"
          >
            <Icon name="externalLink" size={15} />
            <span>Buka Google Maps</span>
          </a>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Icon name="clock" size={15} className="text-teal-700" />
            <span>Jam Operasional</span>
          </div>
          <p className="text-sm font-bold text-slate-900">08:00 - 22:00 WIB (Setiap Hari)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Icon name="shoppingBag" size={15} className="text-teal-700" />
            <span>Layanan Delivery</span>
          </div>
          <p className="text-sm font-bold text-slate-900">{store.delivery_info || "Tersedia via kurir lokal / ojek online"}</p>
        </div>
      </div>

      {/* Menu & Product Section with WhatsApp Order Builder */}
      <section className="mt-8" aria-labelledby="menu-toko">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="menu-toko" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Daftar Menu & Produk
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Pilih menu untuk langsung memesan ke WhatsApp toko</p>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
            {store.products.length} menu
          </span>
        </div>

        <StoreOrderBuilder
          products={store.products.map((p) => ({
            ...p,
            photo_url: p.photo_path?.startsWith("http") ? p.photo_path : publicPhotoUrl(p.photo_path),
          }))}
          storeName={store.name}
          storePhone={store.phone}
          whatsappUrl={contact ? contact.whatsapp : null}
        />
      </section>

      {/* Interactive Map Section */}
      <section className="mt-10" aria-labelledby="lokasi-toko">
        <div className="flex items-center justify-between mb-3">
          <h2 id="lokasi-toko" className="text-lg font-bold text-slate-900 tracking-tight">
            Lokasi & Rute
          </h2>
          <a
            href={maps.open}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-teal-800 hover:underline flex items-center gap-1"
          >
            <span>Petunjuk Arah</span>
            <Icon name="externalLink" size={13} />
          </a>
        </div>
        <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs">
          <iframe
            className="w-full h-full border-0"
            src={maps.embed}
            title={`Peta lokasi ${store.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>
    </div>
  );
}
