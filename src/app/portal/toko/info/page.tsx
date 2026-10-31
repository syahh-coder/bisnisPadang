import Link from "next/link";
import { ownerContext } from "@/lib/portal/owner";
import { OwnerUnavailable, OwnerStorePicker } from "@/components/owner-context";
import { OwnerInfoForm, OwnerPhotoForm } from "@/components/owner-forms";
import { StorePhoto } from "@/components/store-photo";
import { redirect } from "next/navigation";
import { publicPhotoUrl } from "@/lib/supabase/public";
import { demoCategories } from "@/lib/catalog/demo";
import { Icon } from "@/components/icon";

export default async function StoreInfoPage({ searchParams }: { searchParams: Promise<{ toko?: string }> }) {
  const params = await searchParams;
  const context = await ownerContext(params.toko);
  const heading = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
          Pengaturan Profil & Delivery
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">Info Toko & Saluran Pesanan</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Perbarui nama toko, jam buka, info delivery kurir toko, titik GPS, serta link GoFood, ShopeeFood, & GrabFood.
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
    <section className="max-w-4xl mx-auto py-6 px-4 sm:px-0 space-y-6">
      {heading}
      <OwnerStorePicker store={store} stores={stores} path="/portal/toko/info" />

      {/* Main Info & Delivery Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Formulir Data & Pengiriman Toko</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Semua perubahan langsung tersinkronisasi 100% dengan Katalog Beranda, Halaman Toko, dan Portal Admin.
            </p>
          </div>
          <Link
            href={`/portal/toko/menu?toko=${store.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors"
          >
            <Icon name="shoppingBag" size={14} />
            <span>Kelola Menu</span>
          </Link>
        </div>

        <OwnerInfoForm key={store.id} store={store} categories={categoriesData} />
      </div>

      {/* Store Photo Section */}
      <section
        className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4"
        aria-labelledby="store-photo"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900" id="store-photo">
            Foto Sampul Toko
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Foto ini ditampilkan pada kartu katalog beranda dan banner utama halaman toko Anda.
          </p>
        </div>
        <StorePhoto key={store.photo_path} src={publicPhotoUrl(store.photo_path)} name={store.name} />
        <div className="pt-2">
          <OwnerPhotoForm storeId={store.id} hasPhoto={Boolean(store.photo_path)} />
        </div>
      </section>
    </section>
  );
}
