import { ownerContext } from "@/lib/portal/owner";
import { OwnerUnavailable, OwnerStorePicker } from "@/components/owner-context";
import { OwnerInfoForm, OwnerPhotoForm } from "@/components/owner-forms";
import { StorePhoto } from "@/components/store-photo";
import { redirect } from "next/navigation";
import { publicPhotoUrl } from "@/lib/supabase/public";

export default async function StoreInfoPage({ searchParams }: { searchParams: Promise<{ toko?: string }> }) {
  const params = await searchParams;
  const context = await ownerContext(params.toko);
  const heading = <div className="page-heading"><h1>Info toko</h1><p>Perbarui data yang tampil di halaman toko Anda.</p></div>;
  if (context.status !== "ready") return <section className="page-view">{heading}<OwnerUnavailable status={context.status} /></section>;
  const { store, stores, client } = context;
  if (!params.toko && stores.length > 1) redirect(`/portal/toko/info?toko=${store.id}`);
  const categories = await client.from("categories").select("id,name").order("sort_order");
  return <section className="page-view">{heading}<OwnerStorePicker store={store} stores={stores} path="/portal/toko/info" />{categories.error ? <p className="notice" role="alert">Kategori belum dapat dimuat. Coba muat ulang halaman.</p> : <OwnerInfoForm key={store.id} store={store} categories={categories.data} />}<section className="admin-section" aria-labelledby="store-photo"><h2 className="section-title" id="store-photo">Foto toko</h2><StorePhoto key={store.photo_path} src={publicPhotoUrl(store.photo_path)} name={store.name} /><OwnerPhotoForm storeId={store.id} hasPhoto={Boolean(store.photo_path)} /></section></section>;
}
