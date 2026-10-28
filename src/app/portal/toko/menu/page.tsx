import Link from "next/link";
import { redirect } from "next/navigation";
import { ownerContext } from "@/lib/portal/owner";
import { rupiah } from "@/lib/portal/format";
import { pageNumber } from "@/lib/admin";
import { OwnerUnavailable, OwnerStorePicker } from "@/components/owner-context";
import { OwnerProductForm, OwnerPhotoForm, DeleteProductForm, type OwnerProduct } from "@/components/owner-forms";
import { publicPhotoUrl } from "@/lib/supabase/public";
import { StorePhoto } from "@/components/store-photo";

export default async function StoreMenuPage({ searchParams }: { searchParams: Promise<{ toko?: string; halaman?: string }> }) {
  const params = await searchParams;
  const context = await ownerContext(params.toko);
  const heading = <div className="page-heading"><h1>Menu / Produk</h1><p>Atur nama, harga, urutan, dan foto menu toko Anda.</p></div>;
  if (context.status !== "ready") return <section className="page-view">{heading}<OwnerUnavailable status={context.status} /></section>;
  const { store, stores, client } = context;
  if (!params.toko && stores.length > 1) redirect(`/portal/toko/menu?toko=${store.id}${params.halaman ? `&halaman=${encodeURIComponent(params.halaman)}` : ""}`);
  const page = pageNumber(params.halaman);
  const products = await client.from("products").select("id,name,price,sort_order,photo_path", { count: "exact" }).eq("store_id", store.id).order("sort_order").order("id").range((page - 1) * 20, page * 20 - 1);
  return <section className="page-view">{heading}<OwnerStorePicker store={store} stores={stores} path="/portal/toko/menu" /><section className="dashboard-section" aria-label="Tambah menu"><h2 className="section-title">Tambah menu</h2><OwnerProductForm key={`${store.id}-new-${products.count ?? 0}`} storeId={store.id} /></section><section className="admin-section" aria-labelledby="menu-list"><h2 className="section-title" id="menu-list">Menu tersimpan <span className="muted">({products.count ?? 0})</span></h2>
    {products.error ? <p className="notice" role="alert">Menu belum dapat dimuat. Coba muat ulang.</p> : <>{!products.data.length && <p className="notice">Belum ada menu di halaman ini.</p>}{(products.data as OwnerProduct[]).map((product) => <details key={product.id} className="menu-editor"><summary><span>{product.name}</span><span className="muted">{rupiah(Number(product.price))}</span></summary><OwnerProductForm key={product.id} storeId={store.id} product={product} />{product.photo_path && <div className="menu-photo-preview"><StorePhoto key={product.photo_path} src={publicPhotoUrl(product.photo_path)} name={product.name} /></div>}<OwnerPhotoForm storeId={store.id} productId={product.id} hasPhoto={Boolean(product.photo_path)} /><DeleteProductForm storeId={store.id} productId={product.id} /></details>)}<div className="pagination">{page > 1 && <Link className="button" href={`/portal/toko/menu?toko=${store.id}&halaman=${page - 1}`}>Sebelumnya</Link>}<span>Halaman {page}</span>{page * 20 < (products.count ?? 0) && <Link className="button" href={`/portal/toko/menu?toko=${store.id}&halaman=${page + 1}`}>Berikutnya</Link>}</div></>}
  </section></section>;
}
