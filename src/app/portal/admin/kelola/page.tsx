import Link from "next/link";
import { adminClient, pageNumber, type Choice, type StoreRecord } from "@/lib/admin";
import { dateLabel, uuid, type Booking } from "@/lib/affiliation";
import { StoreForm, PhotoForm, ProductForm, BookingStatusForm, type ProductRecord } from "@/components/admin-forms";
import { StorePhoto } from "@/components/store-photo";
import { publicPhotoUrl } from "@/lib/supabase/public";
import { demoCategories, getAllDemoStores, getDemoBookings } from "@/lib/catalog/demo";
import { Icon } from "@/components/icon";

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ toko?: string; permohonan?: string; halaman?: string; tersimpan?: string }>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.halaman);
  const storeId = params.toko && uuid.test(params.toko) ? params.toko : null;
  const requestId = params.permohonan && uuid.test(params.permohonan) ? params.permohonan : null;

  let store: StoreRecord | undefined;
  let request: Booking | undefined;
  let categories: any[] = demoCategories;
  let requestsList: Booking[] = [];
  let requestsCount = 0;
  let owners: Choice[] = [
    { id: "00000000-0000-4000-8000-000000000101", name: "Ibu Ani (Pemilik Warung Bu Ani)" },
  ];
  let products: any[] = [];

  try {
    const client = await adminClient();
    if (client) {
      const [storeResult, requestResult, catRes, reqRes] = await Promise.all([
        storeId ? client.from("stores").select("*").eq("id", storeId).maybeSingle() : Promise.resolve(null),
        requestId
          ? client
              .from("affiliation_requests")
              .select("id,manager_name,whatsapp,address,appointment_date,appointment_time,notes,status,store_id")
              .eq("id", requestId)
              .maybeSingle()
          : Promise.resolve(null),
        client.from("categories").select("id,name").order("sort_order"),
        client
          .from("affiliation_requests")
          .select("id,manager_name,whatsapp,address,appointment_date,appointment_time,notes,status,store_id", {
            count: "exact",
          })
          .order("created_at", { ascending: false })
          .order("id")
          .range((page - 1) * 20, page * 20 - 1),
      ]);

      if (storeResult?.data) store = storeResult.data as StoreRecord;
      if (requestResult?.data) request = requestResult.data as Booking;
      if (catRes?.data) categories = catRes.data;
      if (reqRes?.data) {
        requestsList = reqRes.data as Booking[];
        requestsCount = reqRes.count ?? requestsList.length;
      }

      // Load owners
      for (let offset = 0; ; offset += 1000) {
        const result = await client.from("profiles").select("id,name").eq("role", "toko").order("id").range(offset, offset + 999);
        if (result.error) break;
        owners.push(...result.data);
        if (result.data.length < 1000) break;
      }

      if (store) {
        const prodRes = await client.from("products").select("id,name,price,sort_order").eq("store_id", store.id).order("sort_order");
        if (prodRes.data) products = prodRes.data;
      }
    }
  } catch {
    // fallback
  }

  // Fallback demo bookings
  if (requestsList.length === 0) {
    requestsList = getDemoBookings();
    requestsCount = requestsList.length;
    if (requestId) {
      request = requestsList.find((r) => r.id === requestId);
    }
  }

  // Fallback demo store if editing
  if (storeId && !store) {
    const demoStores = getAllDemoStores();
    const found = demoStores.find((s) => s.id === storeId);
    if (found) {
      store = {
        id: found.id,
        slug: found.slug,
        name: found.name,
        address: found.address,
        delivery_info: found.delivery_info,
        photo_path: found.photo_path,
        category_id: found.category_id || "00000000-0000-4000-8000-000000000001",
        owner_id: found.id === "00000000-0000-4000-8000-000000000101" ? found.id : null,
        manager_name: found.manager_name || "Pengelola",
        phone: found.phone,
        latitude: found.latitude,
        longitude: found.longitude,
      };
      products = found.products.map((p, idx) => ({
        id: p.id || `p-${idx}`,
        name: p.name,
        price: p.price,
        sort_order: idx,
      }));
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-0 space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
          Portal Admin
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
          Kelola Toko & Permohonan Afiliasi
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tambah data toko mitra baru, verifikasi permohonan join afiliasi, atau edit katalog menu.
        </p>
      </div>

      {/* Editor Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {store ? `Edit Toko: ${store.name}` : "Formulir Toko Baru"}
          </h2>
          {(store || request) && (
            <Link
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
              href="/portal/admin/kelola"
            >
              <Icon name="plus" size={14} />
              <span>Tambah Baru</span>
            </Link>
          )}
        </div>

        {params.tersimpan === "1" && store && (
          <div role="status" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Icon name="check" size={16} />
            <span>Data toko berhasil disimpan.</span>
          </div>
        )}

        {request && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center gap-2">
            <Icon name="info" size={16} />
            <span>Diisi otomatis dari permohonan {request.manager_name}.</span>
          </div>
        )}

        <StoreForm
          key={store?.id || request?.id || "new"}
          store={store}
          request={request}
          owners={owners}
          categories={categories}
        />

        {store && (
          <div className="pt-6 border-t border-slate-100 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">Foto Toko</h3>
              <StorePhoto key={store.photo_path} src={publicPhotoUrl(store.photo_path)} name={store.name} />
              <div className="mt-3">
                <PhotoForm id={store.id} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-3">Daftar Menu & Produk</h3>
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductForm key={product.id} storeId={store!.id} product={product as ProductRecord} />
                ))}
                <ProductForm key={`new-${products.length}`} storeId={store.id} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Affiliation Requests Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Permohonan Join Afiliasi</h2>
            <p className="text-xs text-slate-500 mt-0.5">Kelola janji temu dan hubungi calon mitra via WhatsApp.</p>
          </div>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
            {requestsCount} Janji Temu
          </span>
        </div>

        <div className="grid gap-4 pt-2">
          {requestsList.map((booking) => (
            <div
              key={booking.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{booking.manager_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dateLabel(booking.appointment_date)} pukul {booking.appointment_time.slice(0, 5)} WIB
                  </p>
                </div>

                <a
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
                  href={`https://wa.me/${booking.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="chat" size={14} />
                  <span>Hubungi WA ({booking.whatsapp})</span>
                </a>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-500">Alamat:</span> {booking.address}
              </p>

              {booking.notes && (
                <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200/60">
                  “{booking.notes}”
                </p>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/70">
                <BookingStatusForm key={`${booking.id}-${booking.status}`} booking={booking} />

                <Link
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                  href={booking.store_id ? `/portal/admin/kelola?toko=${booking.store_id}` : `/portal/admin/kelola?permohonan=${booking.id}`}
                >
                  <span>{booking.store_id ? "Edit Toko Terkait →" : "Jadikan Toko Mitra →"}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
