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

export default async function StoreMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ toko?: string; halaman?: string }>;
}) {
  const params = await searchParams;
  const context = await ownerContext(params.toko);
  const heading = (
    <div className="page-heading">
      <h1>Menu / Produk Toko</h1>
      <p>Atur nama, harga, urutan, dan foto katalog menu toko Anda.</p>
    </div>
  );

  if (context.status !== "ready") {
    return (
      <section className="page-view">
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
    <section className="page-view max-w-4xl mx-auto py-6 px-4 sm:px-0 space-y-6">
      {heading}
      <OwnerStorePicker store={store} stores={stores} path="/portal/toko/menu" />

      {/* Tambah Menu Baru */}
      <section className="dashboard-section bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6" aria-label="Tambah menu baru">
        <h2 className="section-title text-lg font-bold text-slate-900 mb-4">Tambah Menu Baru</h2>
        <OwnerProductForm key={`${store.id}-new-${productsCount}`} storeId={store.id} />
      </section>

      {/* Daftar Menu Tersimpan */}
      <section className="admin-section bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4" aria-labelledby="menu-list">
        <h2 className="section-title text-lg font-bold text-slate-900" id="menu-list">
          Menu Tersimpan <span className="text-slate-400 font-normal">({productsCount})</span>
        </h2>

        {!productsData.length ? (
          <p className="notice p-4 rounded-xl bg-slate-50 text-slate-500 text-sm">Belum ada menu yang tersimpan.</p>
        ) : (
          <div className="space-y-3">
            {productsData.map((product) => (
              <details key={product.id} className="menu-editor border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <summary className="font-semibold text-slate-900 flex items-center justify-between cursor-pointer">
                  <span>{product.name}</span>
                  <span className="text-teal-700 font-bold text-sm">{rupiah(Number(product.price))}</span>
                </summary>
                <div className="pt-4 mt-3 border-t border-slate-200 space-y-4">
                  <OwnerProductForm key={product.id} storeId={store.id} product={product} />
                  {product.photo_path && (
                    <div className="menu-photo-preview max-w-xs">
                      <StorePhoto key={product.photo_path} src={publicPhotoUrl(product.photo_path)} name={product.name} />
                    </div>
                  )}
                  <OwnerPhotoForm storeId={store.id} productId={product.id} hasPhoto={Boolean(product.photo_path)} />
                  <DeleteProductForm storeId={store.id} productId={product.id} />
                </div>
              </details>
            ))}
          </div>
        )}

        <div className="pagination flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
          {page > 1 ? (
            <Link className="button" href={`/portal/toko/menu?toko=${store.id}&halaman=${page - 1}`}>
              Sebelumnya
            </Link>
          ) : <span />}
          <span>Halaman {page}</span>
          {page * 20 < productsCount ? (
            <Link className="button" href={`/portal/toko/menu?toko=${store.id}&halaman=${page + 1}`}>
              Berikutnya
            </Link>
          ) : <span />}
        </div>
      </section>
    </section>
  );
}
