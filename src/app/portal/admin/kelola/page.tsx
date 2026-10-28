import Link from "next/link";
import { adminClient, pageNumber, type Choice, type StoreRecord } from "@/lib/admin";
import { dateLabel, uuid, type Booking } from "@/lib/affiliation";
import { StoreForm, PhotoForm, ProductForm, BookingStatusForm, type ProductRecord } from "@/components/admin-forms";
import { StorePhoto } from "@/components/store-photo";
import { publicPhotoUrl } from "@/lib/supabase/public";

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ toko?: string; permohonan?: string; halaman?: string; tersimpan?: string }> }) {
  const params = await searchParams;
  const client = await adminClient();
  const page = pageNumber(params.halaman);
  const storeId = params.toko && uuid.test(params.toko) ? params.toko : null;
  const requestId = params.permohonan && uuid.test(params.permohonan) ? params.permohonan : null;
  const [storeResult, requestResult, categories, requests] = await Promise.all([
    storeId ? client.from("stores").select("*").eq("id", storeId).maybeSingle() : Promise.resolve(null),
    requestId ? client.from("affiliation_requests").select("id,manager_name,whatsapp,address,appointment_date,appointment_time,notes,status,store_id").eq("id", requestId).maybeSingle() : Promise.resolve(null),
    client.from("categories").select("id,name").order("sort_order"),
    client.from("affiliation_requests").select("id,manager_name,whatsapp,address,appointment_date,appointment_time,notes,status,store_id", { count: "exact" }).order("created_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1),
  ]);
  const owners: Choice[] = [];
  let ownerError = false;
  for (let offset = 0; ; offset += 1000) {
    const result = await client.from("profiles").select("id,name").eq("role", "toko").order("id").range(offset, offset + 999);
    if (result.error) { ownerError = true; break; }
    owners.push(...result.data);
    if (result.data.length < 1000) break;
  }
  const store = storeResult?.data as StoreRecord | undefined;
  const request = requestResult?.data as Booking | undefined;
  const products = store ? await client.from("products").select("id,name,price,sort_order").eq("store_id", store.id).order("sort_order").order("id") : null;
  const invalidSelection = Boolean((params.toko && !store) || (params.permohonan && (!request || request.store_id)));
  const error = storeResult?.error || requestResult?.error || categories.error || requests.error || ownerError;
  return <section className="page-view"><div className="page-heading"><h1>Kelola toko</h1><p>Tambah atau edit data toko dan atur janji temu afiliasi.</p></div>
    {error ? <p role="alert" className="notice">Data belum dapat dimuat. Coba muat ulang halaman.</p> : <>
      {invalidSelection ? <p role="alert" className="notice">Toko atau permohonan tidak tersedia. <Link className="text-link" href="/portal/admin/kelola">Tambah toko baru</Link></p> : <section aria-labelledby="store-editor"><div className="section-toolbar"><h2 id="store-editor" className="section-title">{store ? `Edit ${store.name}` : "Tambah toko"}</h2>{(store || request) && <Link className="text-link" href="/portal/admin/kelola">Tambah baru</Link>}</div>
        {params.tersimpan === "1" && store && <p className="form-success" role="status">Data toko tersimpan.</p>}
        {request && <p className="notice">Dari permohonan {request.manager_name}. Data kontak dan alamat sudah diisi.</p>}
        <StoreForm key={store?.id || request?.id || "new"} store={store} request={request} owners={owners} categories={categories.data ?? []} />
        {store && <><section className="admin-section" aria-label="Pengaturan foto"><h2 className="section-title">Foto toko</h2><StorePhoto key={store.photo_path} src={publicPhotoUrl(store.photo_path)} name={store.name} /><PhotoForm id={store.id} /></section><section className="admin-section" aria-label="Kelola menu"><h2 className="section-title">Menu / produk</h2>{products?.error ? <p role="alert">Menu belum dapat dimuat.</p> : <>{products?.data?.map((product) => <ProductForm key={product.id} storeId={store.id} product={product as ProductRecord} />)}<ProductForm key={`new-${products?.data?.length}`} storeId={store.id} /></>}</section></>}
      </section>}
      <section className="admin-section" aria-labelledby="bookings"><div className="section-toolbar"><h2 id="bookings" className="section-title">Janji temu <span className="muted">({requests.count ?? 0})</span></h2><Link className="text-link" href="/join-afiliasi">Form join gratis</Link></div>
        {!requests.data?.length ? <p className="notice">Belum ada permohonan di halaman ini.</p> : <ol className="booking-list">{(requests.data as Booking[]).map((booking) => <li key={booking.id}><h3>{booking.manager_name}</h3><p>{dateLabel(booking.appointment_date)}, {booking.appointment_time.slice(0, 5)} WIB</p><p>{booking.address}</p><a className="text-link" href={`https://wa.me/${booking.whatsapp}`} target="_blank" rel="noopener noreferrer">Hubungi WA · {booking.whatsapp}</a>{booking.notes && <p className="booking-notes">Catatan: {booking.notes}</p>}<BookingStatusForm key={`${booking.id}-${booking.status}`} booking={booking} /><p><Link className="text-link" href={booking.store_id ? `/portal/admin/kelola?toko=${booking.store_id}` : `/portal/admin/kelola?permohonan=${booking.id}`}>{booking.store_id ? "Edit toko terkait" : "Tambahkan toko dari permohonan"}</Link></p></li>)}</ol>}
        <div className="pagination">{page > 1 && <Link className="button" href={`/portal/admin/kelola?halaman=${page - 1}`}>Sebelumnya</Link>}<span>Halaman {page}</span>{page * 20 < (requests.count ?? 0) && <Link className="button" href={`/portal/admin/kelola?halaman=${page + 1}`}>Berikutnya</Link>}</div>
      </section>
    </>}
  </section>;
}
