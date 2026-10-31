import Link from "next/link";
import { redirect } from "next/navigation";
import { ownerContext } from "@/lib/portal/owner";
import { rupiah } from "@/lib/portal/format";
import { pageNumber } from "@/lib/admin";
import { OwnerUnavailable, OwnerStorePicker } from "@/components/owner-context";
import { OwnerProductForm, OwnerPhotoForm, DeleteProductForm, type OwnerProduct } from "@/components/owner-forms";
import { publicPhotoUrl } from "@/lib/supabase/public";
import { StorePhoto } from "@/components/store-photo";
import { getDemoStore } from "@/lib/catalog/demo";
import { Icon } from "@/components/icon";

export default async function StoreMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ toko?: string; halaman?: string }>;
}) {
  const params = await searchParams;
  const context = await ownerContext(params.toko);
  const heading = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
          Manajemen Katalog Produk
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">Menu & Produk Toko</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Atur nama menu, harga, urutan tampil, dan foto produk. Menu yang disimpan langsung tampil di keranjang pesanan halaman toko.
        </p>
      </div>
    </div>
  );

  if (context.status !== "ready") {
    return (
      <section className="max-w-4xl mx-auto py-6 px-4 sm:px-0 space-y-6">
        {heading}
        <OwnerUnavailable status={context.status} />
      </section>
    );
  }

  const { store, stores, client } = context;
  if (!params.toko && stores.length > 1) {
    redirect(`/portal/toko/menu?toko=${store.id}${params.halaman ? `&halaman=${encodeURIComponent(params.halaman)}` : ""}`);
  }

  const page = pageNumber(params.halaman);
  let productsData: OwnerProduct[] = [];
  let productsCount = 0;

  if (client) {
    try {
      const products = await client
        .from("products")
        .select("id,name,price,sort_order,photo_path", { count: "exact" })
        .eq("store_id", store.id)
        .order("sort_order")
        .order("id")
        .range((page - 1) * 20, page * 20 - 1);

      if (!products.error && products.data) {
        productsData = products.data as OwnerProduct[];
        productsCount = products.count ?? productsData.length;
      }
    } catch {
      // fallback
    }
  } else {
    const demo = getDemoStore(store.slug);
    if (demo) {
      productsData = demo.products.map((p, idx) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        sort_order: p.sort_order ?? idx,
        photo_path: p.photo_path,
      }));
      productsCount = productsData.length;
    }
  }

  return (
    <section className="max-w-4xl mx-auto py-6 px-4 sm:px-0 space-y-6">
      {heading}
      <OwnerStorePicker store={store} stores={stores} path="/portal/toko/menu" />

      {/* Tambah Menu Baru */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6" aria-label="Tambah menu baru">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tambah Menu Baru</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tambahkan makanan, minuman, produk, atau layanan baru ke toko Anda.</p>
          </div>
          <Link
            href={`/portal/toko/info?toko=${store.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            <Icon name="truck" size={14} />
            <span>Atur Info & Delivery</span>
          </Link>
        </div>
        <OwnerProductForm key={`${store.id}-new-${productsCount}`} storeId={store.id} />
      </section>

      {/* Daftar Menu Tersimpan */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4" aria-labelledby="menu-list">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900" id="menu-list">
            Daftar Menu Tersimpan <span className="text-teal-700 font-extrabold">({productsCount})</span>
          </h2>
          <span className="text-xs text-slate-500">Klik menu untuk mengedit atau menghapus</span>
        </div>

        {!productsData.length ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="shoppingBag" size={20} />
            </div>
            <p className="text-sm font-bold text-slate-800">Belum Ada Menu yang Tersimpan</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Saat menu kosong, halaman publik toko Anda hanya menampilkan profil toko dan kontak tanpa daftar menu. Gunakan formulir di atas untuk menambahkan menu pertama.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {productsData.map((product, index) => (
              <details
                key={product.id}
                open={index === 0}
                className="group border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <summary className="font-bold text-slate-900 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-800 font-extrabold text-sm bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60">
                      {rupiah(Number(product.price))}
                    </span>
                    <Icon name="chevronDown" size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
                  </div>
                </summary>
                <div className="pt-4 mt-3 border-t border-slate-200 space-y-4">
                  <OwnerProductForm key={product.id} storeId={store.id} product={product} />
                  {product.photo_path && (
                    <div className="max-w-xs">
                      <StorePhoto key={product.photo_path} src={publicPhotoUrl(product.photo_path)} name={product.name} />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70">
                    <OwnerPhotoForm storeId={store.id} productId={product.id} hasPhoto={Boolean(product.photo_path)} />
                    <DeleteProductForm storeId={store.id} productId={product.id} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}

        {productsCount > 20 && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
            {page > 1 ? (
              <Link
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                href={`/portal/toko/menu?toko=${store.id}&halaman=${page - 1}`}
              >
                <Icon name="chevronLeft" size={14} />
                <span>Sebelumnya</span>
              </Link>
            ) : (
              <span />
            )}
            <span>Halaman {page}</span>
            {page * 20 < productsCount ? (
              <Link
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                href={`/portal/toko/menu?toko=${store.id}&halaman=${page + 1}`}
              >
                <span>Berikutnya</span>
                <Icon name="chevronRight" size={14} />
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </section>
    </section>
  );
}
