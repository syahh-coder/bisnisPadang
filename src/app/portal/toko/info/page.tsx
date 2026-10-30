import { ownerContext } from "@/lib/portal/owner";
import { OwnerUnavailable, OwnerStorePicker } from "@/components/owner-context";
import { OwnerInfoForm, OwnerPhotoForm } from "@/components/owner-forms";
import { StorePhoto } from "@/components/store-photo";
import { redirect } from "next/navigation";
import { publicPhotoUrl } from "@/lib/supabase/public";
import { demoCategories } from "@/lib/catalog/demo";

export default async function StoreInfoPage({ searchParams }: { searchParams: Promise<{ toko?: string }> }) {
  const params = await searchParams;
  const context = await ownerContext(params.toko);
  const heading = (
    <div className="page-heading">
      <h1>Info Toko</h1>
      <p>Perbarui data dan profil yang tampil di halaman toko Anda.</p>
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
  if (!params.toko && stores.length > 1) redirect(`/portal/toko/info?toko=${store.id}`);

  let categoriesData: { id: string; name: string }[] = demoCategories;
  if (client) {
    try {
      const res = await client.from("categories").select("id,name").order("sort_order");
      if (res.data && res.data.length > 0) {
        categoriesData = res.data;
      }
    } catch {
      // fallback
    }
  }

  return (
    <section className="page-view max-w-4xl mx-auto py-6 px-4 sm:px-0">
      {heading}
      <OwnerStorePicker store={store} stores={stores} path="/portal/toko/info" />
      <OwnerInfoForm key={store.id} store={store} categories={categoriesData} />
      <section className="admin-section mt-8 pt-6 border-t border-slate-200" aria-labelledby="store-photo">
        <h2 className="section-title text-lg font-bold text-slate-900 mb-3" id="store-photo">Foto Toko</h2>
        <StorePhoto key={store.photo_path} src={publicPhotoUrl(store.photo_path)} name={store.name} />
        <div className="mt-3">
          <OwnerPhotoForm storeId={store.id} hasPhoto={Boolean(store.photo_path)} />
        </div>
      </section>
    </section>
  );
}
